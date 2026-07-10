gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ===== THREE.JS — Morphing Particle Grid =====
let scene, camera, renderer, particleGeometry, particleSystem;
let activeShapeIndex = 0;
let mouseX = 0, mouseY = 0;

// Coordinate sets
let targetShapes = [];
const N = 4000; // Number of particles

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
    camera.position.z = 32;

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

    // Subtle white dots for retro-futuristic styling
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.14,
        transparent: true,
        opacity: 0.45,
        sizeAttenuation: true
    });

    particleSystem = new THREE.Points(particleGeometry, material);
    scene.add(particleSystem);

    // Background Three.js subtle grid to ground the 3D space
    const gridHelper = new THREE.GridHelper(70, 35, 0x333333, 0x111111);
    gridHelper.position.y = -18;
    gridHelper.rotation.x = Math.PI / 12;
    scene.add(gridHelper);

    let time = 0;
    (function loop() {
        requestAnimationFrame(loop);
        time += 0.004;

        particleSystem.rotation.y += 0.001;
        particleSystem.rotation.x = Math.sin(time * 0.4) * 0.04;

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

            // Lerp towards target shape
            px += (tx - px) * 0.07;
            py += (ty - py) * 0.07;
            pz += (tz - pz) * 0.07;

            // Mouse magnet displacement (push away)
            const dx = px - magnet.x;
            const dy = py - magnet.y;
            const dz = pz - magnet.z;
            const distSq = dx*dx + dy*dy + dz*dz;
            if (distSq < 49) {
                const force = (49 - distSq) * 0.0015;
                px += dx * force;
                py += dy * force;
                pz += dz * force;
            }

            positions[i*3] = px;
            positions[i*3+1] = py;
            positions[i*3+2] = pz;
        }
        posAttr.needsUpdate = true;

        // Camera follow
        camera.position.x += (mouseX * 5 - camera.position.x) * 0.04;
        camera.position.y += (-mouseY * 5 - camera.position.y) * 0.04;
        camera.lookAt(scene.position);

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

    document.querySelectorAll('a, button, .project-card, .skill-item, .experience-card, .education-card, .resume-card, input, textarea, #theme-toggle').forEach(el => {
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
            element.innerHTML = targetText; // fallback to complete text
        }
    })();
}

