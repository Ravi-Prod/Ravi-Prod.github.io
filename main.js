(function () {
  var navbar = document.querySelector(".navbar");
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");

  function closeMenu() {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function () {
    var isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  links.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });

  function onScroll() {
    navbar.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // "Request the brochure": the brochure isn't a public download. These links
  // open the demo form with "Product brochure" chosen; the team sends it.
  function requestBrochure() {
    var interest = document.getElementById("cf-interest");
    var message = document.getElementById("cf-message");
    if (!interest) return;
    interest.value = "Product brochure";
    if (message && !message.value) {
      message.value = "Please send me the Nextosis Platform product brochure.";
    }
  }

  document.querySelectorAll("[data-request-brochure]").forEach(function (link) {
    link.addEventListener("click", function () {
      if (document.getElementById("cf-interest")) requestBrochure();
    });
  });

  if (/[?&]brochure=1(&|$)/.test(window.location.search)) requestBrochure();

  // Contact form: sent to Nextosis Platform (our own API), where it becomes
  // a sales lead. Sent in the background and the result shown inline;
  // without JavaScript the form posts normally and the API redirects to
  // thank-you.html.
  var form = document.getElementById("contactForm");
  if (form && window.fetch) {
    var status = document.getElementById("formStatus");
    var submit = form.querySelector(".form-submit");

    var showError = function (reason) {
      status.className = "form-status is-error";
      status.textContent = (reason ? reason + " " : "Sorry, your request could not be sent. ") + "You can also email ";
      var mail = document.createElement("a");
      mail.href = "mailto:info@nextosis.com";
      mail.textContent = "info@nextosis.com";
      status.appendChild(mail);
      status.appendChild(document.createTextNode(" or message us on WhatsApp."));
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      // Everything is sent, the spam trap too: the API decides, so a
      // person is never silently turned away.
      var data = {};
      new FormData(form).forEach(function (value, key) {
        data[key] = value;
      });

      submit.disabled = true;
      status.className = "form-status";
      status.textContent = "Sending…";

      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (response) {
          if (response.ok) {
            form.reset();
            status.className = "form-status is-success";
            status.textContent = "Thank you. Your request has been sent and our team will be in touch soon.";
            return;
          }

          // Say why: too many tries from this network, or a detail to fix.
          return response
            .json()
            .catch(function () {
              return {};
            })
            .then(function (body) {
              var reason =
                response.status === 429
                  ? "Several requests were sent from your network just now. Please wait 10 minutes and try again."
                  : (body && body.message) || "";
              showError(reason);
            });
        })
        .catch(function () {
          showError("");
        })
        .then(function () {
          submit.disabled = false;
        });
    });
  }

  // Highlight the nav link for the section currently in view (home page only).
  var sectionLinks = Array.prototype.filter.call(
    links.querySelectorAll('a[href^="#"]'),
    function (link) {
      return document.getElementById(link.getAttribute("href").slice(1));
    }
  );

  if (!sectionLinks.length || !("IntersectionObserver" in window)) return;

  var linkById = {};
  sectionLinks.forEach(function (link) {
    linkById[link.getAttribute("href").slice(1)] = link;
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(function (link) {
          link.classList.remove("is-active");
          link.removeAttribute("aria-current");
        });
        var active = linkById[entry.target.id];
        active.classList.add("is-active");
        active.setAttribute("aria-current", "location");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  Object.keys(linkById).forEach(function (id) {
    observer.observe(document.getElementById(id));
  });
})();

// Print buttons (no inline onclick: the Content-Security-Policy runs only this site's files).
document.querySelectorAll("[data-print]").forEach((button) => button.addEventListener("click", () => window.print()));

// Hero carousel: one product per slide, every 6 seconds; pauses on hover or
// focus and when the tab is hidden, never moves on its own for people who
// prefer reduced motion; arrows, dots, arrow keys and swipe.
(function () {
  const root = document.querySelector("[data-carousel]");
  if (!root) return;
  const slides = Array.from(root.querySelectorAll("[data-slide]"));
  const dots = Array.from(root.querySelectorAll("[data-dot]"));
  const url = root.querySelector("[data-carousel-url]");
  const title = root.querySelector("[data-carousel-title]");
  const line = root.querySelector("[data-carousel-line]");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = 0;
  let timer = null;
  let paused = false;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === current);
      slide.setAttribute("aria-hidden", i === current ? "false" : "true");
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === current);
      if (i === current) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    const slide = slides[current];
    url.textContent = slide.dataset.url;
    title.textContent = slide.dataset.title;
    line.textContent = slide.dataset.line;
  }

  function start() {
    if (still || paused || document.hidden) return;
    stop();
    timer = window.setInterval(() => show(current + 1), 6000);
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function go(index) {
    show(index);
    start();
  }

  root.querySelector("[data-prev]").addEventListener("click", () => go(current - 1));
  root.querySelector("[data-next]").addEventListener("click", () => go(current + 1));
  dots.forEach((dot) => dot.addEventListener("click", () => go(Number(dot.dataset.dot))));

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") go(current - 1);
    if (event.key === "ArrowRight") go(current + 1);
  });

  const pause = () => { paused = true; stop(); };
  const resume = () => { paused = false; start(); };
  root.addEventListener("mouseenter", pause);
  root.addEventListener("mouseleave", resume);
  root.addEventListener("focusin", pause);
  root.addEventListener("focusout", resume);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  let touchX = null;
  const track = root.querySelector(".carousel-track");
  track.addEventListener("touchstart", (event) => { touchX = event.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", (event) => {
    if (touchX === null) return;
    const dx = event.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
  });

  start();
})();
