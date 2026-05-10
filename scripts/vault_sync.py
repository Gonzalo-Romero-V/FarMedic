"""vault_sync — deterministic engine for keeping the Obsidian vault in sync with the repo.

Subcommands:
  report      Generate change_report.json from the latest commit's diff.
  validate    Validate an existing change_report.json against the schema.
  check       Run structural consistency checks across layers.
  apply       Apply approved changes (changes.json) to the vault, idempotent + append-only.
  status      Print quick status: last report, last sync, pending changes.

Usage:
  python scripts/vault_sync.py report
  python scripts/vault_sync.py validate change_report.json
  python scripts/vault_sync.py check
  python scripts/vault_sync.py apply changes.json
  python scripts/vault_sync.py status

Design rules:
  - 0 LLM calls. Pure determinism.
  - Never deletes a vault note. DEPRECATED instead.
  - Never overwrites a `status: locked` note (refuses to write).
  - Idempotent: applying the same changes twice produces identical state.
  - Fail loud: any schema/validation error aborts with non-zero exit.
"""
from __future__ import annotations
import sys
import json
import datetime
from pathlib import Path

# Local imports
sys.path.insert(0, str(Path(__file__).parent))
from lib.config import load_config
from lib.git_ops import current_commit, changed_files, file_diff_summary, has_parent
from lib.hierarchy import detect_layer, is_excluded
from lib.schema import validate_report, SCHEMA_VERSION
from lib.consistency import check_env_references, check_vault_code_paths
from lib.vault import list_notes, parse_frontmatter, is_protected


PROJECT_ROOT = Path(__file__).parent.parent
REPORT_PATH = PROJECT_ROOT / ".vault-sync" / "change_report.json"
LOG_PATH = PROJECT_ROOT / ".vault-sync" / "sync.log"


def _ensure_dirs():
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)


def _log(msg: str):
    _ensure_dirs()
    ts = datetime.datetime.now().isoformat(timespec="seconds")
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(f"[{ts}] {msg}\n")
    print(msg)


def _classify_size(n_files: int) -> str:
    if n_files <= 5:
        return "small"
    if n_files <= 20:
        return "medium"
    return "large"


def _potentially_affected_notes(changes: list[dict], cfg) -> list[str]:
    """For each changed code file, find vault notes whose code_path references it."""
    hits = set()
    for ch in changes:
        path = ch["path"]
        for note in list_notes(cfg.vault_path):
            try:
                fm, _ = parse_frontmatter(note.read_text(encoding="utf-8"))
            except Exception:
                continue
            cp = fm.get("code_path", "")
            if cp and cp.replace("\\", "/") in path.replace("\\", "/"):
                rel = note.relative_to(cfg.vault_path).as_posix()
                hits.add(rel)
    return sorted(hits)


def _locked_notes(cfg) -> list[str]:
    locked = []
    for note in list_notes(cfg.vault_path):
        try:
            fm, _ = parse_frontmatter(note.read_text(encoding="utf-8"))
        except Exception:
            continue
        if is_protected({"frontmatter": fm}, cfg.vault_protected_status):
            locked.append(note.relative_to(cfg.vault_path).as_posix())
    return locked


