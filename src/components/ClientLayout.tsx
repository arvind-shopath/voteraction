'use client';

import { usePathname } from 'next/navigation';
import { useView } from '@/context/ViewContext';
import React from 'react';
import FloatingViewSwitcher from './FloatingViewSwitcher';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { effectiveRole, effectiveWorkerType } = useView();

    const isCentralSocial = effectiveRole === 'SOCIAL_MEDIA' &&
        (effectiveWorkerType === 'SOCIAL_CENTRAL' || effectiveWorkerType?.startsWith('CENTRAL_'));

    const isHidden = pathname === '/social-team' && isCentralSocial;

    return (
        <div className={`app-layout ${isHidden ? 'no-sidebar' : ''}`}>
            {children}
            <FloatingViewSwitcher />
        </div>
    );
}
