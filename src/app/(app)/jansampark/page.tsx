'use client';

import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import CandidateJansamparkView from './CandidateView';
import WorkerJansamparkView from './WorkerView';

/**
 * 🛡️ PAGE PROTECTION STRATEGY:
 * This page acts as a role-based router. 
 * Worker and Candidate views are kept in COMPLETELY SEPARATE files 
 * to ensure changes in one do not leak into the other.
 */
export default function JansamparkPage() {
    const { data: session }: any = useSession();
    const { effectiveRole, effectiveWorkerType, simulationPersona } = useView();
    const assemblyId = (simulationPersona as any)?.assemblyId || (session?.user as any)?.assemblyId || 13;
    const isWorker = effectiveRole === 'WORKER';

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px', paddingBottom: '100px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {isWorker ? (
                    <WorkerJansamparkView
                        assemblyId={assemblyId}
                        workerType={effectiveWorkerType || 'FIELD'}
                    />
                ) : (
                    <CandidateJansamparkView
                        assemblyId={assemblyId}
                    />
                )}
            </div>
        </div>
    );
}
