"""Deterministic semantic extractors. Pure parsing, 0 LLM, 0 tokens."""
from __future__ import annotations
import json
import re
from pathlib import Path


# ─────────────────────────────────────────────────────────────
# Frontend extractors
# ─────────────────────────────────────────────────────────────

def parse_components_json(path: Path) -> dict | None:
    """Extract shadcn/ui configuration."""
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None
    return {
        "style": data.get("style"),
        "rsc": data.get("rsc"),
        "tsx": data.get("tsx"),
        "icon_library": data.get("iconLibrary"),
        "rtl": data.get("rtl"),
        "tailwind_css_path": data.get("tailwind", {}).get("css"),
        "tailwind_base_color": data.get("tailwind", {}).get("baseColor"),
        "css_variables": data.get("tailwind", {}).get("cssVariables"),
        "aliases": data.get("aliases", {}),
        "registries": list((data.get("registries") or {}).keys()),
    }


def parse_tsconfig_paths(path: Path) -> dict:
    """Extract path aliases from tsconfig.json (handles JSON with comments minimally)."""
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8")
    # Strip line comments (simple heuristic)
    text = re.sub(r"//.*$", "", text, flags=re.MULTILINE)
    try:
        data = json.loads(text)
    except Exception:
        return {}
    return data.get("compilerOptions", {}).get("paths", {})


def parse_globals_css(path: Path) -> dict:
    """Extract @import statements, dark mode strategy, and theme tokens."""
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8")

    imports = re.findall(r'@import\s+["\']([^"\']+)["\']', text)

    # @custom-variant dark (selector); — handle nested parens by greedy match to ");"
    dark_match = re.search(r"@custom-variant\s+(\w+)\s*\((.+)\)\s*;", text)
    dark_mode = None
    if dark_match:
        dark_mode = {"variant": dark_match.group(1), "selector": dark_match.group(2).strip()}

    # @theme inline { --color-x: var(--x); ... }
    theme_block = re.search(r"@theme\s+\w*\s*\{([^}]+)\}", text, re.DOTALL)
    tokens = []
    if theme_block:
        tokens = re.findall(r"--([\w-]+)\s*:", theme_block.group(1))

    # :root and .dark blocks — count CSS variables defined
    root_vars = re.findall(r":root\s*\{([^}]+)\}", text, re.DOTALL)
    dark_vars = re.findall(r"\.dark\s*\{([^}]+)\}", text, re.DOTALL)
    root_var_names = []
    for block in root_vars:
        root_var_names.extend(re.findall(r"--([\w-]+)\s*:", block))
    dark_var_names = []
    for block in dark_vars:
        dark_var_names.extend(re.findall(r"--([\w-]+)\s*:", block))

    return {
        "imports": imports,
        "dark_mode": dark_mode,
        "theme_token_count": len(tokens),
        "theme_tokens_sample": tokens[:15],
        "root_variables_count": len(set(root_var_names)),
        "dark_variables_count": len(set(dark_var_names)),
    }


def parse_package_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}
    return {
        "name": data.get("name"),
        "version": data.get("version"),
        "scripts": list((data.get("scripts") or {}).keys()),
        "dependencies": data.get("dependencies", {}),
        "devDependencies": data.get("devDependencies", {}),
    }


def list_ui_primitives(ui_dir: Path) -> list[str]:
    if not ui_dir.exists():
        return []
    return sorted([p.stem for p in ui_dir.glob("*.tsx") if p.is_file()])


def list_hooks(hooks_dir: Path) -> list[str]:
    if not hooks_dir.exists():
        return []
    out = []
    for p in hooks_dir.rglob("*.ts*"):
        if p.is_file():
            out.append(p.stem)
    return sorted(out)


def list_lib_utilities(lib_dir: Path) -> list[str]:
    """Extract exported names from lib/*.ts files."""
    if not lib_dir.exists():
        return []
    exports = []
    pat = re.compile(r"export\s+(?:async\s+)?(?:function|const|class|let|var|type|interface)\s+(\w+)")
    pat_re_export = re.compile(r"export\s+\{([^}]+)\}")
    for p in lib_dir.rglob("*.ts*"):
        if not p.is_file():
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except Exception:
            continue
        exports.extend(pat.findall(text))
        for m in pat_re_export.findall(text):
            for name in m.split(","):
                name = name.strip().split(" as ")[0].strip()
                if name:
                    exports.append(name)
    return sorted(set(exports))


# ─────────────────────────────────────────────────────────────
# Import graph (TypeScript / TSX)
# ─────────────────────────────────────────────────────────────

IMPORT_RE = re.compile(
    r"""(?:^|\n)\s*import\s+(?:[^"';\n]+?\s+from\s+)?["']([^"']+)["']""",
    re.MULTILINE,
)


