(function () {
  "use strict";

  const photos = [
    {
      src: "./images/highlights/mind_conference_1.webp",
      alt: "MIND 2026 attendees seated in the main hall for the conference group photo",
      caption: "Conference group photo"
    },
    {
      src: "./images/highlights/mind_conference_2.webp",
      alt: "A speaker at the lectern beside the title slide for Yew-Soon Ong’s keynote on evolutionary multitasking",
      caption: "Yew-Soon Ong keynote"
    },
    {
      src: "./images/highlights/mind_conference_3.webp",
      alt: "A speaker on stage during Bernhard Sendhoff’s keynote on AI in engineering design",
      caption: "Bernhard Sendhoff keynote"
    },
    {
      src: "./images/highlights/mind_conference_4.webp",
      alt: "A slide on dynamic multiobjective optimization during Gary G. Yen’s keynote",
      caption: "Gary G. Yen keynote"
    },
    {
      src: "./images/highlights/mind_conference_5.webp",
      alt: "The moderator addresses the audience alongside five seated panelists at the Senior Scholar Forum",
      caption: "Senior Scholar Forum"
    }
  ];
  const interval = 6000;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.querySelectorAll("[data-home-highlights]").forEach(function (root) {
    if (!photos.length) return;
    const track = root.querySelector("[data-highlights-track]");
    const status = root.querySelector("[data-highlights-status]");
    const dots = root.querySelector("[data-highlights-dots]");
    const previous = root.querySelector("[data-highlights-previous]");
    const next = root.querySelector("[data-highlights-next]");
    const viewport = root.querySelector(".homeHighlightsViewport");
    const gallery = root.querySelector(".homeHighlightsGallery");
    const slideOffset = photos.length > 1 ? 1 : 0;
    let index = 0;
    let visualIndex = slideOffset;
    let userPaused = reducedMotion.matches;
    let hovered = false;
    let focused = false;
    let visible = false;
    let timer = 0;
    let pointerStart = null;

    // One cloned slide at each end allows seamless first/last transitions.
    const loopPhotos = photos.length > 1
      ? [photos[photos.length - 1]].concat(photos, photos[0])
      : photos;
    const slides = loopPhotos.map(function (photo, position) {
      const slide = document.createElement("figure");
      const photoIndex = (position - slideOffset + photos.length) % photos.length;
      slide.className = "homeHighlightsSlide";
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", (photoIndex + 1) + " of " + photos.length);
      const image = document.createElement("img");
      image.src = photo.src;
      image.alt = photo.alt;
      image.loading = "lazy";
      image.decoding = "async";
      slide.appendChild(image);
      return slide;
    });
    track.replaceChildren.apply(track, slides);

    const dotButtons = photos.map(function (photo, position) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "homeHighlightsDot";
      button.setAttribute("aria-label", "Show photo " + (position + 1) + ": " + photo.caption);
      button.addEventListener("click", function () {
        show(position, true);
        schedule();
      });
      dots.appendChild(button);
      return button;
    });

    function positionTrack(instant) {
      if (instant) track.classList.add("is-resetting");
      track.style.transform = "translate3d(" + (-100 * visualIndex) + "%, 0, 0)";
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-current", slideIndex === visualIndex);
        slide.setAttribute("aria-hidden", String(slideIndex !== visualIndex));
      });
      if (instant) {
        track.getBoundingClientRect();
        track.classList.remove("is-resetting");
      }
    }

    function settle() {
      visualIndex = slideOffset + index;
      positionTrack(true);
    }

    track.addEventListener("transitionend", function (event) {
      if (event.target === track && event.propertyName === "transform") settle();
    });

    function show(position, announce, instant) {
      if (visualIndex !== slideOffset + index) settle();
      index = (position + photos.length) % photos.length;
      visualIndex = slideOffset + position;
      if (instant || reducedMotion.matches || photos.length === 1) visualIndex = slideOffset + index;
      positionTrack(instant || reducedMotion.matches);
      dotButtons.forEach(function (button, buttonIndex) {
        button.setAttribute("aria-pressed", String(buttonIndex === index));
      });
      if (announce) status.textContent = "Photo " + (index + 1) + " of " + photos.length + ": " + photos[index].caption;
    }

    function schedule() {
      window.clearTimeout(timer);
      if (userPaused || hovered || focused || !visible || document.hidden || photos.length < 2) return;
      timer = window.setTimeout(function () {
        show(index + 1, false);
        schedule();
      }, interval);
    }

    previous.addEventListener("click", function () {
      show(index - 1, true);
      schedule();
    });
    next.addEventListener("click", function () {
      show(index + 1, true);
      schedule();
    });
    root.addEventListener("mouseenter", function () { hovered = true; schedule(); });
    root.addEventListener("mouseleave", function () { hovered = false; schedule(); });
    root.addEventListener("focusin", function () { focused = true; schedule(); });
    root.addEventListener("focusout", function (event) {
      if (!root.contains(event.relatedTarget)) {
        focused = false;
        schedule();
      }
    });
    root.addEventListener("keydown", function (event) {
      // Keep keyboard pause/resume available without a visible playback button.
      if (event.key === " " && event.target === gallery) {
        event.preventDefault();
        userPaused = !userPaused;
        if (!userPaused) focused = false;
        status.textContent = userPaused ? "Slideshow paused." : "Slideshow playing.";
        schedule();
        return;
      }
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      show(index + (event.key === "ArrowRight" ? 1 : -1), true);
      schedule();
    });
    viewport.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "touch") pointerStart = { x: event.clientX, y: event.clientY };
    });
    viewport.addEventListener("pointerup", function (event) {
      if (!pointerStart) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        show(index + (dx < 0 ? 1 : -1), true);
        schedule();
      }
    });
    viewport.addEventListener("pointercancel", function () { pointerStart = null; });
    document.addEventListener("visibilitychange", schedule);
    reducedMotion.addEventListener("change", function (event) {
      if (event.matches) userPaused = true;
      settle();
      schedule();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) settle();
        schedule();
      }, { threshold: .2 }).observe(root);
    } else {
      visible = true;
      window.addEventListener("resize", function () {
        visible = root.getClientRects().length > 0;
        schedule();
      });
    }

    previous.hidden = next.hidden = photos.length < 2;
    root.querySelector("[data-highlights-controls]").hidden = photos.length < 2;
    show(0, false, true);
    schedule();
  });
})();
