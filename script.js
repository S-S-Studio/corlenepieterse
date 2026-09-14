const WHATSAPP_NUMBER = "27712170470";

function initialiseMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".main-menu");

  if (!toggle || !menu) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    });
  });
}

function setYear() {
  document.querySelectorAll("#year").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
}

function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function initialiseGeneralWhatsApp() {
  const link = document.getElementById("general-whatsapp-link");

  if (!link) {
    return;
  }

  link.href = whatsappUrl("Hi, I would like to ask about your paintings.");
  link.target = "_blank";
}

function paintingCard(painting) {
  const priceOrStatus =
    painting.status === "for-sale"
      ? `<p class="painting-price">${painting.price || "Price on request"}</p>`
      : `<p class="painting-status">Previous work</p>`;

  const action =
    painting.status === "for-sale"
      ? `<div class="painting-actions">
          <a
            class="primary-button"
            href="${whatsappUrl(`Hi, I would like to ask about the painting "${painting.title || "this painting"}".`)}"
            target="_blank"
            rel="noopener"
          >Contact Artist</a>
        </div>`
      : "";

  return `
    <article class="painting-card" data-category="${painting.category}">
      <button
        class="painting-image-wrap"
        type="button"
        data-viewer-src="${painting.image}"
        data-viewer-alt="${painting.title || "Painting"}"
        aria-label="Open ${painting.title || "painting"} image"
      >
        <img class="painting-image" src="${painting.image}" alt="${painting.title || "Painting"}">
      </button>

      <div class="painting-meta">
        <div class="painting-info-block">
          ${painting.title ? `<h2 class="painting-title">${painting.title}</h2>` : ""}
          <p class="painting-category">${painting.categoryLabel}</p>
          ${painting.medium ? `<p class="painting-detail">${painting.medium}</p>` : ""}
          ${painting.dimensions ? `<p class="painting-detail">${painting.dimensions}</p>` : ""}
        </div>
        ${priceOrStatus}
      </div>

      ${painting.description ? `<p class="painting-description">${painting.description}</p>` : ""}
      ${action}
    </article>
  `;
}

function renderGallery(containerId, status, filter = "all") {
  const container = document.getElementById(containerId);

  if (!container || !Array.isArray(window.PAINTINGS)) {
    return;
  }

  const matches = window.PAINTINGS.filter((painting) => {
    const matchesStatus = painting.status === status;
    const matchesCategory = filter === "all" || painting.category === filter;
    return matchesStatus && matchesCategory;
  });

  if (matches.length === 0) {
    container.innerHTML = '<p class="empty-state">No paintings in this category yet.</p>';
    return;
  }

  container.innerHTML = matches.map(paintingCard).join("");
}

function initialiseFilters() {
  const filterBar = document.querySelector(".filter-bar");

  if (!filterBar) {
    return;
  }

  const group = filterBar.dataset.filterGroup;
  const isForSale = group === "for-sale";
  const containerId = isForSale ? "for-sale-gallery" : "previous-gallery";
  const status = isForSale ? "for-sale" : "previous";

  renderGallery(containerId, status, "all");

  filterBar.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      filterBar.querySelectorAll(".filter-button").forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");
      renderGallery(containerId, status, button.dataset.filter);
    });
  });
}