def extract_imports(file_path: Path) -> dict:
    """Returns {external: [...], internal_alias: [...], relative: [...]}"""
    if not file_path.exists():
        return {"external": [], "internal_alias": [], "relative": []}
    try:
        text = file_path.read_text(encoding="utf-8")
    except Exception:
        return {"external": [], "internal_alias": [], "relative": []}
    imports = IMPORT_RE.findall(text)
    external, internal, relative = [], [], []
    for spec in imports:
        if spec.startswith("@/"):
            internal.append(spec)
        elif spec.startswith(".") or spec.startswith("/"):
            relative.append(spec)
        else:
            external.append(spec)
    return {
        "external": sorted(set(external)),
        "internal_alias": sorted(set(internal)),
        "relative": sorted(set(relative)),
    }


def build_import_graph(root: Path, scope_globs: list[str]) -> dict:
    """Build a map: file -> imports."""
    graph = {}
    for pat in scope_globs:
        for p in root.rglob(pat):
            if not p.is_file():
                continue
            if any(seg in {"node_modules", ".next", "vendor"} for seg in p.parts):
                continue
            rel = p.relative_to(root).as_posix()
            graph[rel] = extract_imports(p)
    return graph


# ─────────────────────────────────────────────────────────────
# Backend extractors (Laravel)
# ─────────────────────────────────────────────────────────────

def parse_composer_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}
    return {
        "name": data.get("name"),
        "type": data.get("type"),
        "php_required": data.get("require", {}).get("php"),
        "require": data.get("require", {}),
        "require_dev": data.get("require-dev", {}),
    }


def list_php_classes(directory: Path, suffix: str = ".php") -> list[str]:
    if not directory.exists():
        return []
    return sorted([p.stem for p in directory.rglob(f"*{suffix}") if p.is_file()])


def list_migrations(migrations_dir: Path) -> list[dict]:
    if not migrations_dir.exists():
        return []
    out = []
    pat = re.compile(r"^(\d{4}_\d{2}_\d{2}_\d{6})_(.+)$")
    for p in sorted(migrations_dir.glob("*.php")):
        m = pat.match(p.stem)
        if m:
            out.append({"timestamp": m.group(1), "name": m.group(2), "file": p.name})
        else:
            out.append({"timestamp": "", "name": p.stem, "file": p.name})
    return out


def list_route_files(routes_dir: Path) -> list[dict]:
    if not routes_dir.exists():
        return []
    out = []
    for p in routes_dir.glob("*.php"):
        try:
            text = p.read_text(encoding="utf-8")
        except Exception:
            continue
        # crude: count Route::xxx(...) calls
        routes = re.findall(r"Route::(get|post|put|patch|delete|resource|apiResource)\s*\(\s*['\"]([^'\"]+)['\"]", text)
        out.append({"file": p.name, "route_count": len(routes), "samples": [{"verb": v, "path": pp} for v, pp in routes[:5]]})
    return out


def list_php_models(models_dir: Path) -> list[dict]:
    """For each Eloquent model, extract table name and fillable fields if statically declared."""
    if not models_dir.exists():
        return []
    out = []
    for p in models_dir.rglob("*.php"):
        try:
            text = p.read_text(encoding="utf-8")
        except Exception:
            continue
        cls = re.search(r"class\s+(\w+)\s+extends\s+(\w+)", text)
        if not cls:
            continue
        table_m = re.search(r"\$table\s*=\s*['\"]([^'\"]+)['\"]", text)
        fillable_m = re.search(r"\$fillable\s*=\s*\[(.*?)\]", text, re.DOTALL)
        fillable = []
        if fillable_m:
            fillable = re.findall(r"['\"]([^'\"]+)['\"]", fillable_m.group(1))
        out.append({
            "name": cls.group(1),
            "extends": cls.group(2),
            "table": table_m.group(1) if table_m else None,
            "fillable": fillable,
            "file": p.relative_to(models_dir).as_posix(),
        })
    return out


# ─────────────────────────────────────────────────────────────
# Top-level fact assembler
# ─────────────────────────────────────────────────────────────

def assemble_facts(project_root: Path) -> dict:
    fe = project_root / "Frontend"
    be = project_root / "Backend"

    facts = {
        "frontend": {"exists": fe.exists()},
        "backend": {"exists": be.exists()},
    }

    if fe.exists():
        facts["frontend"].update({
            "shadcn": parse_components_json(fe / "components.json"),
            "tsconfig_aliases": parse_tsconfig_paths(fe / "tsconfig.json"),
            "theme": parse_globals_css(fe / "app" / "globals.css"),
            "ui_primitives": list_ui_primitives(fe / "components" / "ui"),
            "hooks": list_hooks(fe / "hooks"),
            "lib_utilities": list_lib_utilities(fe / "lib"),
            "package": parse_package_json(fe / "package.json"),
        })
        facts["frontend"]["ui_primitive_count"] = len(facts["frontend"]["ui_primitives"])

    if be.exists():
        facts["backend"].update({
            "composer": parse_composer_json(be / "composer.json"),
            "models": list_php_models(be / "app" / "Models"),
            "controllers": list_php_classes(be / "app" / "Http" / "Controllers"),
            "providers": list_php_classes(be / "app" / "Providers"),
            "policies": list_php_classes(be / "app" / "Policies"),
            "services": list_php_classes(be / "app" / "Services"),
            "migrations": list_migrations(be / "database" / "migrations"),
            "routes": list_route_files(be / "routes"),
        })

    return facts
