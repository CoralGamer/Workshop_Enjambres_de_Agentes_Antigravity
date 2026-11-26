const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");
const { createServer } = require("../app/backend/server");

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "taskpulse-test-"));
const server = createServer({
  dbPath: path.join(temporaryDirectory, "db.json"),
  token: "test-token",
});
let baseUrl;
const authHeaders = {
  authorization: ["Bearer", ["test-token", "4102444800"].join(".")].join(" "),
};

before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("health endpoint is available without a token", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("task creation requires a token and accepts a valid task", async () => {
  const unauthorized = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Test task" }),
  });
  assert.equal(unauthorized.status, 401);

  const expired = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: {
      authorization: ["Bearer", ["test-token", "1"].join(".")].join(" "),
      "content-type": "application/json",
    },
    body: JSON.stringify({ title: "Expired token task" }),
  });
  assert.equal(expired.status, 401);

  const created = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: { ...authHeaders, "content-type": "application/json" },
    body: JSON.stringify({ title: "Test task" }),
  });
  assert.equal(created.status, 201);
  assert.equal((await created.json()).task.title, "Test task");
});
