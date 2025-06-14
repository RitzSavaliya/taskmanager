class Task {
    constructor(id, title, description, priority, category, dueDate = null, completed = false) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.category = category;
        this.dueDate = dueDate;
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

    addTask(title, description, priority, category, dueDate) {
        if (!title.trim()) {
            alert('Task title cannot be empty.');
            return false;
        }
        const task = new Task(this.nextId++, title, description, priority, category, dueDate);
        this.tasks.push(task);
        this.saveTasks();
        if (priority === 'high') {
            this.showNotification(`High-priority task "${title}" added!`);
        }
        return true;
    }

    updateTask(id, title, description, priority, category, dueDate) {
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
        task.dueDate = dueDate;
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

    clearFinishedTasks() {
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.showNotification('All finished tasks cleared!');
    }

    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tasks.json';
        link.click();
        URL.revokeObjectURL(url);
        this.showNotification('Tasks exported successfully!');
    }

    getTasks(categories = ['Personal', 'Work', 'Urgent'], searchQuery = '', showFinished = false, sortBy = 'priority') {
        let filteredTasks = this.tasks.filter(task => task.completed === showFinished);
        if (categories.length > 0) {
            filteredTasks = filteredTasks.filter(task => categories.includes(task.category));
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredTasks = filteredTasks.filter(task =>
                task.title.toLowerCase().includes(query) ||
                task.description.toLowerCase().includes(query) ||
                (task.dueDate && task.dueDate.includes(query))
            );
        }
        return filteredTasks.sort((a, b) => {
            if (sortBy === 'priority') {
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            } else if (sortBy === 'due-date') {
                return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
            } else {
                return a.title.localeCompare(b.title);
            }
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
        this.categoryFilters = document.querySelectorAll('.category-filter');
        this.searchBar = document.getElementById('search-bar');
        this.sortBy = document.getElementById('sort-by');
        this.themeToggle = document.getElementById('theme-toggle');
        this.toggleFinished = document.getElementById('toggle-finished');
        this.clearFinished = document.getElementById('clear-finished');
        this.exportTasks = document.getElementById('export-tasks');
        this.loader = document.getElementById('loader');
        this.isEditMode = false;
        this.editTaskId = null;
        this.showFinished = false;
        this.initEventListeners();
        this.renderTasks();
        this.loadTheme();
    }

    initEventListeners() {
        this.taskForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.categoryFilters.forEach(filter =>
            filter.addEventListener('change', () => this.renderTasks())
        );
        this.searchBar.addEventListener('input', () => this.renderTasks());
        this.sortBy.addEventListener('change', () => this.renderTasks());
        this.themeToggle.addEventListener('change', () => this.toggleTheme());
        this.toggleFinished.addEventListener('click', () => this.handleToggleFinished());
        this.clearFinished.addEventListener('click', () => this.handleClearFinished());
        this.exportTasks.addEventListener('click', () => this.taskManager.exportTasks());
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const category = document.getElementById('task-category').value;
        const dueDate = document.getElementById('task-due-date').value || null;

        if (this.isEditMode) {
            if (this.taskManager.updateTask(this.editTaskId, title, description, priority, category, dueDate)) {
                this.isEditMode = false;
                this.editTaskId = null;
                this.taskForm.querySelector('.btn-primary').textContent = 'Add Task';
            }
        } else {
            if (this.taskManager.addTask(title, description, priority, category, dueDate)) {
                this.taskForm.reset();
            }
        }
        this.renderTasks();
    }

    handleToggleFinished() {
        this.showFinished = !this.showFinished;
        this.toggleFinished.textContent = this.showFinished ? 'Show Active Tasks' : 'Show Finished Tasks';
        this.renderTasks();
    }

    handleClearFinished() {
        if (confirm('Are you sure you want to clear all finished tasks?')) {
            this.taskManager.clearFinishedTasks();
            this.renderTasks();
        }
    }

    renderTasks() {
        this.loader.style.display = 'block';
        this.taskList.style.opacity = '0';
        setTimeout(() => {
            const categories = Array.from(this.categoryFilters)
                .filter(filter => filter.checked)
                .map(filter => filter.value);
            const searchQuery = this.searchBar.value;
            const sortBy = this.sortBy.value;
            const tasks = this.taskManager.getTasks(categories, searchQuery, this.showFinished, sortBy);
            this.taskList.innerHTML = '';
            tasks.forEach(task => {
                const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
                const taskElement = document.createElement('div');
                taskElement.className = `task-item ${task.priority}-priority ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
                taskElement.innerHTML = `
                    <h3 class="task-title">${task.title}</h3>
                    <p>${task.description || 'No description'}</p>
                    <p><strong>Priority:</strong> ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</p>
                    <p><strong>Category:</strong> ${task.category}</p>
                    <p><strong>Due Date:</strong> ${task.dueDate || 'None'}</p>
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
        document.getElementById('task-due-date').value = task.dueDate || '';
        this.taskForm.querySelector('.btn-primary').textContent = 'Update Task';
        this.isEditMode = true;
        this.editTaskId = id;
    }

    handleDelete(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.taskManager.deleteTask(id);
            this.renderTasks();
        }
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