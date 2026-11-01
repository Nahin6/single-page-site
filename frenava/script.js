/* Frenava landing page — interactions & motion (vanilla JS, no dependencies) */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const body = document.body;

  /* ---------- Loader ---------- */
  const started = performance.now();
  let loaded = false;
  const finishLoading = () => {
    if (loaded) return;
    loaded = true;
    const wait = Math.max(0, (reduceMotion ? 0 : 1100) - (performance.now() - started));
    setTimeout(() => {
      body.classList.remove("is-loading");
      body.classList.add("is-loaded");
    }, wait);
  };
  window.addEventListener("load", finishLoading);
  setTimeout(finishLoading, 2600); // never block the page on a slow video

  /* ---------- Year ---------- */
  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Hero title split ---------- */
  const splitTitle = (el) => {
    let i = 0;
    const frag = document.createDocumentFragment();
    const addWord = (word, wrapper) => {
      const w = document.createElement("span");
      w.className = "w";
      const inner = document.createElement("span");
      inner.style.setProperty("--i", i++);
      if (wrapper) {
        const clone = wrapper.cloneNode(false);
        clone.textContent = word;
        inner.appendChild(clone);
      } else {
        inner.textContent = word;
      }
      w.appendChild(inner);
      frag.appendChild(w);
      frag.appendChild(document.createTextNode(" "));
    };
    el.childNodes.forEach((node) => {
      const words = node.textContent.trim().split(/\s+/).filter(Boolean);
      words.forEach((word) => addWord(word, node.nodeType === 1 ? node : null));
    });
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    el.innerHTML = "";
    el.appendChild(frag);
    $$(".w", el).forEach((w) => w.setAttribute("aria-hidden", "true"));
  };
  $$("[data-split]").forEach(splitTitle);

  /* ---------- Hero video ---------- */
  const video = $(".hero__video");
  const playBtn = $(".hero__play");
  let userPaused = reduceMotion;
  if (video) {
    const src = window.innerWidth < 720 ? video.dataset.srcMobile : video.dataset.srcDesktop;
    video.src = src;
    const setPaused = (paused) => {
      playBtn.setAttribute("aria-pressed", String(paused));
      playBtn.setAttribute("aria-label", paused ? "Play background video" : "Pause background video");
    };
    if (reduceMotion) {
      video.removeAttribute("autoplay");
      video.pause();
      setPaused(true);
    } else {
      video.play().catch(() => setPaused(true));
    }
    playBtn.addEventListener("click", () => {
      if (video.paused) {
        userPaused = false;
        video.play().catch(() => {});
        setPaused(false);
      } else {
        userPaused = true;
        video.pause();
        setPaused(true);
      }
    });
    // Save battery: pause when the hero is off-screen.
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused) video.play().catch(() => {});
      else if (!e.isIntersecting) video.pause();
    }, { threshold: 0.05 }).observe($(".hero"));
  }

  /* ---------- Falling petals (canvas) ---------- */
  const canvas = $(".petals");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    const colors = ["#f3dccf", "#e6a796", "#f6ecd9", "#d98b78", "#f0c9bb", "#8fa878"];
    let w = 0, h = 0, dpr = 1, petals = [], running = true, raf;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 720 ? 12 : 24;
      petals = Array.from({ length: count }, () => makePetal(true));
    };
    const makePetal = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -20,
      r: 5 + Math.random() * 9,
      vy: 0.35 + Math.random() * 0.7,
      vx: -0.2 + Math.random() * 0.5,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.015,
      rot: Math.random() * Math.PI * 2,
      vr: -0.02 + Math.random() * 0.04,
      flip: Math.random() * Math.PI,
      color: colors[(Math.random() * colors.length) | 0],
      alpha: 0.55 + Math.random() * 0.4,
    });
    const drawPetal = (p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.7 + 0.3);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.bezierCurveTo(p.r * 0.9, -p.r * 0.6, p.r * 0.7, p.r * 0.8, 0, p.r);
      ctx.bezierCurveTo(-p.r * 0.7, p.r * 0.8, -p.r * 0.9, -p.r * 0.6, 0, -p.r);
      ctx.fill();
      ctx.restore();
    };
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.sway += p.swaySpeed;
        p.flip += 0.02;
        p.x += p.vx + Math.sin(p.sway) * 0.6;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > h + 20 || p.x < -30 || p.x > w + 30) petals[i] = makePetal(false);
        drawPetal(p);
      }
      if (running) raf = requestAnimationFrame(tick);
    };
    const setRunning = (on) => {
      if (on === running) return;
      running = on;
      if (on) raf = requestAnimationFrame(tick);
      else cancelAnimationFrame(raf);
    };
    resize();
    raf = requestAnimationFrame(tick);
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
    new IntersectionObserver(([e]) => setRunning(e.isIntersecting)).observe(canvas);
    document.addEventListener("visibilitychange", () => setRunning(!document.hidden));
  }

  /* ---------- Nav ---------- */
  const nav = $(".nav");
  const toggle = $(".nav__toggle");
  const menu = $("#nav-menu");
  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia("(min-width: 961px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  // Current section highlight
  const navLinks = $$('.nav__links a[href^="#"]:not(.btn)');
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  navLinks.forEach((a) => { const s = $(a.getAttribute("href")); if (s) sectionObs.observe(s); });

  /* ---------- Reveal on scroll ---------- */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add("is-in");
      revealObs.unobserve(el);
      // Once revealed, drop the stagger delay so hover/tilt feel instant.
      setTimeout(() => el.classList.add("is-done"), 1600);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  $$("[data-reveal]").forEach((el) => revealObs.observe(el));

  /* ---------- Botanical line drawing ---------- */
  const drawSvgs = $$("svg.botanical");
  drawSvgs.forEach((svg) => {
    $$(".draw", svg).forEach((p) => {
      const len = Math.ceil(p.getTotalLength ? p.getTotalLength() : 300);
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = reduceMotion ? 0 : len;
    });
  });
  const drawObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      $$(".draw", e.target).forEach((p) => (p.style.strokeDashoffset = 0));
      drawObs.unobserve(e.target);
    });
  }, { threshold: 0.3 });
  drawSvgs.forEach((svg) => drawObs.observe(svg));

  /* ---------- Story: words light up while scrolling ---------- */
  const words = [];
  const storyText = $("[data-words]");
  if (storyText) {
    const parts = storyText.textContent.trim().split(/\s+/);
    storyText.setAttribute("aria-label", parts.join(" "));
    storyText.innerHTML = parts.map((p) => `<span class="word" aria-hidden="true">${p}</span>`).join(" ");
    words.push(...$$(".word", storyText));
  }

  /* ---------- Counters ---------- */
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countObs.unobserve(e.target);
      const el = e.target;
      const end = +el.dataset.count;
      const suffix = el.dataset.suffix || "";
      if (reduceMotion) { el.textContent = end + suffix; return; }
      const dur = 1800, t0 = performance.now();
      const step = (t) => {
        const k = clamp((t - t0) / dur, 0, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => countObs.observe(el));

  /* ---------- Showcase: sticky image follows active feature ---------- */
  const shots = $$("[data-shot]");
  const features = $$("[data-feature]");
  const shotLabel = $("[data-shot-label]");
  const showProgress = $(".showcase__progress i");
  let activeShot = 0;
  const setShot = (i) => {
    if (i === activeShot) return;
    activeShot = i;
    shots.forEach((img) => img.classList.toggle("is-active", +img.dataset.shot === i));
    features.forEach((f) => f.classList.toggle("is-active", +f.dataset.feature === i));
    if (showProgress) showProgress.style.width = ((i + 1) / features.length) * 100 + "%";
    if (shotLabel) {
      shotLabel.classList.add("swap");
      setTimeout(() => { shotLabel.textContent = features[i].dataset.label; shotLabel.classList.remove("swap"); }, 250);
    }
  };
  const featObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setShot(+e.target.dataset.feature); });
  }, { rootMargin: "-45% 0px -45% 0px" });
  features.forEach((f) => featObs.observe(f));

  /* ---------- Scroll-linked effects (single rAF loop) ---------- */
  const parallaxEls = $$("[data-parallax]");
  const steps = $("[data-steps]");
  const stepsLine = $(".steps__line i");
  const toTop = $(".to-top");
  const ring = $(".to-top__ring");
  let lastY = window.scrollY, ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;

    // nav state
    nav.classList.toggle("is-scrolled", y > 20);
    if (!nav.classList.contains("is-open")) {
      const goingDown = y > lastY;
      nav.classList.toggle("is-hidden", goingDown && y > vh * 0.8 && Math.abs(y - lastY) > 2);
      if (!goingDown) nav.classList.remove("is-hidden");
    }
    lastY = y;

    // back-to-top progress
    const max = document.documentElement.scrollHeight - vh;
    const prog = max > 0 ? y / max : 0;
    toTop.classList.toggle("is-visible", y > vh);
    ring.style.strokeDashoffset = 132 * (1 - prog);

    // story words
    if (words.length) {
      const r = storyText.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
      const lit = Math.round(p * words.length);
      for (let i = 0; i < words.length; i++) words[i].classList.toggle("is-lit", i < lit);
    }

    if (!reduceMotion) {
      // parallax
      parallaxEls.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });

      // ritual line
      if (steps && stepsLine) {
        const r = steps.getBoundingClientRect();
        const p = clamp((vh * 0.75 - r.top) / (r.height * 0.9), 0, 1);
        const vertical = window.innerWidth <= 720;
        stepsLine.style.transform = vertical ? `scaleY(${p})` : `scaleX(${p})`;
      }
    } else if (stepsLine) {
      stepsLine.style.transform = "none";
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Reviews carousel ---------- */
  const carousel = $("[data-carousel]");
  if (carousel) {
    const track = $(".carousel__track", carousel);
    const slides = $$(".review", track);
    const dotsWrap = $(".carousel__dots", carousel);
    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", `Review ${i + 1} of ${slides.length}`);
      b.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(b);
      return b;
    });
    let current = 0;
    const slideLeft = (i) => slides[i].offsetLeft - slides[0].offsetLeft;
    const goTo = (i) => {
      current = (i + slides.length) % slides.length;
      track.scrollTo({ left: slideLeft(current), behavior: reduceMotion ? "auto" : "smooth" });
    };
    const updateDots = () => {
      const x = track.scrollLeft;
      let best = 0, bestD = Infinity;
      slides.forEach((_, i) => { const d = Math.abs(slideLeft(i) - x); if (d < bestD) { bestD = d; best = i; } });
      // At the scroll end, the last slides may never reach the start edge.
      if (x + track.clientWidth >= track.scrollWidth - 4) best = slides.length - 1;
      current = best;
      dots.forEach((d, i) => d.setAttribute("aria-selected", String(i === best)));
    };
    track.addEventListener("scroll", () => requestAnimationFrame(updateDots), { passive: true });
    $("[data-prev]", carousel).addEventListener("click", () => goTo(current - 1));
    $("[data-next]", carousel).addEventListener("click", () => goTo(current + 1));
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1); }
    });
    updateDots();

    // Autoplay — pauses on hover, focus, touch and when off-screen
    let paused = false, inView = false;
    ["mouseenter", "focusin", "touchstart"].forEach((ev) => carousel.addEventListener(ev, () => (paused = true), { passive: true }));
    ["mouseleave", "focusout"].forEach((ev) => carousel.addEventListener(ev, () => (paused = false)));
    new IntersectionObserver(([e]) => (inView = e.isIntersecting), { threshold: 0.4 }).observe(carousel);
    if (!reduceMotion) setInterval(() => { if (!paused && inView && !document.hidden) goTo(current + 1); }, 5000);
  }

  /* ---------- Shop ---------- */
  const priceEl = $("[data-price]");
  const noteEl = $("[data-price-note]");
  const qtyEl = $("[data-qty-value]");
  const bagCount = $("[data-bag-count]");
  const bagLink = $(".nav__bag");
  let qty = 1, bag = 0;

  $$('input[name="size"]').forEach((input) => {
    input.addEventListener("change", () => {
      priceEl.classList.remove("tick");
      void priceEl.offsetWidth; // restart animation
      priceEl.classList.add("tick");
      setTimeout(() => {
        priceEl.textContent = "$" + input.dataset.price;
        noteEl.textContent = input.dataset.note;
      }, reduceMotion ? 0 : 220);
    });
  });
  $$("[data-qty]").forEach((btn) => {
    btn.addEventListener("click", () => {
      qty = clamp(qty + +btn.dataset.qty, 1, 10);
      qtyEl.textContent = qty;
    });
  });

  const toast = $(".toast");
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  };

  $("[data-add]").addEventListener("click", (e) => {
    const size = $('input[name="size"]:checked');
    bag += qty;
    bagCount.textContent = bag;
    bagCount.classList.add("has-items");
    bagCount.classList.remove("bump");
    void bagCount.offsetWidth;
    bagCount.classList.add("bump");
    bagLink.setAttribute("aria-label", `Shopping bag, ${bag} item${bag === 1 ? "" : "s"}`);
    nav.classList.remove("is-hidden");
    showToast(`Added ${qty} × ${size.value} ml Cleansing Cream to your bag`);
    const label = $("span", e.currentTarget);
    label.textContent = "Added ✓";
    setTimeout(() => (label.textContent = "Add to bag"), 1800);
  });

  /* ---------- FAQ accordion (smooth height, one open at a time) ---------- */
  const accs = $$(".acc");
  const animateAcc = (det, open) => {
    const bodyEl = $(".acc__body", det);
    if (reduceMotion || !bodyEl.animate) { det.open = open; return; }
    if (open) {
      det.open = true;
      const h = bodyEl.scrollHeight;
      bodyEl.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 450, easing: "cubic-bezier(.22,1,.36,1)" });
    } else {
      const h = bodyEl.scrollHeight;
      const a = bodyEl.animate([{ height: h + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 350, easing: "cubic-bezier(.22,1,.36,1)" });
      a.onfinish = () => (det.open = false);
    }
  };
  accs.forEach((det) => {
    $("summary", det).addEventListener("click", (e) => {
      e.preventDefault();
      const willOpen = !det.open;
      if (willOpen) accs.forEach((o) => { if (o !== det && o.open) animateAcc(o, false); });
      animateAcc(det, willOpen);
    });
  });

  /* ---------- Newsletter ---------- */
  const form = $(".nl-form");
  if (form) {
    const input = $("input", form);
    const msg = $(".nl-form__msg", form);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      form.classList.remove("has-error");
      if (!ok) {
        void form.offsetWidth;
        form.classList.add("has-error");
        msg.className = "nl-form__msg err";
        msg.textContent = "Please enter a valid email address.";
        input.focus();
        return;
      }
      msg.className = "nl-form__msg ok";
      msg.textContent = "Welcome to the garden! Check your inbox for 10% off.";
      form.reset();
    });
    input.addEventListener("input", () => { form.classList.remove("has-error"); if (msg.classList.contains("err")) msg.textContent = ""; });
  }

  /* ---------- Pointer niceties (desktop only) ---------- */
  if (finePointer && !reduceMotion) {
    // Magnetic buttons
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });

    // 3D tilt cards
    $$(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-6px)`;
      });
      card.addEventListener("pointerleave", () => (card.style.transform = ""));
    });
  }
})();
