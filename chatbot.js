// Website chat assistant. Answers product questions from what this site
// says, helps a visitor pick the right product, and books a demo or a
// quote: the details go to the same endpoint as the contact form, where
// they become a sales lead. Everything runs in the browser; nothing is
// sent anywhere until the visitor agrees and submits their details.
(function () {
  var ENDPOINT = "https://api.nextosis.com/api/v1/public/enquiries";
  var WHATSAPP = "https://wa.me/919743876871?text=" + encodeURIComponent("Hi Nextosis, I'd like to know more about Nextosis Platform.");
  var EMAIL = "info@nextosis.com";
  var STORE = "nextosis-chat";

  var PRODUCTS = {
    clinic: {
      name: "Nextosis Clinic",
      text: "Nextosis Clinic runs an outpatient clinic: patient registration, appointments, triage and vitals, doctor consultations, e-prescriptions, lab orders and results, pharmacy, and billing.",
      link: "#nextosis-clinic"
    },
    hospital: {
      name: "Nextosis Hospital",
      text: "Nextosis Hospital covers inpatient care: admissions, wards, rooms and beds, bed transfers, doctor rounds, nursing charts, medication administration, discharge summaries, and nurse rostering.",
      link: "#nextosis-hospital"
    },
    queue: {
      name: "Nextosis Queue",
      text: "Nextosis Queue is token-based queue management for hospitals, banks and government service centres: self-service kiosks, counter and display screens with voice calling, priority for senior citizens, patient flow routing, and wait-time estimates.",
      link: "#nextosis-queue"
    },
    secure: {
      name: "Nextosis Secure",
      text: "Nextosis Secure connects your on-site NVRs, cameras and access controllers through a secure, outbound-only Site Agent. It includes video analytics, number plate recognition, occupancy and traffic counts, alarms, incidents, and guard patrols with checkpoint scanning.",
      link: "#nextosis-secure"
    },
    visitor: {
      name: "Nextosis Visitor",
      text: "Nextosis Visitor handles visitor registration, digital passes, access groups and schedules, and vehicle entry and presence tracking at the gate.",
      link: "#nextosis-visitor"
    },
    workforce: {
      name: "Nextosis Workforce",
      text: "Nextosis Workforce takes staff attendance from biometric terminals and GPS check-in on the mobile app, with face verification, field duty tracking, shifts, holidays and leave across departments and locations.",
      link: "#nextosis-workforce",
      form: "Nextosis Workforce (HR attendance)"
    },
    inventory: {
      name: "Nextosis Asset & Inventory",
      text: "Nextosis Asset & Inventory manages stock across warehouses: suppliers, purchases, goods receipts, batch tracking, stock transfers and adjustments.",
      link: "#nextosis-asset-inventory"
    },
    ai: {
      name: "Nextosis AI & Integration",
      text: "Nextosis AI & Integration adds OCR and document processing, AI chat over your own knowledge base, and predictions, with open integration through REST APIs, API keys, webhooks, HL7, FHIR and MQTT.",
      link: "#nextosis-ai-integration"
    },
    mobile: {
      name: "Nextosis Mobile",
      text: "Nextosis Mobile is the Android and iPhone app for staff, with Face ID and fingerprint unlock, role-based home screens, GPS attendance, and a mobile Doctor Desk.",
      link: "#nextosis-mobile",
      form: "Not sure yet"
    }
  };

  // Free-text questions: the topic whose words match best answers.
  var TOPICS = [
    { words: ["product", "products", "offer", "modules", "what do you", "solutions"], reply: "products" },
    { words: ["clinic", "opd", "outpatient", "prescription", "doctor", "consultation", "emr", "pharmacy", "billing", "lab"], product: "clinic" },
    { words: ["hospital", "inpatient", "ipd", "admission", "ward", "bed", "nursing", "discharge"], product: "hospital" },
    { words: ["queue", "token", "kiosk", "display", "counter", "waiting", "bank", "calling"], product: "queue" },
    { words: ["cctv", "camera", "nvr", "security", "access control", "alarm", "patrol", "guard", "anpr", "number plate", "video"], product: "secure" },
    { words: ["visitor", "gate pass", "pass", "vehicle", "gate"], product: "visitor" },
    { words: ["attendance", "biometric", "hr", "staff", "employee", "leave", "shift", "gps", "face"], product: "workforce" },
    { words: ["inventory", "stock", "warehouse", "purchase", "supplier", "asset", "batch"], product: "inventory" },
    { words: ["ai", "ocr", "api", "integration", "hl7", "fhir", "webhook", "mqtt", "integrate"], product: "ai" },
    { words: ["app", "mobile", "android", "iphone", "ios"], product: "mobile" },
    { words: ["price", "pricing", "cost", "quote", "rate", "charges", "how much", "fee", "license", "licence"], reply: "pricing" },
    { words: ["cloud", "saas", "on-prem", "on premise", "on-premises", "own server", "install", "hosting", "deploy", "offline"], reply: "deploy" },
    { words: ["secure", "data", "privacy", "encryption", "safe", "dpdp", "gdpr", "two-step", "2fa", "backup"], reply: "trust" },
    { words: ["demo", "trial", "try", "see it", "walkthrough", "presentation"], reply: "demo" },
    { words: ["brochure", "pdf", "document", "catalogue", "catalog"], reply: "brochure" },
    { words: ["hardware", "device", "biometric terminal", "printer", "tv", "screen"], reply: "hardware" },
    { words: ["custom", "customise", "customize", "develop", "new module", "report"], reply: "custom" },
    { words: ["support", "training", "implementation", "go-live", "go live", "setup", "migration"], reply: "support" },
    { words: ["contact", "call", "phone", "email", "whatsapp", "talk", "human", "person", "someone"], reply: "contact" },
    { words: ["hi", "hello", "hey", "namaste", "good morning", "good evening"], reply: "hello" }
  ];

  var FITS = [
    { label: "Clinic", products: ["clinic", "queue", "workforce"] },
    { label: "Hospital", products: ["hospital", "clinic", "queue", "secure"] },
    { label: "Bank or government office", products: ["queue", "secure", "visitor"] },
    { label: "Corporate office or campus", products: ["visitor", "secure", "workforce"] },
    { label: "Warehouse or factory", products: ["inventory", "workforce", "secure"] },
    { label: "Gated community", products: ["visitor", "secure"] },
    { label: "Something else", products: [] }
  ];

  var MAIN_CHIPS = ["Products", "Which product fits me?", "Cloud or own servers?", "Security & data", "Pricing", "Book a demo", "WhatsApp us"];

  // ---- State ---------------------------------------------------------

  var state = load() || { log: [], lead: null, topic: null };

  function load() {
    try {
      var saved = sessionStorage.getItem(STORE);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  function save() {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ log: state.log.slice(-60), lead: state.lead, topic: state.topic }));
    } catch (e) {
      // Private window: the chat just isn't remembered between pages.
    }
  }

  // ---- DOM -------------------------------------------------------------

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "text") node.textContent = attrs[key];
      else if (key === "class") node.className = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  var launcher = el("button", {
    class: "chat-launcher",
    type: "button",
    "aria-expanded": "false",
    "aria-controls": "chatPanel",
    "aria-label": "Ask us: chat with the Nextosis assistant"
  });
  launcher.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></svg><span>Ask us</span>';

  var log = el("div", { class: "chat-log", role: "log", "aria-live": "polite", "aria-label": "Conversation" });
  var chips = el("div", { class: "chat-chips", role: "group", "aria-label": "Suggestions" });
  var input = el("input", { class: "chat-input", type: "text", "aria-label": "Type your question", placeholder: "Type your question…", autocomplete: "off", maxlength: "500" });
  var send = el("button", { class: "chat-send", type: "submit", "aria-label": "Send" });
  send.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>';
  var composer = el("form", { class: "chat-composer" }, [input, send]);
  var close = el("button", { class: "chat-close", type: "button", "aria-label": "Close the chat" });
  close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var restart = el("button", { class: "chat-restart", type: "button", text: "Start over" });

  var panel = el("section", { class: "chat-panel", id: "chatPanel", role: "dialog", "aria-modal": "false", "aria-labelledby": "chatTitle", hidden: "" }, [
    el("header", { class: "chat-header" }, [
      el("div", {}, [el("h2", { id: "chatTitle", text: "Nextosis assistant" }), el("p", { text: "Product questions, demos and quotes" })]),
      restart,
      close
    ]),
    log,
    chips,
    composer,
    el("p", { class: "chat-note" }, [
      document.createTextNode("Automated answers from this website. "),
      el("a", { href: "privacy-policy.html", text: "Privacy" })
    ])
  ]);

  document.body.appendChild(panel);
  document.body.appendChild(launcher);

  function bubble(from, text, link) {
    var node = el("div", { class: "chat-msg chat-" + from });
    node.appendChild(el("p", { text: text }));
    if (link) node.appendChild(el("a", { href: link.href, text: link.text, target: link.external ? "_blank" : "_self", rel: link.external ? "noopener" : "" }));
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
  }

  function say(text, link) {
    state.log.push({ from: "bot", text: text, link: link || null });
    bubble("bot", text, link);
    save();
  }

  function heard(text) {
    state.log.push({ from: "me", text: text });
    bubble("me", text);
    save();
  }

  function offer(list) {
    chips.innerHTML = "";
    (list || []).forEach(function (label) {
      var chip = el("button", { type: "button", class: "chat-chip", text: label });
      chip.addEventListener("click", function () {
        handle(label);
      });
      chips.appendChild(chip);
    });
  }

  // ---- Conversation ----------------------------------------------------

  function greet() {
    say("Hi! I can tell you about Nextosis products, help you find the right one for your organization, or arrange a demo.");
    offer(MAIN_CHIPS);
  }

  function describe(key) {
    var p = PRODUCTS[key];
    state.topic = key;
    say(p.text, { href: p.link, text: "Read more about " + p.name });
    offer(["Book a demo of " + p.name, "Get a quote", "Which product fits me?", "Products"]);
  }

  function reply(kind) {
    switch (kind) {
      case "products":
        say(
          "Nextosis Platform has products that work together on one secure core: Clinic, Hospital, Queue, Secure (CCTV, access control, patrols), Visitor, Workforce (attendance), Asset & Inventory, AI & Integration, and a mobile app. Which would you like to know about?"
        );
        offer(["Clinic", "Hospital", "Queue", "Secure", "Visitor", "Workforce", "Inventory", "AI & Integration", "Mobile app"]);
        return;
      case "fit":
        say("What kind of organization is it for?");
        offer(FITS.map(function (f) { return f.label; }));
        return;
      case "pricing":
        say(
          "Prices depend on the products you need, the number of users, sites and devices, and whether you choose our cloud (SaaS) or your own servers. Share a few details and our team will send you a quote."
        );
        offer(["Get a quote", "Book a demo", "WhatsApp us"]);
        return;
      case "deploy":
        say(
          "Both. You can use Nextosis Platform as SaaS on our cloud, or install it on your own servers (on-premises). On-site devices like CCTV recorders, access controllers and biometric terminals connect through a Site Agent that only makes outbound connections, so no ports need opening."
        );
        offer(["Security & data", "Book a demo", "Products"]);
        return;
      case "trust":
        say(
          "Security is built into the core: all traffic over HTTPS, sensitive data encrypted at rest, two-step sign-in, account lockout, role-based permissions for every screen and action, an audit trail, and each organization's records kept separate.",
          { href: "#security", text: "Read about security" }
        );
        offer(["Cloud or own servers?", "Book a demo", "Products"]);
        return;
      case "demo":
        startLead("demo");
        return;
      case "quote":
        startLead("quote");
        return;
      case "brochure":
        say("The brochure is sent on request. I can take your details now and our team will email it to you.");
        offer(["Send me the brochure", "Products"]);
        return;
      case "hardware":
        say(
          "We connect the hardware you already run, or help you choose it: CCTV recorders and cameras, access controllers, biometric attendance terminals, token kiosks and printers, and display screens."
        );
        offer(["Secure", "Queue", "Workforce", "Book a demo"]);
        return;
      case "custom":
        say("Yes. We configure the platform to how you work, and build new modules, reports and integrations when you need something extra.");
        offer(["Get a quote", "Book a demo", "WhatsApp us"]);
        return;
      case "support":
        say(
          "We set up your organization, departments, roles and workflows, migrate your data, train your staff, and provide maintenance, monitoring and support after go-live."
        );
        offer(["Book a demo", "Get a quote", "Products"]);
        return;
      case "contact":
        say("You can WhatsApp or call us on +91 97438 76871, or email " + EMAIL + ".", { href: WHATSAPP, text: "Open WhatsApp", external: true });
        offer(["Book a demo", "Products"]);
        return;
      case "hello":
        say("Hello! What would you like to know?");
        offer(MAIN_CHIPS);
        return;
      default:
        say(
          "I'm not sure about that one. Our team can answer it: leave your details and we'll get back to you, or message us on WhatsApp.",
          { href: WHATSAPP, text: "Open WhatsApp", external: true }
        );
        offer(["Ask the team", "Products", "Book a demo"]);
    }
  }

  function normalize(text) {
    return " " + text.toLowerCase().replace(/[^a-z0-9&\- ]+/g, " ").replace(/\s+/g, " ").trim() + " ";
  }

  function understand(text) {
    var t = normalize(text);
    var best = null;
    var bestScore = 0;
    TOPICS.forEach(function (topic) {
      var score = 0;
      topic.words.forEach(function (w) {
        if (t.indexOf(" " + w + " ") >= 0 || (w.length > 4 && t.indexOf(w) >= 0)) score += w.split(" ").length;
      });
      if (score > bestScore) {
        bestScore = score;
        best = topic;
      }
    });
    return best;
  }

  var CHIP_ACTIONS = {
    "products": function () { reply("products"); },
    "which product fits me?": function () { reply("fit"); },
    "cloud or own servers?": function () { reply("deploy"); },
    "security & data": function () { reply("trust"); },
    "pricing": function () { reply("pricing"); },
    "book a demo": function () { reply("demo"); },
    "get a quote": function () { reply("quote"); },
    "ask the team": function () { startLead("question"); },
    "send me the brochure": function () { startLead("brochure"); },
    "whatsapp us": function () { reply("contact"); },
    "clinic": function () { describe("clinic"); },
    "hospital": function () { describe("hospital"); },
    "queue": function () { describe("queue"); },
    "secure": function () { describe("secure"); },
    "visitor": function () { describe("visitor"); },
    "workforce": function () { describe("workforce"); },
    "inventory": function () { describe("inventory"); },
    "ai & integration": function () { describe("ai"); },
    "mobile app": function () { describe("mobile"); }
  };

  function handle(text) {
    var value = text.trim();
    if (!value) return;
    heard(value);
    offer([]);

    if (state.lead) {
      leadStep(value);
      return;
    }

    var key = value.toLowerCase();
    if (CHIP_ACTIONS[key]) {
      CHIP_ACTIONS[key]();
      return;
    }

    if (/^book a demo of /i.test(value)) {
      startLead("demo");
      return;
    }

    var fit = FITS.filter(function (f) { return f.label.toLowerCase() === key; })[0];
    if (fit) {
      if (!fit.products.length) {
        say("Nextosis Platform serves organizations that look after many people every day. Tell our team what you need and we'll suggest the right setup.");
        offer(["Ask the team", "Products"]);
        return;
      }
      state.topic = fit.products[0];
      say(
        "For a " + fit.label.toLowerCase() + ", these usually fit best: " +
          fit.products.map(function (k) { return PRODUCTS[k].name; }).join(", ") + ". Want to know more about one of them?"
      );
      offer(fit.products.map(function (k) { return chipFor(k); }).concat(["Book a demo"]));
      return;
    }

    var topic = understand(value);
    if (topic && topic.product) describe(topic.product);
    else reply(topic ? topic.reply : null);
  }

  function chipFor(key) {
    return { clinic: "Clinic", hospital: "Hospital", queue: "Queue", secure: "Secure", visitor: "Visitor", workforce: "Workforce", inventory: "Inventory", ai: "AI & Integration", mobile: "Mobile app" }[key];
  }

  // ---- Demo / quote: collecting details --------------------------------

  var STEPS = ["name", "organization", "email", "phone", "consent"];

  function startLead(kind) {
    // Only what was asked before this point goes with the request.
    state.lead = { kind: kind, step: 0, data: {}, asked: state.log.length };
    var opening = {
      demo: "Great, let's book a demo. ",
      quote: "Sure, let's get you a quote. ",
      brochure: "I'll get the brochure to you. ",
      question: "I'll pass your question to the team. "
    }[kind];
    say(opening + "What's your name?");
    offer(["Cancel"]);
    save();
  }

  function leadStep(value) {
    var lead = state.lead;
    if (value.toLowerCase() === "cancel" || value.toLowerCase() === "no thanks") {
      state.lead = null;
      save();
      say("No problem. Anything else I can help with?");
      offer(MAIN_CHIPS);
      return;
    }

    var step = STEPS[lead.step];
    if (step === "name") {
      lead.data.name = value.slice(0, 200);
      say("Thanks, " + lead.data.name.split(" ")[0] + ". Which organization are you from?");
      offer(["Skip", "Cancel"]);
    } else if (step === "organization") {
      lead.data.organization = value.toLowerCase() === "skip" ? "" : value.slice(0, 200);
      say("What's your work email? We'll send the details there.");
      offer(["Cancel"]);
    } else if (step === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        say("That doesn't look like an email address. Could you check it?");
        offer(["Cancel"]);
        return;
      }
      lead.data.email = value.slice(0, 200);
      say("And a mobile number, if you'd like a call or WhatsApp? (optional)");
      offer(["Skip", "Cancel"]);
    } else if (step === "phone") {
      if (value.toLowerCase() !== "skip") {
        var digits = value.replace(/\D/g, "");
        if (digits.length < 10 || digits.length > 13) {
          say("Please enter a 10-digit mobile number, or press Skip.");
          offer(["Skip", "Cancel"]);
          return;
        }
        lead.data.phone = value.slice(0, 30);
      }
      if (lead.kind === "question") {
        lead.step++;
        say("What would you like to ask the team?");
        offer(["Cancel"]);
        lead.awaitingQuestion = true;
        save();
        return;
      }
      askConsent();
      return;
    } else if (step === "consent") {
      if (lead.awaitingQuestion) {
        lead.data.question = value.slice(0, 2000);
        lead.awaitingQuestion = false;
        save();
        askConsent(true);
        return;
      }
      if (/^(i agree|agree|yes|ok|okay|sure)\b/i.test(value)) submitLead();
      else {
        say("I can only send your details with your agreement. You can also reach us directly.", { href: WHATSAPP, text: "Open WhatsApp", external: true });
        state.lead = null;
        offer(MAIN_CHIPS);
      }
      save();
      return;
    }
    lead.step++;
    save();
  }

  function askConsent(already) {
    if (!already) state.lead.step = STEPS.indexOf("consent");
    say(
      "Can Nextosis Technologies use these details to contact you about your request? We keep them as described in our privacy policy.",
      { href: "privacy-policy.html", text: "Privacy policy" }
    );
    offer(["I agree, send", "No thanks"]);
    save();
  }

  function submitLead() {
    var lead = state.lead;
    var product = state.topic && PRODUCTS[state.topic] ? PRODUCTS[state.topic].form || PRODUCTS[state.topic].name : "Not sure yet";
    var what = {
      demo: "Please arrange a demo.",
      quote: "Please send a quote.",
      brochure: "Please send me the Nextosis Platform product brochure.",
      question: lead.data.question || "I have a question."
    }[lead.kind];
    var asked = state.log
      .slice(0, lead.asked)
      .filter(function (m) { return m.from === "me"; })
      .map(function (m) { return m.text; })
      .slice(0, 12)
      .join(" | ");
    var body = {
      name: lead.data.name,
      organization: lead.data.organization || "",
      email: lead.data.email,
      phone: lead.data.phone || "",
      interested_in: lead.kind === "brochure" ? "Product brochure" : product,
      deployment: "",
      message: (what + " (Sent from the website chat.)" + (asked ? " Chat: " + asked : "")).slice(0, 3900),
      consent: "Given"
    };

    say("Sending…");
    offer([]);
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body)
    })
      .then(function (response) {
        if (response.ok) {
          state.lead = null;
          say(
            "Done! Thank you, " + body.name.split(" ")[0] + ". Our team will be in touch soon at " + body.email + ". For anything urgent, WhatsApp us.",
            { href: WHATSAPP, text: "Open WhatsApp", external: true }
          );
          offer(["Products", "Security & data"]);
          save();
          return;
        }
        return response
          .json()
          .catch(function () { return {}; })
          .then(function (data) {
            failed(
              response.status === 429
                ? "Several requests were sent from your network just now. Please wait 10 minutes and try again."
                : (data && data.message) || ""
            );
          });
      })
      .catch(function () {
        failed("");
      });
  }

  function failed(reason) {
    say((reason ? reason + " " : "Sorry, that didn't go through. ") + "You can try again, email " + EMAIL + ", or WhatsApp us.", {
      href: WHATSAPP,
      text: "Open WhatsApp",
      external: true
    });
    offer(["I agree, send", "Cancel"]);
  }

  // ---- Open / close ------------------------------------------------------

  function open() {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    document.body.classList.add("chat-open");
    if (!log.childNodes.length) {
      if (state.log.length) {
        state.log.forEach(function (m) { bubble(m.from, m.text, m.link); });
        offer(state.lead ? ["Cancel"] : MAIN_CHIPS);
      } else greet();
    }
    input.focus();
  }

  function shut() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    document.body.classList.remove("chat-open");
    launcher.focus();
  }

  launcher.addEventListener("click", function () {
    if (panel.hidden) open();
    else shut();
  });
  close.addEventListener("click", shut);
  restart.addEventListener("click", function () {
    state = { log: [], lead: null, topic: null };
    log.innerHTML = "";
    save();
    greet();
    input.focus();
  });
  panel.addEventListener("keydown", function (event) {
    if (event.key === "Escape") shut();
  });
  composer.addEventListener("submit", function (event) {
    event.preventDefault();
    var text = input.value;
    input.value = "";
    handle(text);
  });

  // Links to the demo form elsewhere can open the chat instead.
  document.querySelectorAll("[data-open-chat]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      open();
    });
  });
})();
