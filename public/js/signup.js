const signupForm = document.getElementById("signupForm");

function clearErrors() {
  ["fullNameError", "emailError", "passwordError", "roleError"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
  const msg = document.getElementById("formMessage");
  if (msg) msg.textContent = "";
}

function showFieldError(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (el) el.textContent = message;
}

function validateForm(fullName, email, password, role) {
  let valid = true;

  if (!fullName) {
    showFieldError("fullNameError", "Full name is required.");
    valid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    showFieldError("emailError", "Email is required.");
    valid = false;
  } else if (!emailRegex.test(email)) {
    showFieldError("emailError", "Please enter a valid email address.");
    valid = false;
  }

  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!password) {
    showFieldError("passwordError", "Password is required.");
    valid = false;
  } else if (password.length < 8) {
    showFieldError("passwordError", "Password must be at least 8 characters.");
    valid = false;
  } else if (!strongPassword.test(password)) {
    showFieldError("passwordError", "Password must include uppercase, lowercase, and a number.");
    valid = false;
  }

  if (!role) {
    showFieldError("roleError", "Please select a role.");
    valid = false;
  }

  return valid;
}

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  if (!validateForm(fullName, email, password, role)) return;

  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password, role })
  });

  const data = await response.json();
  const formMessage = document.getElementById("formMessage");

  if (data.success) {
    formMessage.textContent = "Account created! Redirecting to login...";
    formMessage.className = "form-message success";
    signupForm.reset();
    setTimeout(() => { window.location.href = "/login.html"; }, 1500);
  } else {
    formMessage.textContent = data.message;
    formMessage.className = "form-message error";
  }
});