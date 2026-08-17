// ============================================================
// JOYFUL NOISE — shared behavior
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  /* ---- mobile nav toggle ---- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('is-open');
      toggle.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      // document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---- nav shadow on scroll ---- */
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- reveal-on-scroll ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- hero equalizer bars ---- */
  var barsWrap = document.querySelector('.hero-bars');
  if (barsWrap) {
    var barCount = 40;
    for (var i = 0; i < barCount; i++) {
      var bar = document.createElement('span');
      var height = 30 + Math.random() * 70;
      var duration = 2.2 + Math.random() * 2.4;
      var delay = Math.random() * -4;
      bar.style.height = height + '%';
      bar.style.animationDuration = duration + 's';
      bar.style.animationDelay = delay + 's';
      barsWrap.appendChild(bar);
    }
  }

  /* ============================================================
     GALLERY
     The scrolling itself is native CSS scroll-snap (see .gallery-viewport),
     which is what gives us swipe, momentum and trackpad support for free.
     This code only adds: arrow buttons, dots, and the lightbox.
     ============================================================ */
  var viewport = document.querySelector('.gallery-viewport');
  var slides = viewport ? Array.prototype.slice.call(viewport.querySelectorAll('.gallery-slide')) : [];

  if (viewport && slides.length) {
    var dotsWrap = document.querySelector('.gallery-dots');
    var prevBtn = document.querySelector('.gallery-arrow.prev');
    var nextBtn = document.querySelector('.gallery-arrow.next');

    /* distance from the start of one slide to the start of the next */
    function step() {
      if (slides.length < 2) return viewport.clientWidth;
      return slides[1].offsetLeft - slides[0].offsetLeft;
    }
    function currentIndex() {
      var s = step();
      if (!s) return 0;
      return Math.max(0, Math.min(slides.length - 1, Math.round(viewport.scrollLeft / s)));
    }
    function maxScroll() {
      return viewport.scrollWidth - viewport.clientWidth;
    }
    function goTo(i) {
      viewport.scrollTo({ left: i * step(), behavior: 'smooth' });
    }

    /* ---- dots ---- */
    var dots = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach(function (slide, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Go to photo ' + (i + 1) + ' of ' + slides.length);
        dot.addEventListener('click', function () { goTo(i); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function syncDots() {
      var i = currentIndex();
      dots.forEach(function (d, n) {
        d.classList.toggle('is-active', n === i);
        d.setAttribute('aria-current', n === i ? 'true' : 'false');
      });
    }

    var scrollTick;
    viewport.addEventListener('scroll', function () {
      clearTimeout(scrollTick);
      scrollTick = setTimeout(syncDots, 60);
    }, { passive: true });
    window.addEventListener('resize', syncDots);
    syncDots();

    /* ---- arrows (wrap around at the ends, like the original) ---- */
    if (prevBtn) prevBtn.addEventListener('click', function () {
      if (viewport.scrollLeft <= 4) viewport.scrollTo({ left: maxScroll(), behavior: 'smooth' });
      else viewport.scrollBy({ left: -step(), behavior: 'smooth' });
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      if (viewport.scrollLeft >= maxScroll() - 4) viewport.scrollTo({ left: 0, behavior: 'smooth' });
      else viewport.scrollBy({ left: step(), behavior: 'smooth' });
    });

    /* ============================================================
       LIGHTBOX
       ============================================================ */
    var ICON = {
      close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>',
      prev:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 4.5l-7.5 7.5 7.5 7.5-1.5 1.5-9-9 9-9z"/></svg>',
      next:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 4.5l7.5 7.5-7.5 7.5 1.5 1.5 9-9-9-9z"/></svg>'
    };

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Photo viewer');
    box.hidden = true;
    box.innerHTML =
      '<button type="button" class="lightbox-btn lightbox-close" aria-label="Close photo viewer">' + ICON.close + '</button>' +
      '<button type="button" class="lightbox-btn lightbox-nav prev" aria-label="Previous photo">' + ICON.prev + '</button>' +
      '<img class="lightbox-img" alt="">' +
      '<button type="button" class="lightbox-btn lightbox-nav next" aria-label="Next photo">' + ICON.next + '</button>' +
      '<p class="lightbox-counter" aria-live="polite"></p>' +
      '<p class="lightbox-hint">Esc to close &middot; &larr; &rarr; to browse</p>';
    document.body.appendChild(box);

    var boxImg = box.querySelector('.lightbox-img');
    var boxCounter = box.querySelector('.lightbox-counter');
    var closeBtn = box.querySelector('.lightbox-close');
    var lbPrev = box.querySelector('.lightbox-nav.prev');
    var lbNext = box.querySelector('.lightbox-nav.next');
    var focusables = [closeBtn, lbPrev, lbNext];
    var lbIndex = 0;
    var lastFocused = null;

    function largeSrc(i) {
      return slides[i].getAttribute('data-large') || slides[i].querySelector('img').src;
    }

    function show(i) {
      lbIndex = (i + slides.length) % slides.length;
      var thumb = slides[lbIndex].querySelector('img');

      /* show the already-cached thumbnail immediately, swap in the big one when it lands */
      boxImg.src = thumb.currentSrc || thumb.src;
      boxImg.alt = thumb.alt;
      boxImg.classList.add('is-loading');
      boxCounter.textContent = (lbIndex + 1) + ' / ' + slides.length;

      var full = new Image();
      var wanted = largeSrc(lbIndex);
      full.onload = function () {
        if (wanted !== largeSrc(lbIndex)) return;   // user already moved on
        boxImg.src = wanted;
        boxImg.classList.remove('is-loading');
      };
      full.onerror = function () { boxImg.classList.remove('is-loading'); };
      full.src = wanted;

      /* quietly warm up the neighbours so arrowing through feels instant */
      [lbIndex + 1, lbIndex - 1].forEach(function (n) {
        var pre = new Image();
        pre.src = largeSrc((n + slides.length) % slides.length);
      });
    }

    function openBox(i) {
      lastFocused = document.activeElement;
      box.hidden = false;
      show(i);
      requestAnimationFrame(function () { box.classList.add('is-open'); });
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function closeBox() {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(function () { box.hidden = true; boxImg.removeAttribute('src'); }, 250);
      /* put the user back on the thumbnail they came from */
      var back = lastFocused && lastFocused.isConnected ? lastFocused : slides[lbIndex];
      if (back && back.focus) back.focus();
      /* keep the strip in sync with wherever they browsed to */
      goTo(lbIndex);
    }

    slides.forEach(function (slide, i) {
      var thumb = slide.querySelector('img');
      slide.setAttribute('aria-label', 'Open full screen: ' + (thumb ? thumb.alt : 'photo ' + (i + 1)));
      slide.addEventListener('click', function () { openBox(i); });
    });

    closeBtn.addEventListener('click', closeBox);
    lbPrev.addEventListener('click', function () { show(lbIndex - 1); });
    lbNext.addEventListener('click', function () { show(lbIndex + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') { closeBox(); }
      else if (e.key === 'ArrowRight') { show(lbIndex + 1); }
      else if (e.key === 'ArrowLeft') { show(lbIndex - 1); }
      else if (e.key === 'Tab') {
        /* trap focus inside the dialog */
        e.preventDefault();
        var pos = focusables.indexOf(document.activeElement);
        var next = e.shiftKey ? pos - 1 : pos + 1;
        focusables[(next + focusables.length) % focusables.length].focus();
      }
    });

    /* swipe between photos inside the lightbox */
    var touchX = null, touchY = null;
    box.addEventListener('touchstart', function (e) {
      touchX = e.changedTouches[0].clientX;
      touchY = e.changedTouches[0].clientY;
    }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      var dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(lbIndex + (dx < 0 ? 1 : -1));
      touchX = touchY = null;
    }, { passive: true });
  }

  /* ---- member photo auto-cycle + tap override (touch devices) ---- */
  var isTouchDevice = window.matchMedia('(hover: none)').matches;

  if (isTouchDevice) {
    document.querySelectorAll('.member-card').forEach(function (card, i) {
      // auto-cycle, staggered so cards don't all flip in unison
      setInterval(function () {
        card.classList.toggle('is-flipped');
      }, 4000 + (i % 3) * 300);

      // tap also manually toggles, independent of the timer
      card.addEventListener('click', function () {
        card.classList.toggle('is-flipped');
      });
    });
  }

});
