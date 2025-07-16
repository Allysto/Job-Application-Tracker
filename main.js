document.addEventListener('DOMContentLoaded', function() {
    const applicationsList = document.getElementById('applicationsList');
    const addJobBtn = document.getElementById('addJobBtn');
    const addJobModal = document.getElementById('addJobModal');
    const closeModal = document.querySelector('.close');
    const jobForm = document.getElementById('jobForm');
    const statusFilter = document.getElementById('statusFilter');
    const themeToggle = document.getElementById('themeToggle');

    const ctx = document.getElementById('statusChart').getContext('2d');
    let statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Applied', 'Interview', 'Offer', 'Rejected'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#17a2b8',
                    '#ffc107',
                    '#28a745',
                    '#dc3545'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
                    }
                }
            }
        }
    });

    let applications = JSON.parse(localStorage.getItem('jobApplications')) || [];

    // THEME TOGGLE
    themeToggle.addEventListener('change', toggleTheme);
    function toggleTheme() {
        const isDark = themeToggle.checked;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateChartLegendColor(); // Re-render legend label colors
    }

    function updateChartLegendColor() {
        statusChart.options.plugins.legend.labels.color =
            getComputedStyle(document.documentElement).getPropertyValue('--text-color');
        statusChart.update();
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        themeToggle.checked = true;
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // MODAL LOGIC
    addJobBtn.addEventListener('click', () => addJobModal.style.display = 'block');
    closeModal.addEventListener('click', () => addJobModal.style.display = 'none');
    window.addEventListener('click', e => {
        if (e.target === addJobModal) {
            addJobModal.style.display = 'none';
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            addJobModal.style.display = 'none';
        }
    });

    // FORM SUBMIT
    jobForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const newApp = {
            id: Date.now(),
            companyName: document.getElementById('companyName').value.trim(),
            jobTitle: document.getElementById('jobTitle').value.trim(),
            applicationDate: document.getElementById('applicationDate').value,
            status: document.getElementById('jobStatus').value,
            notes: document.getElementById('jobNotes').value.trim()
        };

        applications.push(newApp);
        saveApplications();
        renderApplications();
        updateStats();
        updateChart();

        jobForm.reset();
        addJobModal.style.display = 'none';
    });

    statusFilter.addEventListener('change', renderApplications);

    function saveApplications() {
        localStorage.setItem('jobApplications', JSON.stringify(applications));
    }

    function renderApplications() {
        const filter = statusFilter.value;
        const filteredApps = filter === 'all' ? applications : applications.filter(app => app.status === filter);
        applicationsList.innerHTML = '';

        if (filteredApps.length === 0) {
            applicationsList.innerHTML = '<p class="no-apps">No applications found</p>';
            return;
        }

        filteredApps.forEach(app => {
            const appCard = document.createElement('div');
            appCard.className = `job-card ${app.status}`;
            appCard.innerHTML = `
                <button class="delete-btn" data-id="${app.id}" aria-label="Delete application">
                    <i class="fas fa-trash"></i>
                </button>
                <div class="job-header">
                    <div>
                        <div class="job-title">${escapeHTML(app.jobTitle)}</div>
                        <div class="job-company">${escapeHTML(app.companyName)}</div>
                    </div>
                    <div class="job-status status-${app.status}">${app.status}</div>
                </div>
                <div class="job-date">Applied on: ${formatDate(app.applicationDate)}</div>
                ${app.notes ? `<div class="job-notes">${escapeHTML(app.notes)}</div>` : ''}
            `;
            applicationsList.appendChild(appCard);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                applications = applications.filter(app => app.id !== id);
                saveApplications();
                renderApplications();
                updateStats();
                updateChart();
            });
        });
    }

    function updateStats() {
        const total = applications.length;
        const interviews = applications.filter(app => ['interview', 'offer'].includes(app.status)).length;
        const rate = total ? Math.round((interviews / total) * 100) : 0;

        document.getElementById('totalApps').textContent = total;
        document.getElementById('interviewApps').textContent = interviews;
        document.getElementById('successRate').textContent = `${rate}%`;
    }

    function updateChart() {
        const counts = { applied: 0, interview: 0, offer: 0, rejected: 0 };
        applications.forEach(app => counts[app.status]++);

        statusChart.data.datasets[0].data = [
            counts.applied,
            counts.interview,
            counts.offer,
            counts.rejected
        ];
        statusChart.update();
    }

    function formatDate(dateStr) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString(undefined, options);
    }

    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, function(tag) {
            const chars = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return chars[tag] || tag;
        });
    }

    // Initialize App
    renderApplications();
    updateStats();
    updateChart();
});
