document.addEventListener('DOMContentLoaded', function() {
    
    if (!Auth || !Auth.validateSession()) {
        window.location.href = 'student-login.html';
        return;
    }
    
    const user = Auth.getCurrentUser();
    
    populateProfileForm(user);
    
    initializeProfileForm();
    
    setupLogout();
    
    setupNavigation();
});

function populateProfileForm(user) {
    document.querySelector('input[value="STU_001"]').value = user.studentId || 'STU_001';
    document.querySelector('input[value="Dawit Alemu"]').value = user.fullName || 'Dawit Alemu';
    
    const genderSelect = document.querySelector('select[name="gender"]');
    if (genderSelect) {
        genderSelect.value = user.gender || 'Male';
    }
    
    const deptSelect = document.querySelector('select[name="department"]');
    if (deptSelect && user.department) {
        deptSelect.value = user.department;
    }
    
    const yearInput = document.querySelector('input[type="number"]');
    if (yearInput) {
        yearInput.value = user.academicYear || 2;
    }
    
    const phoneInput = document.querySelector('input[type="tel"]');
    if (phoneInput) {
        phoneInput.value = user.phone || '+251 9XX XXX XXX';
    }
}

function initializeProfileForm() {
    const form = document.getElementById('profileForm');
    const saveButton = document.querySelector('.savechange-btn');
    const fileInput = document.getElementById('fileInput');
    const profileDisplay = document.getElementById('profileDisplay');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showAlert('File size must be less than 5MB', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                profileDisplay.src = e.target.result;
                localStorage.setItem('profile_picture', e.target.result);
                showAlert('Profile picture updated successfully', 'success');
            };
            reader.readAsDataURL(file);
        }
    });
    
    const savedPicture = localStorage.getItem('profile_picture');
    if (savedPicture) {
        profileDisplay.src = savedPicture;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        saveButton.disabled = true;
        const originalText = saveButton.textContent;
        saveButton.innerHTML = '<span class="spinner"></span> Saving...';
        
        try {
            const formData = new FormData(form);
            formData.append('student_id', Auth.getCurrentUser().studentId);
            formData.append('update_timestamp', new Date().toISOString());
            
            const updatedData = {
                fullName: form.querySelector('input[value]:not(.readonly-field)').value,
                gender: form.querySelector('select[name="gender"]').value,
                department: form.querySelector('select[name="department"]').value,
                academicYear: form.querySelector('input[type="number"]').value,
                phone: form.querySelector('input[type="tel"]').value
            };
            
            localStorage.setItem('full_name', updatedData.fullName);
            localStorage.setItem('gender', updatedData.gender);
            localStorage.setItem('department', updatedData.department);
            localStorage.setItem('academic_year', updatedData.academicYear);
            localStorage.setItem('phone', updatedData.phone);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            showAlert('Profile updated successfully!', 'success');
            
        } catch (error) {
            console.error('Update error:', error);
            showAlert('Failed to update profile. Please try again.', 'error');
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = originalText;
        }
    });
    
    const style = document.createElement('style');
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
    const logoutLink = document.querySelector('.logout');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to logout?')) {
                Auth.logout();
            }
        });
    }
}

function setupNavigation() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuLinks = document.querySelectorAll('.sidebar a');
    
    menuLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage)) {
            link.classList.add('active');
        }
    });
    
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.classList.contains('logout')) return;
            
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && Auth.validateSession()) {
                window.location.href = href;
            } else {
                window.location.href = 'student-login.html';
            }
        });
    });
}

function showAlert(message, type) {
    const existingAlert = document.querySelector('.profile-alert');
    if (existingAlert) existingAlert.remove();
    
    const alert = document.createElement('div');
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
    
    if (type === 'error') {
        alert.style.backgroundColor = '#ffeef0';
        alert.style.color = '#ff3860';
        alert.style.border = '1px solid #ff3860';
    } else {
        alert.style.backgroundColor = '#d4edda';
        alert.style.color = '#155724';
        alert.style.border = '1px solid #c3e6cb';
    }
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}