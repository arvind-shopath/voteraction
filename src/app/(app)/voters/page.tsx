'use client';

import React from 'react';
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
 * - CANDIDATE/ADMIN → CandidateVotersView (Premium dark table)
 */
export default function VotersPage() {
    const { effectiveRole, effectiveWorkerType } = useView();
    
    // Workers (except Booth Managers) see modern card-based view
    const shouldShowWorkerView = effectiveRole === 'WORKER' && effectiveWorkerType !== 'BOOTH_MANAGER';

    if (shouldShowWorkerView) {
        return <WorkerVotersView />;
    }

    // Booth Managers, Candidates, and Admins see premium table view
    return <CandidateVotersView />;
}
