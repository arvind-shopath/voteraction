'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import { Settings, X, Eye, ChevronRight } from 'lucide-react';

export default function FloatingViewSwitcher() {
    const { data: session }: any = useSession();
    const { effectiveRole, effectiveWorkerType, setEffectiveRole } = useView();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !session?.user || session.user.role !== 'SUPERADMIN') return null;

    const options = [
        { label: 'Super Admin View', role: 'SUPERADMIN', worker: null, path: '/admin' },
        { label: 'Admin View', role: 'ADMIN', worker: null, path: '/admin' },
        { label: 'Candidate View', role: 'CANDIDATE', worker: null, path: '/dashboard' },
        { label: 'Booth Manager View', role: 'WORKER', worker: 'BOOTH_MANAGER', path: '/dashboard' },
        { label: 'Panna Pramukh View', role: 'WORKER', worker: 'PANNA_PRAMUKH', path: '/dashboard' },
        { label: 'Ground Worker View', role: 'WORKER', worker: 'FIELD', path: '/dashboard' },
        { label: 'Candidate Social Team', role: 'SOCIAL_MEDIA', worker: null, path: '/social/local-team' },
        { label: 'Central Team: Manager', role: 'SOCIAL_MEDIA', worker: 'CENTRAL_MANAGER', path: '/social-sena' },
        { label: 'Central Team: Designer', role: 'SOCIAL_MEDIA', worker: 'CENTRAL_DESIGNER', path: '/social-sena/designer' },
        { label: 'Central Team: Video Editor', role: 'SOCIAL_MEDIA', worker: 'CENTRAL_EDITOR', path: '/social-sena/video-editor' },
    ];

    const handleSwitch = (opt: any) => {
        setEffectiveRole(opt.role, opt.worker, undefined, opt.path);
        setIsOpen(false);
    };

    const currentVal = effectiveWorkerType || effectiveRole;

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    top: '50%',
                    right: '24px',
                    transform: isOpen ? 'translateY(-50%) rotate(90deg) scale(0.9)' : 'translateY(-50%) rotate(0) scale(1)',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#1E293B',
                    color: 'white',
                    border: '4px solid white',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 99999,
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
            >
                {isOpen ? <X size={28} /> : <Eye size={28} />}
            </button>

            {/* Menu Container */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '24px',
                    width: '320px',
                    background: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    padding: '16px',
                    zIndex: 99998,
                    border: '1px solid #E2E8F0',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    <div style={{ padding: '0 12px 12px 12px', borderBottom: '1px solid #F1F5F9', marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            VIEW SYSTEM AS
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                        {options.map((opt, i) => {
                            const isActive = (opt.worker ? effectiveWorkerType === opt.worker : (effectiveRole === opt.role && !effectiveWorkerType));
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSwitch(opt)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: isActive ? '#EFF6FF' : 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                        color: isActive ? '#2563EB' : '#475569',
                                        fontWeight: isActive ? '800' : '600',
                                        fontSize: '14px'
                                    }}
                                    onMouseEnter={(e: any) => { if (!isActive) e.currentTarget.style.background = '#F8FAFC'; }}
                                    onMouseLeave={(e: any) => { if (!isActive) e.currentTarget.style.background = 'white'; }}
                                >
                                    {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB', marginRight: '8px' }}></div>}
                                    <span style={{ flex: 1 }}>{opt.label}</span>
                                    <ChevronRight size={16} opacity={0.4} />
                                </button>
                            );
                        })}

                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                            <button
                                onClick={() => setEffectiveRole('SUPERADMIN', null, undefined, '/admin')}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: '#FEE2E2',
                                    color: '#B91C1C',
                                    border: 'none',
                                    fontWeight: '900',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                ❌ EXIT SIMULATION
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
}
