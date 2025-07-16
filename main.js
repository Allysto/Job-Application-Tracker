document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const applicationsList = document.getElementById('applicationsList');
    const addJobBtn = document.getElementById('addJobBtn');
    const addJobModal = document.getElementById('addJobModal');
    const closeModal = document.querySelector('.close');
    const jobForm = document.getElementById('jobForm');
    const statusFilter = document.getElementById('statusFilter');
    const themeToggle = document.getElementById('themeToggle');
    
    // Chart initialization
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
                        color: 'var(--text-color)'
                    }
                }
            }
        }
    });

    // Load applications from localStorage
    let applications = JSON.parse(localStorage.getItem('jobApplications')) || [];

    // Theme toggle functionality
    themeToggle.addEventListener('change', toggleTheme);
    function toggleTheme() {
        const isDark = themeToggle.checked;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        themeToggle.checked = true;
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Modal functionality
    addJobBtn.addEventListener('click', () => addJobModal.style.display = 'block');
    closeModal.addEventListener('click', () => addJobModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === addJobModal) {
            addJobModal.style.display = 'none';
        }
    });

    // Form submission
    jobForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newApplication = {
            id: Date.now(),
            companyName: document.getElementById('companyName').value,
            jobTitle: document.getElementById('jobTitle').value,
            applicationDate: document.getElementById('applicationDate').value,
            status: document.getElementById('jobStatus').value,
            notes: document.getElementById('jobNotes').value
        };
        
        applications.push(newApplication);
        saveApplications();
        renderApplications();
        updateStats();
        updateChart();
        
        jobForm.reset();
        addJobModal.style.display = 'none';
    });

    // Filter applications
    statusFilter.addEventListener('change', renderApplications);

    // Save applications to localStorage
    function saveApplications() {
        localStorage.setItem('jobApplications', JSON.stringify(applications));
    }

    // Render applications based on filter
    function renderApplications() {
        const filter = statusFilter.value;
        const filteredApps = filter === 'all' 
            ? applications 
            : applications.filter(app => app.status === filter);
        
        applicationsList.innerHTML = '';
        
        if (filteredApps.length === 0) {
            applicationsList.innerHTML = '<p class="no-apps">No applications found</p>';
            return;
        }
        
        filteredApps.forEach(app => {
            const appElement = document.createElement('div');
            appElement.className = `job-card ${app.status}`;
            appElement.innerHTML = `
                <button class="delete-btn" data-id="${app.id}">
                    <i class="fas fa-trash"></i>
                </button>
                <div class="job-header">
                    <div>
                        <div class="job-title">${app.jobTitle}</div>
                        <div class="job-company">${app.companyName}</div>
                    </div>
                    <div class="job-status status-${app.status}">${app.status}</div>
                </div>
                <div class="job-date">Applied on: ${formatDate(app.applicationDate)}</div>
                ${app.notes ? `<div class="job-notes">${app.notes}</div>` : ''}
            `;
            applicationsList.appendChild(appElement);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                applications = applications.filter(app => app.id !== id);
                saveApplications();
                renderApplications();
                updateStats();
                updateChart();
            });
        });
    }

    // Update statistics
    function updateStats() {
        const totalApps = applications.length;
        const interviewApps = applications.filter(app => app.status === 'interview' || app.status === 'offer').length;
        const successRate = totalApps > 0 ? Math.round((interviewApps / totalApps) * 100) : 0;
        
        document.getElementById('totalApps').textContent = totalApps;
        document.getElementById('interviewApps').textContent = interviewApps;
        document.getElementById('successRate').textContent = `${successRate}%`;
    }

    // Update chart data
    function updateChart() {
        const statusCounts = {
            applied: 0,
            interview: 0,
            offer: 0,
            rejected: 0
        };
        
        applications.forEach(app => {
            statusCounts[app.status]++;
        });
        
        statusChart.data.datasets[0].data = [
            statusCounts.applied,
            statusCounts.interview,
            statusCounts.offer,
            statusCounts.rejected
        ];
        
        statusChart.update();
    }

    // Format date for display
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Initialize the app
    renderApplications();
    updateStats();
    updateChart();
});
