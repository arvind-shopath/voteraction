'use client';

import React, { useEffect } from 'react';

export default function DynamicTheme() {
    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'ADMIN') {
            // Set neutral admin theme
            const root = document.documentElement;
            root.style.setProperty('--primary-bg', '#334155'); // Slate 700
            root.style.setProperty('--primary-hover', '#475569');

            // Add a global class to help with admin-specific styling
            document.body.classList.add('admin-view');
        } else {
            document.body.classList.remove('admin-view');
        }
    }, []);

    return null;
}
