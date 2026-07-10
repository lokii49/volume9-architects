'use strict';

/* ═══════════════════════════════════════════
   PROJECT DATA — loaded from data/projects.json
═══════════════════════════════════════════ */
let PROJECTS = [];

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
let activeProject = null;
let slideIndex = 0;

/* ═══════════════════════════════════════════
   HERO REEL
═══════════════════════════════════════════ */
(function initHeroReel() {
  const slides = document.querySelectorAll('.reel-slide');
  const counter = document.getElementById('reelCurrent');
  if (!slides.length) return;

  let current = 0;
  const pad = n => String(n).padStart(2, '0');

  function advance() {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
    if (counter) counter.textContent = pad(current + 1);
  }

  setInterval(advance, 5000);
})();

/* ═══════════════════════════════════════════
   BUILD PROJECT GRID
═══════════════════════════════════════════ */
function buildGrid() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  grid.innerHTML = PROJECTS.map(p => /* html */`
    <div class="project-card" data-id="${p.id}" tabindex="0" role="button" aria-label="Open ${p.name}">
      <div class="card-img">
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy" decoding="async" />
      </div>
      <div class="card-overlay"></div>
      <div class="card-info">
        <div class="card-top">
          <span class="card-num">${p.id}</span>
          <span class="card-cat">${p.category}</span>
        </div>
        <h3 class="card-title">${p.name}</h3>
        <p class="card-loc">${p.location}</p>
        <div class="card-cta">
          <span>View Project</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 7h9M7 2.5 11.5 7 7 11.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </div>
    </div>
  `).join('');

  // Click & keyboard
  grid.querySelectorAll('.project-card').forEach(card => {
    const open = () => openModal(PROJECTS.find(p => p.id === card.dataset.id));
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  applySpans();
}

/* ═══════════════════════════════════════════
   GRID SPANS (recomputed on filter change)
═══════════════════════════════════════════ */
function applySpans() {
  const pattern = [2, 1, 1, 2];
  const visible = [...document.querySelectorAll('.project-card:not(.hidden)')];
  visible.forEach((card, i) => {
    card.style.gridColumn = `span ${pattern[i % 4]}`;
  });
}

/* ═══════════════════════════════════════════
   FILTER
═══════════════════════════════════════════ */
function initFilter() {
  const btns = document.querySelectorAll('.f-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.project-card').forEach(card => {
        const p = PROJECTS.find(p => p.id === card.dataset.id);
        const show = filter === 'all' || p.category === filter;
        card.classList.toggle('hidden', !show);
      });
      applySpans();
    });
  });
}

/* ═══════════════════════════════════════════
   MODAL
═══════════════════════════════════════════ */
const modal      = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const gSlides    = document.getElementById('gallerySlides');
const gDots      = document.getElementById('galleryDots');
const gCurrent   = document.getElementById('gCurrent');
const gTotal     = document.getElementById('gTotal');
const gPrev      = document.getElementById('galleryPrev');
const gNext      = document.getElementById('galleryNext');
const miNum      = document.getElementById('miNum');
const miCat      = document.getElementById('miCat');
const miTitle    = document.getElementById('miTitle');
const miLoc      = document.getElementById('miLoc');
const miDesc     = document.getElementById('miDesc');
const miTags     = document.getElementById('miTags');

function pad(n) { return String(n).padStart(2, '0'); }

function openModal(project) {
  if (!project) return;
  activeProject = project;
  slideIndex = 0;

  // Info panel
  miNum.textContent   = project.id;
  miCat.textContent   = project.category;
  miTitle.textContent = project.name;
  miLoc.textContent   = project.location;
  miDesc.textContent  = project.description;
  miTags.innerHTML    = project.tags.map(t => `<span class="mi-tag">${t}</span>`).join('');

  // Gallery
  gSlides.innerHTML = project.images.map(src => `
    <div class="gallery-slide"><img src="${src}" alt="${project.name}" loading="lazy" /></div>
  `).join('');

  gDots.innerHTML = project.images.map((_, i) =>
    `<button class="g-dot${i === 0 ? ' active' : ''}" data-i="${i}" aria-label="Image ${i + 1}"></button>`
  ).join('');
  gDots.querySelectorAll('.g-dot').forEach(dot => {
    dot.addEventListener('click', () => goTo(+dot.dataset.i));
  });

  gTotal.textContent = pad(project.images.length);
  updateGallery();

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Focus trap
  requestAnimationFrame(() => modalClose.focus());
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  setTimeout(() => { gSlides.innerHTML = ''; activeProject = null; }, 500);
}

function updateGallery() {
  gSlides.style.transform = `translateX(-${slideIndex * 100}%)`;
  gCurrent.textContent = pad(slideIndex + 1);
  gDots.querySelectorAll('.g-dot').forEach((d, i) => d.classList.toggle('active', i === slideIndex));
}

function goTo(i) {
  if (!activeProject) return;
  slideIndex = (i + activeProject.images.length) % activeProject.images.length;
  updateGallery();
}

gPrev.addEventListener('click', () => goTo(slideIndex - 1));
gNext.addEventListener('click', () => goTo(slideIndex + 1));
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

document.addEventListener('keydown', e => {
  if (!modal.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowRight') goTo(slideIndex + 1);
  if (e.key === 'ArrowLeft')  goTo(slideIndex - 1);
});

// Touch swipe
let touchX = 0;
const gallery = document.getElementById('modalGallery');
gallery.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
gallery.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 45) goTo(slideIndex + (dx < 0 ? 1 : -1));
}, { passive: true });

/* ═══════════════════════════════════════════
   NAV SCROLL BEHAVIOR
═══════════════════════════════════════════ */
(function initNav() {
  const nav    = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 60);
  }, { passive: true });

  toggle.addEventListener('click', () => {
    const open = toggle.classList.toggle('is-open');
    links.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
  });

  links.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', () => {
      toggle.classList.remove('is-open');
      links.classList.remove('is-open');
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
})();

/* ═══════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════ */
function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
}

/* ═══════════════════════════════════════════
   PROJECT CARD REVEAL (staggered)
═══════════════════════════════════════════ */
function initCardReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.project-card').forEach((card, i) => {
    card.style.transitionDelay = `${(i % 3) * 0.1}s`;
    io.observe(card);
  });
}

/* ═══════════════════════════════════════════
   CONTACT FORM
═══════════════════════════════════════════ */
(function initForm() {
  const form = document.getElementById('contactForm');
  const btn  = document.getElementById('btnSend');
  if (!form) return;

  const WHATSAPP_NUMBER = '917729887245'; // +91 77298 87245

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const fd      = new FormData(form);
    const name    = (fd.get('name')    || '').toString().trim();
    const phone   = (fd.get('phone')   || '').toString().trim();
    const project = (fd.get('project') || '').toString().trim();
    const message = (fd.get('message') || '').toString().trim();

    const text = [
      'New inquiry from volume9architects.in',
      '',
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Project Type: ${project || '—'}`,
      '',
      message,
    ].join('\n');

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');

    const btnText = btn.querySelector('.btn-text');
    btn.classList.add('is-sent');
    btnText.textContent = 'Opened in WhatsApp ✓';
    form.reset();
    setTimeout(() => {
      btn.classList.remove('is-sent');
      btnText.textContent = 'Send Message';
    }, 4000);
  });
})();

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('data/projects.json');
    const data = await res.json();
    PROJECTS = data.projects;
  } catch (e) {
    console.error('Failed to load projects data:', e);
  }
  buildGrid();
  initFilter();
  initReveal();
  initCardReveal();
});
