document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navMenu = document.querySelector("[data-nav-menu]");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  document.querySelectorAll("[data-quantity-widget]").forEach((widget) => {
    const input = widget.querySelector("input[type='number']");
    const minusButton = widget.querySelector("[data-action='minus']");
    const plusButton = widget.querySelector("[data-action='plus']");

    if (!input || !minusButton || !plusButton) {
      return;
    }

    minusButton.addEventListener("click", () => {
      const currentValue = Number(input.value || 0);
      const step = Number(minusButton.getAttribute("data-step") || input.step || 1);
      input.value = String(Math.max(0, currentValue - step));
    });

    plusButton.addEventListener("click", () => {
      const currentValue = Number(input.value || 0);
      const step = Number(plusButton.getAttribute("data-step") || input.step || 1);
      const max = input.max ? Number(input.max) : Number.POSITIVE_INFINITY;
      input.value = String(Math.min(max, currentValue + step));
    });
  });

  document.querySelectorAll("[data-confirm]").forEach((element) => {
    element.addEventListener("submit", (event) => {
      const message = element.getAttribute("data-confirm");
      if (!window.confirm(message)) {
        event.preventDefault();
      }
    });
  });

  const adminProductSearch = document.querySelector("[data-admin-product-search]");
  const adminProductRows = Array.from(document.querySelectorAll("[data-admin-product-row]"));
  const adminProductSearchFeedback = document.querySelector("[data-admin-product-search-feedback]");
  const adminProductEmpty = document.querySelector("[data-admin-product-empty]");
  const adminProductsTableBody = document.querySelector("[data-admin-products-table-body]");

  if (adminProductSearch && adminProductRows.length) {
    const updateAdminProductSearch = () => {
      const query = adminProductSearch.value.trim().toLowerCase();
      let visibleCount = 0;

      adminProductRows.forEach((row) => {
        const haystack = row.getAttribute("data-product-search-text") || "";
        const matches = !query || haystack.includes(query);

        row.hidden = !matches;

        if (matches) {
          visibleCount += 1;
        }
      });

      if (adminProductSearchFeedback) {
        adminProductSearchFeedback.textContent = query
          ? `Viser ${visibleCount} treff for "${adminProductSearch.value.trim()}".`
          : `Viser alle ${adminProductRows.length} varer.`;
      }

      if (adminProductEmpty) {
        adminProductEmpty.hidden = visibleCount !== 0;
      }

      if (adminProductsTableBody) {
        adminProductsTableBody.parentElement.hidden = visibleCount === 0;
      }
    };

    adminProductSearch.addEventListener("input", updateAdminProductSearch);
    updateAdminProductSearch();
  }

  const productSearch = document.querySelector("[data-product-search]");
  const productCards = Array.from(document.querySelectorAll("[data-product-card]"));
  const productSearchFeedback = document.querySelector("[data-product-search-feedback]");
  const productSearchEmpty = document.querySelector("[data-product-search-empty]");
  const productsGrid = document.querySelector("[data-products-grid]");

  if (productSearch && productCards.length) {
    const updateProductSearch = () => {
      const query = productSearch.value.trim().toLowerCase();
      let visibleCount = 0;

      productCards.forEach((card) => {
        const haystack = card.getAttribute("data-product-search-text") || "";
        const matches = !query || haystack.includes(query);

        card.hidden = !matches;

        if (matches) {
          visibleCount += 1;
        }
      });

      if (productSearchFeedback) {
        productSearchFeedback.textContent = query
          ? `Viser ${visibleCount} treff for "${productSearch.value.trim()}".`
          : `Viser alle ${productCards.length} produkter.`;
      }

      if (productSearchEmpty) {
        productSearchEmpty.hidden = visibleCount !== 0;
      }

      if (productsGrid) {
        productsGrid.hidden = visibleCount === 0;
      }
    };

    productSearch.addEventListener("input", updateProductSearch);
    updateProductSearch();
  }

  document.querySelectorAll("[data-async-order-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector("button[type='submit']");
      const feedback = form.querySelector("[data-order-feedback]");
      const quantityInput = form.querySelector("input[name='quantity']");
      const productCard = form.closest("[data-product-card]");
      const currentQuantity = productCard?.querySelector("[data-current-quantity]");
      const totalOrdered = productCard?.querySelector("[data-total-ordered]");
      const formData = new FormData(form);
      const requestBody = new URLSearchParams();

      formData.forEach((value, key) => {
        requestBody.append(key, value);
      });

      if (submitButton) {
        submitButton.disabled = true;
      }

      if (feedback) {
        feedback.textContent = "Lagrer...";
        feedback.classList.remove("is-error", "is-success");
      }

      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          body: requestBody.toString()
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Kunne ikke lagre bestillingen.");
        }

        if (currentQuantity && quantityInput) {
          currentQuantity.textContent = quantityInput.value;
        }

        if (totalOrdered && typeof data.totalOrdered !== "undefined") {
          totalOrdered.textContent = data.totalOrdered;
        }

        if (feedback) {
          feedback.textContent = data.message || "Bestillingen ble lagret.";
          feedback.classList.add("is-success");
        }
      } catch (error) {
        if (feedback) {
          feedback.textContent = error.message || "Kunne ikke lagre bestillingen.";
          feedback.classList.add("is-error");
        }
      } finally {
        if (submitButton && !submitButton.hasAttribute("data-original-disabled")) {
          submitButton.disabled = false;
        }
      }
    });
  });
});
