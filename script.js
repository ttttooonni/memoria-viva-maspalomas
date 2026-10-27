(() => {
  const config = window.MEMORIA_VIVA_CONFIG || {};
  const toast = document.getElementById("toast");
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    window.setTimeout(() => toast.classList.remove("visible"), 4200);
  };
  document.querySelectorAll(".js-whatsapp").forEach((link) => {
    const message = link.dataset.message || "Hola, quiero información sobre Memoria Viva Maspalomas.";
    const number = String(config.whatsappNumber || "").replace(/\D/g, "");
    if (number.length >= 8) {
      link.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.removeAttribute("aria-disabled");
    } else {
      link.href = "#contacto";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        showToast("WhatsApp está pendiente de configurar.");
      });
    }
  });
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("nav-menu");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      toggle.textContent = open ? "×" : "☰";
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
      toggle.textContent = "☰";
    }));
  }
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();