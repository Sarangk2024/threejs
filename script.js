gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ===== THREE.JS — Particle Galaxy =====
let scene, camera, renderer, particleSystem, glowMeshes = [];
let mouseX = 0, mouseY = 0, scrollFraction = 0;

function initThree() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    document.getElementById('three-container').appendChild(renderer.domElement);

    const N = 2500;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const palette = [
        new THREE.Color(0x7c3aed),
        new THREE.Color(0x22d3ee),
        new THREE.Color(0xa78bfa),
        new THREE.Color(0x5b21b6)
    ];
    for (let i = 0; i < N; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        const r     = 15 + Math.random() * 28;
        pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);
        const c = palette[Math.floor(Math.random() * palette.length)];
        col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    particleSystem = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.75, sizeAttenuation: true }));
    scene.add(particleSystem);

    [
        [new THREE.TorusKnotGeometry(3, 0.7, 100, 16), 0x7c3aed, [-8, 4, -15]],
        [new THREE.IcosahedronGeometry(2.2, 1),        0x22d3ee, [ 8,-3, -12]],
        [new THREE.OctahedronGeometry(1.8, 0),         0xa78bfa, [-4,-6, -10]]
    ].forEach(([geo, clr, pos]) => {
        const m = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: clr, shininess: 60, transparent: true, opacity: 0.12, wireframe: true }));
        m.position.set(...pos);
        scene.add(m); glowMeshes.push(m);
    });

    scene.add(new THREE.AmbientLight(0x7c3aed, 0.4));
    const pl = new THREE.PointLight(0x22d3ee, 1, 60);
    pl.position.set(5, 5, 5); scene.add(pl);

    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => scrollFraction = s.progress });

    (function loop() {
        requestAnimationFrame(loop);
        particleSystem.rotation.y += 0.0003;
        particleSystem.rotation.x += 0.0001;
        glowMeshes.forEach((m, i) => { m.rotation.x += 0.003*(i+1); m.rotation.y += 0.004*(i+1); });
        camera.position.x += (mouseX * 0.008 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 0.008 - camera.position.y) * 0.05;
        camera.position.z = 30 - scrollFraction * 12;
        renderer.render(scene, camera);
    })();
}

window.addEventListener('resize', () => {
    if (!camera || !renderer) return;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

// ===== CUSTOM CURSOR =====
function initCursor() {
    const dot  = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || window.matchMedia('(hover: none)').matches) return;
    let rx = 0, ry = 0, dx = 0, dy = 0;
    document.addEventListener('mousemove', e => {
        dx = e.clientX; dy = e.clientY;
        dot.style.left = dx + 'px'; dot.style.top = dy + 'px';
        mouseX = (e.clientX / innerWidth - 0.5) * 2;
        mouseY = (e.clientY / innerHeight - 0.5) * 2;
    });
    (function trackRing() {
        rx += (dx - rx) * 0.12; ry += (dy - ry) * 0.12;
        ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
        requestAnimationFrame(trackRing);
    })();
    document.querySelectorAll('a, button, .project-card, .skill-item, input, textarea').forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
        el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
    });
}

// ===== SCROLL PROGRESS =====
function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    window.addEventListener('scroll', () => {
        bar.style.width = (scrollY / (document.documentElement.scrollHeight - innerHeight) * 100) + '%';
    });
}

// ===== NAVBAR =====
function initNavbar() {
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 60));
}

// ===== GSAP SCROLL ANIMATIONS (Ingloo-style) =====
function initScrollAnimations() {
    // Generic reveal-up elements
    gsap.utils.toArray('.reveal-up').forEach((el, i) => {
        gsap.fromTo(el,
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
            }
        );
    });

    // Title underline draw
    gsap.utils.toArray('.title-underline').forEach(line => {
        ScrollTrigger.create({ trigger: line, start: 'top 85%', onEnter: () => line.classList.add('expanded') });
    });

    // Stagger project cards
    gsap.utils.toArray('.project-card').forEach((card, i) => {
        gsap.fromTo(card,
            { y: 60, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out',
              scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none',
                onEnter: () => card.classList.add('animated') }
            }
        );
    });

    // Skills stagger bounce
    gsap.utils.toArray('.skill-item').forEach((el, i) => {
        gsap.fromTo(el,
            { y: 30, opacity: 0, scale: 0.8 },
            { y: 0, opacity: 1, scale: 1, duration: 0.5, delay: i * 0.04, ease: 'back.out(1.7)',
              scrollTrigger: { trigger: '.skills-list', start: 'top 80%', toggleActions: 'play none none none',
                onEnter: () => el.classList.add('animated') }
            }
        );
    });

    // About: slide in from sides
    gsap.fromTo('#about .about-img-col',
        { x: -80, opacity: 0 },
        { x: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: '#about', start: 'top 80%', toggleActions: 'play none none none' }
        }
    );
    gsap.fromTo('#about .about-text-col',
        { x: 80, opacity: 0 },
        { x: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: '#about', start: 'top 80%', toggleActions: 'play none none none' }
        }
    );

    // Hero bg text parallax
    gsap.to('.hero-bg-text', {
        y: -120,
        scrollTrigger: { trigger: '#about', start: 'top top', end: 'bottom top', scrub: 1.5 }
    });

    // Contact card
    gsap.fromTo('#contact .content-card',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: '#contact', start: 'top 80%', toggleActions: 'play none none none' }
        }
    );

    // Section headers
    gsap.utils.toArray('.section-header').forEach(h => {
        gsap.fromTo(h,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
              scrollTrigger: { trigger: h, start: 'top 85%', toggleActions: 'play none none none' }
            }
        );
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
    const roles = ['Fullstack Developer', 'UI/UX Designer', 'AI Enthusiast', 'Problem Solver'];
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
    document.getElementById('theme-icon').textContent = light ? 'sun' : 'moon';
    localStorage.setItem('theme', light ? 'light' : 'dark');
}
function applySavedTheme() {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('theme-icon').textContent = 'sun';
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
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    const yrEl = document.getElementById('footer-year');
    if (yrEl) yrEl.textContent = new Date().getFullYear();
});
            