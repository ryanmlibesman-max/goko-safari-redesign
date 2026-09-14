/* GoKo Safari — interactions */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Brand mark: GoKo in serif, "Safari" in copper script, Africa outline behind (from the supplied logo) */
  const LOGO = (h) => `<svg class="logo" viewBox="0 0 200 ${h === "stack" ? 120 : 64}" aria-hidden="true" focusable="false">
    <path class="logo__africa" d="M78 6 C96 2 118 4 134 10 C150 14 158 22 160 34 C162 46 170 52 178 58 C186 64 184 76 176 84 C168 92 160 100 150 108 C142 114 134 114 128 106 C122 98 118 88 112 80 C104 70 92 68 82 66 C70 64 60 58 54 48 C48 38 50 26 56 18 C62 10 70 8 78 6 Z" transform="translate(${h === "stack" ? 22 : 40} ${h === "stack" ? 4 : -28}) scale(${h === "stack" ? .95 : .78})"/>
    ${h === "stack"
      ? `<text class="logo__word" x="100" y="70" text-anchor="middle">GoKo</text><text class="logo__script" x="100" y="106" text-anchor="middle">Safari</text>`
      : `<text class="logo__word" x="4" y="44">GoKo</text><text class="logo__script" x="118" y="52">Safari</text>`}
  </svg>`;
  $$("[data-logo]").forEach((el) => { el.innerHTML = LOGO(el.dataset.logo); });

  /* Intro curtain */
  const curtain = $("#curtain");
  const lift = () => curtain && curtain.classList.add("is-done");
  if (reduced) lift();
  else {
    window.addEventListener("load", () => setTimeout(lift, 900));
    setTimeout(lift, 3200); // safety
  }

  /* Nav state + progress bar */
  const nav = $("#nav");
  const progress = $("#progress");
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 40);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  const burger = $("#burger");
  const menu = $("#mobileMenu");
  const setMenu = (open) => {
    burger.classList.toggle("is-open", open);
    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* Reveal on scroll */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    }),
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  $$(".reveal").forEach((el) => io.observe(el));

  /* Statement: word-by-word illumination tied to scroll */
  const statement = $(".statement__text");
  if (statement) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
    const spans = $$(".w", statement);
    const lightWords = () => {
      const r = statement.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress 0..1 as the block moves from 85% to 35% of the viewport
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.5 + r.height * 0.4)));
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle("is-lit", i < n));
    };
    window.addEventListener("scroll", lightWords, { passive: true });
    lightWords();
  }

  /* Count-up stats */
  const counters = $$("[data-count]");
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.count, t0 = performance.now(), dur = 1400;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => cio.observe(c));

  /* Itinerary accordion */
  $$(".day").forEach((day) => {
    const head = $(".day__head", day);
    head.addEventListener("click", () => {
      const open = !day.classList.contains("is-open");
      day.classList.toggle("is-open", open);
      head.setAttribute("aria-expanded", String(open));
    });
  });
  const firstDay = $(".day");
  if (firstDay) { firstDay.classList.add("is-open"); $(".day__head", firstDay).setAttribute("aria-expanded", "true"); }

  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  /* Subtle parallax on media backgrounds */
  if (!reduced) {
    const layers = hasGsap ? [] : $$(".kosher__bg img, .quote__bg img");
    const parallax = () => {
      layers.forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        const vh = window.innerHeight;
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
        img.style.transform = `translateY(${p * -8}%) scale(1.15)`;
      });
    };
    window.addEventListener("scroll", parallax, { passive: true });
    parallax();
  }

  /* Inquiry form (front-end only) */
  const form = $("#inquiryForm");
  if (form) {
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      let ok = true;
      $$(".field", form).forEach((f) => {
        const input = $("input, select, textarea", f);
        const bad = input.hasAttribute("required") && !input.value.trim()
          || (input.type === "email" && input.value && !/^\S+@\S+\.\S+$/.test(input.value));
        f.classList.toggle("is-invalid", bad);
        if (bad) ok = false;
      });
      if (!ok) return;
      const success = $("#formSuccess");
      success.hidden = false;
      form.reset();
      success.scrollIntoView({ behavior: "smooth", block: "center" });
      // Wire this to your backend / email service here.
    });
  }

  /* ---------- Scroll-linked cinematic sequences (GSAP ScrollTrigger) ---------- */
  if (reduced || !hasGsap) {
    document.documentElement.classList.add("no-motion");
  } else {
    gsap.registerPlugin(ScrollTrigger);

    /* 1. Hero: scroll-driven dolly out of the lodge toward the elephant.
       A frame sequence (assets/dolly/frame_###.jpg) is scrubbed on a canvas; the hero is
       pinned for DOLLY_SCROLL px so the shot plays as you scroll. If the frames are not
       present, it falls back to the earlier push-through on the still image. */
    const hero = $("#hero");
    const canvas = $("#dolly");
    const DOLLY = { count: 120, pad: 3, path: "assets/dolly/frame_", ext: ".jpg" };
    const DOLLY_SCROLL = Math.round(window.innerHeight * 2.2);
    const frameSrc = (i) => DOLLY.path + String(i + 1).padStart(DOLLY.pad, "0") + DOLLY.ext;

    const startDolly = (frames) => {
      hero.classList.add("has-dolly");
      const ctx = canvas.getContext("2d", { alpha: false });
      const state = { i: 0 };
      const draw = () => {
        const img = frames[Math.min(frames.length - 1, Math.max(0, Math.round(state.i)))];
        if (!img || !img.complete) return;
        const cw = canvas.width = canvas.clientWidth * devicePixelRatio;
        const ch = canvas.height = canvas.clientHeight * devicePixelRatio;
        const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        const w = img.naturalWidth * s, hh = img.naturalHeight * s;
        ctx.drawImage(img, (cw - w) / 2, (ch - hh) * 0.55, w, hh);
      };
      draw();
      window.addEventListener("resize", draw);
      gsap.timeline({
        scrollTrigger: { trigger: hero, start: "top top", end: "+=" + DOLLY_SCROLL, pin: true, scrub: 0.35, anticipatePin: 1 }
      })
        .to(state, { i: frames.length - 1, ease: "none", onUpdate: draw, duration: 1 }, 0)
        .to(".hero__content", { y: -120, opacity: 0, ease: "power1.in", duration: 0.35 }, 0)
        .to(".hero__meta", { y: -40, opacity: 0, ease: "power1.in", duration: 0.3 }, 0.05)
        .to(".hero__scroll", { opacity: 0, duration: 0.2 }, 0)
        .to(".hero__vignette", { opacity: 0.55, ease: "none", duration: 0.6 }, 0.1);
    };

    const fallbackPush = () => {
      gsap.timeline({
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
      })
        .to(".hero__media", { scale: 1.18, ease: "none" }, 0)
        .to(".hero__vignette", { opacity: 1.6, ease: "none" }, 0)
        .to(".hero__content", { y: -140, opacity: 0, ease: "power1.in" }, 0)
        .to(".hero__meta", { y: -60, opacity: 0, ease: "power1.in" }, 0.15);
    };

    /* Autoplay film: the curtain lifts, the dolly plays on its own, and the title lands
       as the camera settles near the elephant. Falls back to the scroll-scrubbed frames
       if the video cannot autoplay, and to the still on phones. */
    const film = $("#heroFilm");
    // Manual speed control: 1 = as encoded, 1.5 = fifty percent faster, 0.8 = slower.
    // Set per page with data-film-speed="1.2" on <section class="hero">, or change the default here.
    const FILM_SPEED = parseFloat(hero.dataset.filmSpeed) || 1;
    if (film) film.playbackRate = FILM_SPEED;
    const LAND_BEFORE_END = 1.6; // seconds before the end at which the type starts to land
    let filmStarted = false;
    const startFilm = () => new Promise((resolve, reject) => {
      if (!film || !window.matchMedia("(min-width: 761px)").matches) return reject();
      let landed = false;
      const land = () => { if (landed) return; landed = true; hero.classList.add("is-landed"); const c = $("#heroCaption"); if (c) c.classList.remove("is-on"); };
      hero.classList.add("has-film");
      // phrases that surface and fade as the camera moves; timed as fractions of the film so speed changes don't matter
      let caps = [];
      try { caps = JSON.parse(($("#filmCaptions") || {}).textContent || "[]"); } catch (e) {}
      const capEl = $("#heroCaption");
      let capIdx = -1;
      film.addEventListener("timeupdate", () => {
        if (!capEl || !film.duration) return;
        const p = film.currentTime / film.duration;
        const k = caps.findIndex((c) => p >= c[0] && p < c[1]);
        if (k === capIdx) return;
        capIdx = k;
        if (k < 0) { capEl.classList.remove("is-on"); return; }
        capEl.classList.remove("is-on");
        setTimeout(() => { capEl.innerHTML = caps[k][2]; capEl.classList.add("is-on"); }, 60);
      });
      film.addEventListener("timeupdate", () => {
        if (film.duration && film.currentTime >= film.duration - LAND_BEFORE_END) land();
      });
      film.addEventListener("ended", land);
      const skip = $("#heroSkip");
      if (skip) skip.addEventListener("click", () => { try { film.currentTime = Math.max(0, film.duration - 0.05); } catch (e) {} film.pause(); land(); });
      const p = film.play();
      (p && p.catch ? p : Promise.resolve()).then(() => { filmStarted = true; resolve(); }).catch(() => {
        hero.classList.remove("has-film"); reject();
      });
    });
    // begin as soon as the curtain has lifted (curtain lift is ~0.9 s after load)
    const kickoff = () => startFilm().catch(() => {
      if (canvas) { const probe = new Image(); probe.onload = () => startDollyFromProbe(probe); probe.onerror = fallbackPush; probe.src = frameSrc(0); }
      else fallbackPush();
    });
    if (document.readyState === "complete") setTimeout(kickoff, 1000); else window.addEventListener("load", () => setTimeout(kickoff, 1000));

    const startDollyFromProbe = (probe) => {
      const frames = [probe];
      let loaded = 1;
      for (let i = 1; i < DOLLY.count; i++) {
        const im = new Image();
        im.onload = () => { if (++loaded === DOLLY.count) ScrollTrigger.refresh(); };
        im.src = frameSrc(i);
        frames.push(im);
      }
      startDolly(frames);
    };


    /* 2. Three Acts: staggered clip reveal, then the route draws itself */
    const actsTl = gsap.timeline({
      scrollTrigger: { trigger: ".acts", start: "top 78%", once: true }
    });
    actsTl
      .to(".act__media", { clipPath: "inset(0% 0 0 0)", duration: 1.4, ease: "power4.out", stagger: 0.18 }, 0)
      .from(".act__media img", { scale: 1.25, duration: 2.2, ease: "power3.out", stagger: 0.18 }, 0)
      .to(".route__dot", { opacity: 1, duration: .5, stagger: .55 }, .9)
      .to(".route__line", { scaleX: 1, duration: 1.1, ease: "power2.inOut", stagger: .55 }, 1.0);

    /* 3. Falls chapter: image crossfades as each block reaches centre */
    const scenes = $$(".chapter__img");
    const blocks = $$(".chapter__block[data-scene]");
    const setScene = (i) => {
      scenes.forEach((img) => img.classList.toggle("is-active", +img.dataset.scene === i));
      blocks.forEach((b) => b.classList.toggle("is-dim", +b.dataset.scene !== i));
    };
    if (window.matchMedia("(min-width: 1241px)").matches) {
      blocks.forEach((b, i) => {
        ScrollTrigger.create({
          trigger: b, start: "top 60%", end: "bottom 40%",
          onEnter: () => setScene(i), onEnterBack: () => setScene(i)
        });
      });
    }

    /* 4. Kruger: pinned horizontal strip */
    ScrollTrigger.matchMedia({
      "(min-width: 1101px)": () => {
        const track = $(".gallery");
        const pin = $(".gallery-pin");
        if (!track || !pin) return;
        const distance = () => track.scrollWidth - window.innerWidth;
        const tween = gsap.to(track, {
          x: () => -distance(), ease: "none",
          scrollTrigger: {
            trigger: pin, start: "top top", end: () => "+=" + distance(),
            pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1
          }
        });
        // captions slide in as each panel crosses the viewport centre
        $$(".gallery__item").forEach((item) => {
          gsap.fromTo($("figcaption", item), { y: 14, opacity: 0 }, {
            y: 0, opacity: 1, duration: .8, ease: "power2.out",
            scrollTrigger: { trigger: item, containerAnimation: tween, start: "left 70%", toggleActions: "play none none reverse" }
          });
        });
      },
      "(max-width: 1100px)": () => { $(".gallery") && $(".gallery").classList.add("gallery--static"); }
    });

    /* 5. Itinerary: rail draws with scroll, each day lights as the line passes */
    const rail = $(".days__rail span");
    const days = $$(".day");
    if (rail && days.length) {
      gsap.to(rail, {
        height: "100%", ease: "none",
        scrollTrigger: { trigger: ".days-wrap", start: "top 65%", end: "bottom 55%", scrub: 0.4 }
      });
      days.forEach((d) => ScrollTrigger.create({
        trigger: d, start: "top 62%",
        onEnter: () => d.classList.add("is-lit"), onLeaveBack: () => d.classList.remove("is-lit")
      }));
    }

    /* 6. Kosher: background at 0.4x, card at 1x, border draws on entry */
    const kosherBg = $(".kosher__bg img");
    if (kosherBg) {
      gsap.fromTo(kosherBg, { yPercent: -12, scale: 1.25 }, {
        yPercent: 12, scale: 1.25, ease: "none",
        scrollTrigger: { trigger: ".kosher", start: "top bottom", end: "bottom top", scrub: true }
      });
      const card = $(".kosher__card");
      ScrollTrigger.create({ trigger: card, start: "top 75%", once: true, onEnter: () => card.classList.add("is-visible") });
    }

    /* 7. Quote: image settles from 1.15x to 1x while the text pulls into focus */
    const quoteBg = $(".quote__bg img");
    if (quoteBg) {
      gsap.fromTo(quoteBg, { scale: 1.18 }, {
        scale: 1.02, ease: "none",
        scrollTrigger: { trigger: ".quote", start: "top bottom", end: "bottom top", scrub: true }
      });
    }

    ScrollTrigger.refresh();
  }

  /* Footer year */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
