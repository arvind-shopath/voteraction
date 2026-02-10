'use client';

import { useView } from '@/context/ViewContext';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function WorkerFAB() {
    const { effectiveRole } = useView();
    const pathname = usePathname();

    // Don't show if not a worker
    if (effectiveRole !== 'WORKER') return null;

    // Don't show if already on war room page
    if (pathname === '/poll-day') return null;

    return (
        <Link
            href="/poll-day"
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#EF4444',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.5), 0 8px 10px -6px rgba(239, 68, 68, 0.1)',
                zIndex: 9999,
                cursor: 'pointer',
                animation: 'bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
        >
            <Zap size={32} fill="white" />
            <span style={{ position: 'absolute', top: -8, right: -8, width: 16, height: 16, background: '#10B981', borderRadius: '50%', border: '2px solid white' }}></span>

            <style jsx>{`
                @keyframes bounce-in {
                    0% { transform: scale(0); opacity: 0; }
                    60% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); }
                }
            `}</style>
        </Link>
    );
}
