import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
PRE_HOOK = ROOT / ".antigravity" / "hooks" / "pre_tool_guard.py"
POST_HOOK = ROOT / ".antigravity" / "hooks" / "post_tool_audit.py"


class HookTests(unittest.TestCase):
    def run_hook(self, script, event, cwd=None):
        return subprocess.run(
            ["python3", str(script)],
            input=json.dumps(event),
            text=True,
            capture_output=True,
            cwd=cwd,
            check=False,
        )

    def test_pre_tool_blocks_env_writes_and_recursive_force_remove(self):
        env_write = self.run_hook(
            PRE_HOOK,
            {"tool_name": "write_file", "tool_input": {"file_path": ".env.example"}},
        )
        rm_command = self.run_hook(
            PRE_HOOK,
            {"tool_name": "run_command", "tool_input": {"command": "rm -rf build"}},
        )
        env_redirect = self.run_hook(
            PRE_HOOK,
            {"tool_name": "bash", "tool_input": {"command": "printf demo > .env.local"}},
        )
        self.assertEqual(json.loads(env_write.stdout)["decision"], "block")
        self.assertEqual(json.loads(rm_command.stdout)["decision"], "block")
        self.assertEqual(json.loads(env_redirect.stdout)["decision"], "block")

    def test_pre_tool_allows_safe_calls(self):
        result = self.run_hook(
            PRE_HOOK,
            {"tool_name": "read_file", "tool_input": {"file_path": "README.md"}},
        )
        self.assertEqual(json.loads(result.stdout)["decision"], "allow")

    def test_post_tool_checks_javascript_and_appends_audit(self):
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, "valid.js").write_text("const ok = true;\n", encoding="utf-8")
            result = self.run_hook(
                POST_HOOK,
                {"tool_name": "edit_file", "tool_input": {"file_path": "valid.js"}},
                cwd=directory,
            )
            self.assertEqual(result.returncode, 0)
            audit = json.loads(Path(directory, "audit.log").read_text(encoding="utf-8"))
            self.assertEqual(audit["javascript_checks"][0]["result"], "ok")


if __name__ == "__main__":
    unittest.main()
