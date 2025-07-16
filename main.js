/**
 * JOB APPLICATION TRACKER - MAIN SCRIPT
 * Features:
 * - Add/edit/delete applications
 * - Filter by status
 * - Dark/light theme toggle
 * - Data visualization with Chart.js
 * - LocalStorage persistence
 */

// Wait for the DOM to fully load before running scripts
document.addEventListener('DOMContentLoaded', function() {
    // ===== DOM ELEMENTS =====
    const applicationsList = document.getElementById('applicationsList');
    const addJobBtn = document.getElementById('addJobBtn');
    const addJobModal = document.getElementById('addJobModal');
    const closeModal = document.querySelector('.close');
    const jobForm = document.getElementById('jobForm');
    const statusFilter = document.getElementById('statusFilter');
    const themeToggle = document.getElementById('themeToggle');
    
    // ===== CHART INITIALIZATION =====
    const ctx = document.getElementById('statusChart').getContext('2d');
    let statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Applied', 'Interview', 'Offer', 'Rejected'],
            datasets: [{
                data: [0, 0, 0, 0], // Initial empty data
                backgroundColor: [
                    '#17a2b8', // Applied
                    '#ffc107', // Interview
                    '#28a745', // Offer
                    '#dc3545'  // Rejected
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
                        color: 'var(--text-color)' // Dynamic color for theme
                    }
                }
            }
        }
    });

    // ===== DATA MANAGEMENT =====
    let applications = JSON.parse(localStorage.getItem('jobApplications')) || [];

    // ===== THEME TOGGLE =====
    themeToggle.addEventListener('change', toggleTheme);
    
    function toggleTheme() {
        const isDark = themeToggle.checked;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Update chart text colors
        statusChart.options.plugins.legend.labels.color = isDark ? '#f0f0f0' : '#333';
        statusChart.update();
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        themeToggle.checked = true;
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // ===== MODAL FUNCTIONALITY =====
    addJobBtn.addEventListener('click', () => addJobModal.style.display = 'block');
    closeModal.addEventListener('click', () => addJobModal.style.display = 'none');
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === addJobModal) {
            addJobModal.style.display = 'none';
        }
    });

    // ===== FORM SUBMISSION =====
    jobForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Create new application object
        const newApplication = {
            id: Date.now(), // Unique ID
            companyName: document.getElementById('companyName').value,
            jobTitle: document.getElementById('jobTitle').value,
            applicationDate: document.getElementById('applicationDate').value,
            status: document.getElementById('jobStatus').value,
            notes: document.getElementById('jobNotes').value
        };
        
        // Add to array and save
        applications.push(newApplication);
        saveApplications();
        renderApplications();
        updateStats();
        updateChart();
        
        // Reset form and close modal
        jobForm.reset();
        addJobModal.style.display = 'none';
    });

    // ===== FILTER APPLICATIONS =====
    statusFilter.addEventListener('change', renderApplications);

    // ===== CORE FUNCTIONS =====
    
    /**
     * Saves applications to localStorage
     */
    function saveApplications() {
        localStorage.setItem('jobApplications', JSON.stringify(applications));
    }

    /**
     * Renders applications based on current filter
     */
    function renderApplications() {
        const filter = statusFilter.value;
        const filteredApps = filter === 'all' 
            ? applications 
            : applications.filter(app => app.status === filter);
        
        // Clear current list
        applicationsList.innerHTML = '';
        
        // Show message if no apps
        if (filteredApps.length === 0) {
            applicationsList.innerHTML = '<p class="no-apps">No applications found</p>';
            return;
        }
        
        // Create HTML for each application
        filteredApps.forEach(app => {
            const appElement = document.createElement('div');
            appElement.className = `job-card ${app.status}`;
            appElement.innerHTML = `
                <button class="delete-btn" data-id="${app.id}" aria-label="Delete application">
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
        
        // Add delete button event listeners
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

    /**
     * Updates the stats cards (total apps, interviews, success rate)
     */
    function updateStats() {
        const totalApps = applications.length;
        const interviewApps = applications.filter(app => 
            app.status === 'interview' || app.status === 'offer'
        ).length;
        const successRate = totalApps > 0 ? Math.round((interviewApps / totalApps) * 100) : 0;
        
        document.getElementById('totalApps').textContent = totalApps;
        document.getElementById('interviewApps').textContent = interviewApps;
        document.getElementById('successRate').textContent = `${successRate}%`;
    }

    /**
     * Updates the chart with current application status counts
     */
    function updateChart() {
        const statusCounts = {
            applied: 0,
            interview: 0,
            offer: 0,
            rejected: 0
        };
        
        // Count each status
        applications.forEach(app => {
            statusCounts[app.status]++;
        });
        
        // Update chart data
        statusChart.data.datasets[0].data = [
            statusCounts.applied,
            statusCounts.interview,
            statusCounts.offer,
            statusCounts.rejected
        ];
        
        statusChart.update();
    }

    /**
     * Formats a date string (e.g., "2023-07-20" → "July 20, 2023")
     */
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // ===== INITIALIZE APP =====
    renderApplications();
    updateStats();
    updateChart();
});