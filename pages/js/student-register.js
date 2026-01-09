document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("student-register-form");
  const submitBtn = document.getElementById("register-submit");

  const fields = {
    studentId: document.getElementById("student-id"),
    fullName: document.getElementById("full-name"),
    genderMale: document.getElementById("male"),
    genderFemale: document.getElementById("female"),
    academicYear: document.getElementById("academic-year"),
    department: document.getElementById("department"),
    phone: document.getElementById("phone"),
    password: document.getElementById("password"),
    confirmPassword: document.getElementById("confirm-password"),
  };

  const errorMessages = {
    studentId: document.querySelector("#student-id + .error-message"),
    fullName: document.querySelector("#full-name + .error-message"),
    gender: document.querySelector("#gender-options-form .error-message"),
    academicYear: document.querySelector("#academic-year + .error-message"),
    phone: document.querySelector("#phone + .error-message"),
    password: document.querySelector("#password + .error-message"),
    confirmPassword: document.querySelector(
      "#confirm-password + .error-message"
    ),
  };

  const patterns = {
    // Accept old: 3-20 A-Za-z0-9_- or new: UGR/9735/16 or similar (alphanum 3+ / num+ / num{2} at end)
    studentId: /^([A-Za-z0-9_\-]{3,20}|[A-Za-z]+\/[0-9]+\/[0-9]{2})$/,
    fullName: /^[A-Za-z\s'\-]{3,50}$/,
    phone: /^\+251[0-9]{9}$/,
    password: /^.{6,}$/,
  };

  const validators = {
    studentId: (value) => {
      if (!value.trim()) return "Student ID is required";
      if (!patterns.studentId.test(value))
        return "Student ID must be 3-20 characters (letters, numbers, underscores, or hyphens), or in format UGR/9735/16";
      return "";
    },

    fullName: (value) => {
      if (!value.trim()) return "Full name is required";
      if (!patterns.fullName.test(value))
        return "Full name must be 3-50 characters (letters, spaces, apostrophes, or hyphens)";
      return "";
    },

    gender: () => {
      if (!fields.genderMale.checked && !fields.genderFemale.checked) {
        return "Please select a gender";
      }
      return "";
    },

    academicYear: (value) => {
      if (!value) return "Academic year is required";
      if (value < 1 || value > 5)
        return "Academic year must be between 1 and 5";
      return "";
    },

    department: (value) => {
      if (!value) return "Department is required";
      return "";
    },

    phone: (value) => {
      if (!value.trim()) return "Phone number is required";
      if (!patterns.phone.test(value))
        return "Phone must be in format: +251911223344";
      return "";
    },

    password: (value) => {
      if (!value.trim()) return "Password is required";
      if (!patterns.password.test(value)) {
        return "Password must be at least 6 characters";
      }
      return "";
    },

    confirmPassword: (value) => {
      const password = fields.password.value;
      if (!value.trim()) return "Please confirm your password";
      if (value !== password) return "Passwords do not match";
      return "";
    },
  };

  function initializeForm() {
    form.addEventListener("submit", handleSubmit);

    fields.studentId.addEventListener("blur", () => validateField("studentId"));
    fields.fullName.addEventListener("blur", () => validateField("fullName"));
    fields.academicYear.addEventListener("change", () =>
      validateField("academicYear")
    );
    fields.department.addEventListener("change", () =>
      validateField("department")
    );
    fields.phone.addEventListener("blur", () => validateField("phone"));
    fields.password.addEventListener("blur", () => {
      validateField("password");
      if (fields.confirmPassword.value) validateField("confirmPassword");
    });
    fields.confirmPassword.addEventListener("blur", () =>
      validateField("confirmPassword")
    );

    [fields.genderMale, fields.genderFemale].forEach((radio) => {
      radio.addEventListener("change", () => validateField("gender"));
    });

    Object.values(fields).forEach((field) => {
      if (field && field.tagName === "INPUT") {
        field.addEventListener("input", function () {
          const fieldId = this.id.replace("-", "");
          clearError(fieldId);
        });
      }
    });

    fields.department.addEventListener("change", function () {
      clearError("department");
    });
  }

  function showError(fieldName, message) {
    const errorElement = errorMessages[fieldName];
    const fieldElement = fields[fieldName];

    if (errorElement && fieldElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
      errorElement.style.color = "#ff3860";
      errorElement.style.fontSize = "12px";
      errorElement.style.marginTop = "5px";

      if (
        fieldElement.tagName === "INPUT" ||
        fieldElement.tagName === "SELECT"
      ) {
        fieldElement.style.borderColor = "#ff3860";
        fieldElement.style.backgroundColor = "#ffeef0";
      }

      if (fieldName === "gender") {
        const genderContainer = document.getElementById("gender-options-form");
        if (genderContainer) {
          genderContainer.style.border = "1px solid #ff3860";
          genderContainer.style.padding = "10px";
          genderContainer.style.borderRadius = "4px";
          genderContainer.style.backgroundColor = "#ffeef0";
        }
      }

      if (!form.classList.contains("has-errors")) {
        fieldElement.scrollIntoView({ behavior: "smooth", block: "center" });
        form.classList.add("has-errors");
      }
    }
  }

  function clearError(fieldName) {
    const errorElement = errorMessages[fieldName];
    const fieldElement = fields[fieldName];

    if (errorElement) {
      errorElement.style.display = "none";
      errorElement.textContent = "";
    }

    if (fieldElement) {
      if (
        fieldElement.tagName === "INPUT" ||
        fieldElement.tagName === "SELECT"
      ) {
        fieldElement.style.borderColor = "#ccc";
        fieldElement.style.backgroundColor = "";
      }

      if (fieldName === "gender") {
        const genderContainer = document.getElementById("gender-options-form");
        if (genderContainer) {
          genderContainer.style.border = "";
          genderContainer.style.padding = "";
          genderContainer.style.backgroundColor = "";
        }
      }
    }
  }
  function validateField(fieldName) {
    let value;

    if (fieldName === "gender") {
      value = fields.genderMale.checked
        ? "Male"
        : fields.genderFemale.checked
          ? "Female"
          : "";
    } else {
      const field = fields[fieldName];
      value = field ? field.value : "";
    }

    const error = validators[fieldName](value);

    if (error) {
      showError(fieldName, error);
      return false;
    } else {
      clearError(fieldName);
      return true;
    }
  }

  function validateAllFields() {
    let isValid = true;
    form.classList.remove("has-errors");

    for (const fieldName in validators) {
      if (!validateField(fieldName)) {
        isValid = false;
      }
    }

    if (!fields.department.value) {
      fields.department.style.borderColor = "#ff3860";
      fields.department.style.backgroundColor = "#ffeef0";
      isValid = false;

      const departmentContainer = fields.department.parentElement;
      let deptError = departmentContainer.querySelector(".department-error");
      if (!deptError) {
        deptError = document.createElement("span");
        deptError.className = "error-message department-error";
        deptError.textContent = "Department is required";
        deptError.style.display = "block";
        deptError.style.color = "#ff3860";
        deptError.style.fontSize = "12px";
        deptError.style.marginTop = "5px";
        departmentContainer.appendChild(deptError);
      }
    } else {
      fields.department.style.borderColor = "#ccc";
      fields.department.style.backgroundColor = "";
      const deptError =
        fields.department.parentElement.querySelector(".department-error");
      if (deptError) deptError.remove();
    }

    return isValid;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    if (!validateAllFields()) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Register";

      showAlert("Please fill all required fields correctly", "error");
      return;
    }

    try {
      const API_URL = "";

      submitBtn.innerHTML = '<span class="spinner"></span> Registering...';

      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: fields.studentId.value.trim(),
          full_name: fields.fullName.value.trim(),
          gender: fields.genderMale.checked ? "Male" : "Female",
          academic_year: fields.academicYear.value,
          department: fields.department.value,
          phone: fields.phone.value.trim(),
          password: fields.password.value,
          confirm_password: fields.confirmPassword.value,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showAlert(
          "Registration successful! Redirecting to login...",
          "success"
        );

        form.reset();

        setTimeout(() => {
          window.location.href = "student-login.html";
        }, 2000);
      } else {
        showAlert(
          result.message || "Registration failed. Please try again.",
          "error"
        );

        if (result.errors) {
          Object.entries(result.errors).forEach(([field, error]) => {
            showError(field, error);
          });
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      showAlert(
        `Network error: ${error.message}. Please check your connection.`,
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Register";
    }
  }

  function showAlert(message, type) {
    const existingAlert = document.querySelector(".form-alert");
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement("div");
    alert.className = `form-alert alert-${type}`;
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
    } else {
      form.parentNode.insertBefore(alert, form);
    }

    const removeTime = type === "success" ? 5000 : 8000;
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
        
        .form-alert {
            transition: opacity 0.3s ease;
        }
    `;
  document.head.appendChild(style);

  initializeForm();
});
