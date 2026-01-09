document.addEventListener("DOMContentLoaded", async function () {
  if (!Auth || !Auth.validateSession()) {
    window.location.href = "student-login.html";
    return;
  }

  const user = Auth.getCurrentUser();
  // IMPORTANT: Encode the studentId for safe URL usage (e.g., UGR/xxxx/xx might break a REST route)
  // Use encodeURIComponent whenever constructing URLs with IDs
  const studentId = user.studentId || localStorage.getItem("student_id");

  function getProfilePictureKey(studentId) {
    return `profile_picture_${studentId}`;
  }

  // Try to load profile from backend
  const API_URL = "http://localhost:3000";
  try {
    // Encode studentId for safe URL access
    const encodedStudentId = encodeURIComponent(studentId);
    const response = await fetch(`${API_URL}/students/${encodedStudentId}`);
    if (response.ok) {
      const student = await response.json();
      populateProfileForm(student, studentId);

      // Load profile picture if exists
      // Always prefer backend URL (if exists), otherwise fallback to per-user localStorage
      const profileDisplay = document.getElementById("profileDisplay");
      if (profileDisplay) {
        if (student.profilePicture) {
          profileDisplay.src = `${API_URL}${student.profilePicture}`;
        } else {
          // fallback to per-user localStorage (e.g. from previous updates)
          const saved = localStorage.getItem(getProfilePictureKey(studentId));
          if (saved) profileDisplay.src = saved;
        }
      }
    } else {
      // Fallback to localStorage data
      populateProfileForm(user, studentId);
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    // Fallback to localStorage data
    populateProfileForm(user, studentId);
  }

  initializeProfileForm(studentId);

  setupLogout();

  setupNavigation();

  // -- Residency category: Listen for changes and update immediately (UX improvement) --
  const residenceSelect = document.querySelectorAll("select")[2];
  if (residenceSelect) {
    residenceSelect.addEventListener("change", function () {
      localStorage.setItem("residence_category", residenceSelect.value);
    });
  }
});

function populateProfileForm(user, studentId) {
  // Update Student ID
  const studentIdInput = document.querySelector("input.readonly-field");
  if (studentIdInput) {
    studentIdInput.value = user.studentId || user.student_id || "STU_001";
  }

  // Update Full Name
  const nameInputs = document.querySelectorAll(
    'input[type="text"]:not(.readonly-field)'
  );
  if (nameInputs.length > 0 && user.fullName) {
    nameInputs[0].value = user.fullName;
  }

  // Update Gender
  const genderSelect = document.querySelector("select");
  if (genderSelect && user.gender) {
    genderSelect.value = user.gender;
  }

  // Update Department
  const departmentSelect = document.querySelectorAll("select")[1];
  if (departmentSelect && user.department) {
    departmentSelect.value = user.department;
  }

  // Update Year
  const yearInput = document.querySelector('input[type="number"]');
  if (yearInput && user.academicYear) {
    yearInput.value = user.academicYear;
  }

  // Update Residence Category (default is 'non' if not present)
  const residenceSelect = document.querySelectorAll("select")[2];
  let rcat = user.residenceCategory || user.residence_category;

  if ((!rcat || rcat === "") && studentId) {
    rcat = localStorage.getItem("residence_category");
  }
  if (!rcat || rcat === "") {
    rcat = "non";
  }
  if (residenceSelect) {
    residenceSelect.value = rcat;
    const event = new Event("change", { bubbles: true });
    residenceSelect.dispatchEvent(event);
  }

  // Update Phone
  const phoneInput = document.querySelector('input[type="tel"]');
  if (phoneInput && user.phone) {
    phoneInput.value = user.phone;
  }

  // Per-user profile picture from localStorage, unless the src is already set by backend preference
  const profileDisplay = document.getElementById("profileDisplay");
  if (
    profileDisplay &&
    profileDisplay.src &&
    (!profileDisplay.src.includes("http://localhost:3000/") ||
      profileDisplay.src.endsWith("undefined"))
  ) {
    const picKey = `profile_picture_${studentId}`;
    const saved = localStorage.getItem(picKey);
    if (saved) profileDisplay.src = saved;
  }
}

function initializeProfileForm(studentId) {
  const form = document.getElementById("profileForm");
  const saveButton = document.querySelector(".savechange-btn");
  const fileInput = document.getElementById("fileInput");
  const profileDisplay = document.getElementById("profileDisplay");

  function getProfilePictureKey(studentId) {
    return `profile_picture_${studentId}`;
  }

  fileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert("File size must be less than 5MB", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        profileDisplay.src = e.target.result;
        if (studentId) {
          localStorage.setItem(
            getProfilePictureKey(studentId),
            e.target.result
          );
        }
        showAlert("Profile picture updated successfully", "success");
      };
      reader.readAsDataURL(file);
    }
  });

  if (studentId) {
    const savedPicture = localStorage.getItem(getProfilePictureKey(studentId));
    if (savedPicture) {
      profileDisplay.src = savedPicture;
    }
  }

  const residenceSelect = form.querySelectorAll("select")[2];
  if (residenceSelect) {
    residenceSelect.addEventListener("change", function (e) {
      localStorage.setItem("residence_category", residenceSelect.value);
    });
    if (
      !localStorage.getItem("residence_category") ||
      localStorage.getItem("residence_category") === ""
    ) {
      residenceSelect.value = "non";
      localStorage.setItem("residence_category", "non");
      const event = new Event("change", { bubbles: true });
      residenceSelect.dispatchEvent(event);
    }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    saveButton.disabled = true;
    const originalText = saveButton.textContent;
    saveButton.innerHTML = '<span class="spinner"></span> Saving...';

    try {
      const API_URL = "http://localhost:3000";
      const currentStudentId = Auth.getCurrentUser().studentId;
      // Encode ID for PATCH endpoint
      const encodedStudentId = encodeURIComponent(currentStudentId);

      // Get form values
      const fullName = form.querySelector(
        'input[type="text"]:not(.readonly-field)'
      )?.value;
      const genderSelect = form.querySelector("select");
      const gender = genderSelect?.value;
      const departmentSelect = form.querySelectorAll("select")[1];
      const department = departmentSelect?.value;
      const yearInput = form.querySelector('input[type="number"]');
      const academicYear = yearInput?.value;
      const phoneInput = form.querySelector('input[type="tel"]');
      const phone = phoneInput?.value;
      const residenceSelect = form.querySelectorAll("select")[2];
      const residenceCategory = residenceSelect?.value || "non";

      // Create FormData for potential file upload
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("gender", gender);
      formData.append("department", department);
      formData.append("academicYear", academicYear);
      formData.append("phone", phone);
      formData.append(
        "residenceCategory",
        residenceCategory !== undefined ? residenceCategory : "non"
      );

      // Handle profile picture if changed
      const fileInput = document.getElementById("fileInput");
      if (fileInput && fileInput.files[0]) {
        formData.append("profilePicture", fileInput.files[0]);
      }

      // PATCH: Use encoded student ID to handle special characters in URLs like slashes and spaces
      const response = await fetch(`${API_URL}/students/${encodedStudentId}`, {
        method: "PATCH",
        body: formData,
      });

      if (response.ok) {
        const updatedStudent = await response.json();

        // Update localStorage (non-picture)
        localStorage.setItem("full_name", updatedStudent.fullName);
        localStorage.setItem("gender", updatedStudent.gender);
        localStorage.setItem("department", updatedStudent.department);
        localStorage.setItem("academic_year", updatedStudent.academicYear);
        localStorage.setItem("phone", updatedStudent.phone);

        if (
          typeof updatedStudent.residenceCategory !== "undefined" &&
          updatedStudent.residenceCategory !== null
        ) {
          localStorage.setItem(
            "residence_category",
            updatedStudent.residenceCategory
          );
        } else if (typeof residenceCategory !== "undefined") {
          localStorage.setItem(
            "residence_category",
            residenceCategory || "non"
          );
        }

        // --- Profile picture: backend should win, but store per-user local fallback as well ---
        if (updatedStudent.profilePicture) {
          const profileDisplay = document.getElementById("profileDisplay");
          if (profileDisplay) {
            profileDisplay.src = `${API_URL}${updatedStudent.profilePicture}`;
          }
          if (currentStudentId) {
            localStorage.removeItem(getProfilePictureKey(currentStudentId));
          }
        } else if (fileInput && fileInput.files[0] && currentStudentId) {
          const reader = new FileReader();
          reader.onload = function (ev) {
            localStorage.setItem(
              getProfilePictureKey(currentStudentId),
              ev.target.result
            );
          };
          reader.readAsDataURL(fileInput.files[0]);
        }

        showAlert("Profile updated successfully!", "success");
      } else {
        let errorMsg = "Failed to update profile";
        // Attempt best-effort to extract error reason, including possible route mis-match or backend errors
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMsg = errorData.error;
          }
        } catch (errIgnored) {
          /* Ignore JSON parse errors */
        }

        // Provide extra debugging if it's potentially a routing/userid error
        if (response.status === 404) {
          errorMsg =
            "Profile not found. Please contact admin (possibly invalid ID or routing issue).";
        } else if (response.status >= 500) {
          errorMsg = "A server error occurred. Please try again later.";
        }
        showAlert(errorMsg, "error");
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Update error:", error);
      // This catch covers both thrown errors and manual showAlert above
      // Only show generic alert if more specific one wasn't already shown
      if (!error.handledByCustomAlert) {
        showAlert("Failed to update profile. Please try again.", "error");
      }
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = originalText;
    }
  });

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
    `;
  document.head.appendChild(style);
}

function setupLogout() {
  const logoutLink = document.querySelector(".logout");
  if (logoutLink) {
    logoutLink.addEventListener("click", function (e) {
      e.preventDefault();

      if (confirm("Are you sure you want to logout?")) {
        Auth.logout();
      }
    });
  }
}

function setupNavigation() {
  const currentPage = window.location.pathname.split("/").pop();
  const menuLinks = document.querySelectorAll(".sidebar a");

  menuLinks.forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    if (href && href.includes(currentPage)) {
      link.classList.add("active");
    }
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (this.classList.contains("logout")) return;

      e.preventDefault();
      const href = this.getAttribute("href");
      if (href && Auth.validateSession()) {
        window.location.href = href;
      } else {
        window.location.href = "student-login.html";
      }
    });
  });
}

function showAlert(message, type) {
  const existingAlert = document.querySelector(".profile-alert");
  if (existingAlert) existingAlert.remove();

  const alert = document.createElement("div");
  alert.className = `profile-alert alert-${type}`;
  alert.textContent = message;

  alert.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: bold;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
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

  document.body.appendChild(alert);

  setTimeout(() => {
    alert.style.opacity = "0";
    alert.style.transition = "opacity 0.3s";
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}
