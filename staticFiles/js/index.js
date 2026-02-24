// ------------------- Scroll Reveal Animation -------------------
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, {
    threshold: 0.15 // Trigger when 15% of the element is visible
});

revealElements.forEach(el => revealObserver.observe(el));

// ------------------- News Carousel Logic -------------------
const gallery = document.getElementById('newsGallery');
const nextBtn = document.getElementById('nextBtn');
const backBtn = document.getElementById('backBtn');

if (gallery && nextBtn && backBtn) {
    nextBtn.addEventListener('click', () => {
        // Scroll by width of one card + gap
        gallery.scrollBy({ left: 350, behavior: 'smooth' });
    });

    backBtn.addEventListener('click', () => {
        gallery.scrollBy({ left: -350, behavior: 'smooth' });
    });
}

