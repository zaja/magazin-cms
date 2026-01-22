// Mobile menu toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuClose = document.getElementById('mobile-menu-close');

if (mobileMenuButton) {
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.add('open');
        document.body.style.overflow = 'hidden';
    });
}

if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
    });
}

// Mobile dropdown toggles
const mobileDropdownTriggers = document.querySelectorAll('.mobile-dropdown-trigger');
mobileDropdownTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const submenu = trigger.nextElementSibling;
        const arrow = trigger.querySelector('.dropdown-arrow');

        if (submenu) {
            submenu.classList.toggle('hidden');
            if (arrow) {
                arrow.style.transform = submenu.classList.contains('hidden') ? '' : 'rotate(-135deg)';
            }
        }
    });
});

// Close mobile menu on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
    }
});

// Sticky header shadow on scroll
const header = document.getElementById('main-header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.classList.add('shadow-md');
    } else {
        header.classList.remove('shadow-md');
    }

    lastScroll = currentScroll;
});
