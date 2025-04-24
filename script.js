document.addEventListener('DOMContentLoaded', () => {

    const greetings = document.getElementById('greetings');
    let userName = localStorage.getItem('userName');

    if (!userName) {
        userName = prompt("Witaj! Jak masz na imię?");
        if (userName && userName.trim() !== '') {
            userName = userName.trim();
            localStorage.setItem('userName', userName);
        } else {
            userName = "Gość";
        }
    }
    greetings.innerHTML = `Cześć ${userName}, <br> co musisz zrobić?
                        <i class="bi bi-check-square"></i>`;
    
    const taskText = document.getElementById('task-text');
    const taskDatetime = document.getElementById('task-datetime');
    const taskPriority = document.getElementById('task-priority');
    const addTaskButton = document.getElementById('add-task');
    const taskList = document.querySelector('.task-list');
    const filters = document.querySelectorAll('.filters button');
    const ctx = document.getElementById('tasksPieChart').getContext('2d');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let filter = 'all';
    let tasksPieChart;

    function renderTasks() {
        taskList.innerHTML = '';
        const filteredTasks = tasks.filter(task => {
            if (filter === 'all') return true;
            if (filter === 'done') return task.done && !task.abandoned;
            if (filter === 'todo') return !task.done && !task.abandoned;
            if (filter === 'abandoned') return task.abandoned;
            return true;
        });

        filteredTasks.forEach((task, index) => {
            const originalIndex = tasks.findIndex(t => t === task);

            const li = document.createElement('li');
            li.classList.add(task.priority);
            if (task.done) li.classList.add('done-visual');
            if (task.abandoned) li.classList.add('abandoned-visual');

            li.innerHTML = `
                <span class="task-text">${task.text}</span>
                <div class="priority"><p class="${task.priority}-txt">${task.priority}</p></div>
                <div class="task-actions">
                    <button
                        class="btn done"
                        data-index="${originalIndex}"
                        data-action="toggleDone"
                        ${task.abandoned ? 'disabled' : ''}
                        title="${task.done ? 'Oznacz jako do zrobienia' : 'Oznacz jako wykonane'}">
                        ${task.done ? '<i class="bi bi-arrow-counterclockwise"></i>' : '<i class="bi bi-check-circle"></i>'}
                    </button>
                     <button
                        class="btn edit"
                        data-index="${originalIndex}"
                        data-action="edit"
                        ${task.abandoned || task.done ? 'disabled' : ''} /* Wyłącz, jeśli porzucone lub wykonane */
                        title="Edytuj">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button
                        class="btn delete"
                        data-index="${originalIndex}"
                        data-action="delete"
                        title="Usuń">
                        <i class="bi bi-trash3"></i>
                    </button>
                    <button
                        class="btn abandoned"
                        data-index="${originalIndex}"
                        data-action="abandoned"
                        ${task.done ? 'disabled' : ''} /* Wyłącz, jeśli wykonane */
                        title="${task.abandoned ? 'Przywróć zadanie' : 'Porzuć zadanie'}">
                         ${task.abandoned ? '<i class="bi bi-arrow-clockwise"></i>' : '<i class="bi bi-x-circle"></i>'}
                    </button>
                </div>
            `;
            taskList.appendChild(li);
        });
        updateChart();
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function addTask() {
        const text = taskText.value.trim();
        const datetime = taskDatetime.value;
        const priority = taskPriority.value;
        if (text) {
            tasks.push({
                text,
                done: false,
                abandoned: false,
                datetime,
                priority
            });
            taskText.value = '';
            taskDatetime.value = '';
            taskPriority.value = 'low';
            saveTasks();
            renderTasks();
        } else {
            alert("Tekst zadania nie może być pusty!");
        }
    }

    function toggleDone(index) {
        if (tasks[index] && !tasks[index].abandoned) {
            tasks[index].done = !tasks[index].done;
            saveTasks();
            renderTasks();
        }
    }

    function deleteTask(index) {
        if (confirm(`Czy na pewno chcesz usunąć zadanie: "${tasks[index].text}"?`)) {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        }
    }

    function editTask(index) {
        const task = tasks[index];
        if (task.abandoned || task.done) return;

        taskText.value = task.text;
        taskDatetime.value = task.datetime ? task.datetime.substring(0, 16) : '';
        taskPriority.value = task.priority;

        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
        taskText.focus();
    }

    function abandonTask(index) {
        if (tasks[index] && !tasks[index].done) {
            tasks[index].abandoned = !tasks[index].abandoned;
            saveTasks();
            renderTasks();
        }
    }

    function getTaskCounts() {
        const doneCount = tasks.filter(task => task.done === true && !task.abandoned).length;
        const abandonedCount = tasks.filter(task => task.abandoned === true).length;
        const todoCount = tasks.filter(task => !task.done && !task.abandoned).length;

        return {
            done: doneCount,
            abandoned: abandonedCount,
            todo: todoCount
        };
    }
    function updateChart() {
        const counts = getTaskCounts();

        const data = {
            labels: [
                `Wykonane (${counts.done})`,
                `Porzucone (${counts.abandoned})`,
                `Do zrobienia (${counts.todo})`
            ],
            datasets: [{
                label: 'Status zadań',
                data: [counts.done, counts.abandoned, counts.todo],
                backgroundColor: [
                    'rgba(51, 115, 8, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 206, 86, 0.7)'
                ],
                borderColor: [
                    'rgba(51, 115, 8, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }]
        };

        const config = {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Podsumowanie statusu zadań'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const value = context.parsed;
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0.0%';
                                    label += value + ' (' + percentage + ')';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        };

        if (tasksPieChart) {
            tasksPieChart.data = data;
            tasksPieChart.update();
        } else {
            tasksPieChart = new Chart(ctx, config);
        }
    }

    addTaskButton.addEventListener('click', addTask);
    taskText.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    taskList.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (button) {
            const action = button.dataset.action;
            const index = parseInt(button.dataset.index, 10);

            if (!isNaN(index) && index >= 0 && index < tasks.length) {
                if (action === 'delete') {
                    deleteTask(index);
                } else if (action === 'edit') {
                    editTask(index);
                } else if (action === 'abandoned') {
                    abandonTask(index);
                } else if (action === 'toggleDone') {
                    toggleDone(index);
                }
            } else {
                console.error("Nieprawidłowy indeks zadania:", button.dataset.index);
            }
        }
    });

    filters.forEach(button => {
        button.addEventListener('click', () => {
            filter = button.dataset.filter;
            filters.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderTasks();
        });
    });

    renderTasks();

});
