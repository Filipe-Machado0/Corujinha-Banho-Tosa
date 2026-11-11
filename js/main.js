/* ============================================
   CORUJINHA BANHO & TOSA — MAIN JS
   ============================================ */

(function () {
    'use strict';

    /* ---------- DOM References ---------- */
    const header   = document.getElementById('header');
    const navMenu  = document.getElementById('navMenu');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelectorAll('.nav__link');
    const sections = document.querySelectorAll('section[id]');

    /* ---------- Mobile Menu ---------- */

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'nav__overlay';
    document.body.appendChild(overlay);

    function openMenu() {
        navMenu.classList.add('open');
        navToggle.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        navMenu.classList.remove('open');
        navToggle.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    navToggle.addEventListener('click', function () {
        navMenu.classList.contains('open') ? closeMenu() : openMenu();
    });

    overlay.addEventListener('click', closeMenu);

    // Close menu when a link is clicked
    navLinks.forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
    });


    /* ---------- Header Scroll Effect ---------- */
    let lastScroll = 0;

    function handleScroll() {
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }

        lastScroll = currentScroll;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Run once on load


    /* ---------- Active Nav Link on Scroll ---------- */
    function setActiveLink() {
        const scrollY = window.scrollY + 120;

        sections.forEach(function (section) {
            const top    = section.offsetTop;
            const height = section.offsetHeight;
            const id     = section.getAttribute('id');

            if (scrollY >= top && scrollY < top + height) {
                navLinks.forEach(function (link) {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', setActiveLink, { passive: true });
    setActiveLink();


    /* ---------- Scroll Reveal (Intersection Observer) ---------- */
    var revealElements = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                root: null,
                rootMargin: '0px 0px -60px 0px',
                threshold: 0.15
            }
        );

        revealElements.forEach(function (el) {
            observer.observe(el);
        });
    } else {
        // Fallback: show everything immediately
        revealElements.forEach(function (el) {
            el.classList.add('visible');
        });
    }


    /* ---------- Smooth scroll for internal links (fallback) ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;

            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });


    /* ---------- Corujinha Pet Gallery Carousel ---------- */
    function initCorujinhaCarousel() {
        const track = document.getElementById('corujinhaCarouselTrack');
        const prevBtn = document.getElementById('carouselPrevBtn');
        const nextBtn = document.getElementById('carouselNextBtn');
        const dotsContainer = document.getElementById('carouselDots');

        if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

        const cards = track.querySelectorAll('.carousel-card');
        if (!cards.length) return;

        // Cria dots indicadores
        dotsContainer.innerHTML = '';
        cards.forEach((card, idx) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot' + (idx === 0 ? ' is-active' : '');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Ir para a foto ${idx + 1} de ${cards.length}`);
            dot.addEventListener('click', () => {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
            });
            dotsContainer.appendChild(dot);
        });

        const dots = dotsContainer.querySelectorAll('.carousel-dot');

        // Scroll com botões
        function getScrollStep() {
            const firstCard = cards[0];
            const cardWidth = firstCard.getBoundingClientRect().width;
            return cardWidth + 24; // card width + gap
        }

        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            const maxScroll = track.scrollWidth - track.clientWidth;
            if (track.scrollLeft >= maxScroll - 15) {
                // Loop para o começo se chegou no final
                track.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
            }
        });

        // Atualiza dot ativo no scroll
        let scrollTimeout;
        track.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollLeft = track.scrollLeft;
                let activeIdx = 0;
                let minDiff = Infinity;

                cards.forEach((card, idx) => {
                    const diff = Math.abs(card.offsetLeft - track.offsetLeft - scrollLeft);
                    if (diff < minDiff) {
                        minDiff = diff;
                        activeIdx = idx;
                    }
                });

                dots.forEach((d, idx) => {
                    if (idx === activeIdx) {
                        d.classList.add('is-active');
                    } else {
                        d.classList.remove('is-active');
                    }
                });
            }, 60);
        }, { passive: true });

        // Auto-play suave a cada 4.5 segundos com pausa no hover/touch
        let autoplayTimer = null;

        function startAutoplay() {
            stopAutoplay();
            autoplayTimer = setInterval(() => {
                const maxScroll = track.scrollWidth - track.clientWidth;
                if (track.scrollLeft >= maxScroll - 15) {
                    track.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
                }
            }, 4500);
        }

        function stopAutoplay() {
            if (autoplayTimer) {
                clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
        }

        track.addEventListener('mouseenter', stopAutoplay);
        track.addEventListener('mouseleave', startAutoplay);
        track.addEventListener('touchstart', stopAutoplay, { passive: true });
        track.addEventListener('touchend', startAutoplay, { passive: true });

        // Inicia autoplay após carregamento
        startAutoplay();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCorujinhaCarousel);
    } else {
        initCorujinhaCarousel();
    }
})();
