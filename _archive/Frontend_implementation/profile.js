const API_URL = "http://localhost:3000";

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication (using localStorage for now, can be enhanced)
    const studentId = localStorage.getItem('student_id') || 'STU_001';
    
    if (!studentId) {
        window.location.href = 'student-login.html';
        return;
    }
    
    loadStudentProfile(studentId);
    initializeProfileForm(studentId);
    setupLogout();
    setupNavigation();
});

async function loadStudentProfile(studentId) {
    try {
        const response = await fetch(`${API_URL}/students/${studentId}`);
        
        if (response.ok) {
            const student = await response.json();
            populateProfileForm(student);
            
            // Load profile picture if exists
            if (student.profilePicture) {
                const profileDisplay = document.getElementById('profileDisplay');
                if (profileDisplay) {
                    profileDisplay.src = `${API_URL}${student.profilePicture}`;
                }
            }
        } else if (response.status === 404) {
            // Student doesn't exist, create default profile
            console.log('Student profile not found, will create on first save');
        } else {
            console.error('Error loading profile:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching student profile:', error);
        // Fallback to localStorage if backend is not available
        const user = {
            studentId: localStorage.getItem('student_id') || 'STU_001',
            fullName: localStorage.getItem('full_name') || 'Dawit Alemu',
            gender: localStorage.getItem('gender') || 'Male',
            department: localStorage.getItem('department') || 'Software E.',
            academicYear: localStorage.getItem('academic_year') || 2,
            phone: localStorage.getItem('phone') || '+251 9XX XXX XXX',
            residenceCategory: localStorage.getItem('residence_category') || 'Rural'
        };
        populateProfileForm(user);
    }
}

function populateProfileForm(student) {
    // Update Student ID
    const studentIdInput = document.querySelector('input[readonly].readonly-field');
    if (studentIdInput) {
        studentIdInput.value = student.studentId || 'STU_001';
    }
    
    // Update Full Name
    const nameInputs = document.querySelectorAll('input[type="text"]:not(.readonly-field)');
    if (nameInputs.length > 0 && student.fullName) {
        nameInputs[0].value = student.fullName;
    }
    
    // Update Gender
    const genderSelect = document.querySelector('select');
    if (genderSelect && student.gender) {
        genderSelect.value = student.gender;
    }
    
    // Update Department
    const departmentSelect = document.querySelectorAll('select')[1];
    if (departmentSelect && student.department) {
        departmentSelect.value = student.department;
    }
    
    // Update Year
    const yearInput = document.querySelector('input[type="number"]');
    if (yearInput && student.academicYear) {
        yearInput.value = student.academicYear;
    }
    
    // Update Residence Category
    const residenceSelect = document.querySelectorAll('select')[2];
    if (residenceSelect && student.residenceCategory) {
        residenceSelect.value = student.residenceCategory;
    }
    
    // Update Phone
    const phoneInput = document.querySelector('input[type="tel"]');
    if (phoneInput && student.phone) {
        phoneInput.value = student.phone;
    }
}

function initializeProfileForm(studentId) {
    const form = document.getElementById('profileForm');
    const saveButton = document.querySelector('.savechange-btn');
    const fileInput = document.getElementById('fileInput');
    const profileDisplay = document.getElementById('profileDisplay');
    
    let selectedFile = null;
    
    // Handle file selection
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
                selectedFile = file;
                showAlert('Profile picture selected. Click Save Changes to upload.', 'success');
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        saveButton.disabled = true;
        const originalText = saveButton.textContent;
        saveButton.innerHTML = '<span class="spinner"></span> Saving...';
        
        try {
            // Get form values
            const formData = new FormData();
            
            const fullName = form.querySelector('input[type="text"]:not(.readonly-field)')?.value;
            const genderSelect = form.querySelector('select');
            const gender = genderSelect?.value;
            const departmentSelect = form.querySelectorAll('select')[1];
            const department = departmentSelect?.value;
            const yearInput = form.querySelector('input[type="number"]');
            const academicYear = yearInput?.value;
            const residenceSelect = form.querySelectorAll('select')[2];
            const residenceCategory = residenceSelect?.value;
            const phoneInput = form.querySelector('input[type="tel"]');
            const phone = phoneInput?.value;
            
            // Add profile picture if selected
            if (selectedFile) {
                formData.append('profilePicture', selectedFile);
            }
            
            // Add other fields
            formData.append('fullName', fullName);
            formData.append('gender', gender);
            formData.append('department', department);
            formData.append('academicYear', academicYear);
            formData.append('phone', phone);
            formData.append('residenceCategory', residenceCategory);
            
            // Update profile via backend API
            const response = await fetch(`${API_URL}/students/${studentId}`, {
                method: 'PATCH',
                body: formData
            });
            
            if (response.ok) {
                const updatedStudent = await response.json();
                
                // Update localStorage for compatibility
                localStorage.setItem('full_name', updatedStudent.fullName);
                localStorage.setItem('gender', updatedStudent.gender);
                localStorage.setItem('department', updatedStudent.department);
                localStorage.setItem('academic_year', updatedStudent.academicYear);
                localStorage.setItem('phone', updatedStudent.phone);
                localStorage.setItem('residence_category', updatedStudent.residenceCategory);
                
                // Update profile picture display if uploaded
                if (updatedStudent.profilePicture) {
                    profileDisplay.src = `${API_URL}${updatedStudent.profilePicture}`;
                }
                
                selectedFile = null; // Reset file selection
                showAlert('Profile updated successfully!', 'success');
            } else if (response.status === 404) {
                // Student doesn't exist, create new profile
                const createResponse = await fetch(`${API_URL}/students`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        studentId: studentId,
                        fullName: fullName,
                        gender: gender,
                        department: department,
                        academicYear: parseInt(academicYear),
                        phone: phone,
                        residenceCategory: residenceCategory
                    })
                });
                
                if (createResponse.ok) {
                    const newStudent = await createResponse.json();
                    showAlert('Profile created successfully!', 'success');
                    
                    // If file was selected, update profile picture separately
                    if (selectedFile) {
                        const updateFormData = new FormData();
                        updateFormData.append('profilePicture', selectedFile);
                        updateFormData.append('fullName', fullName);
                        updateFormData.append('gender', gender);
                        updateFormData.append('department', department);
                        updateFormData.append('academicYear', academicYear);
                        updateFormData.append('phone', phone);
                        updateFormData.append('residenceCategory', residenceCategory);
                        
                        const picResponse = await fetch(`${API_URL}/students/${studentId}`, {
                            method: 'PATCH',
                            body: updateFormData
                        });
                        
                        if (picResponse.ok) {
                            const updated = await picResponse.json();
                            if (updated.profilePicture) {
                                profileDisplay.src = `${API_URL}${updated.profilePicture}`;
                            }
                        }
                    }
                } else {
                    throw new Error('Failed to create profile');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to update profile');
            }
            
        } catch (error) {
            console.error('Update error:', error);
            showAlert('Failed to update profile. Please try again.', 'error');
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = originalText;
        }
    });
    
    // Add spinner styles
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
                localStorage.removeItem('auth_token');
                localStorage.removeItem('student_id');
                localStorage.removeItem('full_name');
                localStorage.removeItem('gender');
                localStorage.removeItem('academic_year');
                localStorage.removeItem('department');
                localStorage.removeItem('phone');
                localStorage.removeItem('login_time');
                window.location.href = 'index.html';
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
            if (href && localStorage.getItem('student_id')) {
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