// ===== GSAP SCROLL & WEBGL SHAPE TRIGGERS =====
function initScrollAnimations() {
    // 3D Particle Shape Switch Triggers
    ScrollTrigger.create({
        trigger: '#about',
        start: 'top center',
        end: 'bottom center',
        onToggle: self => { if (self.isActive) activeShapeIndex = 0; }
    });
    ScrollTrigger.create({
        trigger: '#skills',
        start: 'top center',
        end: 'bottom center',
        onToggle: self => { if (self.isActive) activeShapeIndex = 1; }
    });
    ScrollTrigger.create({
        trigger: '#education',
        start: 'top center',
        end: 'bottom center',
        onToggle: self => { if (self.isActive) activeShapeIndex = 2; }
    });
    ScrollTrigger.create({
        trigger: '#experience',
        start: 'top center',
        end: 'bottom center',
        onToggle: self => { if (self.isActive) activeShapeIndex = 2; }
    });
    ScrollTrigger.create({
        trigger: '#projects',
        start: 'top center',
        end: 'bottom center',
        onToggle: self => { if (self.isActive) activeShapeIndex = 3; }
    });
    ScrollTrigger.create({
        trigger: '#resume',
        start: 'top center',
        end: 'bottom center',
        onToggle: self => { if (self.isActive) activeShapeIndex = 4; }
    });
    ScrollTrigger.create({
        trigger: '#contact',
        start: 'top center',
        end: 'bottom center',
        onToggle: self => { if (self.isActive) activeShapeIndex = 4; }
    });

    // Reveal elements upward
    gsap.utils.toArray('.reveal-up').forEach((el) => {
        gsap.fromTo(el,
            { y: 40, opacity: 0 },
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

    // Stagger project cards with simple fade-up
    gsap.utils.toArray('.project-card').forEach((card) => {
        gsap.fromTo(card,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
              scrollTrigger: { trigger: card, start: 'top 92%', toggleActions: 'play none none none' }
            }
        );
    });

    // Skills stagger bounce
    gsap.utils.toArray('.skill-item').forEach((el, i) => {
        gsap.fromTo(el,
            { y: 20, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.4, delay: i * 0.03, ease: 'power2.out',
              scrollTrigger: { trigger: '.skills-list', start: 'top 85%', toggleActions: 'play none none none' }
            }
        );
    });

    // Hero background text parallax
    gsap.to('.hero-bg-text', {
        y: -100,
        scrollTrigger: { trigger: '#about', start: 'top top', end: 'bottom top', scrub: 1 }
    });
}

// ===== TILT CARD EFFECT =====
function initTilt() {
    if (window.matchMedia('(hover: none)').matches) return;
    const cards = document.querySelectorAll('.content-card, .project-card, .resume-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            const dx = (x - xc) / xc; // -1 to 1
            const dy = (y - yc) / yc; // -1 to 1
            card.style.transform = `perspective(800px) rotateY(${dx * 4}deg) rotateX(${-dy * 4}deg) translateY(-4px)`;
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

// ===== CHATBOT =====
function initChatbot() {
    const btn      = document.getElementById('chatbotBtn');
    const modal    = document.getElementById('chatbotModal');
    const closeBtn = document.getElementById('chatbotCloseBtn');
    const backdrop = document.getElementById('chatbotBackdrop');
    const openIco  = document.getElementById('chatbotOpenIcon');
    const closeIco = document.getElementById('chatbotCloseIcon');
    if (!btn || !modal) return;

    function open()  { modal.classList.add('open'); backdrop.classList.add('active'); if(openIco) openIco.style.display='none'; if(closeIco) closeIco.style.display='block'; }
    function close() { modal.classList.remove('open'); backdrop.classList.remove('active'); if(openIco) openIco.style.display='block'; if(closeIco) closeIco.style.display='none'; }

    btn.addEventListener('click', () => modal.classList.contains('open') ? close() : open());
    closeBtn && closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
}

// ===== CONTACT FORM =====
function initContactForm() {
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

        try {
            const res  = await fetch('https://api.web3forms.com/submit', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_key: '1360a426-058e-4c03-9906-5f2cf6e41de2', // Get your free key at web3forms.com
                    name, email, message
                })
            });
            const data = await res.json();
            if (data.success) { showStatus('Message sent! I will get back to you soon.', 'success'); form.reset(); }
            else throw new Error(data.message || 'Failed');
        } catch(err) {
            showStatus((err.message || 'Something went wrong. Please try again!'), 'error');
        } finally {
            btn.disabled = false; btnText.textContent = 'Send Message'; btnIcon.style.display = 'inline'; btnLoading.style.display = 'none';
        }
    });

    function showStatus(msg, type) {
        status.textContent = msg; status.className = 'form-status ' + type;
        setTimeout(() => { status.className = 'form-status'; status.textContent = ''; }, 5000);
    }
}

// ===== THEME =====
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const light = document.body.classList.contains('light-theme');
    document.getElementById('theme-icon').innerHTML = light ? '&#x2600;&#xFE0F;' : '&#x1F319;'; // Sun or Moon
    localStorage.setItem('theme', light ? 'light' : 'dark');
}
function applySavedTheme() {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('theme-icon').innerHTML = '&#x2600;&#xFE0F;';
    }
}

// ===== SMOOTH SCROLL =====
function scrollToSection(id) {
    gsap.to(window, { duration: 1, scrollTo: { y: '#'+id, offsetY: 80 }, ease: 'power2.inOut' });
}

// ===== INIT =====
window.addEventListener('load', () => {
    applySavedTheme();
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
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    const yrEl = document.getElementById('footer-year');
    if (yrEl) yrEl.textContent = new Date().getFullYear();
});
