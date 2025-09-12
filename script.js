
        // Register GSAP plugins
        gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

        // --- Three.js Setup and Initialization ---
        let scene, camera, renderer, controls;
        const objects = [];

        function init() {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0d1117);

            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 5;

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.getElementById('three-container').appendChild(renderer.domElement);

            // Controls: Allows the user to interact with the camera
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.screenSpacePanning = false;
            controls.maxPolarAngle = Math.PI / 2;

            // Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(0, 5, 5);
            scene.add(directionalLight);

            // Creating the 3D Objects
            const geometries = [
                new THREE.BoxGeometry(1.5, 1.5, 1.5),
                new THREE.SphereGeometry(1, 32, 32),
                new THREE.TorusKnotGeometry(0.8, 0.3, 100, 16),
                new THREE.DodecahedronGeometry(1.2),
                new THREE.CylinderGeometry(0.8, 0.8, 1.5, 32),
                new THREE.ConeGeometry(0.8, 1.5, 32),
            ];

            const material = new THREE.MeshPhongMaterial({
                color: 0x58a6ff,
                shininess: 100,
                specular: 0x30363d,
                transparent: true,
                opacity: 0.8,
            });

            for (let i = 0; i < 20; i++) {
                const geometry = geometries[Math.floor(Math.random() * geometries.length)];
                const mesh = new THREE.Mesh(geometry, material);

                mesh.position.x = (Math.random() - 0.5) * 10;
                mesh.position.y = (Math.random() - 0.5) * 10;
                mesh.position.z = (Math.random() - 0.5) * 10;

                mesh.rotation.x = Math.random() * Math.PI;
                mesh.rotation.y = Math.random() * Math.PI;

                const scale = Math.random() * 0.5 + 0.5;
                mesh.scale.set(scale, scale, scale);

                scene.add(mesh);
                objects.push(mesh);
            }
        }

        // --- Animation Loop ---
        function animate() {
            requestAnimationFrame(animate);

            // Update camera controls
            controls.update();

            // Continuous rotation for all objects
            objects.forEach(obj => {
                obj.rotation.x += 0.005;
                obj.rotation.y += 0.005;
            });

            renderer.render(scene, camera);
        }

        // --- GSAP Scroll-based Animations ---
        function setupAnimations() {
            const aboutCard = document.querySelector('#about .content-card');
            const projectsCard = document.querySelector('#projects .content-card');
            const contactCard = document.querySelector('#contact .content-card');
            
            // Content card animations on scroll
            gsap.from(aboutCard, {
                y: 100,
                scale: 0.9,
                opacity: 0,
                duration: 1.5,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#about",
                    start: "top 75%",
                    toggleActions: "play none none none"
                }
            });
            
            gsap.from(projectsCard, {
                y: 100,
                scale: 0.9,
                opacity: 0,
                duration: 1.5,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#projects",
                    start: "top 75%",
                    toggleActions: "play none none none"
                }
            });
            
            gsap.from(contactCard, {
                y: 100,
                scale: 0.9,
                opacity: 0,
                duration: 1.5,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: "#contact",
                    start: "top 75%",
                    toggleActions: "play none none none"
                }
            });
        }

        // --- Theme Toggle Logic ---
        function toggleTheme() {
            const body = document.body;
            body.classList.toggle('light-theme');
            const isLightTheme = body.classList.contains('light-theme');
            const themeIcon = document.getElementById('theme-icon');
            themeIcon.textContent = isLightTheme ? '☀️' : '🌙';
            localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');

            // Note: The object colors will not change, as the animation is not tied to a variable.
        }

        // Apply saved theme on load
        function applySavedTheme() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                document.body.classList.add('light-theme');
                document.getElementById('theme-icon').textContent = '☀️';
            }
        }

        // --- Event Listeners and Page Logic ---
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        // Function for smooth scrolling to a section
        function scrollToSection(id) {
            gsap.to(window, {
                duration: 1,
                scrollTo: { y: `#${id}`, offsetY: 80 }, // Offset for the fixed navbar
                ease: "power2.inOut"
            });
        }

        // Wait for the window to load before starting
        window.onload = function() {
            applySavedTheme();
            init();
            animate();
            setupAnimations();
            
            document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
            window.addEventListener('resize', onWindowResize, false);
        };