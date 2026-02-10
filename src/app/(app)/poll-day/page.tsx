'use client';

import React, { useState, useEffect } from 'react';
import { useView } from '@/context/ViewContext';
import { useSession } from 'next-auth/react';
import { Clock, Activity, Lock, Calendar } from 'lucide-react';
import CandidateWarRoom from './CandidateWarRoom';
import WorkerWarRoom from './WorkerWarRoom';
import CandidateSelector from './CandidateSelector';
import { ArrowLeft } from 'lucide-react';

/**
 * 🛡️ WAR ROOM PAGE ROUTER
 * This page checks:
 * 1. Election Date (48h countdown lock)
 * 2. User Role (Candidate vs Worker)
 */
export default function PollDayPage() {
    const { effectiveRole, effectiveWorkerType } = useView();
    const { data: session }: any = useSession();
    const [electionDate, setElectionDate] = useState<Date | null>(null);
    const [currentTime, setCurrentTime] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [candidateName, setCandidateName] = useState('');
    const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | null>(null);

    // Use user's assemblyId if available, otherwise fallback to Assembly ID 13 (सिकटा)
    // Safety check: If session has stale ID 1 (which doesn't exist), force it to 13
    const userAssemblyId = session?.user?.assemblyId || 13;
    const finalAssemblyId = selectedAssemblyId || (userAssemblyId === 1 ? 13 : userAssemblyId);

    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        setMounted(true);
        // Fetch Election Date from Assembly Settings
        const fetchElectionDate = async () => {
            try {
                const res = await fetch(`/api/assembly/${finalAssemblyId}`);
                const data = await res.json();

                // Check nextElectionDate first (for upcoming elections), then electionDate
                if (data.nextElectionDate) {
                    const eDate = new Date(data.nextElectionDate);
                    setElectionDate(eDate);
                } else if (data.electionDate) {
                    const eDate = new Date(data.electionDate);
                    setElectionDate(eDate);
                }
                if (data.candidateName) {
                    setCandidateName(data.candidateName);
                }
            } catch (error) {
                console.error("Failed to fetch election date", error);
            } finally {
                setLoading(false);
            }
        };
        fetchElectionDate();
    }, [finalAssemblyId]);


    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('hi-IN'));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Prevent Hydration Mismatch
    if (!mounted) return null;

    // Show loader while fetching valid election date to prevent flickering
    if (loading) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #F1F5F9', borderTopColor: '#2563EB', borderRadius: '50%' }}></div>
            </div>
        );
    }

    // War Room is LIVE - Route based on role
    const isAdmin = effectiveRole === 'ADMIN' || effectiveRole === 'SUPERADMIN';

    if (isAdmin && !selectedAssemblyId) {
        return <CandidateSelector onSelect={setSelectedAssemblyId} lang="hi" />;
    }

    return (
        <div style={{ paddingBottom: '80px' }}>
            {/* Live Header */}
            <div style={{
                background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                color: 'white',
                padding: isMobile ? '20px' : '32px',
                borderRadius: isMobile ? '20px' : '32px',
                marginBottom: isMobile ? '20px' : '32px',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                borderLeft: isMobile ? '6px solid #EF4444' : '10px solid #EF4444',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                gap: isMobile ? '16px' : '0'
            }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-1px' }}>
                        {isAdmin && selectedAssemblyId && (
                            <button
                                onClick={() => setSelectedAssemblyId(null)}
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <ArrowLeft size={isMobile ? 20 : 24} />
                            </button>
                        )}
                        <Activity size={isMobile ? 24 : 36} className="status-red" />
                        <span style={{ whiteSpace: isMobile ? 'normal' : 'nowrap' }}>मतदान वार रूम - LIVE</span>
                    </h1>
                    <p style={{ color: '#9CA3AF', fontSize: isMobile ? '13px' : '16px', marginTop: '4px', fontWeight: '700' }}>
                        मुख्य नियंत्रण कक्ष ({candidateName || 'प्रत्याशी'})
                    </p>
                </div>
                <div style={{ textAlign: isMobile ? 'left' : 'right', width: isMobile ? '100%' : 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '900', fontVariantNumeric: 'tabular-nums' }}>{currentTime || '--:--:--'}</div>
                    <div style={{ fontSize: isMobile ? '12px' : '14px', color: '#10B981', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', animation: 'pulse-live 2s infinite' }}></div>
                        सिस्टम LIVE
                    </div>
                </div>
            </div>

            {/* Route to appropriate War Room */}
            {effectiveRole === 'WORKER' ? (
                <WorkerWarRoom boothNumber={session?.user?.boothNumber || 1} assemblyId={finalAssemblyId} />
            ) : (
                <CandidateWarRoom assemblyId={finalAssemblyId} />
            )}

            <style jsx global>{`
                @keyframes pulse-live {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
