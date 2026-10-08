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

  // Contact form: send in the background and show the result inline.
  // Without JavaScript the form posts normally and FormSubmit redirects to thank-you.html.
  var form = document.getElementById("contactForm");
  if (form && window.fetch) {
    var status = document.getElementById("formStatus");
    var submit = form.querySelector(".form-submit");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (form._honey.value) return;

      var data = {};
      new FormData(form).forEach(function (value, key) {
        if (key !== "_next" && key !== "_honey") data[key] = value;
      });

      submit.disabled = true;
      status.className = "form-status";
      status.textContent = "Sending…";

      fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (result) {
          if (String(result.success) !== "true") throw new Error(result.message);
          form.reset();
          status.className = "form-status is-success";
          status.textContent = "Thank you. Your request has been sent and our team will be in touch soon.";
        })
        .catch(function () {
          status.className = "form-status is-error";
          status.innerHTML =
            'Sorry, your request could not be sent. Please email <a href="mailto:info@bgtechsystems.com">info@bgtechsystems.com</a> or message us on WhatsApp.';
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
