(function () {
  document.documentElement.classList.add("has-js");

  const body = document.body;
  const root = document.documentElement;

  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  function getAssetBase() {
    const scriptEl = document.querySelector('script[src$="script.js"]');
    const scriptSrc = scriptEl instanceof HTMLScriptElement ? scriptEl.src : "";
    if (!scriptSrc) return "";
    return scriptSrc.slice(0, scriptSrc.lastIndexOf("/") + 1) + "assets/";
  }

  function runWhenIdle(callback, timeout) {
    const safeTimeout = Number.isFinite(timeout) ? Number(timeout) : 1800;
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(function () {
        callback();
      }, { timeout: safeTimeout });
      return;
    }
    window.setTimeout(callback, safeTimeout);
  }

  const navToggle = document.getElementById("nav-toggle");
  const siteNav = document.getElementById("site-nav");
  const compactNavBreakpoint = 700;
  const heroIntroRoot = document.querySelector(".home-hero-main");
  const heroSliderSlides = Array.from(document.querySelectorAll(".home-hero-slider__slide")).filter(function (slide) {
    return slide instanceof HTMLElement;
  });
  const HERO_SLIDE_HOLD_MS = 2500;
  const HERO_SLIDE_FADE_MS = 1000;
  const exploreIntroRoot = document.querySelector(".home-explore");
  const offersIntroRoot = document.querySelector(".home-offers");
  const prefersReducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let heroIntroPlayed = false;
  let heroSliderIndex = 0;
  let heroSliderRunning = false;
  let heroSliderHoldTimer = 0;
  let heroSliderFadeInTimer = 0;
  let heroSliderCompleteTimer = 0;
  let exploreIntroPlayed = false;
  let exploreIntroObserver = null;
  let exploreCardObservers = [];
  let exploreRefreshTimer = 0;
  let offersCardObservers = [];

  if (exploreIntroRoot instanceof HTMLElement) {
    if (window.innerWidth > 700) {
      exploreIntroRoot.classList.add("is-intro-pending");
    } else {
      exploreIntroRoot.classList.add("is-mobile-intro");
    }
  }

  if (offersIntroRoot instanceof HTMLElement) {
    offersIntroRoot.classList.add("is-intro-pending");
  }

  const serviceCatalogItems = [
    { slug: "assist-access-maintain-employment", label: "Assist Access / Maintain Employment" },
    { slug: "assist-life-stage-transition", label: "Assist-Life Stage, Transition" },
    { slug: "assist-personal-activities", label: "Assist-Personal Activities" },
    { slug: "assist-travel-transport", label: "Assist-Travel / Transport" },
    { slug: "community-nursing-care", label: "Community Nursing Care" },
    { slug: "daily-tasks-shared-living", label: "Daily Tasks / Shared Living" },
    { slug: "innovative-community-participation", label: "Innovative Community Participation" },
    { slug: "development-life-skills", label: "Development-Life Skills" },
    { slug: "household-tasks", label: "Household Tasks" },
    { slug: "participate-community", label: "Participate Community" },
    { slug: "specialised-support-employment", label: "Specialised Support Employment" },
    { slug: "group-centre-activities", label: "Group / Centre Activities" }
  ];
  const primaryServiceSlug = serviceCatalogItems[0] ? serviceCatalogItems[0].slug : "";

  function setupServicesDropdown() {
    if (!(siteNav instanceof HTMLElement)) return;
    if (siteNav.querySelector(".site-nav__services-dropdown")) return;

    const servicesLink = Array.from(siteNav.children).find(function (item) {
      return item instanceof HTMLAnchorElement && (item.textContent || "").trim() === "Services";
    });
    if (!(servicesLink instanceof HTMLAnchorElement)) return;

    const servicesHref = servicesLink.getAttribute("href") || "./services/";
    const cleanServicesHref = servicesHref.replace(/#.*$/, "");

    const dropdown = document.createElement("div");
    dropdown.className = "site-nav__services-dropdown";

    const trigger = document.createElement("a");
    trigger.className = "site-nav__services-trigger";
    trigger.href = primaryServiceSlug ? cleanServicesHref + primaryServiceSlug + "/" : cleanServicesHref;
    if (servicesLink.getAttribute("aria-current") === "page") {
      trigger.setAttribute("aria-current", "page");
    }
    trigger.innerHTML =
      '<span>Services</span><span class="site-nav__services-arrow" aria-hidden="true">&gt;</span>';

    const menu = document.createElement("div");
    menu.className = "site-nav__services-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Services menu");

    serviceCatalogItems.forEach(function (service) {
      const itemLink = document.createElement("a");
      itemLink.className = "site-nav__services-option";
      itemLink.href = cleanServicesHref + service.slug + "/";
      itemLink.textContent = service.label;
      itemLink.setAttribute("role", "menuitem");
      menu.appendChild(itemLink);
    });

    dropdown.appendChild(trigger);
    dropdown.appendChild(menu);
    servicesLink.replaceWith(dropdown);

    trigger.addEventListener("click", function (event) {
      if (window.innerWidth > compactNavBreakpoint) return;
      if (!dropdown.classList.contains("is-open")) {
        event.preventDefault();
        dropdown.classList.add("is-open");
      }
    });

    dropdown.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      dropdown.classList.remove("is-open");
      trigger.focus();
    });

    document.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (dropdown.contains(target)) return;
      dropdown.classList.remove("is-open");
    });
  }

  function setupLanguageSwitcher() {
    if (!(siteNav instanceof HTMLElement) || !body) return;
    if (siteNav.querySelector(".language-switcher")) return;

    const LANGUAGE_STORAGE_KEY = "ndisCarerLanguage";
    const assetBase = getAssetBase();
    const languageOptions = [
      { code: "en", label: "English", flagFile: "languages/australia.png" },
      { code: "zh-CN", label: "Chinese", flagFile: "languages/china.png" },
      { code: "ar", label: "Arabic", flagFile: "languages/saudi_arabia.png" },
      { code: "it", label: "Italian", flagFile: "languages/italy.png" },
      { code: "fr", label: "French", flagFile: "languages/france.png" },
      { code: "el", label: "Greek", flagFile: "languages/greece.png" },
      { code: "hi", label: "Hindi", flagFile: "languages/india.png" },
      { code: "es", label: "Spanish", flagFile: "languages/spain.png" },
      { code: "vi", label: "Vietnamese", flagFile: "languages/vietnam.png" },
      { code: "ne", label: "Nepali", flagFile: "languages/nepal.png" }
    ];
    const translationCache = new Map();
    const textEntries = [];
    const placeholderEntries = [];
    let translationPrepared = false;

    function isTextTranslatable(value) {
      const text = (value || "").replace(/\s+/g, " ").trim();
      if (!text) return false;
      if (text.includes("@")) return false;
      if (/^https?:\/\//i.test(text)) return false;
      if (/^[\d\s()+\-|/.,:%]+$/.test(text)) return false;
      if (text.length < 2) return false;
      return true;
    }

    function wrapTranslatedText(original, translatedCore) {
      const leading = (original.match(/^\s*/) || [""])[0];
      const trailing = (original.match(/\s*$/) || [""])[0];
      return leading + translatedCore + trailing;
    }

    function collectTranslatableContent() {
      if (translationPrepared) return;
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest("script, style, noscript, code, pre, textarea, [data-no-translate]")) {
            return NodeFilter.FILTER_REJECT;
          }
          if (!isTextTranslatable(node.nodeValue || "")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      let current = walker.nextNode();
      while (current) {
        textEntries.push({
          node: current,
          original: current.nodeValue || ""
        });
        current = walker.nextNode();
      }

      document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach(function (field) {
        if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
        if (field.closest("[data-no-translate]")) return;
        const placeholder = field.getAttribute("placeholder") || "";
        if (!isTextTranslatable(placeholder)) return;
        placeholderEntries.push({
          element: field,
          original: placeholder
        });
      });
      translationPrepared = true;
    }

    function ensureTranslationData() {
      if (translationPrepared) return;
      collectTranslatableContent();
    }

    function extractTranslatedText(data) {
      if (!Array.isArray(data) || !Array.isArray(data[0])) return "";
      return data[0]
        .map(function (chunk) {
          return Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : "";
        })
        .join("");
    }

    async function translateText(value, langCode) {
      const normalized = (value || "").trim();
      if (!normalized || langCode === "en") return normalized;

      const cacheKey = langCode + "::" + normalized;
      if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey) || normalized;
      }

      try {
        const url =
          "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" +
          encodeURIComponent(langCode) +
          "&dt=t&q=" +
          encodeURIComponent(normalized);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Translation request failed");
        const data = await response.json();
        const translated = extractTranslatedText(data) || normalized;
        translationCache.set(cacheKey, translated);
      } catch (_error) {
        translationCache.set(cacheKey, normalized);
      }

      return translationCache.get(cacheKey) || normalized;
    }

    const switcher = document.createElement("div");
    switcher.className = "language-switcher";
    switcher.setAttribute("data-no-translate", "true");

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "language-switcher__toggle";
    toggle.setAttribute("aria-haspopup", "menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Select language");
    toggle.innerHTML =
      '<img class="language-switcher__flag-image" src="' +
      assetBase +
      languageOptions[0].flagFile +
      '" alt="" aria-hidden="true" loading="lazy" decoding="async">' +
      '<span class="language-switcher__chevron" aria-hidden="true">&#9662;</span>';

    const menu = document.createElement("ul");
    menu.className = "language-switcher__menu";
    menu.hidden = true;
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Language options");

    function getLanguageByCode(code) {
      return languageOptions.find(function (option) {
        return option.code === code;
      });
    }

    languageOptions.forEach(function (option) {
      const item = document.createElement("li");
      item.setAttribute("role", "none");

      const button = document.createElement("button");
      button.type = "button";
      button.className = "language-switcher__option";
      button.setAttribute("role", "menuitem");
      button.dataset.langCode = option.code;
      button.title = option.label;
      button.innerHTML =
        '<img class="language-switcher__flag-image" src="' +
        assetBase +
        option.flagFile +
        '" alt="" aria-hidden="true" loading="lazy" decoding="async">' +
        '<span class="sr-only">' +
        option.label +
        "</span>";

      item.appendChild(button);
      menu.appendChild(item);
    });

    function setMenuOpen(open) {
      menu.hidden = !open;
      switcher.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    }

    async function applyLanguage(langCode) {
      const selectedLanguage = getLanguageByCode(langCode) || languageOptions[0];
      const flagEl = toggle.querySelector(".language-switcher__flag-image");
      if (flagEl instanceof HTMLImageElement) {
        flagEl.src = assetBase + selectedLanguage.flagFile;
        flagEl.dataset.langCode = selectedLanguage.code;
      }
      toggle.setAttribute("aria-label", "Current language: " + selectedLanguage.label);
      root.lang = selectedLanguage.code === "en" ? "en" : selectedLanguage.code;
      root.dir = selectedLanguage.code === "ar" ? "rtl" : "ltr";
      switcher.classList.add("is-loading");

      try {
        if (selectedLanguage.code !== "en") {
          ensureTranslationData();
        }

        if (selectedLanguage.code === "en") {
          if (translationPrepared) {
            textEntries.forEach(function (entry) {
              entry.node.nodeValue = entry.original;
            });
            placeholderEntries.forEach(function (entry) {
              entry.element.setAttribute("placeholder", entry.original);
            });
          }
          return;
        }

        const translateJobs = textEntries.map(async function (entry) {
          const translatedCore = await translateText(entry.original, selectedLanguage.code);
          entry.node.nodeValue = wrapTranslatedText(entry.original, translatedCore);
        });

        const placeholderJobs = placeholderEntries.map(async function (entry) {
          const translated = await translateText(entry.original, selectedLanguage.code);
          entry.element.setAttribute("placeholder", translated);
        });

        await Promise.all(translateJobs.concat(placeholderJobs));
      } finally {
        switcher.classList.remove("is-loading");
      }
    }

    toggle.addEventListener("click", function () {
      setMenuOpen(menu.hidden);
    });

    menu.addEventListener("click", async function (event) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const optionButton =
        target instanceof HTMLButtonElement
          ? target
          : target instanceof Element
            ? target.closest("button")
            : null;
      if (!(optionButton instanceof HTMLButtonElement)) return;
      const code = optionButton.dataset.langCode;
      if (!code) return;
      setMenuOpen(false);
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      } catch (_error) {
        // Ignore storage errors.
      }
      await applyLanguage(code);
    });

    document.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (switcher.contains(target)) return;
      setMenuOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    });

    switcher.appendChild(toggle);
    switcher.appendChild(menu);

    const ctaLink = siteNav.querySelector(".site-nav__cta, .site-nav__referral");
    if (ctaLink instanceof HTMLElement) {
      siteNav.insertBefore(switcher, ctaLink);
    } else {
      siteNav.appendChild(switcher);
    }

    // Keep core branding/footer content in original English while allowing
    // the acknowledgement heading itself to translate.
    document
      .querySelectorAll(".brand__name, .brand__legal, .country-acknowledgement p, .footer-bottom")
      .forEach(function (el) {
        if (el instanceof HTMLElement) {
          el.setAttribute("data-no-translate", "true");
        }
      });

    let savedLanguage = "en";
    try {
      savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || "en";
    } catch (_error) {
      savedLanguage = "en";
    }
    applyLanguage(savedLanguage);
  }

  setupServicesDropdown();
  runWhenIdle(setupLanguageSwitcher, 2600);

  function clearHeroSliderTimers() {
    if (heroSliderHoldTimer) {
      window.clearTimeout(heroSliderHoldTimer);
      heroSliderHoldTimer = 0;
    }
    if (heroSliderFadeInTimer) {
      window.clearTimeout(heroSliderFadeInTimer);
      heroSliderFadeInTimer = 0;
    }
    if (heroSliderCompleteTimer) {
      window.clearTimeout(heroSliderCompleteTimer);
      heroSliderCompleteTimer = 0;
    }
  }

  function resetHeroSlider() {
    heroSliderIndex = 0;
    heroSliderSlides.forEach(function (slide, index) {
      slide.classList.remove("is-front");
      slide.classList.toggle("is-active", index === 0);
    });
  }

  function queueHeroSlideTransition() {
    clearHeroSliderTimers();
    heroSliderHoldTimer = window.setTimeout(function () {
      if (!heroSliderRunning || heroSliderSlides.length < 2) return;

      const currentSlide = heroSliderSlides[heroSliderIndex];
      const nextIndex = (heroSliderIndex + 1) % heroSliderSlides.length;
      const nextSlide = heroSliderSlides[nextIndex];

      if (!(currentSlide instanceof HTMLElement) || !(nextSlide instanceof HTMLElement)) return;

      nextSlide.classList.add("is-front");
      heroSliderFadeInTimer = window.setTimeout(function () {
        if (!heroSliderRunning) return;
        nextSlide.classList.add("is-active");
      }, 16);

      heroSliderCompleteTimer = window.setTimeout(function () {
        if (!heroSliderRunning) return;
        currentSlide.classList.remove("is-active", "is-front");
        nextSlide.classList.add("is-active");
        nextSlide.classList.remove("is-front");
        heroSliderIndex = nextIndex;
        queueHeroSlideTransition();
      }, HERO_SLIDE_FADE_MS);
    }, HERO_SLIDE_HOLD_MS);
  }

  function startHeroSlider() {
    if (heroSliderRunning || heroSliderSlides.length < 2) return;
    const existingActiveIndex = heroSliderSlides.findIndex(function (slide) {
      return slide.classList.contains("is-active");
    });
    heroSliderIndex = existingActiveIndex >= 0 ? existingActiveIndex : 0;
    heroSliderSlides.forEach(function (slide, index) {
      slide.classList.remove("is-front");
      slide.classList.toggle("is-active", index === heroSliderIndex);
    });
    heroSliderRunning = true;
    queueHeroSlideTransition();
  }

  function stopHeroSlider(reset) {
    heroSliderRunning = false;
    clearHeroSliderTimers();
    if (reset) {
      resetHeroSlider();
    }
  }

  function refreshHeroSliderMotion() {
    if (heroSliderSlides.length === 0) return;
    const motionDisabled = state.reduceMotion || prefersReducedMotionQuery.matches;
    if (motionDisabled) {
      stopHeroSlider(true);
      return;
    }
    startHeroSlider();
  }

  function setNavOpen(open) {
    if (!(navToggle instanceof HTMLButtonElement) || !(siteNav instanceof HTMLElement)) {
      return;
    }
    siteNav.classList.toggle("is-open", open);
    siteNav.querySelectorAll(".site-nav__services-dropdown.is-open").forEach(function (dropdown) {
      dropdown.classList.remove("is-open");
    });
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  }

  if (navToggle instanceof HTMLButtonElement && siteNav instanceof HTMLElement) {
    navToggle.addEventListener("click", function () {
      const nextOpen = !siteNav.classList.contains("is-open");
      setNavOpen(nextOpen);
    });

    siteNav.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const isMobileServicesTrigger =
        anchor.classList.contains("site-nav__services-trigger") &&
        window.innerWidth <= compactNavBreakpoint;

      if (isMobileServicesTrigger) return;
      setNavOpen(false);
    });

    document.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (siteNav.contains(target) || navToggle.contains(target)) return;
      setNavOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
        setNavOpen(false);
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > compactNavBreakpoint) {
        setNavOpen(false);
      }
      if (exploreRefreshTimer) {
        window.clearTimeout(exploreRefreshTimer);
      }
      exploreRefreshTimer = window.setTimeout(function () {
        refreshExploreIntro();
        refreshOffersIntro();
      }, 140);
    });
  }

  const a11yToggle = document.getElementById("a11y-toggle");
  const a11yPanel = document.getElementById("a11y-panel");
  const a11yClose = document.getElementById("a11y-close");
  const a11yButtons = Array.from(document.querySelectorAll("[data-a11y-action]"));
  let scrollTopToggle = document.getElementById("scroll-top-toggle");

  if (!(scrollTopToggle instanceof HTMLButtonElement) && body) {
    const newScrollTopToggle = document.createElement("button");
    newScrollTopToggle.type = "button";
    newScrollTopToggle.id = "scroll-top-toggle";
    newScrollTopToggle.className = "scroll-top-toggle";
    newScrollTopToggle.setAttribute("aria-label", "Scroll to top");
    newScrollTopToggle.innerHTML = '<span class="scroll-top-toggle__caret" aria-hidden="true"></span>';

    if (a11yToggle && a11yToggle.parentNode) {
      a11yToggle.parentNode.insertBefore(newScrollTopToggle, a11yToggle);
    } else {
      body.appendChild(newScrollTopToggle);
    }
    scrollTopToggle = newScrollTopToggle;
  }

  if (scrollTopToggle instanceof HTMLButtonElement) {
    scrollTopToggle.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const STORAGE_KEY = "ndisCarerAccessibility";
  const cssScale = Number.parseFloat(
    window.getComputedStyle(root).getPropertyValue("--font-scale")
  );
  const defaultScale = Number.isFinite(cssScale) ? cssScale : 1.12;
  const minScale = defaultScale;
  const maxScale = Math.min(1.6, defaultScale + 0.32);
  const stepScale = 0.04;

  const state = {
    fontScale: defaultScale,
    highContrast: false,
    grayscale: false,
    underlineLinks: false,
    readableFont: false,
    reduceMotion: false
  };

  function scrollToHashTarget() {
    const hash = window.location.hash;
    if (!hash || hash.length <= 1) return;

    const targetId = decodeURIComponent(hash.slice(1));
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!(target instanceof HTMLElement)) return;

    const behavior =
      state.reduceMotion || prefersReducedMotionQuery.matches ? "auto" : "smooth";
    target.scrollIntoView({ block: "start", behavior });
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setPanelOpen(open) {
    if (!a11yPanel || !a11yToggle) return;
    a11yPanel.hidden = !open;
    a11yToggle.setAttribute("aria-expanded", String(open));
    a11yToggle.setAttribute(
      "aria-label",
      open ? "Close accessibility tools" : "Open accessibility tools"
    );
    if (open) {
      const firstButton = a11yButtons[0];
      if (firstButton) firstButton.focus();
    } else {
      a11yToggle.focus();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_error) {
      // Ignore storage errors in private mode or restricted browsers.
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved !== "object" || saved === null) return;
      if (typeof saved.fontScale === "number") {
        state.fontScale = clamp(saved.fontScale, minScale, maxScale);
      }
      state.highContrast = Boolean(saved.highContrast);
      state.grayscale = Boolean(saved.grayscale);
      state.underlineLinks = Boolean(saved.underlineLinks);
      state.readableFont = Boolean(saved.readableFont);
      state.reduceMotion = Boolean(saved.reduceMotion);
    } catch (_error) {
      // Ignore invalid storage content.
    }
  }

  function setPressed(action, pressed) {
    const button = a11yButtons.find((item) => item.dataset.a11yAction === action);
    if (!button || !button.hasAttribute("aria-pressed")) return;
    button.setAttribute("aria-pressed", String(pressed));
  }

  function applyA11yState() {
    root.style.setProperty("--font-scale", String(state.fontScale));
    body.classList.toggle("a11y-high-contrast", state.highContrast);
    body.classList.toggle("a11y-grayscale", state.grayscale);
    body.classList.toggle("a11y-underline-links", state.underlineLinks);
    body.classList.toggle("a11y-readable-font", state.readableFont);
    body.classList.toggle("a11y-reduce-motion", state.reduceMotion);

    setPressed("toggle-high-contrast", state.highContrast);
    setPressed("toggle-grayscale", state.grayscale);
    setPressed("toggle-underline-links", state.underlineLinks);
    setPressed("toggle-readable-font", state.readableFont);
    setPressed("toggle-reduce-motion", state.reduceMotion);

    refreshHeroSliderMotion();
  }

  function setupHomeHeroIntroTargets() {
    if (!(heroIntroRoot instanceof HTMLElement)) return [];
    const selectors = [
      ".eyebrow",
      "h1",
      ".hero__lead",
      ".hero__actions",
      ".hero__highlights"
    ];

    return selectors
      .map(function (selector) {
        return heroIntroRoot.querySelector(selector);
      })
      .filter(function (el) {
        return el instanceof HTMLElement;
      })
      .map(function (el, index) {
        el.setAttribute("data-hero-intro", "true");
        el.style.setProperty("--hero-intro-delay", String(index * 140) + "ms");
        return el;
      });
  }

  const heroIntroTargets = setupHomeHeroIntroTargets();

  function refreshHomeHeroIntro() {
    if (!(heroIntroRoot instanceof HTMLElement) || heroIntroTargets.length === 0) return;

    const motionDisabled = state.reduceMotion || prefersReducedMotionQuery.matches;
    if (motionDisabled) {
      heroIntroRoot.classList.remove("is-intro-pending");
      heroIntroRoot.classList.remove("is-intro-ready");
      return;
    }

    if (heroIntroPlayed) return;
    heroIntroPlayed = true;

    heroIntroRoot.classList.add("is-intro-pending");
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        heroIntroRoot.classList.add("is-intro-ready");
      });
    });
  }

  function setupExploreIntroTargets() {
    if (!(exploreIntroRoot instanceof HTMLElement)) return [];
    return Array.from(exploreIntroRoot.querySelectorAll(".explore-card")).map(function (card, index) {
      if (!(card instanceof HTMLElement)) return null;
      card.style.setProperty("--explore-delay", String(index * 150) + "ms");
      return card;
    }).filter(function (card) {
      return card instanceof HTMLElement;
    });
  }

  const exploreIntroTargets = setupExploreIntroTargets();

  function setupOffersIntroTargets() {
    if (!(offersIntroRoot instanceof HTMLElement)) return [];
    return Array.from(offersIntroRoot.querySelectorAll(".offers-card")).filter(function (card) {
      return card instanceof HTMLElement;
    });
  }

  const offersIntroTargets = setupOffersIntroTargets();

  function playExploreIntro() {
    if (!(exploreIntroRoot instanceof HTMLElement) || exploreIntroTargets.length === 0) return;
    if (exploreIntroPlayed) return;
    exploreIntroPlayed = true;

    if (exploreIntroObserver) {
      exploreIntroObserver.disconnect();
      exploreIntroObserver = null;
    }

    exploreIntroRoot.classList.add("is-intro-pending");
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        exploreIntroRoot.classList.add("is-intro-ready");
      });
    });
  }

  function disconnectExploreCardObservers() {
    if (!exploreCardObservers.length) return;
    exploreCardObservers.forEach(function (observer) {
      observer.disconnect();
    });
    exploreCardObservers = [];
  }

  function disconnectOffersCardObservers() {
    if (!offersCardObservers.length) return;
    offersCardObservers.forEach(function (observer) {
      observer.disconnect();
    });
    offersCardObservers = [];
  }

  function applyOffersRowDelays() {
    if (!(offersIntroRoot instanceof HTMLElement) || offersIntroTargets.length === 0) return;

    const rowTops = [];
    const rowCounts = [];
    const tolerancePx = 6;

    offersIntroTargets.forEach(function (card) {
      const top = card.offsetTop;
      let rowIndex = rowTops.findIndex(function (rowTop) {
        return Math.abs(rowTop - top) <= tolerancePx;
      });

      if (rowIndex === -1) {
        rowTops.push(top);
        rowCounts.push(0);
        rowIndex = rowTops.length - 1;
      }

      const cardIndexInRow = rowCounts[rowIndex];
      rowCounts[rowIndex] = cardIndexInRow + 1;

      // Stagger left-to-right within each row: 1st, 2nd, 3rd, 4th.
      const delay = Math.min(cardIndexInRow * 140, 560);
      card.style.setProperty("--offers-delay", String(delay) + "ms");
    });
  }

  function setupMobileExploreIntro() {
    if (!(exploreIntroRoot instanceof HTMLElement) || exploreIntroTargets.length === 0) return;

    exploreIntroRoot.classList.remove("is-intro-pending");
    exploreIntroRoot.classList.remove("is-intro-ready");
    exploreIntroRoot.classList.add("is-mobile-intro");

    if (!("IntersectionObserver" in window)) {
      exploreIntroTargets.forEach(function (card) {
        card.classList.add("is-card-ready");
      });
      return;
    }

    exploreIntroTargets.forEach(function (card) {
      if (!(card instanceof HTMLElement)) return;
      if (card.classList.contains("is-card-ready")) return;

      const observer = new IntersectionObserver(
        function (entries) {
          if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
          if (!entries.some(function (entry) { return entry.intersectionRatio >= 0.22; })) return;
          card.classList.add("is-card-ready");
          observer.disconnect();
        },
        { threshold: [0.22], rootMargin: "0px 0px -8% 0px" }
      );
      observer.observe(card);
      exploreCardObservers.push(observer);
    });
  }

  function refreshExploreIntro() {
    if (!(exploreIntroRoot instanceof HTMLElement) || exploreIntroTargets.length === 0) return;

    if (exploreIntroObserver) {
      exploreIntroObserver.disconnect();
      exploreIntroObserver = null;
    }
    disconnectExploreCardObservers();

    const motionDisabled = state.reduceMotion || prefersReducedMotionQuery.matches;
    if (motionDisabled) {
      exploreIntroRoot.classList.remove("is-intro-pending");
      exploreIntroRoot.classList.remove("is-intro-ready");
      exploreIntroRoot.classList.remove("is-mobile-intro");
      exploreIntroTargets.forEach(function (card) {
        card.classList.remove("is-card-ready");
      });
      return;
    }

    const isMobileViewport = window.innerWidth <= 700;
    if (isMobileViewport) {
      setupMobileExploreIntro();
      return;
    }

    exploreIntroRoot.classList.remove("is-mobile-intro");
    exploreIntroTargets.forEach(function (card) {
      card.classList.remove("is-card-ready");
    });
    if (!exploreIntroPlayed) {
      exploreIntroRoot.classList.add("is-intro-pending");
    }

    if (exploreIntroPlayed) return;

    if (!("IntersectionObserver" in window)) {
      playExploreIntro();
      return;
    }

    const minScrollY = 140;
    const triggerRatio = 0.6;
    const triggerRootMargin = "0px 0px -6% 0px";

    exploreIntroObserver = new IntersectionObserver(
      function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        if (window.scrollY < minScrollY) return;
        if (entries.some(function (entry) { return entry.intersectionRatio >= triggerRatio; })) {
          playExploreIntro();
        }
      },
      { threshold: [triggerRatio], rootMargin: triggerRootMargin }
    );
    exploreIntroObserver.observe(exploreIntroRoot);
  }

  function refreshOffersIntro() {
    if (!(offersIntroRoot instanceof HTMLElement) || offersIntroTargets.length === 0) return;

    disconnectOffersCardObservers();
    applyOffersRowDelays();

    const motionDisabled = state.reduceMotion || prefersReducedMotionQuery.matches;
    if (motionDisabled) {
      offersIntroRoot.classList.remove("is-intro-pending");
      offersIntroTargets.forEach(function (card) {
        card.classList.add("is-card-ready");
      });
      return;
    }

    offersIntroRoot.classList.add("is-intro-pending");

    if (!("IntersectionObserver" in window)) {
      offersIntroTargets.forEach(function (card) {
        card.classList.add("is-card-ready");
      });
      return;
    }

    offersIntroTargets.forEach(function (card) {
      if (!(card instanceof HTMLElement)) return;
      if (card.classList.contains("is-card-ready")) return;

      const observer = new IntersectionObserver(
        function (entries) {
          if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
          if (!entries.some(function (entry) { return entry.intersectionRatio >= 0.2; })) return;
          card.classList.add("is-card-ready");
          observer.disconnect();
        },
        { threshold: [0.2], rootMargin: "0px 0px -6% 0px" }
      );

      observer.observe(card);
      offersCardObservers.push(observer);
    });
  }

  function resetA11yState() {
    state.fontScale = defaultScale;
    state.highContrast = false;
    state.grayscale = false;
    state.underlineLinks = false;
    state.readableFont = false;
    state.reduceMotion = false;
    applyA11yState();
    saveState();
  }

  loadState();
  applyA11yState();
  refreshHomeHeroIntro();
  refreshExploreIntro();
  refreshOffersIntro();
  setNavOpen(false);
  scrollToHashTarget();

  window.addEventListener("hashchange", function () {
    scrollToHashTarget();
  });

  window.addEventListener("load", function () {
    window.setTimeout(function () {
      scrollToHashTarget();
      refreshOffersIntro();
    }, 120);
  });

  if (a11yToggle) {
    a11yToggle.addEventListener("click", function () {
      setPanelOpen(a11yPanel ? a11yPanel.hidden : true);
    });
  }

  if (a11yClose) {
    a11yClose.addEventListener("click", function () {
      setPanelOpen(false);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && a11yPanel && !a11yPanel.hidden) {
      setPanelOpen(false);
    }
  });

  document.addEventListener("click", function (event) {
    if (!a11yPanel || a11yPanel.hidden) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (a11yPanel.contains(target) || (a11yToggle && a11yToggle.contains(target))) return;
    setPanelOpen(false);
  });

  a11yButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const action = button.dataset.a11yAction;

      switch (action) {
        case "increase-text":
          state.fontScale = clamp(state.fontScale + stepScale, minScale, maxScale);
          break;
        case "decrease-text":
          state.fontScale = clamp(state.fontScale - stepScale, minScale, maxScale);
          break;
        case "toggle-readable-font":
          state.readableFont = !state.readableFont;
          break;
        case "toggle-high-contrast":
          state.highContrast = !state.highContrast;
          break;
        case "toggle-grayscale":
          state.grayscale = !state.grayscale;
          break;
        case "toggle-underline-links":
          state.underlineLinks = !state.underlineLinks;
          break;
        case "toggle-reduce-motion":
          state.reduceMotion = !state.reduceMotion;
          break;
        case "reset":
          resetA11yState();
          return;
        default:
          return;
      }

      applyA11yState();
      refreshHomeHeroIntro();
      refreshExploreIntro();
      refreshOffersIntro();
      saveState();
    });
  });

  const referralForm = document.getElementById("referral-form");
  const referralStatus = document.getElementById("referral-status");
  const emailFallback = document.getElementById("email-fallback");
  const referralPreview = document.getElementById("referral-preview");
  const copyReferralDetails = document.getElementById("copy-referral-details");
  const careersForm = document.getElementById("careers-form");
  const careersStatus = document.getElementById("careers-status");

  function setReferralStatus(message, isError) {
    if (!referralStatus) return;
    referralStatus.textContent = message;
    referralStatus.style.color = isError ? "#b02020" : "";
  }

  async function copyReferralText() {
    if (!(referralPreview instanceof HTMLTextAreaElement)) return;
    const text = referralPreview.value.trim();
    if (!text) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        referralPreview.focus();
        referralPreview.select();
        document.execCommand("copy");
      }
      setReferralStatus("Referral details copied. You can now paste them into your email.", false);
    } catch (_error) {
      referralPreview.focus();
      referralPreview.select();
      setReferralStatus("Could not copy automatically. Select the text and copy manually.", true);
    }
  }

  function getFormValue(form, name) {
    const field = form.elements.namedItem(name);
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
      return "";
    }
    return field.value.trim();
  }

  function setCareersStatus(message, isError) {
    if (!careersStatus) return;
    careersStatus.textContent = message;
    careersStatus.style.color = isError ? "#b02020" : "";
  }

  const directSubmitEnabled =
    referralForm instanceof HTMLFormElement &&
    referralForm.dataset.directSubmit === "true";

  if (directSubmitEnabled) {
    setReferralStatus("Submitting this form sends it directly to our referrals inbox.", false);
  }

  if (careersForm instanceof HTMLFormElement) {
    careersForm.addEventListener("submit", function (event) {
      const resumeField = careersForm.elements.namedItem("attachment");
      if (!(resumeField instanceof HTMLInputElement)) return;

      const file = resumeField.files && resumeField.files[0];
      if (!file) return;

      const maxBytes = 4 * 1024 * 1024;
      if (file.size > maxBytes) {
        event.preventDefault();
        setCareersStatus("Resume file must be under 4MB. Please choose a smaller file.", true);
      }
    });
  }

  if (referralForm instanceof HTMLFormElement && !directSubmitEnabled) {
    referralForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!referralForm.checkValidity()) {
        referralForm.reportValidity();
        setReferralStatus("Please complete the required fields before submitting.", true);
        return;
      }

      const values = {
        participantName: getFormValue(referralForm, "participantName"),
        participantPhone: getFormValue(referralForm, "participantPhone"),
        participantEmail: getFormValue(referralForm, "participantEmail"),
        participantAddress: getFormValue(referralForm, "participantAddress"),
        coordinatorName: getFormValue(referralForm, "coordinatorName"),
        coordinatorPhone: getFormValue(referralForm, "coordinatorPhone"),
        coordinatorEmail: getFormValue(referralForm, "coordinatorEmail"),
        managerName: getFormValue(referralForm, "managerName"),
        managerPhone: getFormValue(referralForm, "managerPhone"),
        managerEmail: getFormValue(referralForm, "managerEmail"),
        ndisNumber: getFormValue(referralForm, "ndisNumber"),
        referralMessage: getFormValue(referralForm, "referralMessage")
      };

      const subject = `Referral Enquiry - ${values.participantName}`;
      const bodyLines = [
        "We Care Referral Enquiry",
        "",
        "Participant Details",
        `Full Name: ${values.participantName}`,
        `Contact Number: ${values.participantPhone}`,
        `Contact Email: ${values.participantEmail}`,
        `Address: ${values.participantAddress || "N/A"}`,
        "",
        "Best Contact / Support Coordinator",
        `Name: ${values.coordinatorName}`,
        `Phone: ${values.coordinatorPhone}`,
        `Email: ${values.coordinatorEmail || "N/A"}`,
        "",
        "Plan Manager / Self Manager",
        `Name: ${values.managerName}`,
        `Contact Number: ${values.managerPhone}`,
        `Contact Email: ${values.managerEmail}`,
        "",
        "Additional Details",
        `NDIS Number: ${values.ndisNumber || "N/A"}`,
        `Message: ${values.referralMessage || "N/A"}`
      ];
      const bodyText = bodyLines.join("\n");

      const mailtoUrl =
        "mailto:admin@ndiscarer.com?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(bodyText);

      if (emailFallback instanceof HTMLDetailsElement) {
        emailFallback.hidden = false;
        emailFallback.open = true;
      }

      if (referralPreview instanceof HTMLTextAreaElement) {
        referralPreview.value = `Subject: ${subject}\n\n${bodyText}`;
      }

      setReferralStatus(
        "Opening your email app. If nothing opens, use the fallback panel to copy and send manually.",
        false
      );
      window.location.href = mailtoUrl;
    });
  }

  if (copyReferralDetails instanceof HTMLButtonElement) {
    copyReferralDetails.addEventListener("click", function () {
      copyReferralText();
    });
  }
})();
