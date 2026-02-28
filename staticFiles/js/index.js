const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

// ------------------- Scroll Reveal Animation -------------------
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.15 });
revealElements.forEach((el) => revealObserver.observe(el));

// ------------------- News Carousel Logic -------------------
const gallery = document.getElementById('newsGallery');
const nextBtn = document.getElementById('nextBtn');
const backBtn = document.getElementById('backBtn');
const newsSection = document.querySelector('.homeNews');

function getCardStep() {
    if (!gallery) return 320;
    const firstCard = gallery.querySelector('.gallery-item');
    if (!firstCard) return 320;
    const cardWidth = firstCard.getBoundingClientRect().width;
    return Math.round(cardWidth + 30);
}

if (gallery && nextBtn && backBtn) {
    const scrollStep = () => getCardStep();

    nextBtn.addEventListener('click', () => {
        gallery.scrollBy({ left: scrollStep(), behavior: 'smooth' });
    });
    backBtn.addEventListener('click', () => {
        gallery.scrollBy({ left: -scrollStep(), behavior: 'smooth' });
    });

    if (!prefersReducedMotion) {
        let autoTimer = null;
        const startAutoPlay = () => {
            if (autoTimer !== null) return;
            autoTimer = window.setInterval(() => {
                const maxLeft = Math.max(0, gallery.scrollWidth - gallery.clientWidth);
                const nextLeft = gallery.scrollLeft + scrollStep();
                gallery.scrollTo({ left: nextLeft >= maxLeft ? 0 : nextLeft, behavior: 'smooth' });
            }, 4200);
        };
        const stopAutoPlay = () => {
            if (autoTimer !== null) {
                window.clearInterval(autoTimer);
                autoTimer = null;
            }
        };

        gallery.addEventListener('mouseenter', stopAutoPlay);
        gallery.addEventListener('mouseleave', startAutoPlay);
        newsSection?.addEventListener('mouseenter', stopAutoPlay);
        newsSection?.addEventListener('mouseleave', startAutoPlay);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stopAutoPlay();
            else startAutoPlay();
        });
        startAutoPlay();
    }
}

// ------------------- Hero Parallax -------------------
const homeBanner = document.querySelector('.homeBanner');
const homeQuote = homeBanner?.querySelector('blockquote');
if (homeBanner && homeQuote && !prefersReducedMotion) {
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            const y = Math.max(0, window.scrollY);
            const bannerShift = Math.min(70, y * 0.14);
            const quoteShift = Math.min(24, y * 0.05);
            homeBanner.style.backgroundPosition = `center calc(50% + ${bannerShift}px)`;
            homeQuote.style.transform = `translate3d(0, ${quoteShift}px, 0)`;
            homeQuote.style.opacity = String(Math.max(0.55, 1 - y / 800));
            ticking = false;
        });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
}

// ------------------- Spotlight + Tilt Cards -------------------
if (newsSection && !prefersReducedMotion) {
    let sectionRaf = null;
    newsSection.addEventListener('mousemove', (event) => {
        if (sectionRaf) return;
        sectionRaf = window.requestAnimationFrame(() => {
            const rect = newsSection.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            newsSection.style.setProperty('--spotlight-x', `${x}px`);
            newsSection.style.setProperty('--spotlight-y', `${y}px`);
            sectionRaf = null;
        });
    });
}

if (hasFinePointer && !prefersReducedMotion && gallery) {
    const cards = gallery.querySelectorAll('.gallery-item');
    cards.forEach((card) => {
        let rafId = null;

        card.addEventListener('mousemove', (event) => {
            if (rafId) return;
            rafId = window.requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const px = (event.clientX - rect.left) / rect.width;
                const py = (event.clientY - rect.top) / rect.height;
                const rotateY = (px - 0.5) * 16;
                const rotateX = (0.5 - py) * 13;
                card.style.setProperty('--rotate-x', `${rotateX.toFixed(2)}deg`);
                card.style.setProperty('--rotate-y', `${rotateY.toFixed(2)}deg`);
                card.classList.add('tilt-active');
                rafId = null;
            });
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('tilt-active');
            card.style.removeProperty('--rotate-x');
            card.style.removeProperty('--rotate-y');
        });
    });
}

