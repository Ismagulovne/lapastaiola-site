// Closes the menu and language dropdowns on outside click or Escape.
(() => {
  const close = except => document.querySelectorAll("details.lang[open], details.menu[open]").forEach(d => { if (d !== except) d.open = false; });
  document.addEventListener("click", e => close(e.target.closest("details")));
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(null); });
})();
