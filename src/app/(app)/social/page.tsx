'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Simple redirector without complex context hooks initially to prevent crashes
export default function SocialRedirect() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        if (status === 'authenticated' && session?.user && !redirecting) {
            setRedirecting(true);
            const role = (session.user as any).role || 'MANAGER'; // Default to candidate if no role

            // Use window.location for hard redirect to clear any client state issues
            if (role === 'SOCIAL_MEDIA') {
                window.location.href = '/social/content';
            } else if (role === 'MANAGER' || role === 'ADMIN' || role === 'SUPERADMIN') {
                window.location.href = '/social/candidate';
            } else {
                window.location.href = '/social/worker';
            }
        }
    }, [status, session, redirecting]);

    if (status === 'loading') {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Loader2 className="animate-spin" size={48} color="#2563EB" />
            <p style={{ marginTop: '20px', color: '#64748B' }}>Loading your dashboard...</p>
            <style jsx>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
