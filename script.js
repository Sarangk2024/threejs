gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ===== THREE.JS — Morphing Particle Grid & Parallax Camera =====
let scene, camera, renderer, particleGeometry, particleSystem;
let activeShapeIndex = 0;
let scrollFraction = 0;
let mouseX = 0, mouseY = 0;

// Coordinate sets
let targetShapes = [];
const N = 4500; // Number of particles

function generateSphere(numPoints, radius = 15) {
    const arr = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = radius * (0.8 + 0.25 * Math.random());
        arr[i*3] = r * Math.sin(phi) * Math.cos(theta);
        arr[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        arr[i*3+2] = r * Math.cos(phi);
    }
    return arr;
}

function generateTorusKnot(numPoints, radius = 11, tube = 3.2, p = 2, q = 3) {
    const arr = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * Math.PI * 2 * p;
        const theta = t;
        const r = radius + tube * Math.cos(q * t / p);
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const z = tube * Math.sin(q * t / p);
        const jitter = 1.0;
        arr[i*3] = x + (Math.random() - 0.5) * jitter;
        arr[i*3+1] = y + (Math.random() - 0.5) * jitter;
        arr[i*3+2] = z + (Math.random() - 0.5) * jitter;
    }
    return arr;
}

function generateGridPlane(numPoints, size = 32) {
    const arr = new Float32Array(numPoints * 3);
    const cols = Math.floor(Math.sqrt(numPoints));
    const rows = Math.ceil(numPoints / cols);
    for (let i = 0; i < numPoints; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const x = (c / cols - 0.5) * size;
        const z = (r / rows - 0.5) * size;
        const y = Math.sin(c * 0.4) * Math.cos(r * 0.4) * 2;
        arr[i*3] = x;
        arr[i*3+1] = y;
        arr[i*3+2] = z;
    }
    return arr;
}

function generateBox(numPoints, size = 18) {
    const arr = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints; i++) {
        const face = Math.floor(Math.random() * 6);
        let x = (Math.random() - 0.5) * size;
        let y = (Math.random() - 0.5) * size;
        let z = (Math.random() - 0.5) * size;
        if (face === 0) x = size / 2;
        else if (face === 1) x = -size / 2;
        else if (face === 2) y = size / 2;
        else if (face === 3) y = -size / 2;
        else if (face === 4) z = size / 2;
        else if (face === 5) z = -size / 2;
        const jitter = 0.5;
        arr[i*3] = x + (Math.random() - 0.5) * jitter;
        arr[i*3+1] = y + (Math.random() - 0.5) * jitter;
        arr[i*3+2] = z + (Math.random() - 0.5) * jitter;
    }
    return arr;
}

function generateHelix(numPoints, radius = 6, height = 28) {
    const arr = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints; i++) {
        const t = i / numPoints;
        const theta = t * Math.PI * 2 * 6; // 6 rotations
        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);
        const y = (t - 0.5) * height;
        const jitter = 0.8;
        arr[i*3] = x + (Math.random() - 0.5) * jitter;
        arr[i*3+1] = y + (Math.random() - 0.5) * jitter;
        arr[i*3+2] = z + (Math.random() - 0.5) * jitter;
    }
    return arr;
}

