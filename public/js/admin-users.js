const usersTableBody = document.getElementById("usersTableBody");
const adminMessage = document.getElementById("adminMessage");

const showMessage = (message, type) => {
  adminMessage.textContent = message;
  adminMessage.className = `form-message ${type}`;
};

const loadUsers = async () => {
  try {
    const response = await fetch("/api/admin/users");
    const data = await response.json();

    if (!data.success) {
      showMessage(data.message, "error");
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="6">Unable to load users.</td>
        </tr>
      `;
      return;
    }

    usersTableBody.innerHTML = "";

    data.users.forEach((user) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${user.fullName}</td>
        <td>${user.email}</td>
        <td>
          <span class="role-badge">${user.role}</span>
        </td>
        <td>
          <span class="status-badge ${user.isActive ? "active" : "inactive"}">
            ${user.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td>
          <select class="role-select" data-id="${user._id}">
            <option value="user" ${user.role === "user" ? "selected" : ""}>User</option>
            <option value="caregiver" ${user.role === "caregiver" ? "selected" : ""}>Caregiver</option>
            <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
          </select>
        </td>
        <td>
          <button class="small-btn status-btn" data-id="${user._id}">
            ${user.isActive ? "Deactivate" : "Activate"}
          </button>
        </td>
      `;

      usersTableBody.appendChild(row);
    });
  } catch (error) {
    showMessage("Something went wrong while loading users.", "error");
  }
};

usersTableBody.addEventListener("change", async (e) => {
  if (!e.target.classList.contains("role-select")) return;

  const userId = e.target.dataset.id;
  const role = e.target.value;

  const response = await fetch(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ role })
  });

  const data = await response.json();

  if (data.success) {
    showMessage(data.message, "success");
    loadUsers();
  } else {
    showMessage(data.message, "error");
  }
});

usersTableBody.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("status-btn")) return;

  const userId = e.target.dataset.id;

  const response = await fetch(`/api/admin/users/${userId}/status`, {
    method: "PATCH"
  });

  const data = await response.json();

  if (data.success) {
    showMessage(data.message, "success");
    loadUsers();
  } else {
    showMessage(data.message, "error");
  }
});

loadUsers();