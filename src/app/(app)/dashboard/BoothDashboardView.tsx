'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, PieChart, Users, Home, MapPin, CheckCircle, AlertTriangle, Calendar, ChevronRight, TrendingUp, Crown, List, Shield, ArrowUpRight } from 'lucide-react';
import { getBoothDashboardStats, updateBoothAnalytics } from '@/app/actions/dashboard';
import DigitalIdCard from '@/components/DigitalIdCard';

interface BoothDashboardViewProps {
    userId: number;
    lang: string;
    assemblyId: number | null;
    isMobile: boolean;
    assemblyName?: string;
}

export default function BoothDashboardView({ userId, lang, assemblyId, isMobile, assemblyName }: BoothDashboardViewProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ historical: '', caste: '' });
    const dataLoadedRef = React.useRef(false);

    useEffect(() => {
        dataLoadedRef.current = false;
        let timeoutId: NodeJS.Timeout;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getBoothDashboardStats(userId, assemblyId || undefined);
                if (res) {
                    dataLoadedRef.current = true;
                    setData(res);
                    setEditData({
                        historical: res.historicalResults || '[]',
                        caste: res.casteEquation || '[]'
                    });
                } else {
                    setError('बूथ की जानकारी मिल नहीं पाई। कृपया एडमिन से संपर्क करें।');
                }
            } catch (err) {
                console.error('Booth dashboard error:', err);
                setError('डेटा लोड करने में समस्या आई। कृपया पुनः प्रयास करें।');
            } finally {
                setLoading(false);
            }
        };

        timeoutId = setTimeout(() => {
            if (!dataLoadedRef.current) {
                setLoading(false);
                setError('डेटा लोड करने में समय लग रहा है। कृपया पुनः प्रयास करें।');
            }
        }, 15000);

        fetchData();
        return () => clearTimeout(timeoutId);
    }, [userId, assemblyId]);

    const handleSave = async () => {
        try {
            JSON.parse(editData.historical);
            JSON.parse(editData.caste);

            await updateBoothAnalytics(data.booth.id, {
                historicalResults: editData.historical,
                casteEquation: editData.caste
            });
            alert(lang === 'hi' ? 'डेटा सेव हो गया!' : 'Data Saved!');
            setIsEditing(false);
            const res = await getBoothDashboardStats(userId, assemblyId || undefined);
            if (res) {
                setData(res);
                setEditData({
                    historical: res.historicalResults || '[]',
                    caste: res.casteEquation || '[]'
                });
            }
        } catch (e) {
            alert(lang === 'hi' ? 'गलत JSON फॉर्मेट!' : 'Invalid JSON format!');
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: '16px' }}>
            <div className="spinner"></div>
            <div style={{ fontWeight: '600', color: '#6B7280' }}>
                {lang === 'hi' ? 'बूथ डैशबोर्ड लोड हो रहा है...' : 'Loading Booth Dashboard...'}
            </div>
        </div>
    );

    if (error || !data) return (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', marginTop: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', marginBottom: '12px' }}>
                {error || 'बूथ की जानकारी नहीं मिली'}
            </h2>
            <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 24px' }}>
                {lang === 'hi'
                    ? 'आपको इस विधानसभा में बूथ मैनेजर के रूप में असाइन नहीं किया गया है।'
                    : 'You are not assigned as a Booth Manager in this assembly.'}
            </p>
            <button
                onClick={() => window.location.reload()}
                style={{ padding: '12px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
            >
                {lang === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
            </button>
        </div>
    );

    const t = {
        voters: lang === 'hi' ? 'बूथ मतदाता' : 'Booth Voters',
        panna: lang === 'hi' ? 'पन्ना प्रमुख' : 'Panna Pramukhs',
        tasks: lang === 'hi' ? 'पूर्ण कार्य' : 'Tasks Completed',
        sentiment: lang === 'hi' ? 'बूथ सेंटिमेंट' : 'Booth Sentiment',
        caste: lang === 'hi' ? 'बूथ जाति समीकरण' : 'Booth Caste Equation',
        age: lang === 'hi' ? 'आयु वर्ग' : 'Age Distribution',
        historical: lang === 'hi' ? 'पिछले चुनाव (बूथ रिकॉर्ड)' : 'Historical Votes',
        edit: lang === 'hi' ? 'डेटा एडिट' : 'Edit Data',
        save: lang === 'hi' ? 'सेव करें' : 'Save Changes'
    };

    let historical: any[] = [];
    try { historical = JSON.parse(data.historicalResults || '[]'); } catch (e) { }
    let adminCaste: any[] = [];
    try { adminCaste = JSON.parse(data.casteEquation || '[]'); } catch (e) { }

    const readiness = data.electionReadiness;
    const hhStats = data.householdStats;

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
            {/* ── 1. DIGITAL ID CARD (Preserved as instructed) ── */}
            {data.worker && (
                <div style={{ marginBottom: '24px' }}>
                    <DigitalIdCard worker={data.worker} assemblyName={assemblyName || data.assembly?.name} assembly={data.assembly} />
                </div>
            )}

            {/* ── 2. HEADER ── */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#0F172A' }}>
                        बूथ #{data.booth.number} — {data.booth.name || 'बूथ कमांड सेंटर'}
                    </h1>
                    <p style={{ color: '#64748B', fontWeight: '600', fontSize: '14px' }}>
                        📍 {assemblyName || data.assembly?.name || 'विधानसभा'} · बूथ प्रभारी कार्यक्षेत्र
                    </p>
                </div>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    style={{ background: isEditing ? '#EF4444' : '#2563EB', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}
                >
                    {isEditing ? (lang === 'hi' ? 'कैंसिल' : 'Cancel') : t.edit}
                </button>
            </div>

            {/* EDIT OVERLAY */}
            {isEditing && (
                <div className="card" style={{ padding: '24px', marginBottom: '24px', background: '#F8FAFC', border: '2px dashed #CBD5E1' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '800' }}>एनालिटिक्स डेटा अपडेट करें (JSON Format)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '12px' }}>{t.historical} (JSON)</label>
                            <textarea rows={6} value={editData.historical} onChange={e => setEditData({ ...editData, historical: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: '12px' }} placeholder='[{"party": "BJP", "votes": 450}]' />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '12px' }}>{t.caste} (JSON)</label>
                            <textarea rows={6} value={editData.caste} onChange={e => setEditData({ ...editData, caste: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: '12px' }} placeholder='[{"name": "Brahmin", "percent": 25}]' />
                        </div>
                    </div>
                    <button onClick={handleSave} style={{ width: '100%', padding: '12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>{t.save}</button>
                </div>
            )}

            {/* ── 3. KPI CARDS ── */}
            <div className="kpi-grid" style={{ gap: '16px', marginBottom: '24px' }}>
                <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: 'white', borderRadius: '18px', padding: '18px' }}>
                    <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.voters}</div>
                    <div className="kpi-value" style={{ color: 'white', fontSize: '28px', fontWeight: '900', marginTop: '4px' }}>{data.stats.voters}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', marginTop: '2px' }}>कुल पंजीकृत मतदाता</div>
                </div>
                <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', color: 'white', borderRadius: '18px', padding: '18px' }}>
                    <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.panna}</div>
                    <div className="kpi-value" style={{ color: 'white', fontSize: '28px', fontWeight: '900', marginTop: '4px' }}>{data.stats.pannaPramukhs}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', marginTop: '2px' }}>सक्रिय पन्ना प्रमुख</div>
                </div>
                <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', borderRadius: '18px', padding: '18px' }}>
                    <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.tasks}</div>
                    <div className="kpi-value" style={{ color: 'white', fontSize: '28px', fontWeight: '900', marginTop: '4px' }}>{data.stats.tasks}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', marginTop: '2px' }}>सफलतापूर्वक पूर्ण</div>
                </div>
                <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white', borderRadius: '18px', padding: '18px' }}>
                    <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.sentiment}</div>
                    <div className="kpi-value" style={{ color: 'white', fontSize: '28px', fontWeight: '900', marginTop: '4px' }}>
                        {Math.round(((data.realTimeAnalytics.sentiment.support || 0) / (data.stats.voters || 1)) * 100)}% +
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', marginTop: '2px' }}>समर्थक वोटर</div>
                </div>
            </div>

            {/* ── 4. BOOTH READINESS BANNER ── */}
            {readiness && (
                <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', borderRadius: '20px', padding: '22px', marginBottom: '24px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>⚡ बूथ चुनावी तैयारी (Booth Readiness)</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                                <div style={{ fontSize: '48px', fontWeight: '900', color: readiness.score === null ? '#94A3B8' : readiness.score >= 70 ? '#10B981' : readiness.score >= 40 ? '#F59E0B' : '#EF4444', lineHeight: 1 }}>
                                    {readiness.score !== null ? `${readiness.score}%` : '—'}
                                </div>
                                <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                                    {readiness.score >= 70 ? '🟢 ऑन ट्रैक' : readiness.score >= 40 ? '🟡 ध्यान दें' : '🔴 कमजोर स्थिति'}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px', flex: 1, minWidth: '240px' }}>
                            {readiness.components.map((c: any, i: number) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '10px 12px' }}>
                                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>{c.icon} {c.label}</div>
                                    <div style={{ fontSize: '16px', fontWeight: '900', color: c.score === null ? '#475569' : c.score >= 70 ? '#10B981' : c.score >= 40 ? '#F59E0B' : '#EF4444' }}>
                                        {c.score !== null ? `${c.score}%` : 'लंबित'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── 5. TODAY'S SNAPSHOT (SCOPED TO BOOTH) ── */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>📅 आज की स्थिति (Today's Snapshot)</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: '12px' }}>
                    {[
                        { label: 'आज के कार्यक्रम', value: data.todayEventsCount ?? 0, icon: '🎯', color: '#2563EB', link: '/events' },
                        { label: 'बूथ में Visits', value: data.todayVisits ?? 0, icon: '🚪', color: '#10B981', link: `/households?booth=${data.booth.number}` },
                        { label: 'सक्रिय पन्ना प्रमुख', value: data.stats.pannaPramukhs ?? 0, icon: '👥', color: '#8B5CF6', link: '/workers' },
                        { label: 'पेंडिंग कार्य', value: data.pendingTasksCount ?? 0, icon: '📋', color: '#F59E0B', link: '/tasks' },
                        { label: 'Revisit Required', value: hhStats?.revisit ?? 0, icon: '🔄', color: '#EF4444', link: `/households?booth=${data.booth.number}` },
                    ].map((item, i) => (
                        <Link key={i} href={item.link} style={{ textDecoration: 'none' }}>
                            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px', textAlign: 'center', transition: 'all 0.2s', cursor: 'pointer' }}>
                                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</div>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: item.color }}>{item.value}</div>
                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>{item.label}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── 6. HOUSEHOLD COVERAGE FOR THIS BOOTH ── */}
            {hhStats && (
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '22px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Home size={18} color="#2563EB" /> बूथ हाउसहोल्ड / डोर-टू-डोर कवरेज
                        </h3>
                        <Link href={`/households?booth=${data.booth.number}`} style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            हाउसहोल्ड सूची <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
                        {[
                            { label: 'कुल Households', value: hhStats.total, color: '#1E293B' },
                            { label: 'Visit हुए', value: hhStats.visited, color: '#10B981' },
                            { label: 'Pending', value: hhStats.pending, color: '#F59E0B' },
                            { label: 'Revisit Required', value: hhStats.revisit, color: '#EF4444' },
                        ].map((item, i) => (
                            <div key={i} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '22px', fontWeight: '900', color: item.color }}>{item.value}</div>
                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>{item.label}</div>
                            </div>
                        ))}
                    </div>
                    {hhStats.total > 0 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748B' }}>कवरेज प्रोग्रेस</span>
                                <span style={{ fontSize: '12px', fontWeight: '900', color: '#10B981' }}>{Math.round((hhStats.visited / hhStats.total) * 100)}%</span>
                            </div>
                            <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, Math.round((hhStats.visited / hhStats.total) * 100))}%`, height: '100%', background: '#10B981', borderRadius: '10px' }}></div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── 7. MAP SNAPSHOT ── */}
            <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1px solid #BFDBFE', borderRadius: '18px', padding: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '46px', height: '46px', background: '#2563EB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={22} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: '900', color: '#1E3A8A' }}>बूथ #{data.booth.number} का फील्ड मैप</div>
                        <div style={{ fontSize: '12px', color: '#3B82F6', fontWeight: '600' }}>हाउसहोल्ड लोकेशन्स व विज़िट स्टेटस नक्शे पर देखें</div>
                    </div>
                </div>
                <Link href={`/households/map?booth=${data.booth.number}`} style={{ background: '#2563EB', color: 'white', padding: '10px 18px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    नक्शा खोलें <ChevronRight size={15} />
                </Link>
            </div>

            {/* ── 8. UPCOMING EVENTS & TASKS/ISSUES ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Events */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>📅 आगामी कार्यक्रम (Events)</h3>
                        <Link href="/events" style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', textDecoration: 'none' }}>सभी देखें →</Link>
                    </div>
                    {(!data.upcomingEvents || data.upcomingEvents.length === 0) ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '13px' }}>कोई आगामी कार्यक्रम नहीं</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {data.upcomingEvents.map((ev: any, i: number) => (
                                <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 12px', background: '#F8FAFC', borderRadius: '10px', alignItems: 'center' }}>
                                    <div style={{ background: '#EFF6FF', borderRadius: '8px', padding: '6px 8px', textAlign: 'center', minWidth: '44px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#2563EB' }}>{formatEventDate(ev.date)}</div>
                                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>{formatTime(ev.date)}</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>{ev.title}</div>
                                        <div style={{ fontSize: '11px', color: '#64748B' }}>{ev.location || 'स्थान अनिर्धारित'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tasks & Issues */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>📋 कार्य एवं समस्याएं</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Link href="/tasks" style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', textDecoration: 'none' }}>Tasks</Link>
                            <span style={{ color: '#CBD5E1' }}>·</span>
                            <Link href="/issues" style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', textDecoration: 'none' }}>Issues</Link>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ background: '#FFFBEB', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#D97706' }}>{data.pendingTasksCount ?? 0}</div>
                            <div style={{ fontSize: '10px', color: '#92400E', fontWeight: '800' }}>Pending Tasks</div>
                        </div>
                        <div style={{ background: '#FEF2F2', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#DC2626' }}>{data.criticalIssues ?? 0}</div>
                            <div style={{ fontSize: '10px', color: '#991B1B', fontWeight: '800' }}>Critical Issues</div>
                        </div>
                        <div style={{ background: '#F0FDF4', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#16A34A' }}>{data.stats.tasks ?? 0}</div>
                            <div style={{ fontSize: '10px', color: '#166534', fontWeight: '800' }}>Completed</div>
                        </div>
                    </div>
                    {data.topIssues?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {data.topIssues.map((issue: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#F8FAFC', borderRadius: '6px', fontSize: '11px' }}>
                                    <span style={{ fontWeight: '700' }}>{issue.title?.slice(0, 25)}</span>
                                    <span style={{ fontWeight: '800', color: issue.priority === 'Critical' ? '#DC2626' : '#D97706' }}>{issue.priority}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── 9. PANNA PRAMUKHS LIST (FIELD TEAM) ── */}
            {data.pannaPramukhsList?.length > 0 && (
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '22px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={18} color="#8B5CF6" /> पन्ना प्रमुख टीम (बूथ #{data.booth.number})
                        </h3>
                        <Link href="/workers" style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', textDecoration: 'none' }}>कार्यकर्ता सूची →</Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                        {data.pannaPramukhsList.map((p: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>{p.name}</div>
                                    <div style={{ fontSize: '11px', color: '#64748B' }}>📞 {p.mobile || 'नंबर नहीं'}</div>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: '900', color: '#2563EB', background: '#EFF6FF', padding: '4px 8px', borderRadius: '8px' }}>
                                    {p.points || 0} pts
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 10. ANALYTICS (Caste, Age, Sentiment, Historical) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Caste */}
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <PieChart size={18} color="#2563EB" /> {t.caste}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', marginBottom: '12px' }}>वास्तविक डेटा (Live)</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {data.realTimeAnalytics.caste.slice(0, 5).map((c: any, i: number) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                                                <span style={{ fontWeight: '700' }}>{c.name}</span>
                                                <span style={{ fontWeight: '800' }}>{c.count}</span>
                                            </div>
                                            <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{ width: `${(c.count / (data.stats.voters || 1)) * 100}%`, height: '100%', background: '#2563EB', borderRadius: '10px' }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', marginBottom: '12px' }}>अनुमानित (Target)</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {adminCaste.map((c: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#F8FAFC', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '700' }}>{c.name}</span>
                                            <span style={{ fontSize: '13px', fontWeight: '900', color: '#2563EB' }}>{c.percent}%</span>
                                        </div>
                                    ))}
                                    {adminCaste.length === 0 && <div style={{ color: '#94A3B8', fontSize: '12px' }}>डेटा सेट करें</div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Historical */}
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart3 size={18} color="#1E293B" /> {t.historical}
                        </h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ textAlign: 'left', padding: '10px', fontSize: '13px' }}>पार्टी</th>
                                    <th style={{ textAlign: 'right', padding: '10px', fontSize: '13px' }}>प्राप्त वोट</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historical.map((h: any, i: number) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '10px', fontWeight: '700', fontSize: '13px' }}>{h.party}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: '900', color: '#10B981', fontSize: '13px' }}>{h.votes}</td>
                                    </tr>
                                ))}
                                {historical.length === 0 && <tr><td colSpan={2} style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>डेटा उपलब्ध नहीं</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Sentiment Card */}
                    <div className="card" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)', color: 'white' }}>
                        <h3 style={{ color: 'white', marginBottom: '18px', fontSize: '16px' }}>{t.sentiment}</h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                                <div style={{ fontSize: '11px', opacity: 0.8 }}>पार्टी समर्थक</div>
                                <div style={{ fontSize: '20px', fontWeight: '900' }}>{data.realTimeAnalytics.sentiment.support}</div>
                            </div>
                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                                <div style={{ fontSize: '11px', opacity: 0.8 }}>सामान्य (Neutral)</div>
                                <div style={{ fontSize: '20px', fontWeight: '900' }}>{data.realTimeAnalytics.sentiment.neutral}</div>
                            </div>
                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                                <div style={{ fontSize: '11px', opacity: 0.8 }}>विरोध / अन्य</div>
                                <div style={{ fontSize: '20px', fontWeight: '900' }}>{data.realTimeAnalytics.sentiment.oppose}</div>
                            </div>
                        </div>
                    </div>

                    {/* Age Card */}
                    <div className="card">
                        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}><Users size={16} /> {t.age}</h3>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {data.realTimeAnalytics.age.map((a: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600' }}>{a.range}</span>
                                    <span style={{ fontWeight: '800', fontSize: '13px' }}>{a.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
