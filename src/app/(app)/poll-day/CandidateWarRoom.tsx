/**
 * 🛡️ [PROTECTED] CANDIDATE WAR ROOM - LIVE MONITORING
 * ⚠️ STABLE COMPONENT - DO NOT MODIFY WITHOUT CONSENT.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, CheckCircle2, Clock, MapPin, Search, Eye, X } from 'lucide-react';
import { getWarRoomStats, updateIssueStatus } from '@/app/actions/dashboard';

export default function CandidateWarRoom({ assemblyId }: { assemblyId: number }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // All, Alert, Low, High
    const [searchTerm, setSearchTerm] = useState('');
    const [time, setTime] = useState<string | null>(null);

    const [showDrawer, setShowDrawer] = useState(false);
    const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
    const [isMobile, setIsMobile] = useState(false);

    const load = async () => {
        try {
            const res = await getWarRoomStats(assemblyId);
            setData(res);
        } catch (error) {
            console.error("Failed to load War Room stats:", error);
            // Optional: Set some error state or keep showing loading/fallback
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const interval = setInterval(load, 15000); // 15s refresh for War Room
        const clock = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return () => { clearInterval(interval); clearInterval(clock); };
    }, [assemblyId]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (loading || !data) {
        return (
            <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexDirection: 'column', gap: '20px' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #F1F5F9', borderTopColor: '#2563EB', borderRadius: '50%' }}></div>
                <p style={{ fontWeight: '700' }}>वार रूम डेटा लोड हो रहा है...</p>
            </div>
        );
    }

    // 2. SMART SORTING (Option 2)
    const getSortedBooths = () => {
        if (!data?.booths) return [];
        let filtered = [...data.booths];
        if (filter === 'Alert') filtered = filtered.filter((b: any) => b.status === 'Alert');
        if (filter === 'Low') filtered = filtered.filter((b: any) => (b.turnout || 0) < 30);
        if (filter === 'High') filtered = filtered.filter((b: any) => (b.turnout || 0) > 60);

        if (searchTerm) {
            filtered = filtered.filter((b: any) => b.number.toString().includes(searchTerm));
        }

        return filtered.sort((a: any, b: any) => {
            if (a.status === 'Alert' && b.status !== 'Alert') return -1;
            if (a.status !== 'Alert' && b.status === 'Alert') return 1;
            return a.number - b.number;
        });
    };

    const filteredBooths = getSortedBooths();

    // Safety check for stats - Merge with defaults
    const stats = {
        avgTurnout: 0,
        totalVoted: 0,
        totalVoters: 0,
        activeIncidents: 0,
        incidents: [],
        resolvedIncidents: [],
        ...(data?.stats || {})
    };

    // Force arrays
    if (!Array.isArray(stats.incidents)) stats.incidents = [];
    if (!Array.isArray(stats.resolvedIncidents)) stats.resolvedIncidents = [];

    return (
        <div style={{ padding: isMobile ? '10px' : '24px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'var(--font-geist-sans)' }}>

            {/* 1. HEADER & STATS */}
            <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: isMobile ? '24px' : '32px', padding: isMobile ? '24px' : '40px', color: 'white', marginBottom: isMobile ? '24px' : '40px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)' }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10, gap: isMobile ? '20px' : '0' }}>
                    <div>
                        <h1 style={{ fontSize: isMobile ? '24px' : '36px', fontWeight: '950', letterSpacing: '-0.02em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <TrendingUp size={isMobile ? 28 : 40} className="pulse-red" color="#EF4444" /> मतदान वार रूम
                        </h1>
                        <p style={{ fontSize: isMobile ? '13px' : '16px', color: '#94A3B8', fontWeight: '600' }}>मुख्य नियंत्रण कक्ष (विधानसभा: {assemblyId})</p>
                    </div>
                    <div style={{ textAlign: isMobile ? 'left' : 'right', width: isMobile ? '100%' : 'auto' }}>
                        <span style={{ fontSize: isMobile ? '32px' : '48px', fontWeight: '900', lineHeight: 1, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                            {time || '--:--'}
                        </span>

                        <div style={{ marginTop: '8px', textAlign: isMobile ? 'left' : 'right' }}>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', letterSpacing: '2px', textTransform: 'uppercase' }}>
                                TIMELINES
                            </div>
                            <CountdownTimer isMobile={isMobile} />
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '12px' : '24px', marginTop: '40px', position: 'relative', zIndex: 10 }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>मतदान प्रतिशत</div>
                        <div style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', color: stats.avgTurnout > 50 ? '#10B981' : '#F59E0B' }}>
                            {stats.avgTurnout}%
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>कुल वोट पड़े</div>
                        <div style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', color: 'white' }}>
                            {stats.totalVoted?.toLocaleString() || 0}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Active Issues</div>
                        <div style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', color: (stats.activeIncidents || 0) > 0 ? '#EF4444' : '#10B981' }}>
                            {stats.activeIncidents || 0}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>कुल मतदाता</div>
                        <div style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', color: '#64748B' }}>
                            {stats.totalVoters?.toLocaleString() || 0}
                        </div>
                    </div>
                </div>

                {/* DECORATIVE ELEMENTS */}
                <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }}></div>
            </div>

            {/* 2. BOOTH MONITORING GRID */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '950', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '12px', height: '12px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 0 4px #D1FAE5' }}></div>
                    Booth Status ({filteredBooths.length})
                </h2>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
                        <input
                            placeholder="Search Booth..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '10px 16px 10px 40px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: '700', width: isMobile ? '100%' : '200px' }}
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: '700', background: 'white', cursor: 'pointer' }}
                    >
                        <option value="All">All Booths</option>
                        <option value="Alert">⚠️ Alerts Only</option>
                        <option value="Low">🔻 Low Turnout</option>
                        <option value="High">🔥 High Turnout</option>
                    </select>
                    <button onClick={() => setShowDrawer(true)} style={{ background: 'black', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Alerts <span style={{ background: '#EF4444', padding: '2px 6px', borderRadius: '6px', fontSize: '11px' }}>{stats.activeIncidents || 0}</span>
                    </button>
                </div>
            </div>

            {/* BOOTHS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {filteredBooths.map((b: any) => (
                    <div key={b.id} style={{
                        background: 'white', borderRadius: '20px', padding: '20px',
                        border: b.status === 'Alert' ? '2px solid #EF4444' : '1px solid #E2E8F0',
                        animation: b.status === 'Alert' ? 'pulse-soft-red 2s infinite' : 'none',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>BOOTH #{b.number}</div>
                                <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A', marginTop: '2px' }}>{b.name?.substring(0, 18)}...</div>
                            </div>
                            <div style={{ background: b.turnout < 30 ? '#FEF2F2' : '#F0FDF4', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', color: b.turnout < 30 ? '#EF4444' : '#16A34A' }}>
                                {b.turnout}%
                            </div>
                        </div>

                        <div style={{ height: '6px', width: '100%', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                            <div style={{ width: `${b.turnout}%`, height: '100%', background: b.turnout < 30 ? '#EF4444' : '#2563EB' }}></div>
                        </div>

                        {b.status === 'Alert' && (
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#EF4444', background: '#FEF2F2', padding: '6px', borderRadius: '6px', marginBottom: '12px' }}>
                                ⚠️ Active Issue Reported
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#94A3B8' }}>
                            <span>{b.voted} / {b.total} Votes</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Live</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ISSUE DRAWER */}
            <div style={{
                position: 'fixed', top: 0, right: 0, height: '100vh', width: isMobile ? '100%' : '450px',
                background: 'white', zIndex: 10000,
                boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
                transform: showDrawer ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#0F172A' }}>Issue Control</h2>
                        <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Manage Alerts & History</p>
                    </div>
                    <button onClick={() => setShowDrawer(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px' }}>
                        <X size={24} color="#64748B" />
                    </button>
                </div>

                <div style={{ padding: '0 24px', borderBottom: '1px solid #E2E8F0', display: 'flex' }}>
                    <button onClick={() => setActiveTab('live')} style={{ flex: 1, padding: '16px', borderBottom: `2px solid ${activeTab === 'live' ? '#EF4444' : 'transparent'}`, fontWeight: '800', color: activeTab === 'live' ? '#EF4444' : '#64748B', background: 'none', cursor: 'pointer' }}>
                        Live Alerts ({stats.incidents.length})
                    </button>
                    <button onClick={() => setActiveTab('history')} style={{ flex: 1, padding: '16px', borderBottom: `2px solid ${activeTab === 'history' ? '#10B981' : 'transparent'}`, fontWeight: '800', color: activeTab === 'history' ? '#10B981' : '#64748B', background: 'none', cursor: 'pointer' }}>
                        History
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#F8FAFC' }}>
                    {activeTab === 'live' && (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {stats.incidents.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontWeight: '600' }}>No Active Alerts 🎉</div>}
                            {stats.incidents.map((incident: any) => (
                                <div key={incident.id} style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #FECACA', borderLeft: '4px solid #EF4444' }}>
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                        <div style={{ background: '#FEE2F2', padding: '8px', borderRadius: '50%', height: 'fit-content' }}>
                                            <AlertTriangle size={16} color="#EF4444" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#0F172A' }}>{incident.title}</div>
                                            <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px' }}>{incident.description}</div>
                                            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>
                                                {incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString('hi-IN') : '--:--'}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={async () => { if (confirm('Resolve?')) { await updateIssueStatus(incident.id, 'Resolved'); load(); } }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#DCFCE7', color: '#16A34A', border: 'none', fontWeight: '800' }}>Resolve</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showDrawer && <div onClick={() => setShowDrawer(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 9999 }}></div>}

            {(stats.activeIncidents || 0) > 0 && <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', border: '8px solid #EF4444', pointerEvents: 'none', zIndex: 9990, animation: 'emergency-flash 1s infinite' }}></div>}

            <style jsx global>{`
                @keyframes pulse-soft-red {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
                    50% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                @keyframes emergency-flash {
                    0% { opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
}

function CountdownTimer({ isMobile }: { isMobile: boolean }) {
    const [label, setLabel] = useState('LOADING...');
    useEffect(() => {
        const TARGET = new Date('2027-03-15T09:00:00');
        const tick = () => {
            const now = new Date();
            const diff = TARGET.getTime() - now.getTime();
            if (diff <= 0) { setLabel('ELECTION LIVE'); return; }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            setLabel(`${days} DAYS TO GO`);
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '900', color: '#F59E0B', fontFamily: 'monospace' }}>
            {label}
        </div>
    );
}
