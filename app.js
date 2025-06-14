class Task {
    constructor(id, title, description, priority, category, completed = false) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.category = category;
        this.completed = completed;
    }

    toggleComplete() {
        this.completed = !this.completed;
    }
}

class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.nextId = this.tasks.length ? Math.max(...this.tasks.map(task => task.id)) + 1 : 1;
    }

    addTask(title, description, priority, category) {
        if (!title.trim()) {
            alert('Task title cannot be empty.');
            return false;
        }
        const task = new Task(this.nextId++, title, description, priority, category);
        this.tasks.push(task);
        this.saveTasks();
        if (priority === 'high') {
            this.showNotification(`High-priority task "${title}" added!`);
        }
        return true;
    }

    updateTask(id, title, description, priority, category) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return false;
        if (!title.trim()) {
            alert('Task title cannot be empty.');
            return false;
        }
        task.title = title;
        task.description = description;
        task.priority = priority;
        task.category = category;
        this.saveTasks();
        if (priority === 'high') {
            this.showNotification(`High-priority task "${title}" updated!`);
        }
        return true;
    }

    deleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        if (task.priority === 'high') {
            this.showNotification(`High-priority task "${task.title}" deleted!`);
        }
    }

    toggleTaskCompletion(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        task.toggleComplete();
        this.saveTasks();
        if (task.priority === 'high' && task.completed) {
            this.showNotification(`High-priority task "${task.title}" completed!`);
        }
    }

    getTasks(category = 'all', searchQuery = '') {
        let filteredTasks = this.tasks;
        if (category !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === category);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredTasks = filteredTasks.filter(task =>
                task.title.toLowerCase().includes(query) ||
                task.description.toLowerCase().includes(query)
            );
        }
        return filteredTasks.sort((a, b) => {
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 4000);
    }
}

class UI {
    constructor() {
        this.taskManager = new TaskManager();
        this.taskList = document.getElementById('task-list');
        this.taskForm = document.getElementById('task-form');
        this.categoryFilter = document.getElementById('category-filter');
        this.searchBar = document.getElementById('search-bar');
        this.themeToggle = document.getElementById('theme-toggle');
        this.loader = document.getElementById('loader');
        this.isEditMode = false;
        this.editTaskId = null;
        this.initEventListeners();
        this.renderTasks();
        this.loadTheme();
    }

    initEventListeners() {
        this.taskForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.categoryFilter.addEventListener('change', () => this.renderTasks());
        this.searchBar.addEventListener('input', () => this.renderTasks());
        this.themeToggle.addEventListener('change', () => this.toggleTheme());
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const category = document.getElementById('task-category').value;

        if (this.isEditMode) {
            if (this.taskManager.updateTask(this.editTaskId, title, description, priority, category)) {
                this.isEditMode = false;
                this.editTaskId = null;
                this.taskForm.querySelector('.btn-primary').textContent = 'Add Task';
            }
        } else {
            if (this.taskManager.addTask(title, description, priority, category)) {
                this.taskForm.reset();
            }
        }
        this.renderTasks();
    }

    renderTasks() {
        this.loader.style.display = 'block';
        this.taskList.style.opacity = '0';
        setTimeout(() => {
            const category = this.categoryFilter.value;
            const searchQuery = this.searchBar.value;
            const tasks = this.taskManager.getTasks(category, searchQuery);
            this.taskList.innerHTML = '';
            tasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = `task-item ${task.priority}-priority ${task.completed ? 'completed' : ''}`;
                taskElement.innerHTML = `
                    <h3 class="task-title">${task.title}</h3>
                    <p>${task.description}</p>
                    <p><strong>Priority:</strong> ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</p>
                    <p><strong>Category:</strong> ${task.category}</p>
                    <button onclick="ui.handleComplete(${task.id})">${task.completed ? 'Undo' : 'Complete'}</button>
                    <button onclick="ui.handleEdit(${task.id})">Edit</button>
                    <button onclick="ui.handleDelete(${task.id})">Delete</button>
                `;
                this.taskList.appendChild(taskElement);
            });
            this.loader.style.display = 'none';
            this.taskList.style.opacity = '1';
        }, 300);
    }

    handleComplete(id) {
        this.taskManager.toggleTaskCompletion(id);
        this.renderTasks();
    }

    handleEdit(id) {
        const task = this.taskManager.tasks.find(t => t.id === id);
        if (!task) return;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-category').value = task.category;
        this.taskForm.querySelector('.btn-primary').textContent = 'Update Task';
        this.isEditMode = true;
        this.editTaskId = id;
    }

    handleDelete(id) {
        this.taskManager.deleteTask(id);
        this.renderTasks();
    }

    toggleTheme() {
        document.body.classList.toggle('dark');
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    }

    loadTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        if (theme === 'dark') {
            document.body.classList.add('dark');
            this.themeToggle.checked = true;
        }
    }
}

const ui = new UI();