function initThree() {
    const container = document.getElementById('three-container');
    if (!container) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Build the coordinates dataset
    targetShapes.push(generateSphere(N, 14));
    targetShapes.push(generateTorusKnot(N, 11, 3.2));
    targetShapes.push(generateGridPlane(N, 32));
    targetShapes.push(generateBox(N, 18));
    targetShapes.push(generateHelix(N, 6, 28));

    // Initialize position array with Sphere coordinates
    const currentPositions = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i++) {
        currentPositions[i] = targetShapes[0][i];
    }

    particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));

    // Restore original size and opacity parameters for overlapping particles effect
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.13,
        transparent: true,
        opacity: 0.45,
        sizeAttenuation: true
    });

    particleSystem = new THREE.Points(particleGeometry, material);
    particleSystem.position.z = 0; // Restore original overlapping particle depth
    scene.add(particleSystem);

    // Background Three.js subtle grid to ground the 3D space
    const gridHelper = new THREE.GridHelper(70, 35, 0x222222, 0x0a0a0a);
    gridHelper.position.y = -18;
    gridHelper.position.z = -10;
    gridHelper.rotation.x = Math.PI / 12;
    scene.add(gridHelper);

    let time = 0;
    (function loop() {
        requestAnimationFrame(loop);
        time += 0.004;

        particleSystem.rotation.y = time * 0.02 + scrollFraction * Math.PI * 0.5;

        const posAttr = particleGeometry.attributes.position;
        const positions = posAttr.array;
        const target = targetShapes[activeShapeIndex];

        // Project mouse position to virtual magnet coords in 3D
        const magnet = new THREE.Vector3(mouseX * 25, -mouseY * 20, 0);

        for (let i = 0; i < N; i++) {
            let px = positions[i*3];
            let py = positions[i*3+1];
            let pz = positions[i*3+2];

            const tx = target[i*3];
            const ty = target[i*3+1];
            const tz = target[i*3+2];

            // Wave ripple height offset (trigonometric mathematical ripples)
            const wave = Math.sin(tx * 0.25 + time) * Math.cos(tz * 0.25 + time) * 0.6;

            // Target positions with rippling waves
            const targetX = tx;
            const targetY = ty + wave;
            const targetZ = tz;

            // Lerp towards target shape
            px += (targetX - px) * 0.08;
            py += (targetY - py) * 0.08;
            pz += (targetZ - pz) * 0.08;

            // Mouse magnet displacement (push away)
            const dx = px - magnet.x;
            const dy = py - magnet.y;
            const dz = pz - magnet.z;
            const distSq = dx*dx + dy*dy + dz*dz;
            if (distSq < 64) {
                const force = (64 - distSq) * 0.0018;
                px += dx * force;
                py += dy * force;
                pz += dz * force;
            }

            positions[i*3] = px;
            positions[i*3+1] = py;
            positions[i*3+2] = pz;
        }
        posAttr.needsUpdate = true;

        // Camera follow & descent parallax
        const pathY = -scrollFraction * 22; // Travel downwards
        const pathZ = 30 - Math.sin(scrollFraction * Math.PI) * 6; // Zoom in/out depth
        const pathX = mouseX * 4;

        camera.position.x += (pathX - camera.position.x) * 0.05;
        camera.position.y += (pathY - mouseY * 4 - camera.position.y) * 0.05;
        camera.position.z += (pathZ - camera.position.z) * 0.05;
        camera.lookAt(0, pathY, 0);

        renderer.render(scene, camera);
    })();
}

window.addEventListener('resize', () => {
    if (!camera || !renderer) return;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

// ===== TARGET RETICLE CURSOR =====
function initCursor() {
    const dot  = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring || window.matchMedia('(hover: none)').matches) return;
    let rx = 0, ry = 0, dx = 0, dy = 0;
    
    document.addEventListener('mousemove', e => {
        dx = e.clientX; 
        dy = e.clientY;
        dot.style.left = dx + 'px'; 
        dot.style.top = dy + 'px';
        mouseX = (e.clientX / innerWidth - 0.5) * 2;
        mouseY = (e.clientY / innerHeight - 0.5) * 2;
    });

    (function trackRing() {
        rx += (dx - rx) * 0.15; 
        ry += (dy - ry) * 0.15;
        ring.style.left = rx + 'px'; 
        ring.style.top = ry + 'px';
        requestAnimationFrame(trackRing);
    })();

    document.querySelectorAll('a, button, .project-schematic-item, .skill-item-hud, .node-content, input, textarea, .chat-bubble, #chatSendBtn').forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
        el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
    });
}

// ===== SCROLL PROGRESS =====
function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
        bar.style.width = (scrollY / (document.documentElement.scrollHeight - innerHeight) * 100) + '%';
    });
}

// ===== NAVBAR =====
function initNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 60));
}

// ===== DIGITAL SCRAMBLE / DECODE TEXT EFFECT =====
function scrambleText(element, targetText, duration = 0.8) {
    const chars = '01#X$*-_[]{}<>\\/!%&';
    const length = targetText.length;
    let frame = 0;
    const totalFrames = duration * 60;
    
    (function tick() {
        let output = '';
        const progress = frame / totalFrames;
        
        for (let i = 0; i < length; i++) {
            if (targetText[i] === ' ') {
                output += ' ';
            } else if (i / length < progress) {
                output += targetText[i];
            } else if (Math.random() < 0.3) {
                output += chars[Math.floor(Math.random() * chars.length)];
            } else {
                output += ' ';
            }
        }
        
        element.innerHTML = output;
        
        if (frame < totalFrames) {
            frame++;
            requestAnimationFrame(tick);
        } else {
            element.innerHTML = targetText;
        }
    })();
}

