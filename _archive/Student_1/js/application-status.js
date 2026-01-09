const API_URL = "http://localhost:3000";

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const studentId = localStorage.getItem('student_id');
    if (!studentId) {
        window.location.href = 'student-login.html';
        return;
    }
    
    loadApplicationStatus(studentId);
    setupLogout();
    setupNavigation();
});

async function loadApplicationStatus(studentId) {
    try {
        const response = await fetch(`${API_URL}/applications/student/${studentId}`);
        
        if (response.ok) {
            const application = await response.json();
            displayApplicationStatus(application);
        } else if (response.status === 404) {
            // No application found
            displayNoApplication();
        } else {
            console.error('Error loading application status');
            showAlert('Failed to load application status', 'error');
        }
    } catch (error) {
        console.error('Error fetching application status:', error);
        showAlert('Network error. Please check your connection.', 'error');
        // Fallback to default display
        displayNoApplication();
    }
}

function displayApplicationStatus(application) {
    // Update status banner
    const statusBanner = document.getElementById('statusBanner');
    if (statusBanner) {
        const status = application.status || application.docStatus || 'Pending';
        statusBanner.textContent = `Status: ${status}`;
        statusBanner.className = `status-banner ${status.toLowerCase()}`;
        
        // Set status colors
        if (status === 'Verified' || status === 'Approved') {
            statusBanner.style.backgroundColor = '#d4edda';
            statusBanner.style.color = '#155724';
        } else if (status === 'Rejected') {
            statusBanner.style.backgroundColor = '#f8d7da';
            statusBanner.style.color = '#721c24';
        } else {
            statusBanner.style.backgroundColor = '#fff3cd';
            statusBanner.style.color = '#856404';
        }
    }
    
    // Update application details
    const appID = document.getElementById('appID');
    if (appID) appID.textContent = application.applicationId || application.id || 'N/A';
    
    const studentName = document.getElementById('studentName');
    if (studentName) {
        studentName.textContent = application.data?.fullName || 
                                  localStorage.getItem('full_name') || 
                                  'N/A';
    }
    
    const category = document.getElementById('category');
    if (category) {
        category.textContent = application.residencyCategory || 
                               application.data?.category || 
                               'N/A';
    }
    
    const academicYear = document.getElementById('academicYear');
    if (academicYear) {
        const year = application.data?.year || localStorage.getItem('academic_year') || 'N/A';
        academicYear.textContent = `Year ${year}`;
    }
    
    const department = document.getElementById('department');
    if (department) {
        department.textContent = application.data?.department || 
                                 localStorage.getItem('department') || 
                                 'N/A';
    }
    
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated && application.updatedAt) {
        const date = new Date(application.updatedAt);
        lastUpdated.textContent = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    const adminRemark = document.getElementById('adminRemark');
    if (adminRemark) {
        adminRemark.textContent = application.adminRemark || 'No remarks yet';
    }
    
    // Update dorm allocation
    const allocationContainer = document.getElementById('allocationContainer');
    if (allocationContainer) {
        if (application.dormAllocation) {
            allocationContainer.innerHTML = `
                <div class="allocation-info">
                    <p><strong>Dorm:</strong> ${application.dormAllocation.dormName || 'N/A'}</p>
                    <p><strong>Room:</strong> ${application.dormAllocation.roomNumber || 'N/A'}</p>
                    <p><strong>Bed:</strong> ${application.dormAllocation.bedNumber || 'N/A'}</p>
                </div>
            `;
        } else {
            allocationContainer.innerHTML = '<p>No dorm has been allocated yet.</p>';
        }
    }
}

function displayNoApplication() {
    const statusBanner = document.getElementById('statusBanner');
    if (statusBanner) {
        statusBanner.textContent = 'Status: No Application';
        statusBanner.className = 'status-banner pending';
        statusBanner.style.backgroundColor = '#e9ecef';
        statusBanner.style.color = '#6c757d';
    }
    
    // Show message
    const mainContent = document.querySelector('.main-content2');
    if (mainContent) {
        const noAppMessage = document.createElement('div');
        noAppMessage.className = 'no-application-message';
        noAppMessage.style.cssText = `
            text-align: center;
            padding: 40px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 20px 0;
        `;
        noAppMessage.innerHTML = `
            <h3>No Application Found</h3>
            <p>You haven't submitted a dorm application yet.</p>
            <a href="dorm-application.html" style="
                display: inline-block;
                margin-top: 15px;
                padding: 10px 20px;
                background: #003366;
                color: white;
                text-decoration: none;
                border-radius: 4px;
            ">Submit Application</a>
        `;
        mainContent.appendChild(noAppMessage);
    }
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
    const existingAlert = document.querySelector('.status-alert');
    if (existingAlert) existingAlert.remove();
    
    const alert = document.createElement('div');
    alert.className = `status-alert alert-${type}`;
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




