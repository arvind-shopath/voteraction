'use client';

import { usePathname } from 'next/navigation';
import { useView } from '@/context/ViewContext';
import React from 'react';
import FloatingViewSwitcher from './FloatingViewSwitcher';
import NotificationListener from './NotificationListener';
import { useLayout } from '@/context/LayoutContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { isSidebarCollapsed } = useLayout();

    return (
        <div className={`app-layout ${isSidebarCollapsed ? 'main-container-collapsed' : ''}`}>
            {children}
            <FloatingViewSwitcher />
            <NotificationListener />
        </div>
    );
}
