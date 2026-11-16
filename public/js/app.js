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

  document.querySelectorAll("[data-auto-submit-input]").forEach((input) => {
    input.addEventListener("change", () => {
      const form = input.closest("form");
      if (form) {
        form.requestSubmit();
      }
    });
  });

  document.querySelectorAll("[data-order-flag-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector("button[type='submit']");
      const actionInput = form.querySelector("input[name='action']");
      const action = actionInput?.value;
      const orderLine = form.closest("[data-order-line]");
      const summaryRow = form.closest("[data-order-summary-row]");
      const requestUrl = form.getAttribute("data-order-flag-url") || form.getAttribute("action") || "";

      if (!submitButton || !action || !orderLine || !requestUrl) {
        return;
      }

      const formData = new FormData(form);
      const requestBody = new URLSearchParams();
      formData.forEach((value, key) => {
        requestBody.append(key, value);
      });

      submitButton.disabled = true;

      try {
        const response = await fetch(requestUrl, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          body: requestBody.toString()
        });
        const responseText = await response.text();
        let data;

        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error("Serveren svarte ikke med gyldig JSON. Prøv å laste siden på nytt.");
        }

        if (!response.ok || !data.success) {
          throw new Error(data.message || `Kunne ikke oppdatere status (${response.status}).`);
        }

        submitButton.classList.toggle("is-active", Boolean(data.active));

        const historyNode = orderLine.querySelector(`[data-flag-history='${action}']`);
        if (historyNode) {
          historyNode.textContent = data.active
            ? `${action === "paid" ? "Betalt" : "Hentet"} ${data.timestamp}`
            : action === "paid"
              ? "Ikke betalt"
              : "Ikke hentet";
        }

        if (summaryRow) {
          const countNode = summaryRow.querySelector(`[data-flag-count='${action}']`);
          if (countNode) {
            const activeCount = summaryRow.querySelectorAll(`[data-flag-button='${action}'].is-active`).length;
            countNode.textContent = String(activeCount);
          }
        }
      } catch (error) {
        window.alert(error.message || "Kunne ikke oppdatere status.");
      } finally {
        submitButton.disabled = false;
      }
    });
  });

  document.querySelectorAll("[data-product-price-form]").forEach((form) => {
    const input = form.querySelector("input[name='price']");
    const feedback = form.querySelector("[data-price-feedback]");
    const retryButton = form.querySelector("[data-price-retry]");
    const csrfInput = form.querySelector("input[name='_csrf']");
    let savedValue = input.value.trim().replace(",", ".");
    let timer;
    let saving = false;
    let queued = false;
    let revision = 0;
    let needsRetry = false;

    const showFeedback = (message, state = "") => {
      feedback.textContent = message;
      feedback.classList.toggle("is-error", state === "error");
      feedback.classList.toggle("is-success", state === "success");
      retryButton.hidden = state !== "error";
    };

    const savePrice = async () => {
      clearTimeout(timer);
      timer = undefined;
      if (saving) {
        queued = true;
        return;
      }

      const rawValue = input.value.trim();
      if (rawValue && !input.checkValidity()) {
        input.setAttribute("aria-invalid", "true");
        showFeedback("Skriv en pris med høyst to desimaler.", "error");
        return;
      }

      const numericValue = Number(rawValue.replace(",", "."));
      if (rawValue && (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 99999999.99)) {
        input.setAttribute("aria-invalid", "true");
        showFeedback("Pris må være mellom 0 og 99 999 999,99 kr.", "error");
        return;
      }

      input.removeAttribute("aria-invalid");
      const value = rawValue ? numericValue.toFixed(2) : "";
      if (value === savedValue && !needsRetry) {
        showFeedback(value ? "Pris lagret." : "Pris ikke satt.", "success");
        return;
      }

      const submittedRevision = revision;
      saving = true;
      queued = false;
      form.setAttribute("aria-busy", "true");
      showFeedback("Lagrer...");

      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          body: new URLSearchParams({ _csrf: csrfInput.value, price: value }).toString(),
          keepalive: true
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Kunne ikke lagre prisen. Prøv igjen.");
        }

        savedValue = data.price ?? "";
        needsRetry = false;
        if (revision === submittedRevision) {
          input.value = savedValue.replace(".", ",");
          showFeedback(data.message || "Pris lagret.", "success");
        }
      } catch (error) {
        needsRetry = true;
        if (revision === submittedRevision) {
          showFeedback("Kunne ikke lagre. " + (error.message || "Prøv igjen."), "error");
        }
      } finally {
        saving = false;
        form.removeAttribute("aria-busy");
        if (queued) {
          queued = false;
          savePrice();
        }
      }
    };

    input.addEventListener("input", () => {
      revision += 1;
      input.removeAttribute("aria-invalid");
      clearTimeout(timer);
      showFeedback("Venter på lagring...");
      timer = setTimeout(savePrice, 600);
    });
    input.addEventListener("change", savePrice);
    input.addEventListener("blur", savePrice);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      savePrice();
    });
    form.querySelectorAll("[data-price-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        input.value = button.getAttribute("data-price-preset");
        revision += 1;
        savePrice();
      });
    });
    window.addEventListener("beforeunload", (event) => {
      const value = input.value.trim().replace(",", ".");
      const normalizedValue = value && Number.isFinite(Number(value)) ? Number(value).toFixed(2) : value;
      if (saving || needsRetry || normalizedValue !== savedValue) {
        event.preventDefault();
        event.returnValue = "";
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
