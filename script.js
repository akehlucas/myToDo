// DOM Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const categorySelect = document.getElementById('category-select');
const prioritySelect = document.getElementById('priority-select');
const dueDateInput = document.getElementById('due-date');
const sortSelect = document.getElementById('sort-select');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const clearCompletedBtn = document.getElementById('clear-completed');

// Filter elements
const filterButtons = document.querySelectorAll('.filter-btn');
const categoryFilterButtons = document.querySelectorAll('.category-filter-btn');
const priorityFilterButtons = document.querySelectorAll('.priority-filter-btn');

// Counter elements
const allCount = document.getElementById('all-count');
const activeCount = document.getElementById('active-count');
const completedCount = document.getElementById('completed-count');

// Application State
let todos = [];
let currentFilter = 'all';
let currentCategoryFilter = 'all';
let currentPriorityFilter = 'all';
let currentSort = 'created';
let nextId = 1;

// Category configurations
const categoryConfig = {
    personal: { icon: '📋', color: '#e8eaf6' },
    work: { icon: '💼', color: '#f3e5f5' },
    shopping: { icon: '🛒', color: '#e0f2f1' },
    health: { icon: '🏥', color: '#fce4ec' },
    education: { icon: '🎓', color: '#fff3e0' },
    other: { icon: '📦', color: '#f5f5f5' }
};

// Priority configurations
const priorityConfig = {
    high: { label: 'High', color: '#ff4757', icon: '🔴' },
    medium: { label: 'Medium', color: '#ffa502', icon: '🟡' },
    low: { label: 'Low', color: '#2ed573', icon: '🟢' }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    loadTodos();
    setupEventListeners();
    setDefaultDueDate();
    renderTodos();
    updateCounts();
});

// Set default due date to tomorrow
function setDefaultDueDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDateInput.value = tomorrow.toISOString().split('T')[0];
}

// Setup Event Listeners
function setupEventListeners() {
    // Form submission
    todoForm.addEventListener('submit', handleAddTodo);
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleStatusFilterChange);
    });
    
    categoryFilterButtons.forEach(btn => {
        btn.addEventListener('click', handleCategoryFilterChange);
    });
    
    priorityFilterButtons.forEach(btn => {
        btn.addEventListener('click', handlePriorityFilterChange);
    });
    
    // Sort and other actions
    sortSelect.addEventListener('change', handleSortChange);
    clearCompletedBtn.addEventListener('click', handleClearCompleted);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Handle Add Todo
function handleAddTodo(e) {
    e.preventDefault();
    
    const text = todoInput.value.trim();
    if (!text) return;
    
    const newTodo = {
        id: nextId++,
        text: text,
        category: categorySelect.value,
        priority: prioritySelect.value,
        dueDate: dueDateInput.value || null,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    todos.push(newTodo);
    saveTodos();
    renderTodos();
    updateCounts();
    
    // Reset form
    todoForm.reset();
    setDefaultDueDate();
    todoInput.focus();
    
    // Show success message
    showNotification(`Task added to ${categoryConfig[newTodo.category].icon} ${newTodo.category}!`, 'success');
}

// Handle Toggle Todo
function handleToggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    todo.completed = !todo.completed;
    todo.completedAt = todo.completed ? new Date().toISOString() : null;
    
    saveTodos();
    renderTodos();
    updateCounts();
    
    if (todo.completed) {
        showNotification('Task completed! 🎉', 'success');
    }
}

// Handle Edit Todo
function handleEditTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const newText = prompt('Edit task:', todo.text);
    if (newText && newText.trim() !== todo.text) {
        todo.text = newText.trim();
        saveTodos();
        renderTodos();
        showNotification('Task updated!', 'info');
    }
}

// Handle Delete Todo
function handleDeleteTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    if (confirm(`Delete "${todo.text}"?`)) {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderTodos();
        updateCounts();
        showNotification('Task deleted!', 'warning');
    }
}

// Filter Handlers
function handleStatusFilterChange(e) {
    currentFilter = e.target.getAttribute('data-filter');
    updateActiveButton(filterButtons, e.target);
    renderTodos();
}

