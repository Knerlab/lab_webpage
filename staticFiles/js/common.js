(function () {
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('header nav ul');

    if (!navToggle || !navList) {
        return;
    }

    navToggle.addEventListener('click', () => {
        const isOpen = navList.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        navToggle.innerHTML = isOpen ? '&#10005;' : '&#9776;';
    });
})();
