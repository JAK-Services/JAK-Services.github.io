// Handles contact form submission via Formspree.
// Provides user feedback for success, errors, and offline states.
// Supports redirects and legacy element IDs.

(() => {

  // Updates a status element with a message and visual state.
  // Clears previous status styles before applying new ones.
  // Safely exits if the element is missing.
  function setStatus(el, msg, type) {
    if (!el) return;
    el.textContent = msg || "";
    el.classList.remove("ok", "error");
    if (type) el.classList.add(type);
  }

  // Finds the first existing element from a list of IDs.
  // Allows backward compatibility with legacy markup.
  // Returns null if no matching element is found.
  function getFirstExisting(ids) {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  document.addEventListener("DOMContentLoaded", () => {

    // Locate the contact form using the preferred identifier.
    // Abort early if the form is not present.
    // Prevents unnecessary listeners on unrelated pages.
    const form = document.getElementById("contact-form");
    if (!form) return;

    // Resolve the status element with support for legacy IDs.
    // Ensures compatibility across language versions.
    // Used to display submission feedback.
    const statusEl =
      getFirstExisting(["form-status", "form-status-en", "form-status-fr"]);

    // Resolve user-facing messages from data attributes.
    // Falls back to default English messages.
    // Allows per-form customization.
    const okMsg =
      form.dataset.ok ||
      "Thank you, your message has been sent.";

    const errorMsg =
      form.dataset.error ||
      "An error occurred. Please try again later.";

    const offlineMsg =
      form.dataset.offline ||
      "Unable to send the message. Please check your connection.";

    // Resolve optional redirect destination after success.
    // Supports absolute or relative URLs.
    // Skipped if no redirect is configured.
    const redirectUrl = form.dataset.redirect || "";

    form.addEventListener("submit", async (event) => {

      // Intercept native form submission behavior.
      // Reset any previous status message.
      // Continue with client-side handling.
      event.preventDefault();
      setStatus(statusEl, "", null);

      // Perform built-in browser form validation.
      // Surface validation errors to the user.
      // Abort submission if validation fails.
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Serialize form fields for submission.
      // Uses FormData for compatibility.
      // Preserves native form semantics.
      const formData = new FormData(form);

      try {
        // Submit form data to the configured endpoint.
        // Expect a JSON response from the service.
        // Use the form's configured HTTP method.
        const response = await fetch(form.action, {
          method: form.method || "POST",
          headers: { Accept: "application/json" },
          body: formData,
        });

        if (response.ok) {

          // Reset the form and show success feedback.
          // Optionally redirect after a short delay.
          // Delay allows users to perceive the status change.
          form.reset();
          setStatus(statusEl, okMsg, "ok");

          if (redirectUrl) {
            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 150);
          }
        } else {

          // Handle server-side errors gracefully.
          // Display a generic error message.
          setStatus(statusEl, errorMsg, "error");
        }
      } catch (err) {

        // Handle network or connectivity failures.
        // Inform the user of offline conditions.
        setStatus(statusEl, offlineMsg, "error");
      }
    });
  });
})();
