// Theme toggle logic
document.addEventListener("DOMContentLoaded", () => {
  const themeToggleBtn = document.getElementById("theme-toggle");
  if (!themeToggleBtn) return;

  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    // Apply theme immediately
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Dispatch global event for other components (like Leaflet map) to listen to
    window.dispatchEvent(new CustomEvent("theme-change", { detail: { theme: newTheme } }));
  });
});
