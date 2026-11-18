// Turns a request form into a pre-filled email (no server or third-party form service needed).
document.querySelectorAll("form.request").forEach(form => {
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const f = new FormData(form);
    const lines = [
      ["Name", f.get("name")], ["Email", f.get("email")], ["Phone", f.get("phone")],
      ["Event date", f.get("date")], ["Guests", f.get("guests")]
    ].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
    const body = `${lines.join("\n")}\n\n${f.get("message") || ""}`;
    const subject = `${form.dataset.topic} from ${f.get("name")}`;
    window.location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
});
