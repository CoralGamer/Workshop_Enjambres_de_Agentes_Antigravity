const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { isValidToken } = require("./auth");

const ROOT = path.resolve(__dirname, "..", "frontend");
const DB_PATH = path.join(__dirname, "db.json");

function readTasks(dbPath) {
  try {
    const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    return Array.isArray(data.tasks) ? data.tasks : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function writeTasks(dbPath, tasks) {
  fs.writeFileSync(dbPath, `${JSON.stringify({ tasks }, null, 2)}\n`);
}

function sendJson(response, status, value) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", reject);
  });
}

function createServer(options = {}) {
  const dbPath = options.dbPath || DB_PATH;
  const expectedToken = options.token || process.env.TASKPULSE_TOKEN || "workshop-token";

  return http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");

    if (request.method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, 200, { status: "ok" });
    }
    if (request.method === "GET" && url.pathname === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return response.end(fs.readFileSync(path.join(ROOT, "index.html")));
    }
    if (request.method === "GET" && url.pathname === "/app.js") {
      response.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
      return response.end(fs.readFileSync(path.join(ROOT, "app.js")));
    }

    const authorization = request.headers.authorization || "";
    const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!isValidToken(bearer, expectedToken)) {
      return sendJson(response, 401, { error: "Unauthorized" });
    }

    if (request.method === "GET" && url.pathname === "/api/tasks") {
      const tasks = readTasks(dbPath);
      const status = url.searchParams.get("status");
      return sendJson(response, 200, {
        tasks: status ? tasks : tasks,
      });
    }

    if (request.method === "POST" && url.pathname === "/api/tasks") {
      try {
        const body = await readBody(request);
        if (typeof body.title !== "string" || !body.title.trim()) {
          return sendJson(response, 400, { error: "title is required" });
        }
        const tasks = readTasks(dbPath);
        const task = {
          id: randomUUID(),
          title: body.title.trim(),
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        tasks.push(task);
        writeTasks(dbPath, tasks);
        return sendJson(response, 201, { task });
      } catch (error) {
        return sendJson(response, error.message === "Invalid JSON" ? 400 : 413, {
          error: error.message,
        });
      }
    }

    const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
    if (request.method === "PATCH" && taskMatch) {
      try {
        const body = await readBody(request);
        if (!["pending", "completed"].includes(body.status)) {
          return sendJson(response, 400, { error: "status must be pending or completed" });
        }
        const tasks = readTasks(dbPath);
        const task = tasks.find((item) => item.id === taskMatch[1]);
        if (!task) return sendJson(response, 404, { error: "Task not found" });
        task.status = body.status;
        writeTasks(dbPath, tasks);
        return sendJson(response, 200, { task });
      } catch (error) {
        return sendJson(response, error.message === "Invalid JSON" ? 400 : 413, {
          error: error.message,
        });
      }
    }

    return sendJson(response, 404, { error: "Not found" });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, "127.0.0.1", () => {
    console.log(`TaskPulse listening on http://localhost:${port}`);
  });
}

module.exports = { createServer, readTasks, writeTasks };