function handleCategoryFilterChange(e) {
    currentCategoryFilter = e.target.getAttribute('data-category');
    updateActiveButton(categoryFilterButtons, e.target);
    renderTodos();
}

function handlePriorityFilterChange(e) {
    currentPriorityFilter = e.target.getAttribute('data-priority');
    updateActiveButton(priorityFilterButtons, e.target);
    renderTodos();
}

function updateActiveButton(buttons, activeButton) {
    buttons.forEach(btn => btn.classList.remove('active'));
    activeButton.classList.add('active');
}

// Handle Sort Change
function handleSortChange(e) {
    currentSort = e.target.value;
    renderTodos();
}

// Handle Clear Completed
function handleClearCompleted() {
    const completedTodos = todos.filter(t => t.completed);
    
    if (completedTodos.length === 0) {
        showNotification('No completed tasks to clear!', 'info');
        return;
    }
    
    if (confirm(`Delete ${completedTodos.length} completed task(s)?`)) {
        todos = todos.filter(t => !t.completed);
        saveTodos();
        renderTodos();
        updateCounts();
        showNotification(`${completedTodos.length} completed tasks cleared!`, 'success');
    }
}

// Render Todos
function renderTodos() {
    const filteredAndSortedTodos = getFilteredAndSortedTodos();
    
    if (filteredAndSortedTodos.length === 0) {
        emptyState.classList.remove('hidden');
        todoList.style.display = 'none';
    } else {
        emptyState.classList.add('hidden');
        todoList.style.display = 'block';
    }
    
    todoList.innerHTML = filteredAndSortedTodos.map(todo => createTodoHTML(todo)).join('');
}

// Create Enhanced Todo HTML
function createTodoHTML(todo) {
    const category = categoryConfig[todo.category];
    const priority = priorityConfig[todo.priority];
    const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
    const today = new Date();
    
    let dueDateClass = '';
    let dueDateText = '';
    
    if (dueDate) {
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            dueDateClass = 'overdue';
            dueDateText = `⚠️ ${Math.abs(diffDays)} day(s) overdue`;
        } else if (diffDays === 0) {
            dueDateClass = 'due-today';
            dueDateText = '📅 Due today';
        } else if (diffDays <= 3) {
            dueDateClass = 'due-soon';
            dueDateText = `📅 ${diffDays} day(s) left`;
        } else {
            dueDateText = `📅 ${dueDate.toLocaleDateString()}`;
        }
    }
    
    return `
        <li class="todo-item priority-${todo.priority} ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="todo-header">
                <div class="todo-main-content">
                    <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                         onclick="handleToggleTodo(${todo.id})" 
                         title="${todo.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                    </div>
                    <span class="todo-text" onclick="handleToggleTodo(${todo.id})">
                        ${escapeHtml(todo.text)}
                    </span>
                </div>
                
                <div class="todo-actions">
                    <button class="action-btn edit-btn" onclick="handleEditTodo(${todo.id})" title="Edit task">
                        ✏️
                    </button>
                    <button class="action-btn delete-btn" onclick="handleDeleteTodo(${todo.id})" title="Delete task">
                        🗑️
                    </button>
                </div>
            </div>
            
            <div class="todo-meta">
                <span class="todo-category">
                    ${category.icon} ${todo.category.charAt(0).toUpperCase() + todo.category.slice(1)}
                </span>
                <span class="todo-priority ${todo.priority}">
                    ${priority.icon} ${priority.label}
                </span>
                ${dueDate ? `<span class="todo-due-date ${dueDateClass}">${dueDateText}</span>` : ''}
            </div>
        </li>
    `;
}

// Get Filtered and Sorted Todos
function getFilteredAndSortedTodos() {
    let filtered = todos;
    
    // Status filter
    if (currentFilter === 'active') {
        filtered = filtered.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filtered = filtered.filter(t => t.completed);
    }
    
    // Category filter
    if (currentCategoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === currentCategoryFilter);
    }
    
    // Priority filter
    if (currentPriorityFilter !== 'all') {
        filtered = filtered.filter(t => t.priority === currentPriorityFilter);
    }
    
    // Sort
    return sortTodos(filtered);
}

