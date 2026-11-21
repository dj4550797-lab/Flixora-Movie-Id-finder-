/**
 * FLIXORA 3D CINEMATIC EXPERIENCE — THREE.JS ENGINE
 * Renders an interactive 3D particle cosmos & light nebula behind Flixora UI.
 * Lightweight, GPU-accelerated, responsive, with mouse parallax and visibility throttle.
 */

(function () {
    class Flixora3DScene {
        constructor() {
            this.canvas = document.getElementById('threeCanvas');
            if (!this.canvas || typeof THREE === 'undefined') return;

            this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (this.prefersReduced) return;

            this.mouseX = 0;
            this.mouseY = 0;
            this.targetX = 0;
            this.targetY = 0;
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;

            this.init();
        }

        init() {
            // 1. Scene & Camera
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
            this.camera.position.z = 600;

            // 2. Renderer
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                alpha: true,
                antialias: false,
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

            // 3. Particle Starfield Geometry
            const particleCount = 1200;
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);

            const colorBlue = new THREE.Color('#3B82F6');
            const colorCyan = new THREE.Color('#22D3EE');
            const colorDark = new THREE.Color('#1D4ED8');

            for (let i = 0; i < particleCount; i++) {
                // Spherical/cubical distributed cluster
                const i3 = i * 3;
                positions[i3] = (Math.random() - 0.5) * 1600;
                positions[i3 + 1] = (Math.random() - 0.5) * 1600;
                positions[i3 + 2] = (Math.random() - 0.5) * 1400;

                // Color gradient
                const mixedColor = Math.random() > 0.4 ? colorCyan : (Math.random() > 0.5 ? colorBlue : colorDark);
                colors[i3] = mixedColor.r;
                colors[i3 + 1] = mixedColor.g;
                colors[i3 + 2] = mixedColor.b;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            // 4. Point Cloud Material
            const material = new THREE.PointsMaterial({
                size: 2.8,
                vertexColors: true,
                transparent: true,
                opacity: 0.65,
                blending: THREE.AdditiveBlending
            });

            this.particles = new THREE.Points(geometry, material);
            this.scene.add(this.particles);

            // 5. Subtle Nebula Torus Knot
            const knotGeo = new THREE.TorusKnotGeometry(140, 25, 64, 8);
            const knotMat = new THREE.MeshBasicMaterial({
                color: 0x1e3a8a,
                wireframe: true,
                transparent: true,
                opacity: 0.08
            });
            this.torus = new THREE.Mesh(knotGeo, knotMat);
            this.torus.position.set(0, 0, -200);
            this.scene.add(this.torus);

            // 6. Event Listeners
            window.addEventListener('resize', () => this.onWindowResize());
            document.addEventListener('mousemove', (e) => this.onMouseMove(e));

            // Visibility API pause
            document.addEventListener('visibilitychange', () => {
                this.isTabActive = !document.hidden;
            });
            this.isTabActive = true;

            // 7. Start Animation Loop
            this.animate();
        }

        onMouseMove(event) {
            this.mouseX = (event.clientX - this.windowHalfX) * 0.05;
            this.mouseY = (event.clientY - this.windowHalfY) * 0.05;
        }

        onWindowResize() {
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }

        animate() {
            requestAnimationFrame(() => this.animate());

            if (!this.isTabActive) return;

            // Smooth parallax lerp
            this.targetX += (this.mouseX - this.targetX) * 0.04;
            this.targetY += (this.mouseY - this.targetY) * 0.04;

            this.camera.position.x = this.targetX;
            this.camera.position.y = -this.targetY;
            this.camera.lookAt(this.scene.position);

            // Subtle rotation
            if (this.particles) {
                this.particles.rotation.y += 0.0006;
                this.particles.rotation.x += 0.0002;
            }
            if (this.torus) {
                this.torus.rotation.x += 0.001;
                this.torus.rotation.y += 0.0015;
            }

            this.renderer.render(this.scene, this.camera);
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        window.flixora3D = new Flixora3DScene();
    });
})();
