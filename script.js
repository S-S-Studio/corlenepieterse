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

  const shareTitle = painting.title
    ? `${painting.title} — Corléne Pieterse`
    : `${painting.categoryLabel} previous painting — Corléne Pieterse`;

  const shareUrl = `?painting=${painting.id}#painting-${painting.id}`;

  const contactButton =
    painting.status === "for-sale"
      ? `<a
          class="primary-button"
          href="${whatsappUrl(`Hi, I would like to ask about the painting "${painting.title || "this painting"}".`)}"
          target="_blank"
          rel="noopener"
        >Contact Artist</a>`
      : "";

  return `
    <article
      class="painting-card"
      id="painting-${painting.id}"
      data-category="${painting.category}"
      data-painting-id="${painting.id}"
    >
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

      <div class="painting-actions">
        ${contactButton}
        <button
          class="share-button"
          type="button"
          data-share-title="${shareTitle.replace(/"/g, "&quot;")}"
          data-share-url="${shareUrl}"
        >Share</button>
      </div>
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

  let baseWidth = 0;
  let baseHeight = 0;

  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  let targetScale = 1;
  let targetX = 0;
  let targetY = 0;
  let animationFrame = null;

  const pointers = new Map();
  let gestureMode = null;
  let dragStart = null;
  let pinchStart = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function stageSize() {
    return {
      width: stage.clientWidth || window.innerWidth,
      height: stage.clientHeight || window.innerHeight,
    };
  }

  function clampPan(x, y, atScale = scale) {
    const size = stageSize();
    const scaledWidth = baseWidth * atScale;
    const scaledHeight = baseHeight * atScale;

    const maxX = Math.max(0, (scaledWidth - size.width) / 2);
    const maxY = Math.max(0, (scaledHeight - size.height) / 2);

    return {
      x: clamp(x, -maxX, maxX),
      y: clamp(y, -maxY, maxY),
    };
  }

  function applyTransform() {
    image.style.transform =
      `translate3d(-50%, -50%, 0) translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
  }

  function stopAnimation() {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  function animateToTarget() {
    const ease = 0.22;

    scale += (targetScale - scale) * ease;
    translateX += (targetX - translateX) * ease;
    translateY += (targetY - translateY) * ease;

    if (
      Math.abs(targetScale - scale) < 0.001 &&
      Math.abs(targetX - translateX) < 0.15 &&
      Math.abs(targetY - translateY) < 0.15
    ) {
      scale = targetScale;
      translateX = targetX;
      translateY = targetY;
      applyTransform();
      animationFrame = null;
      return;
    }

    applyTransform();
    animationFrame = requestAnimationFrame(animateToTarget);
  }

  function requestSmoothUpdate() {
    if (animationFrame === null) {
      animationFrame = requestAnimationFrame(animateToTarget);
    }
  }

  function resetTransform() {
    stopAnimation();
    scale = 1;
    translateX = 0;
    translateY = 0;
    targetScale = 1;
    targetX = 0;
    targetY = 0;
    applyTransform();
  }

  function fitImageToStage() {
    if (!image.naturalWidth || !image.naturalHeight) return;

    const size = stageSize();
    const maxWidth = Math.max(1, size.width - 24);
    const maxHeight = Math.max(1, size.height - 24);

    // Intentionally allow upscaling so older/smaller photos don't open tiny.
    const fitRatio = Math.min(
      maxWidth / image.naturalWidth,
      maxHeight / image.naturalHeight
    );

    baseWidth = image.naturalWidth * fitRatio;
    baseHeight = image.naturalHeight * fitRatio;

    image.style.width = `${baseWidth}px`;
    image.style.height = `${baseHeight}px`;

    resetTransform();
  }

  function openViewer(src, alt) {
    viewer.classList.add("open");
    viewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("viewer-open");

    image.alt = alt || "Painting";

    if (image.getAttribute("src") === src && image.complete && image.naturalWidth) {
      fitImageToStage();
    } else {
      image.onload = fitImageToStage;
      image.src = src;
    }
  }

  function closeViewer() {
    stopAnimation();
    pointers.clear();
    gestureMode = null;
    viewer.classList.remove("open");
    viewer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("viewer-open");
    resetTransform();
  }

  function localPoint(clientX, clientY) {
    const rect = stage.getBoundingClientRect();
    return {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };
  }

  function zoomAround(clientX, clientY, newScale, smooth = true) {
    newScale = clamp(newScale, MIN_SCALE, MAX_SCALE);

    const point = localPoint(clientX, clientY);
    const currentScale = smooth ? targetScale : scale;
    const currentX = smooth ? targetX : translateX;
    const currentY = smooth ? targetY : translateY;

    const contentX = (point.x - currentX) / currentScale;
    const contentY = (point.y - currentY) / currentScale;

    let nextX = point.x - contentX * newScale;
    let nextY = point.y - contentY * newScale;

    if (newScale <= 1.001) {
      newScale = 1;
      nextX = 0;
      nextY = 0;
    }

    const clamped = clampPan(nextX, nextY, newScale);

    if (smooth) {
      targetScale = newScale;
      targetX = clamped.x;
      targetY = clamped.y;
      requestSmoothUpdate();
    } else {
      stopAnimation();
      scale = newScale;
      translateX = clamped.x;
      translateY = clamped.y;
      targetScale = scale;
      targetX = translateX;
      targetY = translateY;
      applyTransform();
    }
  }

  function beginDrag(pointer) {
    stopAnimation();
    targetScale = scale;
    targetX = translateX;
    targetY = translateY;
    gestureMode = "drag";
    dragStart = {
      pointerId: pointer.pointerId,
      clientX: pointer.clientX,
      clientY: pointer.clientY,
      x: translateX,
      y: translateY,
    };
    stage.classList.add("dragging");
  }

  function beginPinch() {
    if (pointers.size < 2) return;

    stopAnimation();

    const [a, b] = [...pointers.values()].slice(0, 2);
    const dx = b.clientX - a.clientX;
    const dy = b.clientY - a.clientY;
    const distance = Math.hypot(dx, dy) || 1;
    const midpointX = (a.clientX + b.clientX) / 2;
    const midpointY = (a.clientY + b.clientY) / 2;
    const localMid = localPoint(midpointX, midpointY);

    pinchStart = {
      distance,
      scale,
      contentX: (localMid.x - translateX) / scale,
      contentY: (localMid.y - translateY) / scale,
    };

    gestureMode = "pinch";
    stage.classList.add("dragging");
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

    const zoomFactor = Math.exp(-event.deltaY * 0.0016);
    zoomAround(
      event.clientX,
      event.clientY,
      targetScale * zoomFactor,
      true
    );
  }, { passive: false });

  stage.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    stage.setPointerCapture?.(event.pointerId);

    pointers.set(event.pointerId, {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      pointerType: event.pointerType,
    });

    if (pointers.size === 1) {
      beginDrag(event);
    } else if (pointers.size === 2) {
      beginPinch();
    }
  });

  stage.addEventListener("pointermove", event => {
    if (!pointers.has(event.pointerId)) return;

    event.preventDefault();

    pointers.set(event.pointerId, {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      pointerType: event.pointerType,
    });

    if (pointers.size >= 2) {
      if (gestureMode !== "pinch" || !pinchStart) {
        beginPinch();
      }

      const [a, b] = [...pointers.values()].slice(0, 2);
      const distance = Math.hypot(
        b.clientX - a.clientX,
        b.clientY - a.clientY
      ) || 1;

      const midpointX = (a.clientX + b.clientX) / 2;
      const midpointY = (a.clientY + b.clientY) / 2;
      const localMid = localPoint(midpointX, midpointY);

      const newScale = clamp(
        pinchStart.scale * (distance / pinchStart.distance),
        MIN_SCALE,
        MAX_SCALE
      );

      let nextX = localMid.x - pinchStart.contentX * newScale;
      let nextY = localMid.y - pinchStart.contentY * newScale;

      if (newScale <= 1.001) {
        nextX = 0;
        nextY = 0;
      }

      const clamped = clampPan(nextX, nextY, newScale);

      scale = newScale;
      translateX = clamped.x;
      translateY = clamped.y;
      targetScale = scale;
      targetX = translateX;
      targetY = translateY;
      applyTransform();
      return;
    }

    if (gestureMode === "drag" && dragStart && scale > 1.001) {
      const nextX = dragStart.x + (event.clientX - dragStart.clientX);
      const nextY = dragStart.y + (event.clientY - dragStart.clientY);
      const clamped = clampPan(nextX, nextY, scale);

      translateX = clamped.x;
      translateY = clamped.y;
      targetX = translateX;
      targetY = translateY;
      applyTransform();
    }
  }, { passive: false });

  function endPointer(event) {
    pointers.delete(event.pointerId);
    stage.releasePointerCapture?.(event.pointerId);

    if (pointers.size >= 2) {
      beginPinch();
      return;
    }

    if (pointers.size === 1) {
      const remaining = [...pointers.values()][0];
      beginDrag(remaining);
      return;
    }

    gestureMode = null;
    dragStart = null;
    pinchStart = null;
    stage.classList.remove("dragging");

    if (scale <= 1.001) {
      scale = 1;
      translateX = 0;
      translateY = 0;
      targetScale = 1;
      targetX = 0;
      targetY = 0;
      applyTransform();
    }
  }

  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);

  stage.addEventListener("dblclick", event => {
    event.preventDefault();

    if (targetScale <= 1.05) {
      zoomAround(event.clientX, event.clientY, 2.5, true);
    } else {
      targetScale = 1;
      targetX = 0;
      targetY = 0;
      requestSmoothUpdate();
    }
  });

  window.addEventListener("resize", () => {
    if (viewer.classList.contains("open") && image.complete && image.naturalWidth) {
      fitImageToStage();
    }
  });
}


