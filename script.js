(function () {
  document.documentElement.classList.add("has-js");

  const body = document.body;
  const root = document.documentElement;

  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const navToggle = document.getElementById("nav-toggle");
  const siteNav = document.getElementById("site-nav");
  const compactNavBreakpoint = 700;

  function setNavOpen(open) {
    if (!(navToggle instanceof HTMLButtonElement) || !(siteNav instanceof HTMLElement)) {
      return;
    }
    siteNav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  }

  if (navToggle instanceof HTMLButtonElement && siteNav instanceof HTMLElement) {
    navToggle.addEventListener("click", function () {
      const nextOpen = !siteNav.classList.contains("is-open");
      setNavOpen(nextOpen);
    });

    siteNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNavOpen(false);
      });
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
    });
  }

  const a11yToggle = document.getElementById("a11y-toggle");
  const a11yPanel = document.getElementById("a11y-panel");
  const a11yClose = document.getElementById("a11y-close");
  const a11yButtons = Array.from(document.querySelectorAll("[data-a11y-action]"));

  const STORAGE_KEY = "ndisCarerAccessibility";
  const defaultScale = 0.92;
  const minScale = 0.78;
  const maxScale = 1;
  const stepScale = 0.04;

  const state = {
    fontScale: defaultScale,
    highContrast: false,
    grayscale: false,
    underlineLinks: false,
    readableFont: false,
    reduceMotion: false
  };

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
  setNavOpen(false);

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
      saveState();
    });
  });

  const referralForm = document.getElementById("referral-form");
  const referralStatus = document.getElementById("referral-status");
  const emailFallback = document.getElementById("email-fallback");
  const referralPreview = document.getElementById("referral-preview");
  const copyReferralDetails = document.getElementById("copy-referral-details");

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

  if (referralForm instanceof HTMLFormElement) {
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
        "NDIS Carer Referral Enquiry",
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
