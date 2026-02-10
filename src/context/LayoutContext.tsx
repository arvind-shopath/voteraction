'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface LayoutContextType {
    isSidebarOpen: boolean;
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    toggleCollapse: () => void;
    closeSidebar: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('sidebar_collapsed');
        if (stored === 'true') setIsSidebarCollapsed(true);
    }, []);

    const pathname = usePathname();

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const closeSidebar = () => setIsSidebarOpen(false);
    const toggleCollapse = () => {
        setIsSidebarCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebar_collapsed', String(next));
            return next;
        });
    };

    // Auto close sidebar on route change (for mobile)
    useEffect(() => {
        closeSidebar();
    }, [pathname]);

    return (
        <LayoutContext.Provider value={{ isSidebarOpen, isSidebarCollapsed, toggleSidebar, toggleCollapse, closeSidebar }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
