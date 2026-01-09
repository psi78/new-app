// Fixed code: Removed duplicate blocks and ensured redirect works.

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("student-login-form");
  const submitBtn = document.querySelector(".login-btn");

  const studentId = document.getElementById("student-id");
  const password = document.getElementById("password");

  // Accept old: 3-20 A-Za-z0-9_- or new: UGR/9735/16 or similar (alphanum 3+ / num+ / num{2} at end)
  const patterns = {
    studentId: /^([A-Za-z0-9_\-]{3,20}|[A-Za-z]+\/[0-9]+\/[0-9]{2})$/,
    password: /^.{6,}$/,
  };

  function initializeForm() {
    form.addEventListener("submit", handleSubmit);

    studentId.addEventListener("blur", validateStudentId);
    password.addEventListener("blur", validatePassword);

    studentId.addEventListener("input", () => clearError("student-id"));
    password.addEventListener("input", () => clearError("password"));

    form.addEventListener("keypress", function (event) {
      if (event.key === "Enter" && !submitBtn.disabled) {
        handleSubmit(event);
      }
    });
  }

  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    let errorElement = field.parentElement.querySelector(".error-message");
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className = "error-message";
      field.parentElement.appendChild(errorElement);
    }

    errorElement.textContent = message;
    errorElement.style.cssText = `
            color: #ff3860;
            font-size: 12px;
            margin-top: 5px;
            margin-bottom: 10px;
            animation: slideIn 0.3s ease;
        `;

    field.style.borderColor = "#ff3860";
    field.style.backgroundColor = "#ffeef0";
    field.style.boxShadow = "0 0 0 1px #ff3860";

    if (!form.classList.contains("has-errors")) {
      field.focus();
      form.classList.add("has-errors");
    }
  }

  function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const errorElement = field.parentElement.querySelector(".error-message");
    if (errorElement) {
      errorElement.remove();
    }

    field.style.borderColor = "#ccc";
    field.style.backgroundColor = "";
    field.style.boxShadow = "";

    form.classList.remove("has-errors");
  }

  function validateStudentId() {
    const value = studentId.value.trim();

    if (!value) {
      showError("student-id", "Student ID is required");
      return false;
    }

    if (!patterns.studentId.test(value)) {
      showError(
        "student-id",
        "Student ID must be 3-20 characters (letters, numbers, underscores, or hyphens), or in format UGR/xxxx/xx"
      );
      return false;
    }

    clearError("student-id");
    return true;
  }

  function validatePassword() {
    const value = password.value;

    if (!value) {
      showError("password", "Password is required");
      return false;
    }

    if (!patterns.password.test(value)) {
      showError("password", "Password must be at least 6 characters");
      return false;
    }

    clearError("password");
    return true;
  }

  function validateAllFields() {
    let isValid = true;
    form.classList.remove("has-errors");

    if (!validateStudentId()) isValid = false;
    if (!validatePassword()) isValid = false;

    return isValid;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";

    if (!validateAllFields()) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
      showAlert("Please fix the errors above", "error");
      return;
    }

    try {
      const API_URL = "";

      submitBtn.innerHTML = '<span class="spinner"></span> Authenticating...';

      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: studentId.value.trim(),
          password: password.value,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showAlert("Login successful! Redirecting...", "success");

        if (result.token) {
          localStorage.setItem("auth_token", result.token);
          localStorage.setItem("student_id", studentId.value.trim());
        }

        // Store user data in localStorage
        if (result.userData) {
          if (window.Auth && typeof window.Auth.login === 'function') {
            const loginData = {
              token: result.token || 'demo-token',
              ...result.userData,
              student_id: studentId.value.trim()
            };
            Auth.login(loginData);
          } else {
            // Fallback if Auth is not loaded
            localStorage.setItem("full_name", result.userData.full_name || "");
            localStorage.setItem("gender", result.userData.gender || "");
            localStorage.setItem("academic_year", result.userData.academic_year || "");
            localStorage.setItem("department", result.userData.department || "");
            localStorage.setItem("phone", result.userData.phone || "");
            localStorage.setItem("login_time", new Date().toISOString());
          }
        }

        form.reset();

        // Redirect fix: always use a correct path for student profile
        setTimeout(() => {
          // Prefer absolute path for profile page to avoid baseURL confusion
          let redirectUrl = "/pages/student/profile.html";
          if (result.redirect) {
            redirectUrl = result.redirect;
          }
          window.location.href = redirectUrl;
        }, 1500);
      } else {
        const errorMsg =
          result.message || "Invalid credentials. Please try again.";
        showAlert(errorMsg, "error");

        form.style.animation = "shake 0.5s";
        setTimeout(() => (form.style.animation = ""), 500);

        password.value = "";
        password.focus();
      }
    } catch (error) {
      console.error("Login error:", error);
      showAlert(`Network error: ${error.message}. Please check your connection.`, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
    }
  }

  function showAlert(message, type) {
    const existingAlert = document.querySelector(".login-alert");
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement("div");
    alert.className = `login-alert alert-${type}`;
    alert.textContent = message;

    alert.style.cssText = `
            padding: 12px 20px;
            margin: 15px 0;
            border-radius: 4px;
            font-size: 14px;
            text-align: center;
            font-weight: bold;
            animation: slideIn 0.3s ease;
        `;

    if (type === "error") {
      alert.style.backgroundColor = "#ffeef0";
      alert.style.color = "#ff3860";
      alert.style.border = "1px solid #ff3860";
    } else {
      alert.style.backgroundColor = "#d4edda";
      alert.style.color = "#155724";
      alert.style.border = "1px solid #c3e6cb";
    }

    const formTitle = document.querySelector(".login-container h2");
    if (formTitle) {
      formTitle.parentNode.insertBefore(alert, formTitle.nextSibling);
    } else if (form && form.parentNode) {
      form.parentNode.insertBefore(alert, form);
    } else {
      document.body.appendChild(alert);
    }

    const removeTime = type === "success" ? 2000 : 5000;
    setTimeout(() => {
      alert.style.opacity = "0";
      alert.style.transition = "opacity 0.3s";
      setTimeout(() => alert.remove(), 300);
    }, removeTime);
  }

  const style = document.createElement("style");
  style.textContent = `
        .spinner {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .login-alert {
            transition: opacity 0.3s ease;
        }
        
        .login-links a {
            display: block;
            margin: 8px 0;
            color: #003366;
            text-decoration: none;
            transition: color 0.2s;
        }
        
        .login-links a:hover {
            color: #0055aa;
            text-decoration: underline;
        }
        
        .remember-me {
            display: flex;
            align-items: center;
            margin: 10px 0;
            font-size: 14px;
        }
        
        .remember-me input {
            margin-right: 8px;
            width: auto;
        }
    `;
  document.head.appendChild(style);

  setTimeout(() => {
    studentId.focus();
  }, 100);

  initializeForm();
});