// ===== GSAP VERTICAL SCROLL ANIMATIONS =====
function initScrollAnimations() {
    // Scroll progress trigger for camera descent
    ScrollTrigger.create({
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: self => scrollFraction = self.progress
    });

    // WebGL Morph Targets Triggers (Vertical Scroll milestones)
    ScrollTrigger.create({
        trigger: '#about', start: 'top center', end: 'bottom center',
        onToggle: self => { if (self.isActive) activeShapeIndex = 0; }
    });
    ScrollTrigger.create({
        trigger: '#skills', start: 'top center', end: 'bottom center',
        onToggle: self => { if (self.isActive) activeShapeIndex = 1; }
    });
    ScrollTrigger.create({
        trigger: '#timeline', start: 'top center', end: 'bottom center',
        onToggle: self => { if (self.isActive) activeShapeIndex = 2; }
    });
    ScrollTrigger.create({
        trigger: '#projects', start: 'top center', end: 'bottom center',
        onToggle: self => { if (self.isActive) activeShapeIndex = 3; }
    });
    ScrollTrigger.create({
        trigger: '#contact', start: 'top center', end: 'bottom center',
        onToggle: self => { if (self.isActive) activeShapeIndex = 4; }
    });

    // Reveal elements upward
    gsap.utils.toArray('.reveal-up').forEach((el) => {
        gsap.fromTo(el,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
              scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' }
            }
        );
    });

    // Animate Grid Drawing Lines
    gsap.utils.toArray('.grid-line-horizontal').forEach(line => {
        gsap.fromTo(line, 
            { scaleX: 0 },
            { scaleX: 1, transformOrigin: 'left center', duration: 1.2, ease: 'power3.inOut',
              scrollTrigger: { trigger: line, start: 'top 85%' }
            }
        );
    });

    gsap.utils.toArray('.grid-line-vertical').forEach(line => {
        gsap.fromTo(line, 
            { scaleY: 0 },
            { scaleY: 1, transformOrigin: 'top center', duration: 1.5, ease: 'power3.inOut',
              scrollTrigger: { trigger: line, start: 'top 85%' }
            }
        );
    });

    // Digital Scramble Text Trigger for Headings
    gsap.utils.toArray('.section-title').forEach(title => {
        const textToScramble = title.innerText;
        ScrollTrigger.create({
            trigger: title,
            start: 'top 85%',
            onEnter: () => scrambleText(title, textToScramble, 0.8)
        });
    });

    // Stagger projects schematic items with simple fade-up
    gsap.utils.toArray('.project-schematic-item').forEach((card) => {
        gsap.fromTo(card,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
              scrollTrigger: { trigger: card, start: 'top 92%', toggleActions: 'play none none none' }
            }
        );
    });

    // Skills stagger bounce
    gsap.utils.toArray('.skill-item-hud').forEach((el, i) => {
        gsap.fromTo(el,
            { y: 20, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.4, delay: i * 0.03, ease: 'power2.out',
              scrollTrigger: { trigger: '.skills-hud', start: 'top 85%', toggleActions: 'play none none none' }
            }
        );
    });

    // Hero background initials text parallax
    gsap.to('.hero-bg-text', {
        y: -100,
        scrollTrigger: { trigger: '#about', start: 'top top', end: 'bottom top', scrub: 1 }
    });
}

