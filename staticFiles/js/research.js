const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
const items = Array.from(document.querySelectorAll('.research-item'));

if (!items.length) {
    // no-op
} else {
    items.forEach((item, index) => {
        item.style.setProperty('--reveal-delay', `${index * 90}ms`);
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.2 });
    items.forEach((item) => observer.observe(item));

    const progress = document.createElement('aside');
    progress.className = 'research-progress';
    progress.innerHTML = `
        <div class="progress-title">Research Flow</div>
        <div class="progress-track"><div class="progress-fill"></div></div>
        <div class="progress-dots"></div>
    `;
    document.body.appendChild(progress);

    const dotsWrap = progress.querySelector('.progress-dots');
    const fill = progress.querySelector('.progress-fill');
    const dots = [];

    items.forEach((item, index) => {
        const title = item.querySelector('h3')?.textContent?.trim() || `Topic ${index + 1}`;
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'progress-dot';
        dot.setAttribute('aria-label', title);
        dot.title = title;
        dot.addEventListener('click', () => {
            item.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
    });

    const activateIndex = (activeIndex) => {
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === activeIndex);
        });
        if (fill) {
            const ratio = dots.length > 1 ? activeIndex / (dots.length - 1) : 1;
            fill.style.height = `${Math.round(ratio * 100)}%`;
        }
    };

    let rafId = null;
    const onScroll = () => {
        if (rafId) return;
        rafId = window.requestAnimationFrame(() => {
            const viewportCenter = window.innerHeight * 0.45;
            let activeIndex = 0;
            let minDistance = Number.POSITIVE_INFINITY;

            items.forEach((item, index) => {
                const rect = item.getBoundingClientRect();
                const center = rect.top + rect.height / 2;
                const distance = Math.abs(center - viewportCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    activeIndex = index;
                }
            });

            activateIndex(activeIndex);
            rafId = null;
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    if (hasFinePointer && !prefersReducedMotion) {
        const imgBoxes = document.querySelectorAll('.research-img-box');
        imgBoxes.forEach((box) => {
            let moveRaf = null;
            box.addEventListener('mousemove', (event) => {
                if (moveRaf) return;
                moveRaf = window.requestAnimationFrame(() => {
                    const rect = box.getBoundingClientRect();
                    const px = (event.clientX - rect.left) / rect.width;
                    const py = (event.clientY - rect.top) / rect.height;
                    const rotateY = (px - 0.5) * 12;
                    const rotateX = (0.5 - py) * 10;
                    box.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
                    box.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
                    box.classList.add('tilt-active');
                    moveRaf = null;
                });
            });

            box.addEventListener('mouseleave', () => {
                box.classList.remove('tilt-active');
                box.style.removeProperty('--tilt-x');
                box.style.removeProperty('--tilt-y');
            });
        });
    }

}

