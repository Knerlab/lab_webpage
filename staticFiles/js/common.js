(function () {
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('header nav ul');

    if (navToggle && navList) {
        const closeNav = () => {
            navList.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.innerHTML = '&#9776;';
        };

        navToggle.addEventListener('click', () => {
            const isOpen = navList.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            navToggle.innerHTML = isOpen ? '&#10005;' : '&#9776;';
        });

        navList.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', closeNav);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeNav();
            }
        });
    }

    // Server-friendly performance defaults: lazy/decode images in browser.
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
        const inHeader = !!img.closest('header');
        const isHero = !!img.closest('.homeBanner');

        if (!img.getAttribute('decoding')) {
            img.setAttribute('decoding', 'async');
        }
        if (!img.getAttribute('fetchpriority')) {
            img.setAttribute('fetchpriority', inHeader || isHero ? 'high' : 'low');
        }
        if (!img.getAttribute('loading') && !inHeader && !isHero) {
            img.setAttribute('loading', 'lazy');
        }
    });
})();
