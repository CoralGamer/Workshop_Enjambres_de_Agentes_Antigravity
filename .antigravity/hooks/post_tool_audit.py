#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from datetime import datetime, timezone


def changed_files(event):
    tool_input = event.get("tool_input", event.get("input", {}))
    if not isinstance(tool_input, dict):
        return []
    candidates = []
    for key in ("file_path", "path", "file"):
        value = tool_input.get(key)
        if isinstance(value, str):
            candidates.append(value)
    for key in ("files", "edits"):
        value = tool_input.get(key, [])
        if isinstance(value, list):
            for item in value:
                if isinstance(item, str):
                    candidates.append(item)
                elif isinstance(item, dict):
                    path = item.get("file_path", item.get("path"))
                    if isinstance(path, str):
                        candidates.append(path)
    return list(dict.fromkeys(candidates))


def audit(event):
    tool_name = str(event.get("tool_name", event.get("toolName", "unknown")))
    results = []
    for path in changed_files(event):
        if not path.endswith(".js"):
            continue
        try:
            check = subprocess.run(
                ["node", "--check", os.path.abspath(path)],
                capture_output=True,
                text=True,
                check=False,
            )
            result = "ok" if check.returncode == 0 else "syntax_error"
            detail = (check.stderr or check.stdout).strip()
        except OSError as error:
            result = "check_error"
            detail = str(error)
        results.append({"file": path, "result": result, "detail": detail})

    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tool": tool_name,
        "javascript_checks": results,
    }
    with open(os.path.join(os.getcwd(), "audit.log"), "a", encoding="utf-8") as log:
        log.write(json.dumps(record, ensure_ascii=False) + "\n")
    return record


def main():
    try:
        event = json.load(sys.stdin)
    except (json.JSONDecodeError, UnicodeDecodeError):
        event = {}
    if not isinstance(event, dict):
        event = {}
    record = audit(event)
    print(json.dumps(record, ensure_ascii=False))
    return 0 if all(item["result"] == "ok" for item in record["javascript_checks"]) else 1


if __name__ == "__main__":
    sys.exit(main())
