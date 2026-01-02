// Task storage and management
let tasks = [];

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderTasks();
    updateStats();

    // Add enter key support for task input
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Add button click handler
    document.getElementById('addBtn').addEventListener('click', addTask);

    // Clear buttons
    document.getElementById('clearCompleted').addEventListener('click', clearCompleted);
    document.getElementById('clearAll').addEventListener('click', clearAll);

    // Event delegation for task list interactions
    document.getElementById('taskList').addEventListener('change', (e) => {
        if (e.target.classList.contains('task-checkbox')) {
            const taskId = parseInt(e.target.dataset.taskId);
            toggleTask(taskId);
        }
    });

    document.getElementById('taskList').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const taskId = parseInt(e.target.dataset.taskId);
            deleteTask(taskId);
        }
    });
});

// Load tasks from localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('orbitCheckTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('orbitCheckTasks', JSON.stringify(tasks));
}

// Add a new task
function addTask() {
    const input = document.getElementById('taskInput');
    const taskText = input.value.trim();

    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    updateStats();

    input.value = '';
    input.focus();
}

// Toggle task completion
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// Delete a task
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
}

// Clear completed tasks
function clearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
        alert('No completed tasks to clear!');
        return;
    }

    if (confirm(`Delete ${completedCount} completed task(s)?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// Clear all tasks
function clearAll() {
    if (tasks.length === 0) {
        alert('No tasks to clear!');
        return;
    }

    if (confirm('Delete all tasks? This cannot be undone!')) {
        tasks = [];
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// Render tasks to the DOM
function renderTasks() {
    const taskList = document.getElementById('taskList');
    
    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <p>📝 No tasks yet!</p>
                <p>Add your first task to get started.</p>
            </div>
        `;
        return;
    }

    taskList.innerHTML = tasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}">
            <input 
                type="checkbox" 
                class="task-checkbox"
                data-task-id="${task.id}"
                ${task.completed ? 'checked' : ''}
            />
            <span class="task-text">${escapeHtml(task.text)}</span>
            <button class="delete-btn" data-task-id="${task.id}">Delete</button>
        </li>
    `).join('');
}

// Update statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    document.getElementById('totalTasks').textContent = `Total: ${total}`;
    document.getElementById('completedTasks').textContent = `Completed: ${completed}`;
    document.getElementById('pendingTasks').textContent = `Pending: ${pending}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