function initialiseImageViewer() {
  const viewer = document.getElementById("image-viewer");
  const stage = document.getElementById("image-viewer-stage");
  const image = document.getElementById("image-viewer-image");
  const closeButton = document.getElementById("image-viewer-close");

  if (!viewer || !stage || !image || !closeButton) return;

  const MIN_SCALE = 1;
  const MAX_SCALE = 8;

  let scale = 1;
  let x = 0;
  let y = 0;

  let targetScale = 1;
  let targetX = 0;
  let targetY = 0;

  let animationFrame = null;
  let mouseDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartTranslateX = 0;
  let dragStartTranslateY = 0;

  let pinchStartDistance = 0;
  let pinchStartScale = 1;
  let pinchStartCenterX = 0;
  let pinchStartCenterY = 0;
  let pinchStartTranslateX = 0;
  let pinchStartTranslateY = 0;

  const clamp = value => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

  function applyTransform() {
    image.style.transform =
      `translate3d(-50%, -50%, 0) translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }

  function stopAnimation() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  function animateToTarget() {
    const ease = 0.24;

    scale += (targetScale - scale) * ease;
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;

    if (
      Math.abs(targetScale - scale) < 0.001 &&
      Math.abs(targetX - x) < 0.1 &&
      Math.abs(targetY - y) < 0.1
    ) {
      scale = targetScale;
      x = targetX;
      y = targetY;
      applyTransform();
      animationFrame = null;
      return;
    }

    applyTransform();
    animationFrame = requestAnimationFrame(animateToTarget);
  }

  function requestSmoothUpdate() {
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(animateToTarget);
    }
  }

  function resetTransform() {
    stopAnimation();
    scale = 1;
    x = 0;
    y = 0;
    targetScale = 1;
    targetX = 0;
    targetY = 0;
    applyTransform();
  }

  function openViewer(src, alt) {
    image.src = src;
    image.alt = alt || "Painting";
    resetTransform();
    viewer.classList.add("open");
    viewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("viewer-open");
  }

  function closeViewer() {
    stopAnimation();
    viewer.classList.remove("open");
    viewer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("viewer-open");
    resetTransform();
  }

  document.addEventListener("click", event => {
    const target = event.target.closest("[data-viewer-src]");
    if (!target) return;
    event.preventDefault();
    openViewer(target.dataset.viewerSrc, target.dataset.viewerAlt);
  });

  closeButton.addEventListener("click", closeViewer);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && viewer.classList.contains("open")) {
      closeViewer();
    }
  });

  stage.addEventListener("wheel", event => {
    event.preventDefault();

    const rect = stage.getBoundingClientRect();
    const pointerX = event.clientX - rect.left - rect.width / 2;
    const pointerY = event.clientY - rect.top - rect.height / 2;

    const oldScale = targetScale;
    const zoomFactor = Math.exp(-event.deltaY * 0.0015);
    targetScale = clamp(targetScale * zoomFactor);

    if (targetScale <= MIN_SCALE + 0.001) {
      targetScale = MIN_SCALE;
      targetX = 0;
      targetY = 0;
    } else {
      const ratio = targetScale / oldScale;
      targetX = pointerX - (pointerX - targetX) * ratio;
      targetY = pointerY - (pointerY - targetY) * ratio;
    }

    requestSmoothUpdate();
  }, { passive: false });

  stage.addEventListener("mousedown", event => {
    if (targetScale <= 1) return;

    stopAnimation();
    scale = targetScale;
    x = targetX;
    y = targetY;

    mouseDragging = true;
    stage.classList.add("dragging");

    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartTranslateX = x;
    dragStartTranslateY = y;
  });

  window.addEventListener("mousemove", event => {
    if (!mouseDragging) return;

    x = dragStartTranslateX + (event.clientX - dragStartX);
    y = dragStartTranslateY + (event.clientY - dragStartY);
    targetX = x;
    targetY = y;
    applyTransform();
  });

  window.addEventListener("mouseup", () => {
    mouseDragging = false;
    stage.classList.remove("dragging");
  });

  stage.addEventListener("touchstart", event => {
    if (event.touches.length === 2) {
      stopAnimation();

      const a = event.touches[0];
      const b = event.touches[1];

      pinchStartDistance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      pinchStartScale = scale;

      pinchStartCenterX = (a.clientX + b.clientX) / 2;
      pinchStartCenterY = (a.clientY + b.clientY) / 2;

      pinchStartTranslateX = x;
      pinchStartTranslateY = y;
    } else if (event.touches.length === 1 && scale > 1) {
      stopAnimation();

      const t = event.touches[0];
      mouseDragging = true;

      dragStartX = t.clientX;
      dragStartY = t.clientY;
      dragStartTranslateX = x;
      dragStartTranslateY = y;
    }
  }, { passive: false });

  stage.addEventListener("touchmove", event => {
    event.preventDefault();

    if (event.touches.length === 2 && pinchStartDistance > 0) {
      const a = event.touches[0];
      const b = event.touches[1];

      const distance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      const newScale = clamp(pinchStartScale * (distance / pinchStartDistance));

      const centerX = (a.clientX + b.clientX) / 2;
      const centerY = (a.clientY + b.clientY) / 2;

      const stageRect = stage.getBoundingClientRect();
      const baseCenterX = stageRect.left + stageRect.width / 2;
      const baseCenterY = stageRect.top + stageRect.height / 2;

      const startLocalX = pinchStartCenterX - baseCenterX;
      const startLocalY = pinchStartCenterY - baseCenterY;
      const currentLocalX = centerX - baseCenterX;
      const currentLocalY = centerY - baseCenterY;

      const ratio = newScale / pinchStartScale;

      x = currentLocalX - (startLocalX - pinchStartTranslateX) * ratio;
      y = currentLocalY - (startLocalY - pinchStartTranslateY) * ratio;
      scale = newScale;

      targetScale = scale;
      targetX = x;
      targetY = y;

      applyTransform();
      return;
    }

    if (event.touches.length === 1 && mouseDragging && scale > 1) {
      const t = event.touches[0];

      x = dragStartTranslateX + (t.clientX - dragStartX);
      y = dragStartTranslateY + (t.clientY - dragStartY);

      targetX = x;
      targetY = y;

      applyTransform();
    }
  }, { passive: false });

  stage.addEventListener("touchend", event => {
    if (event.touches.length < 2) {
      pinchStartDistance = 0;
    }

    if (event.touches.length === 0) {
      mouseDragging = false;

      if (scale <= 1.01) {
        scale = 1;
        x = 0;
        y = 0;
        targetScale = 1;
        targetX = 0;
        targetY = 0;
        applyTransform();
      }
    }
  });

  stage.addEventListener("dblclick", event => {
    const rect = stage.getBoundingClientRect();
    const pointerX = event.clientX - rect.left - rect.width / 2;
    const pointerY = event.clientY - rect.top - rect.height / 2;

    if (targetScale <= 1.01) {
      targetScale = 2.5;
      targetX = -pointerX * 1.5;
      targetY = -pointerY * 1.5;
    } else {
      targetScale = 1;
      targetX = 0;
      targetY = 0;
    }

    requestSmoothUpdate();
  });
}

function initialiseAboutToggle() {
  const button = document.getElementById("about-toggle");
  const full = document.getElementById("about-full");

  if (!button || !full) return;

  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    full.hidden = isOpen;
    button.textContent = isOpen ? "See more" : "See less";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initialiseMenu();
  setYear();
  initialiseGeneralWhatsApp();
  initialiseFilters();
  initialiseImageViewer();
  initialiseAboutToggle();
});
