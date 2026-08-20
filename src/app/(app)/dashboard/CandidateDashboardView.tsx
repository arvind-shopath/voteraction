'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ArrowUpRight, BarChart3, TrendingUp, Users, List, PieChart } from 'lucide-react';
import { getCasteAnalytics, getDashboardStats, getBoothSentimentAnalytics, getAgeAnalytics } from '@/app/actions/dashboard';
import { getAssemblyLeaderboard } from '@/app/actions/worker';
import { PARTY_CONFIG } from '@/lib/constants';
import { Crown, Medal } from 'lucide-react';

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

    return (
        <div style={{ paddingBottom: '100px' }}>
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
                                            return {
                                                id: `cand-${u.id}`,
                                                name: u.name,
                                                image: u.image,
                                                assemblyId: u.assemblyId,
                                                campaignId: u.campaignId,
                                                assemblyName: a ? a.name : 'कोई विधानसभा नहीं',
                                                district: a ? (a.district || a.number) : ''
                                            };
                                        }) : []),
                                        ...(assemblies || [])
                                            .filter(a => !candidateUsers?.some(u => u.assemblyId === a.id))
                                            .map(a => ({
                                                id: `seat-${a.id}`,
                                                name: 'प्रत्याशी सीट (खाली)',
                                                image: null,
                                                assemblyId: a.id,
                                                campaignId: a.campaigns?.[0]?.id || null,
                                                assemblyName: a.name,
                                                district: a.district || a.number
                                            }))
                                    ];

                                    return displayCandidates.map((c: any) => (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                const targetAssmId = c.assemblyId || assemblies[0]?.id;
                                                if (targetAssmId) setSelectedAssemblyId(targetAssmId);
                                                if (c.campaignId) setSelectedCampaignId(c.campaignId);
                                                setEffectiveRole('CANDIDATE', null, { name: c.name, image: c.image });
                                            }}
                                            style={{
                                                padding: '20px',
                                                background: 'white',
                                                border: '1px solid #E2E8F0',
                                                borderRadius: '20px',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                                            }}
                                        >
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
                    <div className="kpi-grid" style={{ gap: '20px' }}>
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
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '4px' }}>{lang === 'hi' ? 'सफलता दर: 84%' : 'Success Rate: 84%'}</div>
                        </div>
                    </div>

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
                                        {ageData.map((item: any, idx: number) => {
                                            const colors = ['#F59E0B', '#10B981', '#2563EB', '#8B5CF6', '#94A3B8'];
                                            const percent = totalVoters > 0 ? Math.round((item.count / totalVoters) * 100) : 0;
                                            return (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: colors[idx % colors.length] }}></div>
                                                    <div style={{ flex: 1, fontSize: '14px', fontWeight: '700' }}>{item.range}</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B' }}>{percent}%</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {selectedAssemblyId && (role !== 'WORKER' || canSwitch) && <LeaderboardCard assemblyId={selectedAssemblyId} />}
                            <div className="card" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)', color: 'white' }}>
                                <h3 style={{ color: 'white', marginBottom: '20px' }}><TrendingUp size={18} /> {t.todayStatus}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '12px', opacity: 0.7 }}>पार्टी की ताकत</div>
                                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{(stats.prevPartyVotes || 0).toLocaleString('hi-IN')}</div>
                                    </div>
                                </div>
                            </div>
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

                    <div className="card" style={{ marginTop: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>{t.boothAnalysis}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '12px' }}>
                            {boothSentiment.map((booth: any, idx: number) => {
                                const color = booth.support > 60 ? '#10B981' : booth.support > 40 ? '#F59E0B' : '#EF4444';
                                return (
                                    <div key={idx} style={{ aspectRatio: '1', border: `1.5px solid ${color}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => window.location.href = `/voters?booth=${booth.boothNumber}`}>
                                        <div style={{ fontSize: '10px', color: '#64748B' }}>Booth</div>
                                        <div style={{ fontSize: '16px', fontWeight: '900', color: color }}>{booth.boothNumber}</div>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: color }}>{booth.support}%</div>
                                    </div>
                                );
                            })}
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

    const hindiMonths = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

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
