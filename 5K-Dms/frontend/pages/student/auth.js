const Auth = {
    isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    },
    
    getCurrentUser() {
        return {
            token: localStorage.getItem('auth_token'),
            studentId: localStorage.getItem('student_id'),
            fullName: localStorage.getItem('full_name'),
            gender: localStorage.getItem('gender'),
            academicYear: localStorage.getItem('academic_year'),
            department: localStorage.getItem('department'),
            phone: localStorage.getItem('phone')
        };
    },
    
    
    login(userData) {
        localStorage.setItem('auth_token', userData.token || 'demo-token');
        localStorage.setItem('student_id', userData.student_id);
        localStorage.setItem('full_name', userData.full_name);
        localStorage.setItem('gender', userData.gender);
        localStorage.setItem('academic_year', userData.academic_year);
        localStorage.setItem('department', userData.department);
        localStorage.setItem('phone', userData.phone);
        
        localStorage.setItem('login_time', new Date().toISOString());
    },
    
    
    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('student_id');
        localStorage.removeItem('full_name');
        localStorage.removeItem('gender');
        localStorage.removeItem('academic_year');
        localStorage.removeItem('department');
        localStorage.removeItem('phone');
        localStorage.removeItem('login_time');
        
        
        window.location.href = 'student-login.html';
    },
    
    
    validateSession() {
        if (!this.isAuthenticated()) {
            return false;
        }
        
        
        const loginTime = localStorage.getItem('login_time');
        if (loginTime) {
            const loginDate = new Date(loginTime);
            const now = new Date();
            const hoursDiff = Math.abs(now - loginDate) / 36e5;
            
            if (hoursDiff > 24) {
                this.logout();
                return false;
            }
        }
        
        return true;
    }
};