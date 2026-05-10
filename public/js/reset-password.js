const resetPasswordForm = document.getElementById("resetPasswordForm");

resetPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formMessage = document.getElementById("formMessage");
  formMessage.textContent = "";

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    formMessage.textContent = "Reset token is missing.";
    formMessage.className = "form-message error";
    return;
  }

  const password = document.getElementById("password").value;

  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token,
      password
    })
  });

  const data = await response.json();

  if (data.success) {
    formMessage.textContent = data.message;
    formMessage.className = "form-message success";

    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1500);
  } else {
    formMessage.textContent = data.message;
    formMessage.className = "form-message error";
  }
});