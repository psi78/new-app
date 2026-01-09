const API_URL = "http://localhost:3000";

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const studentId = localStorage.getItem('student_id');
    if (!studentId) {
        window.location.href = 'student-login.html';
        return;
    }
    
    const form = document.getElementById('dormAppForm');
    if (!form) return;
    
    initializeForm(form, studentId);
    setupLogout();
    setupNavigation();
});

function initializeForm(form, studentId) {
    const submitBtn = form.querySelector('.submit-btn');
    const residencyCategoryInputs = form.querySelectorAll('input[name="residency_category"]');
    const subcitySection = form.querySelector('section:nth-of-type(2)');
    
    // Show/hide subcity section based on residency category
    residencyCategoryInputs.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'Addis Ababa') {
                if (subcitySection) {
                    subcitySection.style.display = 'block';
                    form.querySelector('#subcity').required = true;
                    form.querySelector('#woreda').required = true;
                }
            } else {
                if (subcitySection) {
                    subcitySection.style.display = 'none';
                    form.querySelector('#subcity').required = false;
                    form.querySelector('#woreda').required = false;
                }
            }
        });
    });
    
    // Initially hide subcity section
    if (subcitySection) {
        subcitySection.style.display = 'none';
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
        
        try {
            // Validate form
            if (!form.checkValidity()) {
                form.reportValidity();
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            // Get form values
            const residencyCategory = form.querySelector('input[name="residency_category"]:checked')?.value;
            const subcity = form.querySelector('#subcity')?.value;
            const woreda = form.querySelector('#woreda')?.value;
            const termsConfirm = form.querySelector('input[name="terms_confirm"]')?.checked;
            
            if (!termsConfirm) {
                showAlert('Please confirm that the information provided is correct', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            // Create FormData for file uploads
            const formData = new FormData();
            formData.append('studentId', studentId);
            formData.append('residency_category', residencyCategory);
            if (subcity) formData.append('subcity', subcity);
            if (woreda) formData.append('woreda', woreda);
            formData.append('terms_confirm', termsConfirm);
            
            // Add files
            const kebeleIdFile = form.querySelector('input[name="kebele_id"]')?.files[0];
            const supportLetterFile = form.querySelector('input[name="support_letter"]')?.files[0];
            const medicalDocFile = form.querySelector('input[name="medical_doc"]')?.files[0];
            
            if (kebeleIdFile) formData.append('kebele_id', kebeleIdFile);
            if (supportLetterFile) formData.append('support_letter', supportLetterFile);
            if (medicalDocFile) formData.append('medical_doc', medicalDocFile);
            
            // Submit application
            const response = await fetch(`${API_URL}/applications`, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const application = await response.json();
                showAlert('Application submitted successfully!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'application-status.html';
                }, 2000);
            } else {
                const error = await response.json();
                showAlert(error.error || 'Failed to submit application. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Application submission error:', error);
            showAlert('Network error. Please check your connection and try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
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
                window.location.href = '../../index.html';
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
}

function showAlert(message, type) {
    const existingAlert = document.querySelector('.application-alert');
    if (existingAlert) existingAlert.remove();
    
    const alert = document.createElement('div');
    alert.className = `application-alert alert-${type}`;
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




