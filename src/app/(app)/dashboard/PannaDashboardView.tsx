'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, Handshake, Crown, Medal, Home, MapPin, CheckCircle, AlertTriangle, Calendar, ChevronRight, Activity, Zap, Star } from 'lucide-react';
import { getPannaDashboardStats } from '@/app/actions/dashboard';
import { getWorkerPointsSum } from '@/app/actions/worker';
import DigitalIdCard from '@/components/DigitalIdCard';

interface PannaDashboardViewProps {
    userId: number;
    lang: string;
    assemblyId: number | null;
    isMobile: boolean;
    assemblyName?: string;
}

export default function PannaDashboardView({ userId, lang, assemblyId, isMobile, assemblyName }: PannaDashboardViewProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const dataLoadedRef = React.useRef(false);

    useEffect(() => {
        dataLoadedRef.current = false;
        let timeoutId: NodeJS.Timeout;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getPannaDashboardStats(userId, assemblyId || undefined);
                if (res) {
                    dataLoadedRef.current = true;
                    setData(res);
                } else {
                    setError('पन्ना की जानकारी मिल नहीं पाई। कृपया एडमिन से संपर्क करें।');
                }
            } catch (err) {
                console.error('Panna dashboard error:', err);
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

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: '16px' }}>
            <div className="spinner"></div>
            <div style={{ fontWeight: '600', color: '#6B7280' }}>
                {lang === 'hi' ? 'पन्ना डैशबोर्ड लोड हो रहा है...' : 'Loading Panna Dashboard...'}
            </div>
        </div>
    );

    if (error || !data) return (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', marginTop: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', marginBottom: '12px' }}>
                {error || 'पन्ना की जानकारी नहीं मिली'}
            </h2>
            <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 24px' }}>
                {lang === 'hi'
                    ? 'आपको इस विधानसभा में पन्ना प्रमुख के रूप में असाइन नहीं किया गया है।'
                    : 'You are not assigned as a Panna Pramukh in this assembly.'}
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
        title: lang === 'hi' ? 'मेरा पन्ना (My Page)' : 'My Page',
        liveAnalysis: lang === 'hi' ? 'आपके पन्ना का लाइव विश्लेषण' : 'Live Analysis of Your Page',
        voters: lang === 'hi' ? 'मेरे मतदाता' : 'My Voters',
        tasks: lang === 'hi' ? 'पूर्ण कार्य' : 'Completed Tasks',
        pending: lang === 'hi' ? 'पेंडिंग कार्य' : 'Pending Tasks',
        coverage: lang === 'hi' ? 'कवरेज' : 'Coverage',
        sentiment: lang === 'hi' ? 'वोटर सेंटिमेंट' : 'Voter Sentiment',
        age: lang === 'hi' ? 'आयु वर्ग' : 'Age Groups',
        caste: lang === 'hi' ? 'जाति वितरण' : 'Caste Distribution',
    };

    const boothNumber = data.worker?.booth?.number ?? '';
    const boothName = data.worker?.booth?.name || '';
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
            {/* ── 1. DIGITAL ID CARD (Preserved) ── */}
            {data.worker && (
                <div style={{ marginBottom: '24px' }}>
                    <DigitalIdCard
                        worker={data.worker}
                        assemblyName={assemblyName || data.assembly?.name}
                        assembly={data.assembly}
                    />
                </div>
            )}

            {/* ── 2. HEADER ── */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{
                    fontSize: isMobile ? '22px' : '28px',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '6px'
                }}>
                    {boothNumber ? `बूथ #${boothNumber}` : ''}{boothNumber && boothName ? ' - ' : ''}{boothName} — {t.title}
                </h1>
                <p style={{ color: '#64748B', fontSize: isMobile ? '13px' : '14px', fontWeight: '600' }}>
                    📍 {assemblyName || data.assembly?.name} · {t.liveAnalysis}
                </p>
            </div>

            {/* ── 3. POINTS KPI ── */}
            {data.worker?.id && <PointsKPICard workerId={data.worker.id} isMobile={isMobile} />}

            {/* ── 4. KPI CARDS ── */}
            <div className="kpi-grid" style={{ gap: '16px', marginBottom: '24px' }}>
                <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: 'white', borderRadius: '18px', padding: '18px' }}>
                    <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.voters}</div>
                    <div className="kpi-value" style={{ color: 'white', fontSize: '28px', fontWeight: '900', marginTop: '4px' }}>{data.stats.totalVoters}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', marginTop: '2px' }}>असाइन किए गए मतदाता</div>
                </div>
                <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', borderRadius: '18px', padding: '18px' }}>
                    <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.tasks}</div>
                    <div className="kpi-value" style={{ color: 'white', fontSize: '28px', fontWeight: '900', marginTop: '4px' }}>{data.stats.completedTasks}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', marginTop: '2px' }}>सफलतापूर्वक पूर्ण कार्य</div>
                </div>
                <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white', borderRadius: '18px', padding: '18px' }}>
                    <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.coverage}</div>
                    <div className="kpi-value" style={{ color: 'white', fontSize: '28px', fontWeight: '900', marginTop: '4px' }}>{data.stats.coverage}%</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', marginTop: '2px' }}>मतदाता संपर्क दर</div>
                </div>
                <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', color: 'white', borderRadius: '18px', padding: '18px' }}>
                    <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>पार्टी समर्थन</div>
                    <div className="kpi-value" style={{ color: 'white', fontSize: '28px', fontWeight: '900', marginTop: '4px' }}>{data.analytics.sentiment.support}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', marginTop: '2px' }}>समर्थक वोटर</div>
                </div>
            </div>

            {/* ── 5. PANNA READINESS BANNER ── */}
            {readiness && (
                <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', borderRadius: '20px', padding: '22px', marginBottom: '24px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>⚡ पन्ना चुनावी तैयारी (Page Readiness)</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                                <div style={{ fontSize: '48px', fontWeight: '900', color: readiness.score === null ? '#94A3B8' : readiness.score >= 70 ? '#10B981' : readiness.score >= 40 ? '#F59E0B' : '#EF4444', lineHeight: 1 }}>
                                    {readiness.score !== null ? `${readiness.score}%` : '—'}
                                </div>
                                <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                                    {readiness.score >= 70 ? '🟢 मजबूत स्थिति' : readiness.score >= 40 ? '🟡 सक्रिय रहें' : '🔴 संपर्क बढ़ाएं'}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '10px', flex: 1, minWidth: '240px' }}>
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

            {/* ── 6. TODAY'S SNAPSHOT ── */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>📅 आज की स्थिति (Today's Snapshot)</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px' }}>
                    {[
                        { label: 'आज के कार्यक्रम', value: data.todayEventsCount ?? 0, icon: '🎯', color: '#2563EB', link: '/events' },
                        { label: 'आज मेरे Visits', value: data.todayVisits ?? 0, icon: '🚪', color: '#10B981', link: '/households' },
                        { label: 'पेंडिंग कार्य', value: data.pendingTasksCount ?? 0, icon: '📋', color: '#F59E0B', link: '/worker/tasks' },
                        { label: 'Revisit Required', value: hhStats?.revisit ?? 0, icon: '🔄', color: '#EF4444', link: '/households' },
                    ].map((item, i) => (
                        <Link key={i} href={item.link} style={{ textDecoration: 'none' }}>
                            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px', textAlign: 'center', cursor: 'pointer' }}>
                                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</div>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: item.color }}>{item.value}</div>
                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>{item.label}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── 7. HOUSEHOLD COVERAGE FOR MY PANNA ── */}
            {hhStats && (
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '22px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Home size={18} color="#2563EB" /> मेरे पन्ने के हाउसहोल्ड कवरेज
                        </h3>
                        <Link href="/households" style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            हाउसहोल्ड विज़िट दर्ज करें <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
                        {[
                            { label: 'कुल परिवार', value: hhStats.total, color: '#1E293B' },
                            { label: 'विज़िट हुए', value: hhStats.visited, color: '#10B981' },
                            { label: 'पेंडिंग', value: hhStats.pending, color: '#F59E0B' },
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

            {/* ── 8. MAP SNAPSHOT ── */}
            <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1px solid #BFDBFE', borderRadius: '18px', padding: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '46px', height: '46px', background: '#2563EB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={22} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: '900', color: '#1E3A8A' }}>फील्ड मैप (Field Map)</div>
                        <div style={{ fontSize: '12px', color: '#3B82F6', fontWeight: '600' }}>अपने क्षेत्र के परिवारों की लोकेशन व विज़िट स्थिति देखें</div>
                    </div>
                </div>
                <Link href="/households/map" style={{ background: '#2563EB', color: 'white', padding: '10px 18px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    नक्शा खोलें <ChevronRight size={15} />
                </Link>
            </div>

            {/* ── 9. UPCOMING EVENTS & MY TASKS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Events */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>📅 आगामी कार्यक्रम</h3>
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

                {/* My Tasks */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>📋 मेरे कार्य (My Tasks)</h3>
                        <Link href="/worker/tasks" style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', textDecoration: 'none' }}>सभी देखें →</Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ background: '#FFFBEB', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: '#D97706' }}>{data.pendingTasksCount ?? 0}</div>
                            <div style={{ fontSize: '11px', color: '#92400E', fontWeight: '800' }}>🟡 Pending</div>
                        </div>
                        <div style={{ background: '#F0FDF4', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: '#16A34A' }}>{data.stats.completedTasks ?? 0}</div>
                            <div style={{ fontSize: '11px', color: '#166534', fontWeight: '800' }}>🟢 Completed</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 10. ANALYTICS (Sentiment, Caste, Age on My Page) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
                {/* Sentiment */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)', color: 'white' }}>
                    <h3 style={{ color: 'white', marginBottom: '18px', fontSize: '16px' }}>{t.sentiment}</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                            <div style={{ fontSize: '11px', opacity: 0.8 }}>समर्थक (Support)</div>
                            <div style={{ fontSize: '20px', fontWeight: '900' }}>{data.analytics.sentiment.support}</div>
                        </div>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                            <div style={{ fontSize: '11px', opacity: 0.8 }}>सामान्य (Neutral)</div>
                            <div style={{ fontSize: '20px', fontWeight: '900' }}>{data.analytics.sentiment.neutral}</div>
                        </div>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                            <div style={{ fontSize: '11px', opacity: 0.8 }}>विरोध / अन्य (Oppose)</div>
                            <div style={{ fontSize: '20px', fontWeight: '900' }}>{data.analytics.sentiment.oppose}</div>
                        </div>
                    </div>
                </div>

                {/* Caste & Age */}
                <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} color="#2563EB" /> {t.caste}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                        {data.analytics.caste.slice(0, 5).map((c: any, i: number) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                                    <span style={{ fontWeight: '700' }}>{c.name}</span>
                                    <span style={{ fontWeight: '800' }}>{c.count}</span>
                                </div>
                                <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${(c.count / (data.stats.totalVoters || 1)) * 100}%`, height: '100%', background: '#2563EB', borderRadius: '10px' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PointsKPICard({ workerId, isMobile }: { workerId: number; isMobile: boolean }) {
    const [points, setPoints] = useState<number | null>(null);

    useEffect(() => {
        getWorkerPointsSum(workerId)
            .then(res => setPoints(res.points))
            .catch(err => console.error("Error fetching points:", err));
    }, [workerId]);

    return (
        <div style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '1px solid #FDE68A',
            borderRadius: '18px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3)'
                }}>
                    <Crown size={22} />
                </div>
                <div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#92400E' }}>
                        कार्यकर्ता प्रदर्शन अंक (Reward Points)
                    </div>
                    <div style={{ fontSize: '12px', color: '#B45309', fontWeight: '600' }}>
                        जनसंपर्क, सोशल टास्क एवं रिपोर्टिंग से अर्जित अंक
                    </div>
                </div>
            </div>
            <div style={{
                fontSize: '28px',
                fontWeight: '900',
                color: '#D97706',
                display: 'flex',
                alignItems: 'baseline',
                gap: '4px'
            }}>
                {points !== null ? points : '...'} <span style={{ fontSize: '13px', fontWeight: '700', color: '#92400E' }}>अंक</span>
            </div>
        </div>
    );
}
