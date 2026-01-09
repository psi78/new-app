setInterval(() => {
    if (typeof Auth !== 'undefined') {
        Auth.validateSession();
    }
}, 5 * 60 * 1000);