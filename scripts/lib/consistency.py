"""Deterministic structural consistency checks across layers."""
from __future__ import annotations
from pathlib import Path
import re


def check_env_references(project_root: Path, scope_map: dict | None = None) -> dict:
    """Verify every var used via env('X') in user code has a key X in .env.example.
    `scope_map`: {"Backend": ["app/**", "routes/**"], ...}. If None, scans the whole .env.example dir.
    Framework-default env() calls in config/ are ignored when scope is provided.
    """
    passed, failed, warnings = [], [], []

    examples = list(project_root.rglob(".env.example"))
    if not examples:
        warnings.append("No .env.example files found in repo")
        return {"passed": passed, "failed": failed, "warnings": warnings}

    for example in examples:
        try:
            keys = _parse_env_keys(example.read_text(encoding="utf-8"))
        except Exception as e:
            warnings.append(f"Could not parse {example}: {e}")
            continue

        scope_root = example.parent
        scope_name = example.parent.name
        sub_scopes = (scope_map or {}).get(scope_name)
        if sub_scopes:
            used = set()
            for pat in sub_scopes:
                # rglob doesn't accept ** patterns the same way; expand simply
                base_dir = pat.split("/")[0]
                target = scope_root / base_dir
                if target.exists():
                    used.update(_scan_env_uses(target))
        else:
            used = _scan_env_uses(scope_root)

        missing = used - keys
        if missing:
            failed.append({
                "check": "env_references",
                "scope": scope_name,
                "missing_in_env_example": sorted(missing),
            })
        else:
            passed.append(f"env_references({scope_name}): {len(used)} vars all declared")
    return {"passed": passed, "failed": failed, "warnings": warnings}


def _parse_env_keys(text: str) -> set[str]:
    keys = set()
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k = line.split("=", 1)[0].strip()
            if k:
                keys.add(k)
    return keys


def _scan_env_uses(scope_root: Path) -> set[str]:
    """Scan PHP and JS/TS files for env variable usage."""
    used = set()
    php_pat = re.compile(r"env\(\s*['\"]([A-Z][A-Z0-9_]*)['\"]")
    js_pat = re.compile(r"process\.env\.([A-Z][A-Z0-9_]*)")
    js_pat2 = re.compile(r"process\.env\[\s*['\"]([A-Z][A-Z0-9_]*)['\"]\s*\]")
    skip = {"node_modules", "vendor", ".next", "storage", "bootstrap"}

    for p in scope_root.rglob("*"):
        if not p.is_file():
            continue
        if any(seg in skip for seg in p.parts):
            continue
        if p.suffix.lower() not in {".php", ".js", ".jsx", ".ts", ".tsx", ".mjs"}:
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if p.suffix.lower() == ".php":
            used.update(php_pat.findall(text))
        else:
            used.update(js_pat.findall(text))
            used.update(js_pat2.findall(text))
    return used


def check_vault_code_paths(vault_path: Path, project_root: Path) -> dict:
    """Verify that every `code_path:` in vault notes points to an existing file."""
    from .vault import list_notes, parse_frontmatter
    passed, failed, warnings = [], [], []
    for note in list_notes(vault_path):
        try:
            fm, _ = parse_frontmatter(note.read_text(encoding="utf-8"))
        except Exception:
            continue
        cp = fm.get("code_path", "").strip()
        if not cp:
            continue
        target = (project_root / cp).resolve()
        if target.exists():
            passed.append(f"code_path OK: {note.name} -> {cp}")
        else:
            failed.append({
                "check": "vault_code_path",
                "note": str(note.relative_to(vault_path)),
                "missing_target": cp,
            })
    return {"passed": passed, "failed": failed, "warnings": warnings}
