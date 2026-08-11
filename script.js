const WHATSAPP_NUMBER = "27000000000";

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
      ? `<p class="painting-price">${painting.price}</p>`
      : `<p class="painting-status">Previous work</p>`;

  const action =
    painting.status === "for-sale"
      ? `<div class="painting-actions">
          <a
            class="primary-button"
            href="${whatsappUrl(`Hi, I would like to ask about the painting "${painting.title}".`)}"
            target="_blank"
            rel="noopener"
          >Contact Artist</a>
        </div>`
      : "";

  return `
    <article class="painting-card" data-category="${painting.category}">
      <div class="painting-image-wrap">
        <img class="painting-image" src="${painting.image}" alt="${painting.title}">
      </div>
      <div class="painting-meta">
        <div>
          <h2 class="painting-title">${painting.title}</h2>
          <p class="painting-category">${painting.categoryLabel}</p>
        </div>
        ${priceOrStatus}
      </div>
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

document.addEventListener("DOMContentLoaded", () => {
  initialiseMenu();
  setYear();
  initialiseGeneralWhatsApp();
  initialiseFilters();
});
