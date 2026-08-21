'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, ArrowUpRight, BarChart3, TrendingUp, Users, List, PieChart, Home, MapPin, Zap, AlertTriangle, CheckCircle, Calendar, Clock, ChevronRight, Activity, Target, Star, Crown, Medal } from 'lucide-react';
import { getCasteAnalytics, getDashboardStats, getBoothSentimentAnalytics, getAgeAnalytics } from '@/app/actions/dashboard';
import { getAssemblyLeaderboard } from '@/app/actions/worker';
import { PARTY_CONFIG } from '@/lib/constants';

interface CandidateDashboardViewProps {
    role: string;
    selectedAssemblyId: number | null;
    selectedCampaignId: number | null;
    setSelectedAssemblyId: (id: number | null) => void;
    setSelectedCampaignId: (id: number | null) => void;
    assemblies: any[];
    candidateUsers?: any[];
    canSwitch: boolean;
    isGlobalDisplay: boolean;
    lang: 'hi' | 'en';
    isMobile: boolean;
    currentUser: any;
    setEffectiveRole: (role: string | null, workerType?: string | null, persona?: any) => void;
    effectiveRole: string | null;
    realRole: string;
}

export default function CandidateDashboardView({
    role,
    selectedAssemblyId,
    selectedCampaignId,
    setSelectedAssemblyId,
    setSelectedCampaignId,
    assemblies,
    candidateUsers = [],
    canSwitch,
    isGlobalDisplay,
    lang,
    isMobile,
    currentUser,
    setEffectiveRole,
    effectiveRole,
    realRole
}: CandidateDashboardViewProps) {
    const [stats, setStats] = useState<any>(null);
    const [casteData, setCasteData] = useState<any[]>([]);
    const [ageData, setAgeData] = useState<any[]>([]);
    const [boothSentiment, setBoothSentiment] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeHistoryTab, setActiveHistoryTab] = useState<string>('');

    useEffect(() => {
        async function fetchData() {
            if (!selectedAssemblyId) return;
            setLoading(true);
            try {
                const dashboardStats = await getDashboardStats(role, selectedAssemblyId, currentUser?.id);
                setStats(dashboardStats);

                const [casteStats, sentimentStats, ageStats] = await Promise.all([
                    getCasteAnalytics(selectedAssemblyId),
                    getBoothSentimentAnalytics(selectedAssemblyId),
                    getAgeAnalytics(selectedAssemblyId)
                ]);
                setCasteData(casteStats || []);
                setBoothSentiment(sentimentStats || []);
                setAgeData(ageStats || []);

                if (dashboardStats?.electionHistory?.length > 0) {
                    const years = [...new Set(dashboardStats.electionHistory.map((h: any) => h.year.toString()))] as string[];
                    setActiveHistoryTab(years[0]);
                } else if (dashboardStats?.historicalResults) {
                    setActiveHistoryTab('Default');
                }
            } catch (err) {
                console.error("Dashboard data fetch error", err);
            } finally {
                setLoading(false);
            }
        }
        if (selectedAssemblyId) {
            fetchData();
        } else {
            setLoading(false);
            setStats(null);
        }
    }, [selectedAssemblyId, role, currentUser?.id]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
            <div className="spinner"></div>
            <div style={{ fontWeight: '600', color: '#6B7280' }}>
                {lang === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading Data...'}
            </div>
        </div>
    );

    const t = {
        adminView: lang === 'hi' ? 'एडमिन दृश्य' : 'Admin View',
        liveAnalysis: lang === 'hi' ? 'आपकी विधानसभा का लाइव विश्लेषण' : 'Live analysis of your assembly',
        globalData: lang === 'hi' ? 'रीयल-टाइम डेटा' : 'Real-time data',
        voters: lang === 'hi' ? 'कुल मतदाता' : 'Total Voters',
        booths: lang === 'hi' ? 'सक्रिय बूथ' : 'Active Booths',
        workers: lang === 'hi' ? 'पूरी टीम (कार्यकर्ता)' : 'Total Workers',
        tasks: lang === 'hi' ? 'पूरे कार्य' : 'Completed Tasks',
        boothAnalysis: lang === 'hi' ? 'बूथ विश्लेषण' : 'Booth Analysis',
        casteAnalytics: lang === 'hi' ? 'जातिगत समीकरण' : 'Caste Analytics',
        ageDist: lang === 'hi' ? 'आयु वर्ग' : 'Age Distribution',
        todayStatus: lang === 'hi' ? 'आज की स्थिति' : "Today's Status",
        topBooths: lang === 'hi' ? 'पॉजिटिव बूथ सेंटीमेंट' : 'Top Sentiment Booths',
        feedback: lang === 'hi' ? 'जनसंपर्क फीडबैक' : 'Jansampark Feedback',
        historicalHeader: lang === 'hi' ? 'पिछले चुनाव के आंकड़े' : 'Historical Election Data',
        selectAssembly: lang === 'hi' ? 'विधानसभा चुनें' : 'Select Assembly'
    };

    let historicalLines: any[] = [];
    try { if (stats?.historicalResults) historicalLines = JSON.parse(stats.historicalResults); } catch (e) { }

    let adminCastes: any[] = [];
    try { if (stats?.casteEquation) adminCastes = JSON.parse(stats.casteEquation); } catch (e) { }

    const totalVoters = stats?.voters || 0;
    const readiness = stats?.electionReadiness;
    const hhStats = stats?.householdStats;
    const boothReadiness = stats?.boothReadiness;

    // Format event date
    const formatEventDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
        if (d.toDateString() === today.toDateString()) return 'आज';
        if (d.toDateString() === tomorrow.toDateString()) return 'कल';
        return d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' });
    };
    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ paddingBottom: '100px' }}>
            {/* ── HEADER ── */}
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'flex-start',
                gap: '24px',
                marginBottom: '32px'
            }}>
                <div style={{ width: isMobile ? '100%' : 'auto' }}>
                    <h1 style={{
                        fontSize: isMobile ? '24px' : '32px',
                        fontWeight: '900',
                        background: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '8px'
                    }}>
                        {isGlobalDisplay ? t.adminView : (selectedAssemblyId ? (() => {
                            const assembly = assemblies.find(a => a.id === selectedAssemblyId);
                            return `${assembly?.number || ''} ${assembly?.name || ''} विधानसभा`;
                        })() : 'विधानसभा चुनें')}
                    </h1>
                    <p style={{ color: '#64748B', fontSize: '15px', fontWeight: '600' }}>
                        {isGlobalDisplay ? t.globalData : t.liveAnalysis}
                    </p>
                </div>

                {canSwitch && (
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
                        {role !== 'CANDIDATE' && (
                            <select
                                value={selectedAssemblyId || ''}
                                onChange={(e) => {
                                    const id = Number(e.target.value);
                                    setSelectedAssemblyId(id);
                                    setSelectedCampaignId(null);
                                    if (effectiveRole === 'CANDIDATE') {
                                        const assm = assemblies.find((a: any) => a.id === id);
                                        if (assm) {
                                            setEffectiveRole('CANDIDATE', null, { name: assm.candidateName || 'Candidate', image: assm.candidateImageUrl });
                                        } else {
                                            setEffectiveRole(realRole);
                                        }
                                    } else if (isGlobalDisplay) {
                                        setEffectiveRole(realRole);
                                    }
                                }}
                                style={{ padding: '12px 16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', fontWeight: '700', color: '#1E293B', outline: 'none', flex: isMobile ? 1 : 'none' }}
                            >
                                <option value="">{t.selectAssembly}</option>
                                {assemblies.map((a: any, idx: number) => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.number || idx + 1})</option>
                                ))}
                            </select>
                        )}

                        {selectedAssemblyId && (
                            <select
                                value={selectedCampaignId || ''}
                                onChange={(e) => setSelectedCampaignId(Number(e.target.value) || null)}
                                style={{ padding: '12px 16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', fontWeight: '700', color: '#1E293B', outline: 'none', flex: isMobile ? 1 : 'none' }}
                            >
                                <option value="">{lang === 'hi' ? 'अभियान चुनें (सभी)' : 'Select Campaign (All)'}</option>
                                {assemblies.find(a => a.id === selectedAssemblyId)?.campaigns?.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}

                        {isGlobalDisplay && (
                            <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '14px', gap: '4px', width: isMobile ? '100%' : 'auto' }}>
                                <button onClick={() => setEffectiveRole(null)} style={{ flex: 1, padding: '8px 16px', borderRadius: '10px', border: 'none', background: !effectiveRole ? 'white' : 'transparent', color: !effectiveRole ? '#1E293B' : '#64748B', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: !effectiveRole ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>Admin View</button>
                                <button onClick={() => setEffectiveRole('CANDIDATE')} style={{ flex: 1, padding: '8px 16px', borderRadius: '10px', border: 'none', background: effectiveRole === 'CANDIDATE' ? 'white' : 'transparent', color: effectiveRole === 'CANDIDATE' ? '#1E293B' : '#64748B', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: effectiveRole === 'CANDIDATE' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>Simulation</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── EMPTY STATE ── */}
            {!stats && !loading && (
                <div style={{ padding: '80px 20px', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', marginTop: '20px' }}>
                    {isGlobalDisplay ? (
                        <>
                            <Shield size={48} color="#94A3B8" style={{ marginBottom: '16px' }} />
                            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>{lang === 'hi' ? 'कृपया विधानसभा चुनें' : 'Please Select an Assembly'}</h2>
                            <p style={{ color: '#64748B', maxWidth: '400px', margin: '8px auto' }}>{lang === 'hi' ? 'डेटा और विश्लेषण देखने के लिए ऊपर दिए गए फिल्टर से विधानसभा का चुनाव करें।' : 'Select an assembly from the filter above to view live data and analysis.'}</p>
                        </>
                    ) : (
                        <>
                            <Users size={48} color="#94A3B8" style={{ marginBottom: '16px' }} />
                            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>{lang === 'hi' ? 'कैंडिडेट का चुनाव करें' : 'Select a Candidate'}</h2>
                            <p style={{ color: '#64748B', maxWidth: '400px', margin: '8px auto' }}>{lang === 'hi' ? 'कैंडिडेट डैशबोर्ड देखने के लिए एक कैंडिडेट का चुनाव करें।' : 'Select a candidate campaign to view this workspace.'}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '32px', maxWidth: '1100px', margin: '32px auto 0' }}>
                                {(() => {
                                    const displayCandidates = [
                                        ...(candidateUsers && candidateUsers.length > 0 ? candidateUsers.map(u => {
                                            const a = assemblies.find(as => as.id === u.assemblyId);
                                            return { id: `cand-${u.id}`, name: u.name, image: u.image, assemblyId: u.assemblyId, campaignId: u.campaignId, assemblyName: a ? a.name : 'कोई विधानसभा नहीं', district: a ? (a.district || a.number) : '' };
                                        }) : []),
                                        ...(assemblies || []).filter(a => !candidateUsers?.some(u => u.assemblyId === a.id)).map(a => ({ id: `seat-${a.id}`, name: 'प्रत्याशी सीट (खाली)', image: null, assemblyId: a.id, campaignId: a.campaigns?.[0]?.id || null, assemblyName: a.name, district: a.district || a.number }))
                                    ];
                                    return displayCandidates.map((c: any) => (
                                        <button key={c.id} onClick={() => {
                                            const targetAssmId = c.assemblyId || assemblies[0]?.id;
                                            if (targetAssmId) setSelectedAssemblyId(targetAssmId);
                                            if (c.campaignId) setSelectedCampaignId(c.campaignId);
                                            setEffectiveRole('CANDIDATE', null, { name: c.name, image: c.image });
                                        }} style={{ padding: '20px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                                            <div style={{ width: '48px', height: '48px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#2563EB', overflow: 'hidden' }}>
                                                {c.image ? <img src={c.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.name?.[0] || 'C')}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '16px', color: '#1E293B' }}>{c.name}</div>
                                                <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>📍 {c.assemblyName} {c.district ? `(${c.district})` : ''}</div>
                                            </div>
                                        </button>
                                    ));
                                })()}
                            </div>
                        </>
                    )}
                </div>
            )}

            {stats && (
                <>
                    {/* ── SECTION 1: KPI CARDS ── */}
                    <div className="kpi-grid" style={{ gap: '20px', marginBottom: '24px' }}>
                        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)', borderRadius: '20px' }}>
                            <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.voters}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                                <div className="kpi-value" style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{totalVoters.toLocaleString('hi-IN')}</div>
                                <div style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', backdropFilter: 'blur(4px)' }}><ArrowUpRight size={12} /> Verified</div>
                            </div>
                        </div>
                        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.5)', borderRadius: '20px' }}>
                            <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.booths}</div>
                            <div className="kpi-value" style={{ color: 'white' }}>{stats.booths || 0}</div>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '4px' }}>{lang === 'hi' ? 'प्रभारी नियुक्त हैं' : 'Incharge assigned'}</div>
                        </div>
                        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)', borderRadius: '20px' }}>
                            <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.workers}</div>
                            <div className="kpi-value" style={{ color: 'white' }}>{stats.workers || 0}</div>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '4px' }}>On-field active</div>
                        </div>
                        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.5)', borderRadius: '20px' }}>
                            <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.tasks}</div>
                            <div className="kpi-value" style={{ color: 'white' }}>{stats.tasks || 0}</div>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '4px' }}>{lang === 'hi' ? 'पूर्ण हुए' : 'Completed'}</div>
                        </div>
                    </div>

                    {/* ── SECTION 2: ELECTION READINESS BANNER ── */}
                    {readiness && (
                        <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', borderRadius: '20px', padding: '24px', marginBottom: '24px', color: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>⚡ चुनावी तैयारी (Election Readiness)</div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                        <div style={{ fontSize: '56px', fontWeight: '900', color: readiness.score === null ? '#94A3B8' : readiness.score >= 70 ? '#10B981' : readiness.score >= 40 ? '#F59E0B' : '#EF4444', lineHeight: 1 }}>
                                            {readiness.score !== null ? `${readiness.score}%` : '—'}
                                        </div>
                                        {readiness.score !== null && (
                                            <div style={{ fontSize: '14px', color: '#94A3B8' }}>
                                                {readiness.score >= 70 ? '🟢 अच्छी स्थिति' : readiness.score >= 40 ? '🟡 ध्यान दें' : '🔴 तत्काल कार्रवाई'}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748B' }}>
                                        {boothReadiness && <>🔴 {boothReadiness.critical} Critical · 🟡 {boothReadiness.attention} Attention · 🟢 {boothReadiness.ready} Ready</>}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '12px', flex: 1, minWidth: '240px', maxWidth: '540px' }}>
                                    {readiness.components.map((c: any, i: number) => (
                                        <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '10px 12px' }}>
                                            <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>{c.icon} {c.label}</div>
                                            <div style={{ fontSize: '18px', fontWeight: '900', color: c.score === null ? '#475569' : c.score >= 70 ? '#10B981' : c.score >= 40 ? '#F59E0B' : '#EF4444' }}>
                                                {c.score !== null ? `${c.score}%` : <span style={{ fontSize: '12px' }}>डेटा लंबित</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <Link href="/campaign-progress" style={{ color: '#60A5FA', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                    📈 विस्तृत Campaign Progress देखें <ChevronRight size={14} />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* ── SECTION 3: TODAY'S SNAPSHOT ── */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>📅 आज की स्थिति (Today's Snapshot)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: '12px' }}>
                            {[
                                { label: 'आज के Events', value: stats.todayEventsCount ?? 0, icon: '🎯', color: '#2563EB', link: '/events' },
                                { label: 'आज के Field Visits', value: stats.todayVisits ?? 0, icon: '🚪', color: '#10B981', link: '/households' },
                                { label: 'Active Workers', value: stats.activeWorkersToday ?? stats.workers, icon: '👥', color: '#8B5CF6', link: '/workers' },
                                { label: 'Pending Tasks', value: stats.pendingTasksCount ?? 0, icon: '📋', color: '#F59E0B', link: '/tasks' },
                                { label: 'Revisit Required', value: hhStats?.revisit ?? 0, icon: '🔄', color: '#EF4444', link: '/households' },
                            ].map((item, i) => (
                                <Link key={i} href={item.link} style={{ textDecoration: 'none' }}>
                                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                                        <div style={{ fontSize: '22px', marginBottom: '6px' }}>{item.icon}</div>
                                        <div style={{ fontSize: '26px', fontWeight: '900', color: item.color }}>{item.value.toLocaleString('hi-IN')}</div>
                                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginTop: '4px' }}>{item.label}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ── SECTION 4: HOUSEHOLD COVERAGE ── */}
                    {hhStats && (
                        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Home size={20} color="#2563EB" /> हाउसहोल्ड / डोर-टू-डोर कवरेज
                                </h3>
                                <Link href="/households" style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Household Tracking <ChevronRight size={14} />
                                </Link>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                                {[
                                    { label: 'कुल Households', value: hhStats.total, color: '#1E293B' },
                                    { label: 'Visit हुए', value: hhStats.visited, color: '#10B981' },
                                    { label: 'Pending', value: hhStats.pending, color: '#F59E0B' },
                                    { label: 'Revisit Required', value: hhStats.revisit, color: '#EF4444' },
                                ].map((item, i) => (
                                    <div key={i} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '900', color: item.color }}>{item.value.toLocaleString('hi-IN')}</div>
                                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '4px' }}>{item.label}</div>
                                    </div>
                                ))}
                            </div>
                            {/* Progress Bar */}
                            {hhStats.total > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748B' }}>Coverage Progress</span>
                                        <span style={{ fontSize: '13px', fontWeight: '900', color: '#10B981' }}>{Math.round((hhStats.visited / hhStats.total) * 100)}%</span>
                                    </div>
                                    <div style={{ height: '10px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min(100, Math.round((hhStats.visited / hhStats.total) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #059669)', borderRadius: '10px', transition: 'width 0.5s' }}></div>
                                    </div>
                                </div>
                            )}
                            {/* Priority Booths Table */}
                            {hhStats.boothBreakdown?.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>⚠️ Priority Booths (कम Coverage)</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {hhStats.boothBreakdown.slice(0, 4).map((b: any, i: number) => {
                                            const pct = b.total > 0 ? Math.round((b.visited / b.total) * 100) : 0;
                                            return (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: '#FEF2F2', borderRadius: '10px' }}>
                                                    <span style={{ fontWeight: '900', fontSize: '13px', color: '#DC2626', minWidth: '60px' }}>Booth {b.boothNumber}</span>
                                                    <div style={{ flex: 1, height: '6px', background: '#FECACA', borderRadius: '6px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: '#DC2626', borderRadius: '6px' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#DC2626', minWidth: '35px', textAlign: 'right' }}>{pct}%</span>
                                                    <span style={{ fontSize: '11px', color: '#64748B' }}>{b.visited}/{b.total}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── SECTION 5: MAP SNAPSHOT ── */}
                    <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1px solid #BFDBFE', borderRadius: '20px', padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '52px', height: '52px', background: '#2563EB', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MapPin size={26} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '900', color: '#1E3A8A' }}>Household Map — फील्ड कवरेज नक्शा</div>
                                <div style={{ fontSize: '13px', color: '#3B82F6', fontWeight: '600' }}>सभी बूथों की household locations और visit status देखें</div>
                            </div>
                        </div>
                        <Link href="/households/map" style={{ background: '#2563EB', color: 'white', padding: '12px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                            पूरा नक्शा खोलें <ChevronRight size={16} />
                        </Link>
                    </div>

                    {/* ── SECTION 6: BOOTH STATUS ── */}
                    {boothReadiness && (
                        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0F172A' }}>🏛️ बूथ स्थिति (Booth Status)</h3>
                                <Link href="/booths" style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Booth Management <ChevronRight size={14} />
                                </Link>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                                {[
                                    { label: 'तैयार (Ready)', count: boothReadiness.ready, color: '#10B981', bg: '#DCFCE7', emoji: '🟢' },
                                    { label: 'ध्यान चाहिए', count: boothReadiness.attention, color: '#D97706', bg: '#FEF3C7', emoji: '🟡' },
                                    { label: 'Critical', count: boothReadiness.critical, color: '#DC2626', bg: '#FEE2E2', emoji: '🔴' },
                                ].map((item, i) => (
                                    <div key={i} style={{ background: item.bg, borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '28px', fontWeight: '900', color: item.color }}>{item.count}</div>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: item.color, marginTop: '4px' }}>{item.emoji} {item.label}</div>
                                        <div style={{ fontSize: '11px', color: '#64748B' }}>/ {boothReadiness.total} बूथ</div>
                                    </div>
                                ))}
                            </div>
                            {boothReadiness.priorityBooths?.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>⚠️ Priority Booths</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {boothReadiness.priorityBooths.map((b: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: b.status === 'critical' ? '#FEF2F2' : '#FFFBEB', borderRadius: '10px' }}>
                                                <span style={{ fontWeight: '900', fontSize: '13px', color: b.status === 'critical' ? '#DC2626' : '#D97706' }}>Booth {b.boothNumber}</span>
                                                <span style={{ fontSize: '12px', color: '#64748B' }}>{b.reason}</span>
                                                <Link href={`/voters?booth=${b.boothNumber}`} style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', textDecoration: 'none' }}>देखें →</Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Booth Grid */}
                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                                <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', marginBottom: '10px', textTransform: 'uppercase' }}>सभी बूथ — Sentiment</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))', gap: '8px' }}>
                                    {boothSentiment.map((booth: any, idx: number) => {
                                        const color = booth.support > 60 ? '#10B981' : booth.support > 40 ? '#F59E0B' : '#EF4444';
                                        return (
                                            <div key={idx} style={{ aspectRatio: '1', border: `1.5px solid ${color}`, borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: `${color}10` }} onClick={() => window.location.href = `/voters?booth=${booth.boothNumber}`}>
                                                <div style={{ fontSize: '9px', color: '#64748B' }}>Booth</div>
                                                <div style={{ fontSize: '14px', fontWeight: '900', color: color }}>{booth.boothNumber}</div>
                                                <div style={{ fontSize: '11px', fontWeight: '800', color: color }}>{booth.support}%</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SECTION 7: UPCOMING EVENTS ── */}
                    {stats.upcomingEvents !== undefined && (
                        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0F172A' }}>📅 आगामी कार्यक्रम (Upcoming Events)</h3>
                                <Link href="/events" style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    सभी Events <ChevronRight size={14} />
                                </Link>
                            </div>
                            {stats.upcomingEvents.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8', fontSize: '14px', fontWeight: '600' }}>
                                    <Calendar size={32} style={{ marginBottom: '8px', opacity: 0.5 }} /><br />
                                    कोई आगामी कार्यक्रम नहीं
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {stats.upcomingEvents.map((ev: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', gap: '16px', padding: '14px 16px', background: '#F8FAFC', borderRadius: '14px', alignItems: 'center' }}>
                                            <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '10px 12px', textAlign: 'center', minWidth: '52px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '900', color: '#2563EB' }}>{formatEventDate(ev.eventDate)}</div>
                                                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>{formatTime(ev.eventDate)}</div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A' }}>{ev.name}</div>
                                                <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                    <MapPin size={11} /> {ev.location || 'स्थान अनिर्धारित'}
                                                    {ev.expectedAttendance && <span style={{ marginLeft: '8px' }}>👥 {ev.expectedAttendance}</span>}
                                                </div>
                                            </div>
                                            {ev.eventType && <span style={{ fontSize: '11px', fontWeight: '800', background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '20px' }}>{ev.eventType}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── SECTION 8: FIELD TEAM STATUS ── */}
                    <div style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)', color: 'white', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: '900', color: 'white' }}>👥 Field Team Status</h3>
                            <Link href="/workers" style={{ fontSize: '13px', fontWeight: '800', color: '#93C5FD', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Worker Progress <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px' }}>
                            {[
                                { label: 'कुल कार्यकर्ता', value: stats.workers || 0, icon: '👤' },
                                { label: 'आज Active', value: stats.activeWorkersToday ?? stats.workers, icon: '✅' },
                                { label: 'पार्टी की ताकत', value: (stats.prevPartyVotes || 0).toLocaleString('hi-IN'), icon: '🏛️' },
                                { label: 'Visits Today', value: stats.todayVisits ?? 0, icon: '🚪' },
                            ].map((item, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</div>
                                    <div style={{ fontSize: '22px', fontWeight: '900', color: 'white' }}>{item.value}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', fontWeight: '700' }}>{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── SECTION 9: TASKS & ISSUES ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        {/* Tasks */}
                        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>📋 कार्य (Tasks)</h3>
                                <Link href="/tasks" style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB', textDecoration: 'none' }}>सभी देखें →</Link>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                <div style={{ background: '#FFFBEB', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#D97706' }}>{stats.pendingTasksCount ?? 0}</div>
                                    <div style={{ fontSize: '11px', color: '#92400E', fontWeight: '800' }}>🟡 Pending</div>
                                </div>
                                <div style={{ background: '#FEF2F2', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#DC2626' }}>{stats.overdueTasks ?? 0}</div>
                                    <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: '800' }}>🔴 Overdue</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textAlign: 'center' }}>
                                ✅ {stats.tasks || 0} पूर्ण हुए · कुल {(stats.tasks || 0) + (stats.pendingTasksCount || 0)} कार्य
                            </div>
                        </div>

                        {/* Issues */}
                        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>⚠️ समस्याएं (Issues)</h3>
                                <Link href="/issues" style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB', textDecoration: 'none' }}>सभी देखें →</Link>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                <div style={{ background: '#FEF2F2', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#DC2626' }}>{stats.criticalIssues ?? 0}</div>
                                    <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: '800' }}>🔴 Critical</div>
                                </div>
                                <div style={{ background: '#FFFBEB', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#D97706' }}>{(stats.totalOpenIssues ?? 0) - (stats.criticalIssues ?? 0)}</div>
                                    <div style={{ fontSize: '11px', color: '#92400E', fontWeight: '800' }}>🟡 Pending</div>
                                </div>
                            </div>
                            {stats.topIssues?.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {stats.topIssues.map((issue: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F8FAFC', borderRadius: '8px', fontSize: '12px' }}>
                                            <span style={{ fontWeight: '700', color: '#0F172A' }}>{issue.title?.slice(0, 30) || 'समस्या'}</span>
                                            <span style={{ fontWeight: '800', color: issue.priority === 'Critical' ? '#DC2626' : '#D97706' }}>{issue.priority}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── SECTION 10: ANALYTICS (Caste + Age) ── */}
                    <div className="dashboard-layout">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="dashboard-subgrid">
                                <div className="card">
                                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart3 size={20} color="#2563EB" /> {t.casteAnalytics}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {casteData.slice(0, 6).map((item: any, idx: number) => {
                                            const colors = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                                            const w = totalVoters > 0 ? (item.count / totalVoters) * 100 : 0;
                                            return (
                                                <div key={idx}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                                                        <span style={{ fontWeight: '700' }}>{item.name}</span>
                                                        <span style={{ fontWeight: '800', color: '#64748B' }}>{item.count.toLocaleString('hi-IN')}</span>
                                                    </div>
                                                    <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${w}%`, height: '100%', background: colors[idx % colors.length], borderRadius: '10px' }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="card">
                                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20} color="#8B5CF6" /> {t.ageDist}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {(() => {
                                            const totalAgeCount = ageData.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
                                            return ageData.map((item: any, idx: number) => {
                                                const colors = ['#F59E0B', '#10B981', '#2563EB', '#8B5CF6', '#94A3B8'];
                                                const percent = totalAgeCount > 0 ? Math.round((item.count / totalAgeCount) * 100) : 0;
                                                return (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: colors[idx % colors.length] }}></div>
                                                        <div style={{ flex: 1, fontSize: '14px', fontWeight: '700' }}>{item.range}</div>
                                                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B' }}>{percent}%</div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Caste Pie Chart */}
                            <div className="card">
                                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><PieChart size={20} color="#2563EB" /> {lang === 'hi' ? 'विधानसभा का जाति समीकरण' : 'Assembly Caste Equation'}</h3>
                                {adminCastes.length > 0 ? (
                                    <div className="caste-grid">
                                        <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
                                            <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
                                                {(() => {
                                                    let currentAngle = 0;
                                                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#06B6D4'];
                                                    return adminCastes.map((c: any, idx: number) => {
                                                        const startAngle = currentAngle;
                                                        const sliceAngle = (c.percent / 100) * 360;
                                                        currentAngle += sliceAngle;
                                                        const startRad = (startAngle - 90) * (Math.PI / 180);
                                                        const endRad = (currentAngle - 90) * (Math.PI / 180);
                                                        const x1 = 100 + 90 * Math.cos(startRad);
                                                        const y1 = 100 + 90 * Math.sin(startRad);
                                                        const x2 = 100 + 90 * Math.cos(endRad);
                                                        const y2 = 100 + 90 * Math.sin(endRad);
                                                        const largeArc = sliceAngle > 180 ? 1 : 0;
                                                        return <path key={idx} d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={colors[idx % colors.length]} stroke="white" strokeWidth="2" />;
                                                    });
                                                })()}
                                                <circle cx="100" cy="100" r="50" fill="white" />
                                            </svg>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                                            {adminCastes.map((c: any, idx: number) => {
                                                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#06B6D4'];
                                                return (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: colors[idx % colors.length] }}></div>
                                                        <div>
                                                            <div style={{ fontWeight: '800', fontSize: '14px' }}>{c.name}</div>
                                                            <div style={{ fontWeight: '900', color: colors[idx % colors.length] }}>{c.percent}%</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : <div style={{ textAlign: 'center', color: '#94A3B8', padding: '40px' }}>डेटा अनुपलब्ध</div>}
                            </div>

                            {/* Historical Data */}
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><List size={20} /> {t.historicalHeader}</h3>
                                    <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                                        {stats?.electionHistory?.length > 0 && [...new Set(stats.electionHistory.map((h: any) => h.year.toString()))].map((year: any) => (
                                            <button key={year} onClick={() => setActiveHistoryTab(year)} style={{ padding: '6px 16px', borderRadius: '10px', border: 'none', background: activeHistoryTab === year ? 'white' : 'transparent', fontWeight: '700', fontSize: '13px', color: activeHistoryTab === year ? '#1E40AF' : '#64748B', cursor: 'pointer' }}>{year}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="responsive-table-wrapper">
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                                                <th style={{ textAlign: 'left', padding: '14px' }}>पार्टी</th>
                                                <th style={{ textAlign: 'left', padding: '14px' }}>प्रत्याशी</th>
                                                <th style={{ textAlign: 'right', padding: '14px' }}>वोट मिले</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                let lines = activeHistoryTab === 'Default' ? historicalLines.map(l => ({ partyName: l.party, candidateName: l.candidate, votesReceived: l.votes })) : stats.electionHistory.filter((h: any) => h.year.toString() === activeHistoryTab);
                                                return lines.sort((a: any, b: any) => (b.votesReceived || 0) - (a.votesReceived || 0)).map((line: any, idx: number) => {
                                                    const pConfig = stats?.partyDetails?.[line.partyName] || PARTY_CONFIG[line.partyName] || { color: '#64748B', logo: '' };
                                                    return (
                                                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx === 0 ? '#F0FDF4' : 'white' }}>
                                                            <td style={{ padding: '14px', fontWeight: '800' }}>{line.partyName}</td>
                                                            <td style={{ padding: '14px' }}>{line.candidateName}</td>
                                                            <td style={{ padding: '14px', textAlign: 'right', fontWeight: '900' }}>{line.votesReceived?.toLocaleString('hi-IN')}</td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT COLUMN ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {selectedAssemblyId && (role !== 'WORKER' || canSwitch) && <LeaderboardCard assemblyId={selectedAssemblyId} />}

                            {/* Top Sentiment Booths */}
                            <div className="card">
                                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', color: '#059669' }}><TrendingUp size={18} /> {t.topBooths}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {boothSentiment.slice(0, 5).map((booth: any, idx: number) => (
                                        <div key={idx} style={{ padding: '10px', background: '#F8FAFC', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                            <div style={{ fontWeight: '800' }}>बूथ #{booth.boothNumber}</div>
                                            <div style={{ fontWeight: '900', color: '#10B981' }}>{booth.support}% +</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
        .dashboard-layout { display: grid; grid-template-columns: minmax(0, 1fr) 350px; gap: 24px; margin-top: 24px; }
        .dashboard-subgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .caste-grid { display: grid; grid-template-columns: 300px 1fr; gap: 40px; align-items: center; }
        @media (max-width: 900px) {
          .dashboard-layout { grid-template-columns: 1fr; }
          .dashboard-subgrid { grid-template-columns: 1fr; }
          .caste-grid { grid-template-columns: 1fr; justify-items: center; }
        }
      `}</style>
        </div>
    );
}

function LeaderboardCard({ assemblyId }: { assemblyId: number }) {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [filterType, setFilterType] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'LIFETIME' | 'CUSTOM'>('THIS_MONTH');
    const [loading, setLoading] = useState(false);
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(new Date().getMonth());

    useEffect(() => { fetchLeaderboard(); }, [filterType, year, month, assemblyId]);
    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const data = await getAssemblyLeaderboard(assemblyId, { type: filterType, year: filterType === 'CUSTOM' ? year : undefined, month: filterType === 'CUSTOM' ? month : undefined });
            setLeaderboard(data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><Crown size={20} color="#F59E0B" /> टॉप कार्यकर्ता</h3>
            <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <option value="THIS_MONTH">This Month</option>
                    <option value="LAST_MONTH">Last Month</option>
                    <option value="LIFETIME">Lifetime</option>
                    <option value="CUSTOM">Custom</option>
                </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {leaderboard.map((worker, index) => (
                    <div key={worker.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#F8FAFC', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>#{index + 1}</div>
                            <div style={{ fontWeight: '700', fontSize: '14px' }}>{worker.name}</div>
                        </div>
                        <div style={{ fontWeight: '900', color: '#0F172A' }}>{worker.points}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
