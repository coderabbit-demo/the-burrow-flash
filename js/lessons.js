(function () {
  "use strict";
  const checks = [...document.querySelectorAll("[data-lesson]")];
  let completed = {};
  try {
    const stored = JSON.parse(localStorage.getItem("burrow-flash.lessons"));
    if (stored && typeof stored === "object" && !Array.isArray(stored))
      completed = stored;
  } catch (_) {
    /* In-memory checkmarks still work. */
  }
  function update() {
    document.getElementById("progress").textContent =
      `${checks.filter((check) => check.checked).length} of 5 field notes completed`;
  }
  function save() {
    try {
      localStorage.setItem("burrow-flash.lessons", JSON.stringify(completed));
    } catch (_) {
      /* No persistence is required to read the guide. */
    }
  }
  checks.forEach((check) => {
    check.checked = completed[check.dataset.lesson] === true;
    check.addEventListener("change", () => {
      completed[check.dataset.lesson] = check.checked;
      save();
      update();
    });
  });
  document.getElementById("reset-lessons").addEventListener("click", () => {
    completed = {};
    checks.forEach((check) => {
      check.checked = false;
    });
    save();
    update();
  });
  document.querySelectorAll("[data-copy]").forEach((button) =>
    button.addEventListener("click", async () => {
      const source = document.getElementById(button.dataset.copy),
        status = document.getElementById("copy-status");
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText)
          throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(source.textContent);
        button.textContent = "Copied";
        status.textContent = "Copied to clipboard.";
      } catch (_) {
        const range = document.createRange();
        range.selectNodeContents(source);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        source.focus();
        button.textContent = "Text selected";
        status.textContent =
          "Text selected. Press Command+C or Ctrl+C to copy.";
      }
      setTimeout(() => {
        button.textContent = "Copy";
      }, 2500);
    }),
  );
  update();
})();
