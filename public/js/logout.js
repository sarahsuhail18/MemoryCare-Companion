const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const response = await fetch("/api/auth/logout", {
      method: "POST"
    });

    const data = await response.json();

    if (data.success) {
      window.location.href = "/login.html";
    }
  });
}