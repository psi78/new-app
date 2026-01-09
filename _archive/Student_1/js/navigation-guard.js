document.addEventListener('DOMContentLoaded', function() {
    
    const protectedPages = [
        'profile.html',
        'student-dashboard.html',
        'dorm-application.html',
        'application-status.html'
    ];
    
    
    const currentPage = window.location.pathname.split('/').pop();
    
    
    if (protectedPages.includes(currentPage)) {
        
        const checkAuth = setInterval(() => {
            if (typeof Auth !== 'undefined') {
                clearInterval(checkAuth);
                
                if (!Auth.validateSession()) {
                    
                    const returnUrl = encodeURIComponent(window.location.pathname);
                    window.location.href = `student-login.html?return=${returnUrl}`;
                }
            }
        }, 100);
    }
});