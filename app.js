const STORAGE_KEY = "todo-app-items";
const THEME_KEY = "todo-app-theme";

const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoPriority = document.getElementById("todoPriority");
const todoDue = document.getElementById("todoDue");
const todoList = document.getElementById("todoList");
const emptyState = document.getElementById("emptyState");
const itemsLeft = document.getElementById("itemsLeft");
const clearCompletedBtn = document.getElementById("clearCompleted");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");
const filterBtns = document.querySelectorAll(".filter-btn");

let todos = loadTodos();
let currentFilter = "all";
let searchTerm = "";

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function priorityLabel(p) {
  return { high: "높음", medium: "보통", low: "낮음" }[p] || "보통";
}

function formatDue(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-");
  return `${y}.${m}.${d}`;
}

function isOverdue(dateStr, completed) {
  if (!dateStr || completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

function render() {
  const filtered = todos.filter((t) => {
    if (currentFilter === "active" && t.completed) return false;
    if (currentFilter === "completed" && !t.completed) return false;
    if (searchTerm && !t.text.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    return true;
  });

  todoList.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }

  filtered.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");
    li.dataset.id = todo.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    const body = document.createElement("div");
    body.className = "todo-body";

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;
    text.title = "더블클릭하여 수정";
    text.addEventListener("dblclick", () => startEdit(li, todo));

    const meta = document.createElement("div");
    meta.className = "todo-meta";

    const badge = document.createElement("span");
    badge.className = `priority-badge ${todo.priority}`;
    badge.textContent = priorityLabel(todo.priority);
    meta.appendChild(badge);

    if (todo.due) {
      const dueBadge = document.createElement("span");
      dueBadge.className =
        "due-badge" + (isOverdue(todo.due, todo.completed) ? " overdue" : "");
      dueBadge.textContent = `📅 ${formatDue(todo.due)}`;
      meta.appendChild(dueBadge);
    }

    body.appendChild(text);
    body.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "todo-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.title = "수정";
    editBtn.addEventListener("click", () => startEdit(li, todo));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "삭제";
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(body);
    li.appendChild(actions);

    todoList.appendChild(li);
  });

  const remaining = todos.filter((t) => !t.completed).length;
  itemsLeft.textContent = `${remaining}개 남음`;
}

function startEdit(li, todo) {
  const body = li.querySelector(".todo-body");
  body.innerHTML = "";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "edit-input";
  input.value = todo.text;
  input.maxLength = 200;

  const commit = () => {
    const value = input.value.trim();
    if (value) {
      todo.text = value;
      saveTodos();
    }
    render();
  };

  input.addEventListener("blur", commit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") render();
  });

  body.appendChild(input);
  input.focus();
  input.select();
}

function addTodo(text, priority, due) {
  todos.unshift({
    id: uid(),
    text,
    completed: false,
    priority,
    due: due || null,
    createdAt: Date.now(),
  });
  saveTodos();
  render();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos();
    render();
  }
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  render();
}

function clearCompleted() {
  todos = todos.filter((t) => !t.completed);
  saveTodos();
  render();
}

todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;
  addTodo(text, todoPriority.value, todoDue.value);
  todoInput.value = "";
  todoDue.value = "";
  todoInput.focus();
});

clearCompletedBtn.addEventListener("click", clearCompleted);

searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  render();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, theme);
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

const savedTheme =
  localStorage.getItem(THEME_KEY) ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light");
applyTheme(savedTheme);

render();