def cmd_report() -> int:
    cfg = load_config(PROJECT_ROOT)
    _ensure_dirs()

    if not has_parent(PROJECT_ROOT):
        _log("WARN: no previous commit. Generating report against empty tree.")

    commit = current_commit(PROJECT_ROOT)
    raw_changes = changed_files(PROJECT_ROOT)

    # Filter excluded
    filtered = [c for c in raw_changes if not is_excluded(c["path"], cfg.exclude_patterns)]
    if len(filtered) > cfg.max_files:
        _log(f"ABORT: {len(filtered)} files exceeds max_files={cfg.max_files}. Split your commit.")
        return 2

    # Build change items
    by_layer = {k: 0 for k in cfg.hierarchy_mapping}
    by_layer["UNCLASSIFIED"] = 0
    items = []
    for c in filtered:
        layer = detect_layer(c["path"], cfg.hierarchy_mapping)
        by_layer[layer] = by_layer.get(layer, 0) + 1
        excerpt = file_diff_summary(
            PROJECT_ROOT, c["path"], commit["previous_id"] or "HEAD~1", "HEAD",
            cfg.max_diff_chars_per_file
        ) if c["type"] != "deleted" else ""
        items.append({
            "path": c["path"],
            "type": c["type"],
            "layer": layer,
            "lines_added": c["lines_added"],
            "lines_removed": c["lines_removed"],
            "diff_excerpt": excerpt,
        })

    # Consistency
    env_check = check_env_references(PROJECT_ROOT, cfg.raw.get("env_scan_scope"))
    vault_check = check_vault_code_paths(cfg.vault_path, PROJECT_ROOT)
    structural = {
        "passed": env_check["passed"] + vault_check["passed"],
        "failed": env_check["failed"] + vault_check["failed"],
        "warnings": env_check["warnings"] + vault_check["warnings"],
    }

    report = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "project_name": cfg.project_name,
        "commit": commit,
        "scope": {
            "total_files": len(items),
            "by_layer": by_layer,
            "size": _classify_size(len(items)),
        },
        "changes": items,
        "consistency": {"structural_checks": structural},
        "vault_hints": {
            "potentially_affected": _potentially_affected_notes(items, cfg),
            "must_not_touch": _locked_notes(cfg),
        },
    }

    errors = validate_report(report)
    if errors:
        _log("ABORT: generated report failed schema validation:")
        for e in errors:
            _log(f"  - {e}")
        return 3

    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    _log(f"OK: change_report.json written ({len(items)} files, size={report['scope']['size']})")
    if structural["failed"]:
        _log(f"WARN: {len(structural['failed'])} consistency failures present in report")
    return 0


def cmd_validate(report_path: str) -> int:
    p = Path(report_path)
    if not p.exists():
        _log(f"ABORT: file not found: {p}")
        return 1
    try:
        report = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        _log(f"ABORT: invalid JSON: {e}")
        return 1
    errors = validate_report(report)
    if errors:
        _log("INVALID:")
        for e in errors:
            _log(f"  - {e}")
        return 3
    _log("VALID")
    return 0


def cmd_check() -> int:
    cfg = load_config(PROJECT_ROOT)
    env_check = check_env_references(PROJECT_ROOT, cfg.raw.get("env_scan_scope"))
    vault_check = check_vault_code_paths(cfg.vault_path, PROJECT_ROOT)

    print("\n=== ENV references ===")
    print(f"passed:   {len(env_check['passed'])}")
    print(f"failed:   {len(env_check['failed'])}")
    print(f"warnings: {len(env_check['warnings'])}")
    for f in env_check["failed"]:
        print(f"  FAIL: {f}")
    for w in env_check["warnings"]:
        print(f"  WARN: {w}")

    print("\n=== Vault code_path integrity ===")
    print(f"passed:   {len(vault_check['passed'])}")
    print(f"failed:   {len(vault_check['failed'])}")
    for f in vault_check["failed"]:
        print(f"  FAIL: {f}")

    failed_total = len(env_check["failed"]) + len(vault_check["failed"])
    return 0 if failed_total == 0 else 4


