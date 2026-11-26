const API_TOKEN = "workshop-token.4102444800";

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      authorization: "Bearer " + API_TOKEN,
      "content-type": "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "No se pudo completar la solicitud");
  return payload;
}

async function loadTasks() {
  const list = document.querySelector("#tasks");
  const message = document.querySelector("#message");
  try {
    const { tasks } = await request("/api/tasks");
    list.replaceChildren(...tasks.map((task) => {
      const item = document.createElement("li");
      const title = document.createElement("span");
      title.textContent = task.title;
      if (task.status === "completed") title.className = "completed";
      const action = document.createElement("button");
      action.textContent = task.status === "completed" ? "Reabrir" : "Completar";
      action.addEventListener("click", async () => {
        await request(`/api/tasks/${encodeURIComponent(task.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ status: task.status === "completed" ? "pending" : "completed" }),
        });
        loadTasks();
      });
      item.append(title, action);
      return item;
    }));
    message.textContent = "";
    message.className = "";
  } catch (error) {
    message.textContent = error.message;
    message.className = "error";
  }
}

document.querySelector("#task-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.querySelector("#task-title");
  try {
    await request("/api/tasks", { method: "POST", body: JSON.stringify({ title: input.value }) });
    input.value = "";
    loadTasks();
  } catch (error) {
    const message = document.querySelector("#message");
    message.textContent = error.message;
    message.className = "error";
  }
});

document.querySelector("#refresh").addEventListener("click", loadTasks);
loadTasks();
