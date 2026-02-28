const canvas = document.getElementById('particleCanvas');
const container = document.getElementById('canvas-container');

if (!canvas || !container) {
    // no-op for pages without canvas
} else {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    let rafId = null;
    let running = false;
    let particles = [];
    let isPageVisible = !document.hidden;
    let isContainerVisible = true;

    if (!ctx || reduceMotion) {
        canvas.style.display = 'none';
    } else {
        const cores = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4;
        const lowPower = cores <= 2 || memory <= 2;
        const particleCount = lowPower ? 20 : 38;
        const maxLinkDistance = lowPower ? 75 : 100;
        const maxSize = lowPower ? 2.2 : 3.2;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        class Particle {
            constructor() {
                this.reset();
                this.size = Math.random() * maxSize + 0.7;
                this.speedX = Math.random() * 1.2 - 0.6;
                this.speedY = Math.random() * 1.2 - 0.6;
                this.alpha = Math.random() * 0.8 + 0.15;
            }

            reset() {
                this.x = Math.random() * canvas.clientWidth;
                this.y = Math.random() * canvas.clientHeight;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.clientWidth || this.x < 0) this.speedX *= -1;
                if (this.y > canvas.clientHeight || this.y < 0) this.speedY *= -1;
            }

            draw() {
                ctx.fillStyle = `rgba(60, 174, 113, ${this.alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const shouldRun = () => isPageVisible && isContainerVisible;

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i += 1) {
                particles.push(new Particle());
            }
        };

        const resize = () => {
            const width = Math.max(container.offsetWidth, 1);
            const height = Math.max(container.offsetHeight, 1);

            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            if (!particles.length) {
                initParticles();
            } else {
                particles.forEach((p) => p.reset());
            }
        };

        const drawFrame = () => {
            if (!running) {
                return;
            }

            ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
            for (let i = 0; i < particles.length; i += 1) {
                const p1 = particles[i];
                p1.update();
                p1.draw();

                for (let j = i + 1; j < particles.length; j += 1) {
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < maxLinkDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(60, 174, 113, ${1 - distance / maxLinkDistance})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
            rafId = window.requestAnimationFrame(drawFrame);
        };

        const start = () => {
            if (running) return;
            running = true;
            rafId = window.requestAnimationFrame(drawFrame);
        };

        const stop = () => {
            running = false;
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }
        };

        const syncRunState = () => {
            if (shouldRun()) {
                start();
            } else {
                stop();
            }
        };

        const visibilityObserver = new IntersectionObserver((entries) => {
            isContainerVisible = !!entries[0] && entries[0].isIntersecting;
            syncRunState();
        }, { threshold: 0.1 });

        let resizeTimer = null;
        window.addEventListener('resize', () => {
            if (resizeTimer) {
                window.clearTimeout(resizeTimer);
            }
            resizeTimer = window.setTimeout(resize, 120);
        }, { passive: true });

        document.addEventListener('visibilitychange', () => {
            isPageVisible = !document.hidden;
            syncRunState();
        });

        resize();
        visibilityObserver.observe(container);
        syncRunState();
    }
}

