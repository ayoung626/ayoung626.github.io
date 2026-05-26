/**
 * Andrew Young - Developer Portfolio Interactive Logic
 * Particle Background, Command Line Terminal Simulator, Filter Operations, and Theme Toggles
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Global Elements
  initTheme();
  initNavigation();
  initGlowCursor();
  initCanvasParticles();
  initTerminal();
  initScrollAnimations();
  initProjectFilters();
  initContactForm();
  initArchitectureModal();
  initActivityDashboard();
});

/* ==========================================
   Navigation Header Controls (Scroll & Mobile)
   ========================================== */
function initNavigation() {
  const header = document.querySelector('header');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  // Handle Scroll dynamic background
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Handle Mobile Menu toggle
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && e.target !== mobileMenuBtn) {
        navLinks.classList.remove('active');
      }
    });

    // Close mobile menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }
}

/* ==========================================
   1. Theme Management (Midnight & Snow)
   ========================================== */
function initTheme() {
  const themeBtn = document.getElementById('theme-toggle');
  if (!themeBtn) return;

  // Retrieve current preference or default to midnight (dark)
  const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
  
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-theme');
  } else {
    document.documentElement.classList.remove('light-theme');
  }

  themeBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('light-theme');
    const currentTheme = document.documentElement.classList.contains('light-theme') ? 'light' : 'dark';
    localStorage.setItem('portfolio-theme', currentTheme);
  });
}

/* ==========================================
   2. Glowing Cursor Overlay
   ========================================== */
function initGlowCursor() {
  const glow = document.querySelector('.glow-cursor');
  if (!glow) return;

  document.addEventListener('mousemove', (e) => {
    // Center the glow orb on the cursor coordinates
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  });
}

/* ==========================================
   3. Interactive Canvas Particle Background
   ========================================== */
function initCanvasParticles() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particlesArray = [];
  let mouse = {
    x: null,
    y: null,
    radius: 120
  };

  // Adjust size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Track Mouse Move
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Particle Blueprint
  class Particle {
    constructor(x, y, directionX, directionY, size, color) {
      this.x = x;
      this.y = y;
      this.directionX = directionX;
      this.directionY = directionY;
      this.size = size;
      this.color = color;
    }

    // Draw single node
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
    }

    // Move node and boundary collision check
    update() {
      if (this.x > canvas.width || this.x < 0) {
        this.directionX = -this.directionX;
      }
      if (this.y > canvas.height || this.y < 0) {
        this.directionY = -this.directionY;
      }

      // Check mouse distance interaction
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < mouse.radius && mouse.x !== null) {
        // Soft pull towards cursor
        this.x -= dx * 0.03;
        this.y -= dy * 0.03;
      }

      this.x += this.directionX;
      this.y += this.directionY;
      this.draw();
    }
  }

  // Generate Particle Array
  function init() {
    particlesArray = [];
    // Adjust count based on screen width
    let numberOfParticles = Math.floor((canvas.width * canvas.height) / 14000);
    if (numberOfParticles > 90) numberOfParticles = 90;

    for (let i = 0; i < numberOfParticles; i++) {
      let size = (Math.random() * 2) + 0.8;
      let x = Math.random() * (canvas.width - size * 2);
      let y = Math.random() * (canvas.height - size * 2);
      let directionX = (Math.random() * 0.4) - 0.2;
      let directionY = (Math.random() * 0.4) - 0.2;

      // Extract colors from theme
      let isLightTheme = document.documentElement.classList.contains('light-theme');
      let color = isLightTheme ? 'rgba(2, 132, 199, 0.15)' : 'rgba(6, 182, 212, 0.18)';
      
      particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
  }

  // Draw connector links
  function connect() {
    let opacityValue = 1;
    let isLightTheme = document.documentElement.classList.contains('light-theme');
    let maxDistance = 140;

    for (let a = 0; a < particlesArray.length; a++) {
      for (let b = a; b < particlesArray.length; b++) {
        let dx = particlesArray[a].x - particlesArray[b].x;
        let dy = particlesArray[a].y - particlesArray[b].y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          opacityValue = 1 - (distance / maxDistance);
          let linkColor = isLightTheme 
            ? `rgba(2, 132, 199, ${opacityValue * 0.08})` 
            : `rgba(6, 182, 212, ${opacityValue * 0.12})`;
          
          ctx.strokeStyle = linkColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
          ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
          ctx.stroke();
        }
      }
    }
  }

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sync colors dynamically in case of theme toggles
    let isLightTheme = document.documentElement.classList.contains('light-theme');
    let dynamicColor = isLightTheme ? 'rgba(2, 132, 199, 0.12)' : 'rgba(6, 182, 212, 0.18)';
    
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].color = dynamicColor;
      particlesArray[i].update();
    }
    connect();
  }

  init();
  animate();

  // Re-initialize on window resize
  window.addEventListener('resize', () => {
    init();
  });
}

