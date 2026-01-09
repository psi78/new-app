# 5K Dormitory Management System (DMS)

A complete web-based system for managing university dormitory allocations, student applications, and room administration.

---

## 🔑 Login Credentials

### System Administrator
*   **Login URL:** `/pages/admin/admin-login.html`
*   **Username:** `sysadmin`
*   **Password:** `admin123`
*   *Access level: Full control, create other admins, manage system settings.*

### Student Access
*   **Login URL:** `index.html` (Home Page)
*   **Registration:** Supports new student registration with ID verification.
*   *Features: Apply for dorm, view status, see allocation.*

---

## 🛠️ Tech Stack
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (No frameworks)
*   **Backend:** Node.js (Express.js)
*   **Database:** MySQL

## 📁 Project Structure
*   `/j/server.js`: Main backend logic.
*   `/j/pages`: All frontend HTML/JS/CSS files.
*   `/j/database`: SQL configuration and schema.

## ✨ Key Features
*   **Rule-Based Allocation:** Automatically assigns rooms based on gender, department, and year.
*   **Document Verification:** Admins can preview and verify/reject student uploaded IDs.
*   **Role-Based Access:** Different admin roles (Room Admin, App Admin, System Admin).
*   **Real-time Status:** Students can check their application status instantly.