function absoluteShareUrl(relativeUrl) {
  return new URL(relativeUrl, window.location.href).href;
}

function ensureShareDialog() {
  let dialog = document.getElementById("share-dialog");
  if (dialog) return dialog;

  dialog = document.createElement("div");
  dialog.id = "share-dialog";
  dialog.className = "share-dialog";
  dialog.setAttribute("aria-hidden", "true");

  dialog.innerHTML = `
    <div class="share-dialog-backdrop" data-share-close></div>
    <section class="share-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title">
      <div class="share-dialog-header">
        <h2 id="share-dialog-title">Share</h2>
        <button class="share-dialog-close" type="button" data-share-close aria-label="Close share options">×</button>
      </div>

      <p class="share-dialog-item-title" id="share-dialog-item-title"></p>

      <div class="share-options">
        <a class="share-option" id="share-whatsapp" href="#" target="_blank" rel="noopener">
          <img src="assets/images/whatsapp.svg" alt="" aria-hidden="true">
          <span>Share on WhatsApp</span>
        </a>

        <a class="share-option" id="share-facebook" href="#" target="_blank" rel="noopener">
          <img src="assets/images/facebook.svg" alt="" aria-hidden="true">
          <span>Share on Facebook</span>
        </a>

        <button class="share-option" id="share-copy" type="button">
          <span id="share-copy-label">Copy Link</span>
        </button>

        <button class="share-option" id="share-native" type="button" hidden>
          <span>More share options</span>
        </button>
      </div>
    </section>
  `;

  document.body.appendChild(dialog);
  return dialog;
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function initialiseSharing() {
  const dialog = ensureShareDialog();
  const titleElement = dialog.querySelector("#share-dialog-item-title");
  const whatsappLink = dialog.querySelector("#share-whatsapp");
  const facebookLink = dialog.querySelector("#share-facebook");
  const copyButton = dialog.querySelector("#share-copy");
  const copyLabel = dialog.querySelector("#share-copy-label");
  const nativeButton = dialog.querySelector("#share-native");

  let currentTitle = "";
  let currentUrl = "";

  function closeShareDialog() {
    dialog.classList.remove("open");
    dialog.setAttribute("aria-hidden", "true");
    document.body.classList.remove("share-dialog-open");
    copyLabel.textContent = "Copy Link";
  }

  function openShareDialog(button) {
    currentTitle = button.dataset.shareTitle || "Corléne Pieterse";
    currentUrl = absoluteShareUrl(button.dataset.shareUrl || window.location.href);

    titleElement.textContent = currentTitle;

    whatsappLink.href =
      `https://wa.me/?text=${encodeURIComponent(`${currentTitle}\n${currentUrl}`)}`;

    facebookLink.href =
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;

    nativeButton.hidden = typeof navigator.share !== "function";

    dialog.classList.add("open");
    dialog.setAttribute("aria-hidden", "false");
    document.body.classList.add("share-dialog-open");
  }

  document.addEventListener("click", event => {
    const shareButton = event.target.closest("[data-share-title][data-share-url]");
    if (shareButton) {
      event.preventDefault();
      openShareDialog(shareButton);
      return;
    }

    if (event.target.closest("[data-share-close]")) {
      closeShareDialog();
    }
  });

  copyButton.addEventListener("click", async () => {
    try {
      await copyTextToClipboard(currentUrl);
      copyLabel.textContent = "Link copied";
      window.setTimeout(() => {
        copyLabel.textContent = "Copy Link";
      }, 1800);
    } catch {
      copyLabel.textContent = "Could not copy";
    }
  });

  nativeButton.addEventListener("click", async () => {
    if (typeof navigator.share !== "function") return;

    try {
      await navigator.share({
        title: currentTitle,
        text: currentTitle,
        url: currentUrl,
      });
    } catch (error) {
      if (error && error.name !== "AbortError") {
        console.error(error);
      }
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && dialog.classList.contains("open")) {
      closeShareDialog();
    }
  });
}

function initialiseSharedDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const paintingId = params.get("painting");
  const newsId = params.get("news");

  if (paintingId) {
    window.requestAnimationFrame(() => {
      const target = document.getElementById(`painting-${paintingId}`);
      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("shared-target");
      window.setTimeout(() => target.classList.remove("shared-target"), 2400);
    });
    return;
  }

  if (newsId && window.location.hash) {
    window.requestAnimationFrame(() => {
      const target = document.querySelector(window.location.hash);
      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("shared-target");
      window.setTimeout(() => target.classList.remove("shared-target"), 2400);
    });
  }
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
  initialiseSharing();
  initialiseSharedDeepLink();
  initialiseAboutToggle();
});
