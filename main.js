/* ============================================
   HENRI ARVELA OY — main.js
   ============================================ */

'use strict';

/* ---------- UTILITY ---------- */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ---------- FOOTER YEAR ---------- */
const yearEl = qs('#footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- NAVIGATION ---------- */
(function initNav() {
  const header  = qs('.site-header');
  const toggle  = qs('.nav-toggle');
  const menu    = qs('.nav-menu');
  const navLinks = qsa('.nav-link, .nav-cta-btn');

  if (!header || !toggle || !menu) return;

  /* Scroll: lisää .scrolled kun sivua on vieritetty */
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Hampurilaisvalikko */
  const openMenu = () => {
    menu.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  /* Suljetaan valikko linkkiä klikatessa */
  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  /* Suljetaan valikko Escape-näppäimellä */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
      toggle.focus();
    }
  });

  /* Suljetaan valikko klikatessa valikon ulkopuolelle */
  document.addEventListener('click', e => {
    if (
      menu.classList.contains('open') &&
      !menu.contains(e.target) &&
      !toggle.contains(e.target)
    ) {
      closeMenu();
    }
  });
})();

/* ---------- SCROLL REVEAL ---------- */
(function initReveal() {
  const targets = qsa(
    '.service-card, .trust-item, .yhteystiedot-card, ' +
    '.prosessi-step, .meista-layout, .section-header, ' +
    '.yhteydenotto-info, .contact-form'
  );

  targets.forEach((el, i) => {
    el.classList.add('reveal');
    /* Porrasta korteissa viive automaattisesti */
    if (el.classList.contains('service-card') ||
        el.classList.contains('prosessi-step') ||
        el.classList.contains('yhteystiedot-card') ||
        el.classList.contains('trust-item')) {
      const delay = (i % 4) * 80;
      el.style.transitionDelay = `${delay}ms`;
    }
  });

  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(el => observer.observe(el));
})();

/* ---------- SMOOTH SCROLL ANKKURILINKIT ---------- */
(function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const navHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '70'
    );
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;

    window.scrollTo({ top, behavior: 'smooth' });

    /* Siirretään fokus kohdesektioon saavutettavuuden vuoksi */
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  });
})();

/* ---------- YHTEYDENOTTOLOMAKE ---------- */
(function initContactForm() {
  const form       = qs('#contact-form');
  if (!form) return;

  const submitBtn  = qs('#submit-btn',  form);
  const statusEl   = qs('#form-status', form);
  const btnText    = qs('.btn-text',    submitBtn);
  const btnLoading = qs('.btn-loading', submitBtn);

  /* Kenttien validointisäännöt */
  const rules = {
    nimi: {
      el:      qs('#nimi',        form),
      errorEl: qs('#nimi-error',  form),
      validate: v => v.trim().length >= 2 ? '' : 'Kirjoita nimesi (vähintään 2 merkkiä).'
    },
    sahkoposti: {
      el:      qs('#sahkoposti',        form),
      errorEl: qs('#sahkoposti-error',  form),
      validate: v =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
          ? ''
          : 'Tarkista sähköpostiosoite.'
    },
    viesti: {
      el:      qs('#viesti',        form),
      errorEl: qs('#viesti-error',  form),
      validate: v => v.trim().length >= 10 ? '' : 'Kirjoita viesti (vähintään 10 merkkiä).'
    }
  };

  /* Reaaliaikainen validointi kentän poistuessa */
  Object.values(rules).forEach(({ el, errorEl, validate }) => {
    if (!el) return;
    el.addEventListener('blur', () => {
      const msg = validate(el.value);
      showFieldError(el, errorEl, msg);
    });
    el.addEventListener('input', () => {
      if (el.classList.contains('invalid')) {
        const msg = validate(el.value);
        showFieldError(el, errorEl, msg);
      }
    });
  });

  function showFieldError(input, errorEl, message) {
    if (!input || !errorEl) return;
    if (message) {
      input.classList.add('invalid');
      errorEl.textContent = message;
      input.setAttribute('aria-describedby', errorEl.id);
    } else {
      input.classList.remove('invalid');
      errorEl.textContent = '';
      input.removeAttribute('aria-describedby');
    }
  }

  function validateAll() {
    let valid = true;
    Object.values(rules).forEach(({ el, errorEl, validate }) => {
      if (!el) return;
      const msg = validate(el.value);
      showFieldError(el, errorEl, msg);
      if (msg) valid = false;
    });
    return valid;
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    if (btnText)    btnText.hidden    = loading;
    if (btnLoading) btnLoading.hidden = !loading;
  }

  function showStatus(type, message) {
    if (!statusEl) return;
    statusEl.className = `form-status ${type}`;
    statusEl.textContent = message;
    statusEl.hidden = false;
    statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideStatus() {
    if (!statusEl) return;
    statusEl.hidden = true;
    statusEl.className = 'form-status';
    statusEl.textContent = '';
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    hideStatus();

    if (!validateAll()) {
      /* Fokusoi ensimmäiseen virheelliseen kenttään */
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    setLoading(true);

    try {
      const data     = new FormData(form);
      const response = await fetch(form.action, {
        method:  'POST',
        body:    data,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        showStatus(
          'success',
          'Viesti lähetetty. Palataan sinulle saman päivän aikana arkisin.'
        );
        form.reset();
        /* Poistetaan virhetilat resetin jälkeen */
        Object.values(rules).forEach(({ el, errorEl }) => {
          if (el) el.classList.remove('invalid');
          if (errorEl) errorEl.textContent = '';
        });
      } else {
        const json = await response.json().catch(() => ({}));
        const msg  = json?.errors?.map(err => err.message).join(', ') ||
                     'Lähetys epäonnistui. Yritä uudelleen tai soita suoraan.';
        showStatus('error', msg);
      }
    } catch {
      showStatus(
        'error',
        'Verkkovirhe. Tarkista yhteys ja yritä uudelleen tai soita suoraan.'
      );
    } finally {
      setLoading(false);
    }
  });
})();

/* ---------- ACTIVE NAV LINK HIGHLIGHT ---------- */
(function initActiveNav() {
  const sections = qsa('main section[id]');
  const navLinks = qsa('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const navHeight = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '70'
  );

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href === `#${id}`) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });
    },
    {
      rootMargin: `-${navHeight + 8}px 0px -55% 0px`,
      threshold: 0
    }
  );

  sections.forEach(sec => observer.observe(sec));
})();