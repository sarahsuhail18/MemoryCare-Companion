const loginForm = document.getElementById("loginForm");

function clearErrors() {
  ["emailError", "passwordError"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
  document.getElementById("formMessage").textContent = "";
}

function validateForm(email, password) {
  let valid = true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    document.getElementById("emailError").textContent = "Email is required.";
    valid = false;
  } else if (!emailRegex.test(email)) {
    document.getElementById("emailError").textContent = "Please enter a valid email address.";
    valid = false;
  }

  if (!password) {
    document.getElementById("passwordError").textContent = "Password is required.";
    valid = false;
  } else if (password.length < 8) {
    document.getElementById("passwordError").textContent = "Password must be at least 8 characters.";
    valid = false;
  }

  return valid;
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!validateForm(email, password)) return;

  const formMessage = document.getElementById("formMessage");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      formMessage.textContent = "Login successful! Redirecting...";
      formMessage.className = "form-message success";
      window.location.href = data.redirectUrl;
    } else {
      formMessage.textContent = data.message;
      formMessage.className = "form-message error";
    }
  } catch (err) {
    formMessage.textContent = "Something went wrong. Please try again.";
    formMessage.className = "form-message error";
  }
});