"""Read vault notes and parse their frontmatter — read-mostly, append-only writes."""
from __future__ import annotations
from pathlib import Path
import re

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", re.DOTALL)


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Returns (frontmatter_dict, body). Frontmatter is parsed as simple key: value."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, text
    fm_text, body = m.group(1), m.group(2)
    fm = {}
    for line in fm_text.splitlines():
        line = line.rstrip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            k, _, v = line.partition(":")
            fm[k.strip()] = v.strip()
    return fm, body


def list_notes(vault_path: Path) -> list[Path]:
    return [p for p in vault_path.rglob("*.md") if "/_template" not in p.as_posix()]


def read_note(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    fm, body = parse_frontmatter(text)
    return {
        "path": str(path),
        "relative": path.relative_to(path.parents[1] if path.parent.name != "FarMedic" else path.parent).as_posix() if path.exists() else "",
        "frontmatter": fm,
        "body": body,
        "raw": text,
    }


def is_protected(note: dict, protected_status: list[str]) -> bool:
    return note["frontmatter"].get("status", "").lower() in [s.lower() for s in protected_status]


def find_notes_by_code_path(vault_path: Path, code_path_substring: str) -> list[Path]:
    """Return vault notes whose `code_path:` references the given substring."""
    results = []
    for p in list_notes(vault_path):
        try:
            text = p.read_text(encoding="utf-8")
        except Exception:
            continue
        fm, _ = parse_frontmatter(text)
        cp = fm.get("code_path", "")
        if cp and code_path_substring in cp:
            results.append(p)
    return results