/* ==========================================
   4. Simulated Interactive Developer Terminal
   ========================================== */
function initTerminal() {
  const terminal = document.querySelector('.terminal-widget');
  if (!terminal) return;

  const terminalBody = terminal.querySelector('.terminal-body');
  const inputElement = terminal.querySelector('.terminal-input');
  const outputContainer = terminal.querySelector('.terminal-output');

  // Terminal commands dictionary
  const commands = {
    help: () => `
Available commands:
  about       - Brief summary of my background
  skills      - Technical skills breakdown
  projects    - Highlighted project details
  experience  - Professional journey summary
  education   - Academic achievements
  contact     - Social connections and credentials
  clear       - Clear the screen buffer
`,
    about: () => `
[Andrew Young]
--------------
I write code to process data, model databases, and construct data pipelines.
- MS in Analytics graduate from Georgia Tech (GPA: 4.0)
- AWS Certified Solutions Architect Associate
- Enjoy building simulators, digital board games, and workflow automations.
`,
    skills: () => `
[Technical Stack]
------------------
- Languages:    Python, SQL, R, JavaScript, TypeScript, Bash, Scala, Java
- Cloud & Data: AWS (Redshift, Glue, Athena, DynamoDB, Bedrock, Kinesis), Snowflake
- BI & Analytics: DBT, Power BI, Tableau, Amazon QuickSight, DOMO, D3.js
- Machine Learning: Scikit-learn, Tensorly, AI agent design (Bedrock)
`,
    projects: () => `
[Featured Projects]
-------------------
1. Duel for Middle Earth: Web-based digital board game built with Next.js/React.
2. Yahtzee Simulator: Interactive Monte Carlo strategy simulator running in-browser.
3. AWS Data Pipeline: Real-time serverless call center log ingestion and reporting.
`,
    experience: () => `
[Professional Experience]
--------------------------
- Senior BI Analyst at Stax Payments (2025 - Present)
  * Managed DBT/Redshift/QuickSight architectures. Established Claude Code documentation.
- Principal Architect at Consilium, LLC (2023 - 2025)
  * Designed scalable AWS data infrastructure & AI systems for Enterprise brands.
- Business Analyst at Health Management Associates (2022 - 2023)
  * Executive dashboard design and Power BI reports creation.
`,
    education: () => `
[Academic History]
-------------------
- Georgia Institute of Technology (Apr 2026)
  * Master of Science in Analytics (Computational Track) | GPA: 4.0
- University of Utah (Dec 2022)
  * BS in Quantitative Analysis of Markets & Organizations
  * BA in Linguistics
`,
    contact: () => `
[Connect with Me]
------------------
- LinkedIn: linkedin.com/in/andrew-young6/
- GitHub:   github.com/ayoung626
- Message:  Use the contact form at the bottom of the page!
`,
    clear: () => {
      outputContainer.innerHTML = '';
      return '';
    }
  };

  // Focus terminal input on widget click
  terminal.addEventListener('click', () => {
    inputElement.focus();
  });

  // Handle Command Submit
  inputElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const inputVal = inputElement.value.trim().toLowerCase();
      inputElement.value = '';

      if (inputVal === '') return;

      // Print Prompt and command
      const commandLine = document.createElement('div');
      commandLine.className = 'terminal-line';
      commandLine.innerHTML = `<span class="terminal-prompt">andrew@ayoung626:~$</span> <span>${inputVal}</span>`;
      outputContainer.appendChild(commandLine);

      // Process command
      let responseText = '';
      if (commands[inputVal]) {
        responseText = commands[inputVal]();
      } else {
        responseText = `bash: command not found: ${inputVal}. Type 'help' for options.`;
      }

      if (inputVal !== 'clear') {
        const responseLine = document.createElement('div');
        responseLine.className = 'terminal-output';
        responseLine.innerText = responseText;
        outputContainer.appendChild(responseLine);
      }

      // Keep scrolling down
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }
  });

  // Autoplay welcome script on load
  let index = 0;
  const welcomeScript = 'cat welcome.txt';
  
  function autoTypeWelcome() {
    if (index < welcomeScript.length) {
      inputElement.value += welcomeScript.charAt(index);
      index++;
      setTimeout(autoTypeWelcome, 80);
    } else {
      setTimeout(() => {
        // Trigger enter
        const commandLine = document.createElement('div');
        commandLine.className = 'terminal-line';
        commandLine.innerHTML = `<span class="terminal-prompt">andrew@ayoung626:~$</span> <span>${welcomeScript}</span>`;
        outputContainer.appendChild(commandLine);

        const welcomeText = document.createElement('div');
        welcomeText.className = 'terminal-output';
        welcomeText.innerHTML = `
Hi, I'm Andrew Young. Welcome to my portfolio! 
I'm a developer and analyst focused on data tools and cloud pipelines. 

Type <span style="color: var(--accent-cyan)">'help'</span> to see available commands, or simply scroll down to check out the site!
`;
        outputContainer.appendChild(welcomeText);
        inputElement.value = '';
        inputElement.focus();
        terminalBody.scrollTop = terminalBody.scrollHeight;
      }, 500);
    }
  }

  // Start autotype after short delay
  setTimeout(autoTypeWelcome, 1000);
}