// Sort Todos
function sortTodos(todos) {
    return todos.sort((a, b) => {
        switch (currentSort) {
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
                
            case 'dueDate':
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
                
            case 'category':
                return a.category.localeCompare(b.category);
                
            case 'alphabetical':
                return a.text.localeCompare(b.text);
                
            case 'created':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });
}

// Update Counts
function updateCounts() {
    const activeTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);
    
    allCount.textContent = todos.length;
    activeCount.textContent = activeTodos.length;
    completedCount.textContent = completedTodos.length;
    
    clearCompletedBtn.style.display = completedTodos.length > 0 ? 'block' : 'none';
}

// Show Notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        backgroundColor: type === 'success' ? '#4caf50' : 
                        type === 'warning' ? '#ff9800' : 
                        type === 'error' ? '#f44336' : '#2196f3',
        color: 'white',
        borderRadius: '8px',
        zIndex: '1000',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        animation: 'slideInRight 0.3s ease-out'
    });
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'Enter':
                todoInput.focus();
                break;
            case '1':
                e.preventDefault();
                prioritySelect.value = 'high';
                break;
            case '2':
                e.preventDefault();
                prioritySelect.value = 'medium';
                break;
            case '3':
                e.preventDefault();
                prioritySelect.value = 'low';
                break;
        }
    }
    
    if (e.key === 'Escape' && document.activeElement === todoInput) {
        todoInput.value = '';
    }
}

// Local Storage Functions
function saveTodos() {
    try {
        localStorage.setItem('enhancedTodos', JSON.stringify(todos));
        localStorage.setItem('nextId', nextId.toString());
    } catch (error) {
        console.error('Failed to save todos:', error);
        showNotification('Failed to save tasks!', 'error');
    }
}

function loadTodos() {
    try {
        const savedTodos = localStorage.getItem('enhancedTodos');
        const savedNextId = localStorage.getItem('nextId');
        
        if (savedTodos) {
            todos = JSON.parse(savedTodos);
        }
        
        if (savedNextId) {
            nextId = parseInt(savedNextId);
        }
        
        if (todos.length > 0) {
            const maxId = Math.max(...todos.map(t => t.id));
            nextId = Math.max(nextId, maxId + 1);
        }
    } catch (error) {
        console.error('Failed to load todos:', error);
        todos = [];
        nextId = 1;
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Analytics and Insights
function getTodoAnalytics() {
    const analytics = {
        totalTasks: todos.length,
        completedTasks: todos.filter(t => t.completed).length,
        overdueTasks: todos.filter(t => {
            if (!t.dueDate || t.completed) return false;
            return new Date(t.dueDate) < new Date();
        }).length,
        categoryBreakdown: {},
        priorityBreakdown: {},
        averageCompletionTime: 0
    };
    
    // Category breakdown
    todos.forEach(todo => {
        analytics.categoryBreakdown[todo.category] = 
            (analytics.categoryBreakdown[todo.category] || 0) + 1;
    });
    
    // Priority breakdown
    todos.forEach(todo => {
        analytics.priorityBreakdown[todo.priority] = 
            (analytics.priorityBreakdown[todo.priority] || 0) + 1;
    });
    
    // Calculate average completion time
    const completedTodos = todos.filter(t => t.completed && t.completedAt);
    if (completedTodos.length > 0) {
        const totalTime = completedTodos.reduce((sum, todo) => {
            const created = new Date(todo.createdAt);
            const completed = new Date(todo.completedAt);
            return sum + (completed - created);
        }, 0);
        
        analytics.averageCompletionTime = totalTime / completedTodos.length / (1000 * 60 * 60 * 24); // in days
    }
    
    return analytics;
}

// Export enhanced analytics
function exportAnalytics() {
    const analytics = getTodoAnalytics();
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `todo_analytics_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Analytics exported!', 'success');
}

// Add analytics to console for development
if (window.location.hostname === 'localhost') {
    window.todoAnalytics = getTodoAnalytics;
    console.log('📊 Todo Analytics available via: todoAnalytics()');
}