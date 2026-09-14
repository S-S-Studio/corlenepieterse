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

  let scale = 1;
  let x = 0;
  let y = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startTranslateX = 0;
  let startTranslateY = 0;
  let initialPinchDistance = 0;
  let initialPinchScale = 1;

  const clamp = value => Math.min(6, Math.max(1, value));

  function apply() {
    image.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
  }

  function reset() {
    scale = 1;
    x = 0;
    y = 0;
    apply();
  }

  function openViewer(src, alt) {
    image.src = src;
    image.alt = alt || "Painting";
    reset();
    viewer.classList.add("open");
    viewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("viewer-open");
  }

  function closeViewer() {
    viewer.classList.remove("open");
    viewer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("viewer-open");
    reset();
  }

  document.addEventListener("click", event => {
    const target = event.target.closest("[data-viewer-src]");
    if (!target) return;
    event.preventDefault();
    openViewer(target.dataset.viewerSrc, target.dataset.viewerAlt);
  });

  closeButton.addEventListener("click", closeViewer);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && viewer.classList.contains("open")) closeViewer();
  });

  stage.addEventListener("wheel", event => {
    event.preventDefault();
    scale = clamp(scale * (event.deltaY < 0 ? 1.12 : 0.89));
    if (scale === 1) {
      x = 0;
      y = 0;
    }
    apply();
  }, { passive: false });

  stage.addEventListener("mousedown", event => {
    if (scale <= 1) return;
    dragging = true;
    stage.classList.add("dragging");
    startX = event.clientX;
    startY = event.clientY;
    startTranslateX = x;
    startTranslateY = y;
  });

  window.addEventListener("mousemove", event => {
    if (!dragging) return;
    x = startTranslateX + event.clientX - startX;
    y = startTranslateY + event.clientY - startY;
    apply();
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    stage.classList.remove("dragging");
  });

  stage.addEventListener("touchstart", event => {
    if (event.touches.length === 2) {
      const a = event.touches[0];
      const b = event.touches[1];
      initialPinchDistance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      initialPinchScale = scale;
      dragging = false;
    } else if (event.touches.length === 1 && scale > 1) {
      const t = event.touches[0];
      dragging = true;
      startX = t.clientX;
      startY = t.clientY;
      startTranslateX = x;
      startTranslateY = y;
    }
  }, { passive: false });

  stage.addEventListener("touchmove", event => {
    event.preventDefault();

    if (event.touches.length === 2 && initialPinchDistance > 0) {
      const a = event.touches[0];
      const b = event.touches[1];
      const distance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      scale = clamp(initialPinchScale * distance / initialPinchDistance);
      if (scale === 1) {
        x = 0;
        y = 0;
      }
      apply();
      return;
    }

    if (event.touches.length === 1 && dragging && scale > 1) {
      const t = event.touches[0];
      x = startTranslateX + t.clientX - startX;
      y = startTranslateY + t.clientY - startY;
      apply();
    }
  }, { passive: false });

  stage.addEventListener("touchend", event => {
    if (event.touches.length < 2) initialPinchDistance = 0;
    if (event.touches.length === 0) dragging = false;
  });

  stage.addEventListener("dblclick", () => {
    if (scale === 1) scale = 2;
    else {
      scale = 1;
      x = 0;
      y = 0;
    }
    apply();
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