/* ==========================================
   5. Scroll Animation via Intersection Observer
   ========================================== */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.fade-in');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('appear');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animatedElements.forEach(element => {
    observer.observe(element);
  });
}

/* ==========================================
   6. Dynamic Project Search and Tag Filters
   ========================================== */
function initProjectFilters() {
  const filterButtons = document.querySelectorAll('.filter-tag');
  const searchInput = document.getElementById('project-search');
  const projectCards = document.querySelectorAll('.project-card');

  let activeCategory = 'all';
  let searchQuery = '';

  function filterProjects() {
    projectCards.forEach(card => {
      const category = card.getAttribute('data-category');
      const title = card.querySelector('.project-title').textContent.toLowerCase();
      const desc = card.querySelector('.project-desc').textContent.toLowerCase();
      const chips = Array.from(card.querySelectorAll('.project-chip')).map(chip => chip.textContent.toLowerCase());
      
      const matchesCategory = activeCategory === 'all' || category === activeCategory;
      const matchesSearch = title.includes(searchQuery) || desc.includes(searchQuery) || chips.some(chip => chip.includes(searchQuery));

      if (matchesCategory && matchesSearch) {
        card.style.display = 'flex';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        }, 50);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.style.display = 'none';
        }, 300);
      }
    });
  }

  // Filter Buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-filter');
      filterProjects();
    });
  });

  // Search input change
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterProjects();
    });
  }
}

/* ==========================================
   7. Form Validation & Animation Effects
   ========================================== */
function initContactForm() {
  const form = document.getElementById('portfolio-contact-form');
  const submitBtn = document.getElementById('contact-submit-btn');
  const successOverlay = document.getElementById('form-success');

  if (!form || !submitBtn || !successOverlay) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Verify basic checks
    const name = document.getElementById('form-name').value.trim();
    const email = document.getElementById('form-email').value.trim();
    const subject = document.getElementById('form-subject').value.trim();
    const message = document.getElementById('form-message').value.trim();

    if (!name || !email || !message) {
      alert('Please fill out all contact fields!');
      return;
    }

    // Simple Email Regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address!');
      return;
    }

    // Play Submit Loading State
    submitBtn.disabled = true;
    submitBtn.innerText = 'Transmitting...';

    // Real AJAX request to Web3Forms API (100% Free & CORS compliant)
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: 'd69f7b18-29f0-4efb-a15d-3fd56aa3e082',
        name: name,
        email: email,
        subject: subject || 'Contact from Portfolio Website',
        message: message
      })
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Transmission failed');
    })
    .then(data => {
      // Fade out Form elements and reveal custom glassmorphic success overlay
      form.style.display = 'none';
      successOverlay.style.display = 'flex';
      form.reset();
    })
    .catch(error => {
      alert('Transmission failed. Please verify your connection and try again.');
      submitBtn.disabled = false;
      submitBtn.innerText = 'Transmit Message';
    });
  });
}

/* ==========================================
   8. AWS Enterprise Architecture Modal
   ========================================== */
