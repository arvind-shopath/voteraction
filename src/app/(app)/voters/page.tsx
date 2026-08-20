'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import CandidateVotersView from './CandidateVotersView';
import WorkerVotersView from './WorkerVotersView';

/**
 * 🛡️ STRATEGIC ROLE ISOLATION
 * This page serves as a router between Candidate and Worker views.
 * 
 * ROUTING LOGIC:
 * - PANNA_PRAMUKH → WorkerVotersView (Modern glossy cards)
 * - FIELD (Ground Worker) → WorkerVotersView (Modern glossy cards)
 * - BOOTH_MANAGER → CandidateVotersView (Premium dark table)
 * - CANDIDATE/ELECTION_MANAGER/ADMIN → CandidateVotersView (Premium dark table)
 */
export default function VotersPage() {
    const { data: session } = useSession();
    const { effectiveRole, effectiveWorkerType } = useView();
    const role = effectiveRole || (session?.user as any)?.role;
    const workerType = effectiveWorkerType || (session?.user as any)?.workerType;

    // Workers (except Booth Managers) see modern card-based view
    const isBoothManager = workerType === 'BOOTH_MANAGER';
    const shouldShowWorkerView = role === 'WORKER' && !isBoothManager;

    if (shouldShowWorkerView) {
        return (
            <Suspense fallback={
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
                    <div className="spinner"></div>
                    <div style={{ fontWeight: '600', color: '#6B7280' }}>मतदाता सूची लोड हो रही है...</div>
                </div>
            }>
                <WorkerVotersView />
            </Suspense>
        );
    }

    // Booth Managers, Candidates, Election Managers and Admins see premium table view
    return <CandidateVotersView />;
}
