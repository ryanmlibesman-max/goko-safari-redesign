/* GoKo Safari — homepage behaviours (filters, reviews slider, modal, plan form) */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Package filters ---------- */
  const filters = $("#filters");
  const grid = $("#packageGrid");
  const empty = $("#packagesEmpty");
  const state = { dest: "all", nights: "all", style: "all" };

  const nightsMatch = (n, range) => {
    if (range === "all") return true;
    if (range === "11+") return n >= 11;
    const [lo, hi] = range.split("-").map(Number);
    return n >= lo && n <= hi;
  };

  const apply = () => {
    let shown = 0;
    $$(".pkg", grid).forEach((p) => {
      const ok =
        (state.dest === "all" || p.dataset.dest.split(" ").includes(state.dest)) &&
        nightsMatch(+p.dataset.nights, state.nights) &&
        (state.style === "all" || p.dataset.style.split(" ").includes(state.style));
      p.classList.toggle("is-hidden", !ok);
      if (ok) shown++;
    });
    empty.classList.toggle("is-shown", shown === 0);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };

  const setChip = (group, value) => {
    const wrap = $(`[data-group="${group}"]`, filters);
    if (!wrap) return;
    $$(".chip", wrap).forEach((c) => c.classList.toggle("is-on", c.dataset.v === value));
    state[group] = value;
    apply();
  };

  if (filters && grid) {
    filters.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      setChip(chip.parentElement.dataset.group, chip.dataset.v);
    });
    // destination cards + "Travel, your way" tiles pre-filter the packages
    $$("[data-filter-dest]").forEach((a) => a.addEventListener("click", () => setChip("dest", a.dataset.filterDest)));
    $$(".way[data-style]").forEach((a) => a.addEventListener("click", () => setChip("style", a.dataset.style)));
  }

  /* ---------- Reviews slider ---------- */
  const slider = $("#reviewSlider");
  if (slider) {
    const slides = $$(".slide", slider);
    const dots = $("#reviewDots");
    let i = 0, timer;
    slides.forEach((_, k) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", `Review ${k + 1}`);
      b.addEventListener("click", () => go(k, true));
      dots.appendChild(b);
    });
    const go = (k, manual) => {
      i = (k + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === i));
      $$("button", dots).forEach((d, n) => d.classList.toggle("is-on", n === i));
      if (manual) restart();
    };
    const restart = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 7000); };
    $$(".slider__btn", slider).forEach((b) => b.addEventListener("click", () => go(i + +b.dataset.dir, true)));
    go(0); restart();
  }

  /* ---------- "Africa is calling" modal ---------- */
  const modal = $("#modal");
  if (modal) {
    const KEY = "goko-modal-dismissed";
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === "1"; } catch (e) {}
    const open = () => { modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false"); };
    const close = () => {
      modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true");
      try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    };
    if (!seen) setTimeout(open, 9000);
    $("#modalClose").addEventListener("click", close);
    $("#modalCta").addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) close(); });
  }

  /* ---------- Plan form (front-end only) ---------- */
  const form = $("#planForm");
  if (form) {
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      let ok = true;
      $$(".field", form).forEach((f) => {
        const input = $("input, select, textarea", f);
        if (!input) return;
        const bad = (input.hasAttribute("required") && !input.value.trim())
          || (input.type === "email" && input.value && !/^\S+@\S+\.\S+$/.test(input.value));
        f.classList.toggle("is-invalid", bad);
        if (bad) ok = false;
      });
      if (!ok) return;
      const success = $("#formSuccess");
      success.hidden = false;
      form.reset();
      success.scrollIntoView({ behavior: "smooth", block: "center" });
      // Wire to email service / CRM here. FormData(form) carries every field including the package checkboxes.
    });
  }
})();
