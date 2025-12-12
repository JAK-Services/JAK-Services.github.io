// js/formspree.js
(() => {
  function setStatus(el, msg, type) {
    if (!el) return;
    el.textContent = msg || "";
    el.classList.remove("ok", "error");
    if (type) el.classList.add(type);
  }

  function getFirstExisting(ids) {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Prefer new single-language ids:
    //   form id: contact-form
    //   status id: form-status
    // But also support your old ones (form-status-en / form-status-fr).
    const form = document.getElementById("contact-form");
    if (!form) return;

    const statusEl =
      getFirstExisting(["form-status", "form-status-en", "form-status-fr"]);

    const okMsg =
      form.dataset.ok ||
      "Thank you, your message has been sent.";

    const errorMsg =
      form.dataset.error ||
      "An error occurred. Please try again later.";

    const offlineMsg =
      form.dataset.offline ||
      "Unable to send the message. Please check your connection.";

    // Use an absolute or relative URL, e.g. "/en/thanks.html" or "thanks.html"
    const redirectUrl = form.dataset.redirect || "";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      setStatus(statusEl, "", null);

      // built-in validation
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);

      try {
        const response = await fetch(form.action, {
          method: form.method || "POST",
          headers: { Accept: "application/json" },
          body: formData,
        });

        if (response.ok) {
          form.reset();
          setStatus(statusEl, okMsg, "ok");

          if (redirectUrl) {
            // small delay so screen readers/users can see the success message
            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 150);
          }
        } else {
          setStatus(statusEl, errorMsg, "error");
        }
      } catch (err) {
        setStatus(statusEl, offlineMsg, "error");
      }
    });
  });
})();
