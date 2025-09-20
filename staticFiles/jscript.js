// Mobile nav toggle for small screens
(function(){
    const headerEl = document.querySelector('header');
    const navToggle = document.querySelector('.nav-toggle');
    if (headerEl && navToggle) {
        navToggle.addEventListener('click', () => {
            const isOpen = headerEl.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            document.body.classList.toggle('nav-open', isOpen);
            navToggle.textContent = isOpen ? '✕' : '\u2630';
        });
        // Close when clicking outside the header/nav
        document.addEventListener('click', (e) => {
            if (!headerEl.classList.contains('open')) return;
            const nav = headerEl.querySelector('nav');
            if (!nav) return;
            if (nav.contains(e.target) || navToggle.contains(e.target)) return;
            headerEl.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('nav-open');
        });
        // Close menu when a link is clicked
        document.querySelectorAll('header nav a').forEach(a => {
            a.addEventListener('click', () => {
                headerEl.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('nav-open');
                navToggle.textContent = '\u2630';
            });
        });
        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                headerEl.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('nav-open');
                navToggle.textContent = '\u2630';
            }
        });
    }
})();

// News gallery scroll controls (only on pages where present)
(function(){
    const scrollContainer = document.querySelector('.gallery');
    const backBtn = document.getElementById('backBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (scrollContainer && backBtn && nextBtn) {
        const getStep = () => {
            const card = scrollContainer.querySelector('.gallery-group-n');
            if (card) {
                const group = card.parentElement;
                const style = group ? window.getComputedStyle(group) : null;
                const gap = style ? parseFloat(style.columnGap || style.gap || '0') : 0;
                return Math.ceil(card.getBoundingClientRect().width + (isNaN(gap) ? 0 : gap));
            }
            return Math.ceil(scrollContainer.clientWidth);
        };
        backBtn.addEventListener('click', () => {
            scrollContainer.style.scrollBehavior = 'smooth';
            scrollContainer.scrollLeft -= getStep();
        });
        nextBtn.addEventListener('click', () => {
            scrollContainer.style.scrollBehavior = 'smooth';
            scrollContainer.scrollLeft += getStep();
        });
    }
})();

// Publications: build mobile year index panel (disabled per request)
(function(){
    return; // disabled
    const pubSection = document.querySelector('.section-pub');
    if (!pubSection) return;
    const yearEls = Array.from(pubSection.querySelectorAll('.years p'));
    if (!yearEls.length) return;

    // Assign IDs to year headings if missing
    yearEls.forEach(p => {
        const y = (p.textContent || '').trim();
        const num = y.match(/\d{4}/)?.[0];
        if (!num) return;
        if (!p.id) p.id = `year-${num}`;
    });

    // Create UI (mobile-first)
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pub-index-btn';
    btn.textContent = 'Index';

    const panel = document.createElement('div');
    panel.className = 'pub-index-panel';
    panel.innerHTML = yearEls.map(p => `<a href="#${p.id}">${p.textContent}</a>`).join('');

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    btn.addEventListener('click', () => {
        panel.classList.toggle('open');
    });
    panel.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;
        panel.classList.remove('open');
    });
})();
