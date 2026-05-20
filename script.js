/**
 * Andrew Young - Developer Portfolio Interactive Logic
 * Particle Background, Command Line Terminal Simulator, Filter Operations, and Theme Toggles
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Global Elements
  initTheme();
  initGlowCursor();
  initCanvasParticles();
  initTerminal();
  initScrollAnimations();
  initProjectFilters();
  initContactForm();
});

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
[Andrew Young - BI Analyst, Data Engineer, & Cloud Architect]
-----------------------------------------------------------
I bridge the gap between raw data pipelines and high-impact business insights.
- MS in Analytics (Georgia Tech, GPA: 4.0)
- AWS Certified Solutions Architect Associate
- Passionate advocate of agentic AI workflows and developer operations automation.
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
[Highlighted Projects]
-----------------------
1. Duel for Middle Earth
   - Next.js/React/TypeScript digital board game engine translate.
   - Built through an iterative agentic design loop.

2. Yahtzee Strategy Simulator
   - Advanced Python Monte Carlo engine evaluating millions of games.
   - Designed for GT analytics research. Evaluates five core AI strategies.
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
- Email:    andrewyoung626@gmail.com
- Phone:    (801) 631-7100
- LinkedIn: linkedin.com/in/andrew-young6/
- GitHub:   github.com/ayoung626
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
Hi there! I'm Andrew Young. 
Welcome to my interactive CLI. 

Type <span style="color: var(--accent-cyan)">'help'</span> to explore my stats, projects, and work history, or simply scroll down to check out the modern GUI portfolio!
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
        
        // If skill card, trigger bar animation
        if (entry.target.classList.contains('skills-container')) {
          animateSkillBars();
        }
        
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animatedElements.forEach(element => {
    observer.observe(element);
  });
}

function animateSkillBars() {
  const bars = document.querySelectorAll('.skill-bar-fill');
  bars.forEach(bar => {
    const targetPercent = bar.getAttribute('data-percent');
    bar.style.width = `${targetPercent}%`;
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

    // Real fetch request to FormSubmit AJAX endpoint (100% Free)
    fetch('https://formsubmit.co/ajax/andrewyoung626@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        email: email,
        _subject: subject || 'Contact from Portfolio Website',
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
      // Fade out Form elements and show custom success panel
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