function initArchitectureModal() {
  const viewArchitectureBtn = document.getElementById('view-architecture');
  const architectureModal = document.getElementById('architecture-modal');
  const closeArchitectureModal = document.getElementById('close-architecture-modal');

  if (viewArchitectureBtn && architectureModal) {
    viewArchitectureBtn.addEventListener('click', (e) => {
      e.preventDefault();
      architectureModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeModal = () => {
      architectureModal.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (closeArchitectureModal) {
      closeArchitectureModal.addEventListener('click', closeModal);
    }

    architectureModal.addEventListener('click', (e) => {
      if (e.target === architectureModal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && architectureModal.classList.contains('active')) {
        closeModal();
      }
    });
  }
}

/* ==========================================
   9. Live Activity & Streaks Dashboard
   ========================================== */
function initActivityDashboard() {
  loadChessStats();
  loadStravaWorkouts();
}

function loadChessStats() {
  const puzzleEl = document.getElementById('chess-puzzle-rating');
  const peakEl = document.getElementById('chess-puzzle-peak');
  const streakEl = document.getElementById('chess-streak');
  const rapidEl = document.getElementById('chess-rapid-rating');
  const blitzEl = document.getElementById('chess-blitz-rating');
  const recordEl = document.getElementById('chess-rapid-record');
  const updatedEl = document.getElementById('chess-last-updated');

  if (!puzzleEl) return;

  fetch('assets/data/chess.json')
    .then(res => {
      if (!res.ok) throw new Error('Data file not found');
      return res.json();
    })
    .then(data => {
      puzzleEl.innerText = data.puzzle_rating || 'N/A';
      peakEl.innerText = data.highest_puzzle_rating || 'N/A';
      streakEl.innerText = data.active_game_streak !== undefined ? `${data.active_game_streak}d` : '0d';
      rapidEl.innerText = data.rapid_rating || 'N/A';
      blitzEl.innerText = data.blitz_rating || 'N/A';

      // Record formatting
      const rec = data.rapid_record || {};
      if (rec.win !== undefined && rec.loss !== undefined && rec.draw !== undefined) {
        recordEl.innerText = `${rec.win}W / ${rec.loss}L / ${rec.draw}D`;
      } else {
        recordEl.innerText = 'N/A';
      }

      // Last updated
      if (data.last_updated) {
        const updateDate = new Date(data.last_updated);
        updatedEl.innerText = `Updated: ${updateDate.toLocaleDateString()}`;
      } else {
        updatedEl.innerText = 'Updated: N/A';
      }

      // Re-trigger Lucide icons render for dynamic icons
      if (window.lucide) window.lucide.createIcons();
    })
    .catch(err => {
      console.warn('Could not load Chess.com data:', err);
      updatedEl.innerText = 'Load failed';
    });
}

function loadLinkedInStreaks() {
  const gridEl = document.getElementById('linkedin-puzzles-grid');
  const updatedEl = document.getElementById('linkedin-last-updated');

  if (!gridEl) return;

  fetch('assets/data/linkedin-games.json')
    .then(res => {
      if (!res.ok) throw new Error('Data file not found');
      return res.json();
    })
    .then(data => {
      gridEl.innerHTML = '';
      
      const games = data.games || {};
      const gameKeys = Object.keys(games);
      
      if (gameKeys.length === 0) {
        gridEl.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:20px 0;">No streaks logged yet.</div>';
        return;
      }

      gameKeys.forEach(key => {
        const game = games[key];
        const card = document.createElement('div');
        card.className = 'puzzle-streak-card';
        
        let iconName = 'crown';
        if (game.icon === 'map-pin') iconName = 'map-pin';
        else if (game.icon === 'mountain') iconName = 'mountain';
        else if (game.icon === 'sparkles') iconName = 'sparkles';

        card.innerHTML = `
          <i data-lucide="${iconName}" class="puzzle-icon" style="width:20px; height:20px; color:var(--accent-cyan);"></i>
          <span class="puzzle-name">${game.name}</span>
          <div class="streak-badge-wrapper">
            <i data-lucide="flame" class="streak-icon ${game.streak > 0 ? 'active' : ''}" style="width:14px; height:14px;"></i>
            <span style="font-weight:700; font-family:var(--font-mono); font-size:14px; color:var(--text-primary);">${game.streak}d</span>
          </div>
        `;
        gridEl.appendChild(card);
      });

      if (data.lastUpdated) {
        const updateDate = new Date(data.lastUpdated);
        updatedEl.innerText = `Updated: ${updateDate.toLocaleDateString()}`;
      } else {
        updatedEl.innerText = 'Updated: N/A';
      }

      if (window.lucide) window.lucide.createIcons();
    })
    .catch(err => {
      console.warn('Could not load LinkedIn streaks:', err);
      gridEl.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:20px 0;">Sync pending. Click bookmarklet on LinkedIn.</div>';
      updatedEl.innerText = 'Sync pending';
    });
}

function loadStravaWorkouts() {
  const listEl = document.getElementById('strava-workouts-list');
  const updatedEl = document.getElementById('strava-last-updated');
  const subtitleEl = document.getElementById('strava-subtitle');
  const badgeEl = document.getElementById('strava-badge');

  if (!listEl) return;

  // Try to load real workouts from assets/data/activities.json
  fetch('assets/data/activities.json')
    .then(res => {
      if (!res.ok) throw new Error('Real activities not found');
      return res.json();
    })
    .then(activities => {
      listEl.innerHTML = '';
      
      if (activities.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px 0;">No recent activities logged.</div>';
        return;
      }

      const recent = activities.slice(0, 3);
      recent.forEach(act => {
        const item = document.createElement('div');
        item.className = 'workout-item';
        
        const actDate = new Date(act.start_date_local || act.start_date);
        const dateStr = actDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        let typeIcon = 'footprints';
        if (act.type === 'Ride') typeIcon = 'bike';
        else if (act.type === 'Swim') typeIcon = 'waves';
        else if (act.type === 'WeightTraining') typeIcon = 'dumbbell';

        const distMiles = (act.distance * 0.000621371).toFixed(2);
        const durHrs = Math.floor(act.moving_time / 3600);
        const durMins = Math.floor((act.moving_time % 3600) / 60);
        const durStr = durHrs > 0 ? `${durHrs}h ${durMins}m` : `${durMins}m`;

        item.innerHTML = `
          <div class="workout-info">
            <div class="workout-icon-box">
              <i data-lucide="${typeIcon}" style="width:20px; height:20px;"></i>
            </div>
            <div>
              <span class="workout-title">${act.name}</span>
              <span class="workout-date">${dateStr} • ${act.type}</span>
            </div>
          </div>
          <div class="workout-stats-short">
            <span class="workout-distance">${distMiles} mi</span>
            <span class="workout-duration">${durStr}</span>
          </div>
        `;
        listEl.appendChild(item);
      });

      badgeEl.innerHTML = '<i data-lucide="shield-check" style="width: 12px; height: 12px;"></i> Connected';
      updatedEl.innerText = 'Synced';
      if (window.lucide) window.lucide.createIcons();
    })
    .catch(() => {
      // Fallback: Mock beautiful training logs in Demo Mode
      listEl.innerHTML = '';
      subtitleEl.innerText = 'Training Logs (Demo Mode)';
      badgeEl.innerHTML = '<span class="demo-badge">Demo Mode</span>';
      
      const mockWorkouts = [
        { name: 'Morning Trail Run', type: 'Run', distance: 8450, moving_time: 2940, date: new Date(Date.now() - 24 * 3600 * 1000) },
        { name: 'Canyon Road Ride', type: 'Ride', distance: 34100, moving_time: 4620, date: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
        { name: 'Interval Pace Session', type: 'Run', distance: 6800, moving_time: 2180, date: new Date(Date.now() - 5 * 24 * 3600 * 1000) }
      ];

      mockWorkouts.forEach(act => {
        const item = document.createElement('div');
        item.className = 'workout-item';
        
        const dateStr = act.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        let typeIcon = 'footprints';
        if (act.type === 'Ride') typeIcon = 'bike';

        const distMiles = (act.distance * 0.000621371).toFixed(2);
        const durHrs = Math.floor(act.moving_time / 3600);
        const durMins = Math.floor((act.moving_time % 3600) / 60);
        const durStr = durHrs > 0 ? `${durHrs}h ${durMins}m` : `${durMins}m`;

        item.innerHTML = `
          <div class="workout-info">
            <div class="workout-icon-box">
              <i data-lucide="${typeIcon}" style="width:20px; height:20px;"></i>
            </div>
            <div>
              <span class="workout-title">${act.name}</span>
              <span class="workout-date">${dateStr} • ${act.type}</span>
            </div>
          </div>
          <div class="workout-stats-short">
            <span class="workout-distance">${distMiles} mi</span>
            <span class="workout-duration">${durStr}</span>
          </div>
        `;
        listEl.appendChild(item);
      });

      updatedEl.innerText = 'Demo Active';
      if (window.lucide) window.lucide.createIcons();
    });
}

