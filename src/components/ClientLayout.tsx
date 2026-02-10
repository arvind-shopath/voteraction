'use client';

import { usePathname } from 'next/navigation';
import { useView } from '@/context/ViewContext';
import React from 'react';
import FloatingViewSwitcher from './FloatingViewSwitcher';
import NotificationListener from './NotificationListener';
import { useLayout } from '@/context/LayoutContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { effectiveRole, effectiveWorkerType } = useView();
    const { isSidebarCollapsed } = useLayout();

    const isCentralSocial = effectiveRole === 'SOCIAL_MEDIA' &&
        (effectiveWorkerType === 'SOCIAL_CENTRAL' || effectiveWorkerType?.startsWith('CENTRAL_'));

    const isHidden = (pathname === '/social-team' || pathname === '/social-sena') && isCentralSocial;

    return (
        <div className={`app-layout ${isHidden ? 'no-sidebar' : ''} ${isSidebarCollapsed ? 'main-container-collapsed' : ''}`}>
            {children}
            <FloatingViewSwitcher />
            <NotificationListener />
        </div>
    );
}
