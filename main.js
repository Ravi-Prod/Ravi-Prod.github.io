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
