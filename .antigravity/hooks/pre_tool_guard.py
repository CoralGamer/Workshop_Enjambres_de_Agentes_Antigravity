#!/usr/bin/env python3
import json
import re
import sys


ENV_PATH = re.compile(r"(?<![\w.-])\.env[^\s\"'`/\\]*")
RM_RF = re.compile(r"\brm\b(?=[^\n]*(?:-[^\s]*r))(?=[^\n]*(?:-[^\s]*f))")
WRITE_TOOL = re.compile(r"(write|edit|create|patch|replace|save|delete|move|copy)", re.I)
SHELL_TOOL = re.compile(r"(shell|terminal|command|exec|run|bash|powershell|cmd)", re.I)


def inspect_event(event):
    tool_name = str(event.get("tool_name", event.get("toolName", "")))
    tool_input = event.get("tool_input", event.get("input", {}))
    serialized_input = json.dumps(tool_input, ensure_ascii=False)
    command = ""
    if isinstance(tool_input, dict):
        command = str(
            tool_input.get("command", tool_input.get("cmd", tool_input.get("script", "")))
        )

    if RM_RF.search(command):
        return "Blocked destructive command: rm -rf is not allowed."
    if ENV_PATH.search(serialized_input) and WRITE_TOOL.search(tool_name):
        return "Blocked write to protected .env* file."
    if ENV_PATH.search(command) and SHELL_TOOL.search(tool_name):
        if re.search(r"(?:>|>>|\b(?:tee|mv|cp|rm|sed\s+-i|touch)\b)", command):
            return "Blocked write to protected .env* file."
    return None


def main():
    try:
        event = json.load(sys.stdin)
    except (json.JSONDecodeError, UnicodeDecodeError):
        print(json.dumps({"decision": "block", "reason": "Invalid hook input."}))
        return 2
    if not isinstance(event, dict):
        print(json.dumps({"decision": "block", "reason": "Hook input must be an object."}))
        return 2

    reason = inspect_event(event)
    result = {"decision": "block", "reason": reason} if reason else {"decision": "allow"}
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
