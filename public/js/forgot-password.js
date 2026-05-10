const forgotPasswordForm = document.getElementById("forgotPasswordForm");

forgotPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formMessage = document.getElementById("formMessage");
  formMessage.textContent = "";

  const email = document.getElementById("email").value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    formMessage.textContent = "Please enter your email address.";
    formMessage.className = "form-message error";
    return;
  }

  if (!emailRegex.test(email)) {
    formMessage.textContent = "Please enter a valid email address.";
    formMessage.className = "form-message error";
    return;
  }

  const submitBtn = forgotPasswordForm.querySelector("button[type='submit']");
  submitBtn.textContent = "Sending...";
  submitBtn.disabled = true;

  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    formMessage.textContent = data.message;
    formMessage.className = `form-message ${data.success ? "success" : "error"}`;

    if (data.success) forgotPasswordForm.reset();
  } catch (err) {
    formMessage.textContent = "Something went wrong. Please try again.";
    formMessage.className = "form-message error";
  } finally {
    submitBtn.textContent = "Send Reset Link";
    submitBtn.disabled = false;
  }
});