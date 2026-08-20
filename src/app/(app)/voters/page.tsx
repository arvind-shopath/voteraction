'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import CandidateVotersView from './CandidateVotersView';
import WorkerVotersView from './WorkerVotersView';

function VotersPageContent() {
    const { data: session } = useSession();
    const { effectiveRole, effectiveWorkerType } = useView();
    const role = effectiveRole || (session?.user as any)?.role;
    const workerType = effectiveWorkerType || (session?.user as any)?.workerType;

    // Workers (except Booth Managers) see modern card-based view
    const isBoothManager = workerType === 'BOOTH_MANAGER';
    const shouldShowWorkerView = role === 'WORKER' && !isBoothManager;

    if (shouldShowWorkerView) {
        return <WorkerVotersView />;
    }

    // Booth Managers, Candidates, Election Managers and Admins see premium table view
    return <CandidateVotersView />;
}

export default function VotersPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
                <div className="spinner"></div>
                <div style={{ fontWeight: '600', color: '#6B7280' }}>मतदाता सूची लोड हो रही है...</div>
            </div>
        }>
            <VotersPageContent />
        </Suspense>
    );
}
