// Turns a request form into a pre-filled email (no server or third-party form service needed).
// Field labels come from data-l-* attributes so the email matches the page language.
document.querySelectorAll("form.request").forEach(form => {
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const f = new FormData(form), d = form.dataset;
    const lines = [["name", d.lName], ["email", d.lEmail], ["phone", d.lPhone], ["date", d.lDate], ["guests", d.lGuests]]
      .filter(([k]) => f.get(k)).map(([k, label]) => `${label}: ${f.get(k)}`);
    const body = `${lines.join("\n")}\n\n${f.get("message") || ""}`;
    const subject = `${d.topic} ${d.from || "from"} ${f.get("name")}`;
    window.location.href = `mailto:${d.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
});
