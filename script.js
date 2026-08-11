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
      // document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
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

  /* ---- gallery carousel ---- */
  var track = document.querySelector('.gallery-track');
  if (track) {
    var viewport = document.querySelector('.gallery-viewport');
    var slides = track.querySelectorAll('.gallery-slide');
    var prevBtn = document.querySelector('.gallery-arrow.prev');
    var nextBtn = document.querySelector('.gallery-arrow.next');
    var dotsWrap = document.querySelector('.gallery-dots');
    var index = 0;

    function slidesPerView() {
      var w = window.innerWidth;
      if (w <= 720) return 1;
      if (w <= 900) return 2;
      return 3;
    }

    function maxIndex() {
      return Math.max(0, slides.length - slidesPerView());
    }

    function update() {
      var slideWidth = slides[0].getBoundingClientRect().width;
      var gap = 20;
      track.style.transform = 'translateX(-' + (index * (slideWidth + gap)) + 'px)';
      if (dotsWrap) {
        dotsWrap.querySelectorAll('button').forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === index);
        });
      }
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      var count = maxIndex() + 1;
      for (var i = 0; i < count; i++) {
        var dot = document.createElement('button');
        dot.setAttribute('aria-label', 'Go to gallery slide ' + (i + 1));
        (function (i) {
          dot.addEventListener('click', function () {
            index = i;
            update();
          });
        })(i);
        dotsWrap.appendChild(dot);
      }
    }

    if (prevBtn) prevBtn.addEventListener('click', function () {
      index = index <= 0 ? maxIndex() : index - 1;
      update();
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      index = index >= maxIndex() ? 0 : index + 1;
      update();
    });

    window.addEventListener('resize', function () {
      index = Math.min(index, maxIndex());
      buildDots();
      update();
    });

    buildDots();
    update();
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
