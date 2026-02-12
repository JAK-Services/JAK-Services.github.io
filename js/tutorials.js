// Enables one-click copying of tutorial code snippets.
// Connects copy buttons to their associated code blocks.
// Provides visual feedback on successful copy actions.

// Attach copy behavior to all copy buttons on the page.
document.querySelectorAll('.copy-btn').forEach(btn => {

  // Handle user interaction with a copy button.
  // Resolves the target code block.
  // Initiates clipboard copy flow.
  btn.addEventListener('click', () => {

    // Identify the code block linked to this button.
    const targetId = btn.getAttribute('data-target');
    const code = document.getElementById(targetId).innerText;

    // Copy code text to the system clipboard.
    // Provide immediate UI feedback on success.
    // Restore the original button state after a delay.
    navigator.clipboard.writeText(code).then(() => {
      const original = btn.textContent;
      btn.textContent = '✓';
      setTimeout(() => btn.textContent = original, 1500);
    }).catch(err => {

      // Report clipboard failures for debugging.
      console.error('Copy failed', err);
    });
  });
});