def cmd_apply(changes_path: str) -> int:
    """Apply a curated changes.json (produced by /sync after user approval).

    changes.json schema:
    {
      "operations": [
        {"action": "update_frontmatter", "note": "domain/x.md", "set": {"code_path": "Backend/..."}},
        {"action": "append_section", "note": "domain/x.md", "section": "Notes", "content": "..."},
        {"action": "deprecate", "note": "domain/old.md"},
        {"action": "create", "path": "domain/new.md", "content": "..."}
      ]
    }
    """
    cfg = load_config(PROJECT_ROOT)
    p = Path(changes_path)
    if not p.exists():
        _log(f"ABORT: file not found: {p}")
        return 1
    payload = json.loads(p.read_text(encoding="utf-8"))
    ops = payload.get("operations", [])
    if not ops:
        _log("OK: no operations to apply")
        return 0

    applied = 0
    skipped = 0
    failed = 0
    locked_blocked = 0

    for op in ops:
        action = op.get("action")
        note_rel = op.get("note") or op.get("path")
        if not note_rel:
            failed += 1
            _log(f"FAIL: op missing 'note' or 'path': {op}")
            continue
        note_path = cfg.vault_path / note_rel
        note_path.parent.mkdir(parents=True, exist_ok=True)

        # Locked guard
        if note_path.exists():
            try:
                fm, body = parse_frontmatter(note_path.read_text(encoding="utf-8"))
            except Exception:
                fm, body = {}, ""
            if is_protected({"frontmatter": fm}, cfg.vault_protected_status):
                locked_blocked += 1
                _log(f"BLOCKED (locked): {note_rel}")
                continue
        else:
            fm, body = {}, ""

        try:
            if action == "create":
                if note_path.exists():
                    skipped += 1
                    _log(f"SKIP (exists): {note_rel}")
                    continue
                note_path.write_text(op["content"], encoding="utf-8")
                applied += 1
                _log(f"CREATED: {note_rel}")

            elif action == "update_frontmatter":
                set_map = op.get("set", {})
                # Idempotency
                if all(fm.get(k) == str(v) for k, v in set_map.items()):
                    skipped += 1
                    _log(f"SKIP (idempotent): {note_rel}")
                    continue
                for k, v in set_map.items():
                    fm[k] = str(v)
                note_path.write_text(_render(fm, body), encoding="utf-8")
                applied += 1
                _log(f"UPDATED frontmatter: {note_rel} {set_map}")

            elif action == "append_section":
                section = op.get("section", "Notes")
                content = op.get("content", "")
                marker = f"## {section}"
                if marker in body and content.strip() in body:
                    skipped += 1
                    _log(f"SKIP (idempotent): {note_rel} section={section}")
                    continue
                if marker not in body:
                    body = body.rstrip() + f"\n\n{marker}\n{content}\n"
                else:
                    body = body.rstrip() + f"\n\n{content}\n"
                note_path.write_text(_render(fm, body), encoding="utf-8")
                applied += 1
                _log(f"APPENDED to {section}: {note_rel}")

            elif action == "deprecate":
                if fm.get("status") == "deprecated":
                    skipped += 1
                    _log(f"SKIP (already deprecated): {note_rel}")
                    continue
                fm["status"] = "deprecated"
                fm["deprecated_at"] = datetime.date.today().isoformat()
                note_path.write_text(_render(fm, body), encoding="utf-8")
                applied += 1
                _log(f"DEPRECATED: {note_rel}")

            else:
                failed += 1
                _log(f"FAIL: unknown action: {action}")

        except Exception as e:
            failed += 1
            _log(f"FAIL: {note_rel}: {e}")

    _log(f"DONE: applied={applied} skipped={skipped} failed={failed} blocked_locked={locked_blocked}")
    return 0 if failed == 0 else 5


def _render(fm: dict, body: str) -> str:
    fm_text = "---\n" + "\n".join(f"{k}: {v}" for k, v in fm.items()) + "\n---\n\n"
    return fm_text + body.lstrip("\n")


def cmd_status() -> int:
    print(f"Project root: {PROJECT_ROOT}")
    cfg = load_config(PROJECT_ROOT)
    print(f"Project: {cfg.project_name}")
    print(f"Vault:   {cfg.vault_path}")
    print(f"Notes:   {len(list_notes(cfg.vault_path))}")
    if REPORT_PATH.exists():
        report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
        print(f"\nLast report: {report['generated_at']}  ({report['scope']['size']}, {report['scope']['total_files']} files)")
        print(f"  commit: {report['commit']['id'][:8]} — {report['commit']['message'].splitlines()[0]}")
    else:
        print("\nNo change_report.json yet. Run: python scripts/vault_sync.py report")
    return 0


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 1
    cmd = argv[1]
    if cmd == "report":
        return cmd_report()
    if cmd == "validate":
        if len(argv) < 3:
            print("usage: vault_sync.py validate <file>")
            return 1
        return cmd_validate(argv[2])
    if cmd == "check":
        return cmd_check()
    if cmd == "apply":
        if len(argv) < 3:
            print("usage: vault_sync.py apply <changes.json>")
            return 1
        return cmd_apply(argv[2])
    if cmd == "status":
        return cmd_status()
    print(f"Unknown command: {cmd}")
    print(__doc__)
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