// ===== TILT HUD CARDS EFFECT =====
function initTilt() {
    if (window.matchMedia('(hover: none)').matches) return;
    const cards = document.querySelectorAll('.hud-container, .project-schematic-item, .node-content');
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            const dx = (x - xc) / xc; 
            const dy = (y - yc) / yc; 
            card.style.transform = `perspective(800px) rotateY(${dx * 3}deg) rotateX(${-dy * 3}deg) translateY(-2px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0)';
        });
    });
}

// ===== COUNTER =====
function initCounters() {
    document.querySelectorAll('.stat-number').forEach(el => {
        new IntersectionObserver((entries, obs) => {
            if (!entries[0].isIntersecting) return;
            obs.unobserve(el);
            const target = +el.dataset.count, dur = 1500, start = performance.now();
            (function tick(now) {
                const p = Math.min((now - start) / dur, 1);
                el.textContent = Math.round((1 - Math.pow(1-p,3)) * target);
                if (p < 1) requestAnimationFrame(tick);
            })(start);
        }, { threshold: 0.5 }).observe(el);
    });
}

// ===== TYPED TEXT =====
function initTyped() {
    const roles = ['Software Developer', 'Full Stack Developer'];
    const el = document.getElementById('typedText');
    if (!el) return;
    let ri = 0, ci = 0, del = false;
    function tick() {
        const role = roles[ri];
        el.textContent = del ? role.slice(0, ci-1) : role.slice(0, ci+1);
        del ? ci-- : ci++;
        if (!del && ci === role.length) { setTimeout(tick, 1500); del = true; return; }
        if (del && ci === 0) { del = false; ri = (ri+1) % roles.length; setTimeout(tick, 400); return; }
        setTimeout(tick, del ? 60 : 90);
    }
    setTimeout(tick, 800);
}

// ===== SMART CLIENT-SIDE RAG FALLBACK ENGINE =====
function getLocalFallbackResponse(query) {
    const q = query.toLowerCase();
    
    // Project queries
    if (q.includes("project") || q.includes("build") || q.includes("made") || q.includes("create") || q.includes("portfolio")) {
        return "Sarang has built several notable projects, representing a full stack: \n\n1. DocPilot AI: Developer documentation tool mapping repos into interactive code graphs (React, FastAPI).\n2. Anti-Fake Chain: Counterfeit product detection utilizing NFC tags verified on a blockchain ledger.\n3. AgriDetect AI: Plant leaf disease classifier using ML deep learning.\n4. Zecpath AI: Automated AI recruiter matching resumes to jobs.\n\nWhich of these would you like to explore in detail?";
    }
    
    // Internship and Experience queries
    if (q.includes("experience") || q.includes("intern") || q.includes("work") || q.includes("career") || q.includes("job")) {
        return "Sarang's experience consists of key developer internships:\n\n1. Zecser Business LLP (May 2026 - Present): AI Developer Intern building NLP pipelines (Python, spaCy) and REST APIs.\n2. Infosys Springboard (Dec 2025 - Mar 2026): AI Intern deploying ML models (Python, scikit-learn).\n3. Grohub (Jun 2025 - Oct 2025): Web Developer Intern writing responsive web features.\n4. Eqsoft Business Solutions (Jun 2025): Web Developer Intern creating Flutter and ASP.NET modules.";
    }
    
    // Skills and Tech Stack queries
    if (q.includes("skill") || q.includes("tech") || q.includes("stack") || q.includes("know") || q.includes("language") || q.includes("python") || q.includes("javascript")) {
        return "Sarang has a robust technical skillset:\n\n- Frontend: React, Three.js, JavaScript (ES6+), Flutter, HTML5, CSS3\n- Backend: Node.js, Express, Django, .NET, REST APIs\n- Programming: Python, Java, C++, C#, PHP\n- Tools & Cloud: AWS, Docker, Git, Linux, PostgreSQL, MySQL, Postman";
    }
    
    // Education queries
    if (q.includes("education") || q.includes("college") || q.includes("cgpa") || q.includes("study") || q.includes("degree") || q.includes("school")) {
        return "Sarang K is currently pursuing his B.Tech in Computer Science and Engineering at the College Of Engineering Thalassery (2022 - 2026 batch) with an impressive CGPA of 8.88.";
    }

    // Contact queries
    if (q.includes("contact") || q.includes("reach") || q.includes("hire") || q.includes("email") || q.includes("linkedin") || q.includes("github")) {
        return "You can reach out to Sarang K via:\n\n- LinkedIn: linkedin.com/in/sarang-k-37073226b\n- GitHub: github.com/Sarangk2024\n- Resume download: Click 'DOWNLOAD CV' inside the Get in Touch section on this page!";
    }
    
    // General programming Q&A
    if (q.includes("coding") || q.includes("programming") || q.includes("what is") || q.includes("how to") || q.includes("explain")) {
        return "I am currently running in local offline sandbox mode since a serverless Node API is only active in a Vercel production hosting environment. However, I can help answer questions about Sarang's resume, projects, or skills! Once deployed, I can execute general technical questions using Gemini.";
    }

    // Greeting keywords (evaluated last to prevent short-circuiting specific questions that start with greetings)
    if (q.match(/\b(hi|hello|hey|greetings|yo|howdy|sup)\b/)) {
        return "Hello! I am Sarang's AI assistant. Ask me anything about Sarang's experience, education, projects, technical skills, or contact info!";
    }
    
    return "I am running in local fallback mode. I know everything about Sarang's skills, internships, projects, and education. Try asking: 'What projects did he build?' or 'Tell me about his internships'.";
}

// ===== NATIVE CHATBOT RAG INTEGRATION =====
let chatHistory = [];

function initChatbot() {
    const btn      = document.getElementById('chatbotBtn');
    const modal    = document.getElementById('chatbotModal');
    const closeBtn = document.getElementById('chatbotCloseBtn');
    const backdrop = document.getElementById('chatbotBackdrop');
    const openIco  = document.getElementById('chatbotOpenIcon');
    const closeIco = document.getElementById('chatbotCloseIcon');
    const form     = document.getElementById('chatInputArea');
    const input    = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');

    if (!btn || !modal || !form) return;

    function open()  { 
        modal.classList.add('open'); 
        backdrop.classList.add('active'); 
        if(openIco) openIco.style.display='none'; 
        if(closeIco) closeIco.style.display='block'; 
        messages.scrollTop = messages.scrollHeight;
    }
    function close() { 
        modal.classList.remove('open'); 
        backdrop.classList.remove('active'); 
        if(openIco) openIco.style.display='block'; 
        if(closeIco) closeIco.style.display='none'; 
    }

    btn.addEventListener('click', () => modal.classList.contains('open') ? close() : open());
    closeBtn && closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const msgText = input.value.trim();
        if (!msgText) return;

        // Reset input
        input.value = '';

        // Append User bubble
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user-bubble';
        userBubble.textContent = msgText;
        messages.appendChild(userBubble);
        messages.scrollTop = messages.scrollHeight;

        // Append Loading bubble
        const loadBubble = document.createElement('div');
        loadBubble.className = 'chat-bubble bot-bubble loading-bubble';
        loadBubble.id = 'loadingBubble';
        loadBubble.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Routing query...';
        messages.appendChild(loadBubble);
        messages.scrollTop = messages.scrollHeight;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msgText, history: chatHistory })
            });

            if (!res.ok) {
                // Any non-200 response code (like 501 from Python local server) triggers the fallback
                throw new Error('Local server sandbox fallback triggered');
            }
            const data = await res.json();

            // Remove loading
            loadBubble.remove();

            // Append Bot response bubble
            const botBubble = document.createElement('div');
            botBubble.className = 'chat-bubble bot-bubble';
            botBubble.textContent = data.response || 'Sorry, I encountered an issue processing that request.';
            messages.appendChild(botBubble);
            messages.scrollTop = messages.scrollHeight;

            chatHistory.push({ role: 'user', text: msgText });
            chatHistory.push({ role: 'model', text: data.response });
            if (chatHistory.length > 12) chatHistory = chatHistory.slice(chatHistory.length - 12);

        } catch (err) {
            console.warn('API chat fetch failed, running offline client RAG engine:', err);
            
            // Execute fallback
            const fallbackText = getLocalFallbackResponse(msgText);
            
            // Simulate 600ms latency for processing
            setTimeout(() => {
                loadBubble.remove();
                
                const botBubble = document.createElement('div');
                botBubble.className = 'chat-bubble bot-bubble';
                botBubble.textContent = fallbackText;
                messages.appendChild(botBubble);
                messages.scrollTop = messages.scrollHeight;

                chatHistory.push({ role: 'user', text: msgText });
                chatHistory.push({ role: 'model', text: fallbackText });
                if (chatHistory.length > 12) chatHistory = chatHistory.slice(chatHistory.length - 12);
            }, 600);
        }
    });
}

// ===== INTERACTIVE PROJECT DETAILS DATASET =====
const PROJECT_METADATA = {
    docpilot: {
        title: "DocPilot AI",
        tagline: "Intelligent GitHub Repository Documentation Engine",
        emoji: "🚀",
        tags: ["AI", "FastAPI", "React", "GitHub API"],
        desc: "DocPilot AI is an advanced developer tool designed to map and document complex GitHub repositories in seconds. By tracing functions, reading file trees, and identifying key REST API endpoints, it generates interactive visual code graphs and maintains an embedded chatbot to answer codebase Q&A factually.",
        features: [
            "Scrapes public/private repositories using GitHub APIs and parses project directory layouts.",
            "Constructs hierarchical interactive dependency graphs to trace codebase call flows.",
            "Extracts class schemas, function models, and REST endpoints for structured specifications.",
            "Features a local vector-stuffed chatbot using Google Gemini for context-aware codebase Q&A."
        ],
        live: "https://repo-documentation.vercel.app/",
        github: "https://github.com/Sarangk2024/RepoDocumentation"
    },
    zecpath: {
        title: "Zecpath AI",
        tagline: "Automated AI-Powered Recruitment Screening Platform",
        emoji: "🤖",
        tags: ["AI", "Python", "Recruitment Analysis"],
        desc: "Zecpath AI simplifies the recruiting pipeline by utilizing NLP to parse, evaluate, and rank candidate resumes. It extracts applicant skill indices, scores profiles against complex job criteria, and highlights the best fits for specific hiring workflows.",
        features: [
            "Parses PDF and Docx resumes using Python text extraction pipelines.",
            "Uses spaCy and custom NLP libraries to extract named entities (skills, experience, education).",
            "Calculates semantic similarity scores between candidate profiles and job requirements.",
            "Generates recruitment charts and visual screening indicators for HR teams."
        ],
        live: "#",
        github: "https://github.com/Sarangk2024"
    },
    counterfeit: {
        title: "Fake Product Detection",
        tagline: "Decentralized Product Authentication using NFC and Blockchain",
        emoji: "🔗",
        tags: ["Blockchain", "NFC Tags", "Node.js"],
        desc: "A secure counterfeit product identification system combining decentralized ledgers with physical hardware tags. Products are registered as unique assets on-chain, and consumers scan the embedded NFC tag to verify the product's origin and transaction history.",
        features: [
            "Registers and mints product authenticity signatures on a decentralized smart contract.",
            "Verifies product tags instantly in the browser using NFC card read/write APIs.",
            "Tracks the complete chain of custody from manufacturer to final buyer.",
            "Prevents duplicate tag spoofing using unique cryptographically signed payload sequences."
        ],
        live: "https://supply-chain-1-0rut.onrender.com/",
        github: "https://github.com/Sarangk2024/fake-product-backend"
    },
    agridetect: {
        title: "AgriDetect AI",
        tagline: "Deep Learning Web App for Crop Leaf Disease Identification",
        emoji: "🌿",
        tags: ["Deep Learning", "Web App", "Agriculture"],
        desc: "AgriDetect AI assists farmers by diagnosing plant health issues directly from photos. Utilizing deep convolutional neural networks, it identifies diseases on leaf surfaces and instantly serves guidance on corrective organic treatments.",
        features: [
            "Analyzes leaf photographs using TensorFlow classification models.",
            "Classifies plant diseases (e.g., blight, rust, leaf spots) with high validation accuracy.",
            "Suggests immediate corrective solutions, bio-pesticides, and watering advice.",
            "Features a responsive mobile-friendly interface designed for low-bandwidth farming areas."
        ],
        live: "https://agridetectai.vercel.app/",
        github: "https://github.com/Sarangk2024/AgriDetect-AI"
    },
    chatapp: {
        title: "Chat Application",
        tagline: "Real-Time Socket-Based Channels Messaging Console",
        emoji: "💬",
        tags: ["Firebase", "JavaScript", "Sockets"],
        desc: "A responsive, instant chat messaging application supporting channel divisions and private communication. Built with socket connections, it provides real-time text delivery and user activity indicators.",
        features: [
            "Manages message transmission and channel updates.",
            "Saves history and authenticates users securely utilizing Firebase.",
            "Displays real-time typing indicators and user online/offline statuses.",
            "Supports text styling and responsive layout scaling across platforms."
        ],
        live: "https://huggingface.co/spaces/kuttu-2003/mygenapi",
        github: "https://huggingface.co/spaces/kuttu-2003/mygenapi/tree/main"
    },
    travel: {
        title: "Dubai Trip Assistant",
        tagline: "Generative Travel Route & Itinerary Planner",
        emoji: "✈️",
        tags: ["Generative AI", "APIs", "Chatbot"],
        desc: "An AI-powered travel planning assistant that processes tourist budgets, duration of stay, and activity preferences to compile customized Dubai itineraries, complete with maps and booking aids.",
        features: [
            "Parses travel criteria to generate structured, day-by-day itineraries.",
            "Recommends local attractions, restaurants, and hotels matching budget tiers.",
            "Integrated with map coordinates and transit guidelines.",
            "Provides travel advice regarding cultural details and local guidelines."
        ],
        live: "#",
        github: "https://github.com/Sarangk2024/chatbot"
    },
    spotify: {
        title: "Spotify Clone",
        tagline: "Responsive Web Player Frontend Replica",
        emoji: "🎵",
        tags: ["HTML5", "CSS3", "JS"],
        desc: "A frontend clone of the Spotify web player user interface. Recreated using semantic HTML5 and clean CSS layouts, it features play panels, hover-tilt album covers, and responsive sidebar navigation.",
        features: [
            "Recreates Spotify's desktop design with responsive flex and grids.",
            "Implements custom hover effects and micro-animations for player controls.",
            "Features interactive album grid tiles and smooth navigation tabs.",
            "Lightweight code using vanilla styling utilities without frameworks."
        ],
        live: "#",
        github: "https://github.com/Sarangk2024/spotify-clone"
    },
    objectdet: {
        title: "Object Detection",
        tagline: "Real-Time Webcam Object Classification in Browser",
        emoji: "📸",
        tags: ["TensorFlow.js", "Webcam API", "ML"],
        desc: "A browser-based machine learning application that utilizes the computer's webcam to detect and classify everyday objects in real-time. Powered by TensorFlow.js and the pre-trained COCO-SSD object detection model.",
        features: [
            "Loads and runs the COCO-SSD model directly client-side in the browser.",
            "Streams video frames from the Webcam API to perform classification loops.",
            "Draws bounding boxes and labels around detected items (e.g., cell phone, bottle, person).",
            "Maintains 30+ frames per second (FPS) execution on modern computer hardware."
        ],
        live: "#",
        github: "https://github.com/Sarangk2024/Object-detection-"
    },
    healthcare: {
        title: "Healthcare Appointment",
        tagline: "Java OOP Medical Scheduling & Database Console",
        emoji: "🏥",
        tags: ["Java", "OOP", "Database"],
        desc: "A structured software management console written in Java applying object-oriented design principles. Built to manage doctor schedules, book patient slots, and maintain medical history records.",
        features: [
            "Encapsulates patient, doctor, and booking slots inside structured Java classes.",
            "Implements search and filter queries for doctor specializations.",
            "Maintains local database operations for tracking medical histories.",
            "Includes input validation and console security checks."
        ],
        live: "#",
        github: "https://github.com/Sarangk2024/Heath-care-Appointment-"
    },
    helmet: {
        title: "Smart Helmet",
        tagline: "IoT Accidental Detection & Safety Alerts System",
        emoji: "🪖",
        tags: ["IoT", "GPS", "Safety"],
        desc: "An IoT hardware prototype utilizing accident detection sensors to improve rider safety. In the event of an impact, it accesses the GPS module to transmit coordinates to emergency numbers via SMS.",
        features: [
            "Detects sudden head impacts utilizing accelerometer and gyroscope modules.",
            "Fetches precise coordinates from the GPS module on emergency triggers.",
            "Transmits automated safety SMS alerts to preset numbers.",
            "Coordinates with an external mobile application for hardware testing."
        ],
        live: "#",
        github: "https://github.com/Sarangk2024/smart-helmet"
    },
    games: {
        title: "JavaScript Games",
        tagline: "Dynamic DOM Sequence Memory & Virtual Instruments",
        emoji: "🎮",
        tags: ["JavaScript", "DOM", "Events"],
        desc: "A dynamic showcase of browser-based games and instruments including a Simon Says sequence memory game and a key-triggered virtual Drum Kit, demonstrating JavaScript event listeners and audio styling.",
        features: [
            "Tracks user click sequences to evaluate Simon Says memory patterns.",
            "Triggers sound samples and visual key flashes dynamically in a Drum Kit layout.",
            "Utilizes audio web APIs and CSS transform animations.",
            "Completely written in vanilla JavaScript without heavy external libraries."
        ],
        live: "#",
        github: "https://github.com/Sarangk2024/tic-tac-toe-game"
    }
};

function initProjectModal() {
    const modal = document.getElementById('projectModal');
    const closeBtn = document.getElementById('projectModalClose');
    const backdrop = document.getElementById('projectModalBackdrop');
    const body = document.getElementById('projectModalBody');
    const cards = document.querySelectorAll('.project-schematic-item'); // Bind to HUD list items

    if (!modal || !closeBtn || !body) return;

    function openModal(projectKey) {
        const data = PROJECT_METADATA[projectKey];
        if (!data) return;

        // Build features list
        const featuresHtml = data.features.map(f => `<li>${f}</li>`).join('');
        // Build tags badges
        const tagsHtml = data.tags.map(t => `<span class="tag">${t}</span>`).join('');
        // Build action links
        let actionsHtml = '';
        if (data.github && data.github !== '#') {
            actionsHtml += `<a href="${data.github}" class="social-btn" target="_blank"><i class="fab fa-github"></i> Repository Code</a>`;
        }
        if (data.live && data.live !== '#') {
            actionsHtml += `<a href="${data.live}" class="submit-btn" target="_blank" style="margin-top:0; padding: 0.6rem 1.2rem; font-size: 0.8rem;"><i class="fas fa-external-link-alt"></i> Live Demo</a>`;
        }

        body.innerHTML = `
            <h2><span>${data.emoji}</span> ${data.title}</h2>
            <div class="modal-tagline">${data.tagline}</div>
            <div class="modal-tags">${tagsHtml}</div>
            <div class="modal-desc">${data.desc}</div>
            <h4>Key Features & Architecture</h4>
            <ul class="modal-features">${featuresHtml}</ul>
            <div class="modal-actions">${actionsHtml}</div>
        `;

        modal.classList.add('open');
        document.body.style.overflow = 'hidden'; // Lock main scroll
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = 'auto'; // Restore scroll
    }

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const pKey = card.getAttribute('data-project');
            if (pKey) openModal(pKey);
        });
    });

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // ESC key close support
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
}

// ===== CONTACT FORM =====
function initContactForm() {
    // Set to your public n8n Webhook URL (e.g., via Ngrok tunnel: "https://your-tunnel.ngrok-free.app/webhook/contact")
    // If n8n/Ngrok is offline, it will automatically fall back to Web3Forms within 3.5 seconds.
    const N8N_WEBHOOK_URL = "https://coping-bride-fleshy.ngrok-free.dev/webhook/contact-form";

    const form   = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    const btn    = document.getElementById('submitBtn');
    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const name    = document.getElementById('name').value.trim();
        const email   = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        if (!name || !email || !message) { showStatus('Please fill in all fields.', 'error'); return; }

        const btnText    = btn.querySelector('.btn-text');
        const btnIcon    = btn.querySelector('.btn-icon');
        const btnLoading = btn.querySelector('.btn-loading');
        btn.disabled = true; btnText.textContent = 'Sending...'; btnIcon.style.display = 'none'; btnLoading.style.display = 'inline';

        let n8nSuccess = false;

        // 1. Try sending via n8n (if online)
        if (N8N_WEBHOOK_URL) {
            try {
                // Abort request after 3.5 seconds if tunnel is offline
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);

                const res = await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({ name, email, message }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    showStatus('Thank you! Your message was sent. Check your email for confirmation!', 'success');
                    form.reset();
                    n8nSuccess = true;
                }
            } catch (err) {
                console.warn('n8n workflow is offline, falling back to Web3Forms:', err);
            }
        }

        // 2. Fall back to Web3Forms if n8n was offline or failed
        if (!n8nSuccess) {
            try {
                const res  = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        access_key: '1360a426-058e-4c03-9906-5f2cf6e41de2',
                        name, email, message
                    })
                });
                const data = await res.json();
                if (data.success) { 
                    showStatus('Thank you! Your message was sent. I will get back to you soon!', 'success'); 
                    form.reset(); 
                } else {
                    throw new Error(data.message || 'Failed');
                }
            } catch(err) {
                showStatus((err.message || 'Something went wrong. Please try again!'), 'error');
            }
        }

        btn.disabled = false; btnText.textContent = 'Send Message'; btnIcon.style.display = 'inline'; btnLoading.style.display = 'none';
    });

    function showStatus(msg, type) {
        status.textContent = msg; status.className = 'form-status ' + type;
        setTimeout(() => { status.className = 'form-status'; status.textContent = ''; }, 5000);
    }
}

// ===== SMOOTH SCROLL =====
function scrollToSection(id) {
    gsap.to(window, { duration: 1.2, scrollTo: { y: '#'+id, offsetY: 80 }, ease: 'power2.inOut' });
}

// ===== INIT =====
window.addEventListener('load', () => {
    initThree();
    initCursor();
    initScrollProgress();
    initNavbar();
    initScrollAnimations();
    initCounters();
    initTyped();
    initChatbot();
    initContactForm();
    initTilt();
    initProjectModal();
    const yrEl = document.getElementById('footer-year');
    if (yrEl) yrEl.textContent = new Date().getFullYear();
});
