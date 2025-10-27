// ApolloAI - Main JavaScript File
// Educational Scheduling Platform

class ApolloAI {
    constructor() {
        this.assignments = this.loadAssignments();
        this.userProfile = this.loadUserProfile();
        this.init();
    }

    init() {
        this.initializeNeuralBackground();
        this.initializeAnimations();
        this.initializeEventListeners();
        this.initializeCalendar();
        this.initializePerformanceChart();
        this.initializeTimerUI();
        this.startAIAssistant();
        this.loadDashboardData();
    }

    // Neural Network Background with p5.js
    initializeNeuralBackground() {
        new p5((p) => {
            let nodes = [];
            let connections = [];
            
            p.setup = () => {
                let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                canvas.parent('neural-bg');
                
                // Create nodes
                for (let i = 0; i < 50; i++) {
                    nodes.push({
                        x: p.random(p.width),
                        y: p.random(p.height),
                        vx: p.random(-0.5, 0.5),
                        vy: p.random(-0.5, 0.5),
                        size: p.random(2, 6)
                    });
                }
            };
            
            p.draw = () => {
                p.clear();
                
                // Update and draw nodes
                for (let node of nodes) {
                    node.x += node.vx;
                    node.y += node.vy;
                    
                    // Wrap around edges
                    if (node.x < 0) node.x = p.width;
                    if (node.x > p.width) node.x = 0;
                    if (node.y < 0) node.y = p.height;
                    if (node.y > p.height) node.y = 0;
                    
                    // Draw node
                    p.fill(26, 35, 50, 100);
                    p.noStroke();
                    p.circle(node.x, node.y, node.size);
                }
                
                // Draw connections
                p.stroke(186, 134, 11, 50);
                p.strokeWeight(1);
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        let dist = p.dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
                        if (dist < 100) {
                            p.line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
                        }
                    }
                }
            };
            
            p.windowResized = () => {
                p.resizeCanvas(p.windowWidth, p.windowHeight);
            };
        });
    }

    // Initialize text animations and interactions
    initializeAnimations() {
        // Split text for character animations
        Splitting();
        
        // Animate hero text on load
        anime({
            targets: '[data-splitting] .char',
            translateY: [-100, 0],
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 1400,
            delay: (el, i) => 30 * i
        });

        // Animate cards on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    anime({
                        targets: entry.target,
                        translateY: [50, 0],
                        opacity: [0, 1],
                        easing: 'easeOutQuart',
                        duration: 800,
                        delay: 200
                    });
                }
            });
        }, observerOptions);

        // Observe all cards
        document.querySelectorAll('.card-hover').forEach(card => {
            observer.observe(card);
        });
    }

    // Event listeners for interactive elements
    initializeEventListeners() {
        // Assignment modal
        const addAssignmentBtn = document.getElementById('add-assignment-btn');
        const assignmentModal = document.getElementById('assignment-modal');
        const closeModal = document.getElementById('close-modal');
        const cancelAssignment = document.getElementById('cancel-assignment');
        const assignmentForm = document.getElementById('assignment-form');

        addAssignmentBtn?.addEventListener('click', () => {
            assignmentModal.classList.remove('hidden');
            anime({
                targets: assignmentModal.querySelector('.bg-white'),
                scale: [0.8, 1],
                opacity: [0, 1],
                easing: 'easeOutBack',
                duration: 400
            });
        });

        [closeModal, cancelAssignment].forEach(btn => {
            btn?.addEventListener('click', () => {
                anime({
                    targets: assignmentModal.querySelector('.bg-white'),
                    scale: [1, 0.8],
                    opacity: [1, 0],
                    easing: 'easeInBack',
                    duration: 300,
                    complete: () => {
                        assignmentModal.classList.add('hidden');
                    }
                });
            });
        });

        // Form submission
        assignmentForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAssignmentSubmission();
        });

        // Calendar navigation
        document.querySelectorAll('[data-calendar-nav]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const direction = e.target.dataset.calendarNav;
                this.navigateCalendar(direction);
            });
        });
    }

    // Calendar functionality
    initializeCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) return;

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        this.renderCalendar(currentYear, currentMonth);
    }

    renderCalendar(year, month) {
        const calendarGrid = document.getElementById('calendar-grid');
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        
        calendarGrid.innerHTML = '';
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'h-12';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day h-12 flex items-center justify-center text-sm font-medium rounded-lg cursor-pointer';
            dayElement.textContent = day;
            
            const currentDate = new Date(year, month, day);
            
            // Highlight today
            if (currentDate.toDateString() === today.toDateString()) {
                dayElement.classList.add('bg-amber-500', 'text-white');
            }
            
            // Add assignments indicators
            const dayAssignments = this.getAssignmentsForDate(currentDate);
            if (dayAssignments.length > 0) {
                const indicator = document.createElement('div');
                indicator.className = 'absolute w-2 h-2 bg-red-500 rounded-full mt-6 ml-6';
                dayElement.style.position = 'relative';
                dayElement.appendChild(indicator);
            }
            
            dayElement.addEventListener('click', () => {
                this.showDayDetails(currentDate);
            });
            
            calendarGrid.appendChild(dayElement);
        }
    }

    // Performance analytics chart
    initializePerformanceChart() {
        const chartElement = document.getElementById('performance-chart');
        if (!chartElement) return;

        const chart = echarts.init(chartElement);
        
        const option = {
            color: ['#1a2332', '#7a8471', '#b8860b'],
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                }
            },
            legend: {
                data: ['Study Hours', 'Assignments', 'Productivity']
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    name: 'Study Hours',
                    type: 'line',
                    smooth: true,
                    data: [4.5, 6.2, 3.8, 5.5, 7.1, 4.9, 6.3]
                },
                {
                    name: 'Assignments',
                    type: 'bar',
                    data: [2, 3, 1, 4, 2, 3, 2]
                },
                {
                    name: 'Productivity',
                    type: 'line',
                    smooth: true,
                    data: [85, 92, 78, 88, 95, 82, 90]
                }
            ]
        };
        
        chart.setOption(option);
        
        // Resize chart on window resize
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }

    // AI Assistant with typing animation
    startAIAssistant() {
        const aiMessages = [
            "Analyzing your schedule to optimize study time...",
            "Identifying peak productivity hours based on your patterns...",
            "Recommending study breaks for maximum focus...",
            "Adjusting assignment priorities based on deadlines...",
            "Your personalized study plan is ready!"
        ];
        
        let messageIndex = 0;
        // ensure we keep a single Typed instance to avoid overlapping animations
        this._aiTyped = this._aiTyped || null;

        const typeMessage = () => {
            const element = document.getElementById('ai-message');
            if (!element) return;

            // clear previous content and destroy existing typed if present
            if (this._aiTyped) {
                try { this._aiTyped.destroy(); } catch (e) { /* ignore */ }
                this._aiTyped = null;
            }
            element.textContent = '';

            this._aiTyped = new Typed(element, {
                strings: [aiMessages[messageIndex]],
                typeSpeed: 40,
                backSpeed: 0,
                showCursor: false,
                onComplete: () => {
                    setTimeout(() => {
                        messageIndex = (messageIndex + 1) % aiMessages.length;
                        try { this._aiTyped.destroy(); } catch (e) {}
                        this._aiTyped = null;
                        setTimeout(typeMessage, 1200);
                    }, 2200);
                }
            });
        };

        setTimeout(typeMessage, 1200);
    }

    // Assignment management
    handleAssignmentSubmission() {
        const title = document.getElementById('assignment-title').value;
        const subject = document.getElementById('assignment-subject').value;
        const date = document.getElementById('assignment-date').value;
        const hours = document.getElementById('assignment-hours').value;
        const priority = document.getElementById('assignment-priority').value;
        
        if (!title || !subject || !date || !hours) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const assignment = {
            id: Date.now(),
            title,
            subject,
            dueDate: new Date(date),
            estimatedHours: parseFloat(hours),
            priority,
            progress: 0,
            createdAt: new Date()
        };
        
    // Attempt to persist to server and get planner response. Local fallback handled on error.
        // Try to POST to server to persist and get a planner response. If server not available, fall back to local-only behavior.
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('apolloai-token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch('/api/assignments', {
            method: 'POST',
            headers,
            body: JSON.stringify(assignment)
        }).then(res => res.json()).then(data => {
            // server returns { assignment, plan }
            const serverAssignment = data.assignment || assignment;
            if (data.plan) serverAssignment.plan = data.plan;

            this.assignments.push(serverAssignment);
            this.saveAssignments();
            this.addAssignmentToUI(serverAssignment);
            this.closeAssignmentModal();
            this.showNotification('Assignment added and planned successfully!', 'success');

            // Show brief plan info
            if (serverAssignment.plan && serverAssignment.plan.slots && serverAssignment.plan.slots.length > 0) {
                const first = serverAssignment.plan.slots[0];
                const start = new Date(first.startISO).toLocaleString();
                this.showNotification(`First suggested slot: ${start} (${first.durationHours}h)`, 'info');
            } else if (serverAssignment.plan) {
                this.showNotification(serverAssignment.plan.note || 'Planner returned no slots', 'warning');
            }
        }).catch(err => {
            console.warn('Failed to POST assignment to server, falling back to local-only:', err);
            // Fallback: local storage only
            this.assignments.push(assignment);
            this.saveAssignments();
            this.addAssignmentToUI(assignment);
            this.closeAssignmentModal();
            this.showNotification('Assignment saved locally (server unreachable).', 'warning');

            // still try local planner UI suggestion
            this.suggestOptimalSchedule(assignment);
        });
    }

    suggestOptimalSchedule(assignment) {
        // Try server-side planner first (if server is running). Fallback to local quick tips.
        const payload = {
            assignment: {
                title: assignment.title,
                dueDate: assignment.dueDate,
                estimatedHours: assignment.estimatedHours,
                priority: assignment.priority
            },
            userProfile: this.userProfile,
            existingAssignments: this.assignments
        };

        const sHeaders = { 'Content-Type': 'application/json' };
        const sToken = localStorage.getItem('apolloai-token');
        if (sToken) sHeaders['Authorization'] = `Bearer ${sToken}`;

        fetch('/api/suggest', {
            method: 'POST',
            headers: sHeaders,
            body: JSON.stringify(payload)
        }).then(r => r.json()).then(data => {
            if (data && data.plan) {
                const p = data.plan;
                if (p.slots && p.slots.length > 0) {
                    const first = p.slots[0];
                    const start = new Date(first.startISO).toLocaleString();
                    this.showNotification(`Planned ${assignment.estimatedHours}h in ${p.slots.length} slot(s). First: ${start}`, 'info');
                } else {
                    this.showNotification(p.note || 'Planner could not find enough slots', 'warning');
                }
            } else {
                this.showNotification('Planner unavailable — using local suggestions', 'warning');
                this.localSuggestionFallback(assignment);
            }
        }).catch(err => {
            // server not running or network error — fallback
            console.warn('Planner fetch failed:', err);
            this.localSuggestionFallback(assignment);
        });
    }

    localSuggestionFallback(assignment) {
        const suggestions = [
            "Based on your schedule, I recommend working on this assignment between 2-4 PM when your focus is highest.",
            "This assignment pairs well with your existing CS workload. Consider grouping similar tasks.",
            "I've identified 3 optimal time slots this week for this assignment. Check your updated calendar!"
        ];
        setTimeout(() => {
            const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
            this.showNotification(randomSuggestion, 'info');
        }, 500);
    }

    addAssignmentToUI(assignment) {
        const assignmentsList = document.getElementById('assignments-list');
        if (!assignmentsList) return;
        
        const assignmentElement = this.createAssignmentElement(assignment);
        assignmentsList.insertBefore(assignmentElement, assignmentsList.firstChild);
        
        // Animate the new assignment
        anime({
            targets: assignmentElement,
            translateX: [-300, 0],
            opacity: [0, 1],
            easing: 'easeOutQuart',
            duration: 600
        });
    }

    createAssignmentElement(assignment) {
        const div = document.createElement('div');
        div.className = 'assignment-item bg-gray-50 rounded-xl p-4';
        div.dataset.assignmentId = assignment.id;
        
        const priorityColors = {
            high: 'bg-red-100 text-red-700',
            medium: 'bg-yellow-100 text-yellow-700',
            low: 'bg-green-100 text-green-700'
        };
        
    // Normalize dueDate to a Date object
    const due = new Date(assignment.dueDate);
    const daysUntilDue = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
        
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-900">${assignment.title}</h3>
                    <p class="text-gray-600 text-sm mt-1">${assignment.subject} • Due in ${daysUntilDue} days</p>
                    <div class="flex items-center mt-2 space-x-4">
                        <span class="text-xs ${priorityColors[assignment.priority]} px-2 py-1 rounded-full capitalize">${assignment.priority} Priority</span>
                        <span class="text-xs text-gray-500">Estimated: ${assignment.estimatedHours} hours</span>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium text-gray-900">${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    <div class="mt-2">
                        <div class="w-16 h-16">
                            <svg class="progress-ring w-16 h-16">
                                <circle cx="32" cy="32" r="28" stroke="#e5e7eb" stroke-width="4" fill="transparent"/>
                                <circle cx="32" cy="32" r="28" stroke="#b8860b" stroke-width="4" fill="transparent" 
                                        stroke-dasharray="175.929" stroke-dashoffset="175.929" class="progress-ring-circle"/>
                            </svg>
                            <div class="absolute inset-0 flex items-center justify-center">
                                <span class="text-xs font-bold text-gray-700">0%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;

        // If planner provided suggested slots, append a small summary
        if (assignment.plan && assignment.plan.slots && assignment.plan.slots.length > 0) {
            const slot = assignment.plan.slots[0];
            const slotInfo = document.createElement('div');
            slotInfo.className = 'mt-3 text-sm text-gray-600';
            const start = new Date(slot.startISO).toLocaleString();
            slotInfo.textContent = `Suggested: ${start} — ${slot.durationHours}h (${assignment.plan.slots.length} slot(s))`;
            div.appendChild(slotInfo);
        }
        
        return div;
    }

    closeAssignmentModal() {
        const modal = document.getElementById('assignment-modal');
        const form = document.getElementById('assignment-form');
        
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [1, 0.8],
            opacity: [1, 0],
            easing: 'easeInBack',
            duration: 300,
            complete: () => {
                modal.classList.add('hidden');
                form.reset();
            }
        });
    }

    // Utility functions
    loadAssignments() {
        const stored = localStorage.getItem('apolloai-assignments');
        return stored ? JSON.parse(stored) : [];
    }

    saveAssignments() {
        localStorage.setItem('apolloai-assignments', JSON.stringify(this.assignments));
    }

    loadUserProfile() {
        // If we have a server token, try to fetch the canonical profile asynchronously
        const token = localStorage.getItem('apolloai-token');
        if (token) {
            fetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(j => {
                if (j && j.ok && j.user) {
                    try {
                        localStorage.setItem('apolloai-current-user', JSON.stringify(j.user));
                        localStorage.setItem('apolloai-profile', JSON.stringify({ name: (j.user.firstName || '') + ' ' + (j.user.lastName || ''), role: j.user.role || 'student' }));
                    } catch (e) { /* ignore storage errors */ }
                }
            }).catch(() => {});
        }

        const stored = localStorage.getItem('apolloai-profile');
        return stored ? JSON.parse(stored) : {
            name: 'Student',
            role: 'student',
            studyStreak: 12,
            totalStudyHours: 156,
            completionRate: 92
        };
    }

    getAssignmentsForDate(date) {
        return this.assignments.filter(assignment => {
            const assignmentDate = new Date(assignment.dueDate);
            return assignmentDate.toDateString() === date.toDateString();
        });
    }

    showDayDetails(date) {
        const assignments = this.getAssignmentsForDate(date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        
        if (assignments.length > 0) {
            const assignmentTitles = assignments.map(a => a.title).join(', ');
            this.showNotification(`${dayName}: ${assignmentTitles}`, 'info');
        } else {
            this.showNotification(`${dayName}: No assignments due`, 'info');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 z-50 max-w-sm p-4 rounded-xl shadow-lg transform translate-x-full transition-transform duration-300`;
        
        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            info: 'bg-blue-500 text-white',
            warning: 'bg-amber-500 text-white'
        };
        
        notification.className += ` ${colors[type]}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }

    loadDashboardData() {
        // Update dashboard statistics
        const activeAssignments = this.assignments.filter(a => a.progress < 100).length;
        const statsElements = document.querySelectorAll('.text-3xl');
        
        if (statsElements[0]) {
            statsElements[0].textContent = activeAssignments;
        }
    }

    // Simple Pomodoro timer (25/5) with UI widget
    initializeTimerUI() {
        // create a floating timer button
        const timerHtml = `
        <div id="pomodoro-timer" style="position:fixed;right:20px;bottom:20px;z-index:60">
          <div id="pomodoro-card" class="bg-white rounded-2xl p-4 shadow-lg" style="width:220px;text-align:center">
            <div id="pomodoro-label" class="text-sm font-medium text-gray-700">Focus</div>
            <div id="pomodoro-time" class="text-2xl font-bold text-gray-900 mt-2">25:00</div>
            <div class="mt-3 flex gap-2 justify-center">
              <button id="pomodoro-start" class="px-3 py-1 rounded bg-amber-500 text-white">Start</button>
              <button id="pomodoro-pause" class="px-3 py-1 rounded bg-gray-200">Pause</button>
              <button id="pomodoro-reset" class="px-3 py-1 rounded bg-gray-200">Reset</button>
            </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', timerHtml);

        this.pomo = { running: false, duration: 25*60, remaining: 25*60, interval: null };
        document.getElementById('pomodoro-start').addEventListener('click', ()=> this.pomStart());
        document.getElementById('pomodoro-pause').addEventListener('click', ()=> this.pomPause());
        document.getElementById('pomodoro-reset').addEventListener('click', ()=> this.pomReset());
        this.updatePomoUI();
    }

    pomStart() {
        if (this.pomo.running) return;
        this.pomo.running = true;
        this.pomo.interval = setInterval(()=>{
            if (this.pomo.remaining <= 0) { this.pomPause(); this.showNotification('Pomodoro complete — take a break!', 'success'); return; }
            this.pomo.remaining -= 1;
            this.updatePomoUI();
        }, 1000);
    }

    pomPause() {
        this.pomo.running = false;
        if (this.pomo.interval) { clearInterval(this.pomo.interval); this.pomo.interval = null; }
    }

    pomReset() {
        this.pomPause();
        this.pomo.remaining = this.pomo.duration;
        this.updatePomoUI();
    }

    updatePomoUI() {
        const t = this.pomo.remaining;
        const mm = String(Math.floor(t/60)).padStart(2,'0');
        const ss = String(t%60).padStart(2,'0');
        const el = document.getElementById('pomodoro-time');
        if (el) el.textContent = `${mm}:${ss}`;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.apolloAI = new ApolloAI();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApolloAI;
}