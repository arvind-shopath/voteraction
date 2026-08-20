'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Handshake, Crown, Medal } from 'lucide-react';
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
    const dataLoadedRef = React.useRef(false); // fix stale closure bug

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

        // Safety timeout — only show error if data truly didn't load (use ref, not stale closure)
        timeoutId = setTimeout(() => {
            if (!dataLoadedRef.current) {
                setLoading(false);
                setError('डेटा लोड करने में समय लग रहा है। कृपया पुनः प्रयास करें।');
            }
        }, 15000); // increased to 15s to avoid false positives

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
                    ? 'आपको पन्ना प्रमुख के रूप में असाइन नहीं किया गया है। कृपया बूथ मैनेजर या एडमिन से संपर्क करें।'
                    : 'You are not assigned as a Panna Pramukh. Please contact your Booth Manager or Admin.'}
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
        greeting: lang === 'hi' ? 'पन्ना प्रमुख डैशबोर्ड' : 'Panna Pramukh Dashboard',
        liveAnalysis: lang === 'hi' ? 'आपके पन्ना का लाइव विश्लेषण' : 'Live Analysis of Your Page',
        voters: lang === 'hi' ? 'मेरे मतदाता' : 'My Voters',
        tasks: lang === 'hi' ? 'पूर्ण काम' : 'Completed Tasks',
        pending: lang === 'hi' ? 'पेंडिंग काम' : 'Pending Tasks',
        coverage: lang === 'hi' ? 'कवरेज' : 'Coverage',
        sentiment: lang === 'hi' ? 'वोटर सेंटिमेंट' : 'Voter Sentiment',
        age: lang === 'hi' ? 'आयु वर्ग' : 'Age Groups',
        caste: lang === 'hi' ? 'जाति वितरण' : 'Caste Distribution',
        actions: lang === 'hi' ? 'त्वरित कार्य' : 'Quick Actions',
        viewVoters: lang === 'hi' ? 'सभी मतदाता देखें' : 'View All Voters',
        addContact: lang === 'hi' ? 'जनसंपर्क दर्ज करें' : 'Add Contact',
        notifications: lang === 'hi' ? 'सूचनाएं' : 'Notifications'
    };

    // Extract booth info — use booth.number (display #) not boothId (DB primary key)
    const boothNumber = data.worker?.booth?.number ?? '';
    const boothName = data.worker?.booth?.name || '';

    return (
        <div style={{ paddingBottom: '100px' }}>
            {data.worker && (
                <DigitalIdCard
                    worker={data.worker}
                    assemblyName={assemblyName || data.assembly?.name}
                    assembly={data.assembly}
                />
            )}
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontSize: isMobile ? '24px' : '32px',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '8px'
                }}>
                    {boothNumber ? `बूथ ${boothNumber}` : ''}{boothNumber && boothName ? ' - ' : ''}{boothName ? boothName : ''} - {t.title}
                </h1>
                <p style={{
                    color: '#64748B',
                    fontSize: isMobile ? '13px' : '15px',
                    fontWeight: '600'
                }}>
                    {t.liveAnalysis}
                </p>
            </div>

            {/* Points Card */}
            <PointsKPICard workerId={data.worker.id} />

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card" style={{ borderLeft: '4px solid #F97316' }}>
                    <div className="kpi-label">{t.voters}</div>
                    <div className="kpi-value">{data.stats.totalVoters}</div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '4px solid #10B981' }}>
                    <div className="kpi-label">{t.tasks}</div>
                    <div className="kpi-value">{data.stats.completedTasks}</div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '4px solid #EF4444' }}>
                    <div className="kpi-label">{t.pending}</div>
                    <div className="kpi-value">{data.stats.pendingTasks}</div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '4px solid #8B5CF6' }}>
                    <div className="kpi-label">{t.coverage}</div>
                    <div className="kpi-value">{data.stats.coverage}%</div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Sentiment Card */}
                    <div className="card">
                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TrendingUp size={22} color="#10B981" /> {t.sentiment}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {['support', 'neutral', 'oppose'].map((key) => {
                                const count = data.analytics.sentiment[key] || 0;
                                const percent = data.stats.totalVoters > 0 ? (count / data.stats.totalVoters) * 100 : 0;
                                const color = key === 'support' ? '#10B981' : key === 'oppose' ? '#EF4444' : '#64748B';
                                const label = key === 'support' ? 'सकारात्मक' : key === 'oppose' ? 'नकारात्मक' : 'सामान्य';
                                return (
                                    <div key={key}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', fontWeight: '700' }}>
                                            <span style={{ color: '#1E293B' }}>{label}</span>
                                            <span style={{ color: color }}>{count} ({Math.round(percent)}%)</span>
                                        </div>
                                        <div style={{ height: '10px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '10px', transition: 'width 0.3s ease' }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Caste Distribution */}
                    <div className="card">
                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Users size={20} color="#F97316" /> {t.caste}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {data.analytics.caste.slice(0, 5).map((c: any, i: number) => {
                                const percent = data.stats.totalVoters > 0 ? (c.count / data.stats.totalVoters) * 100 : 0;
                                return (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>{c.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>{Math.round(percent)}%</div>
                                            <div style={{ fontWeight: '900', fontSize: '16px', color: '#F97316' }}>{c.count}</div>
                                        </div>
                                    </div>
                                );
                            })}
                            {data.analytics.caste.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>डेटा उपलब्ध नहीं</div>
                            )}
                        </div>
                    </div>

                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Age Distribution */}
                    <div className="card" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)', color: 'white' }}>
                        <h3 style={{ color: 'white', marginBottom: '20px', display: 'center', alignItems: 'center', gap: '10px' }}>
                            <Users size={20} /> {t.age}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {data.analytics.age.map((a: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '700' }}>{a.range}</span>
                                    <span style={{ fontWeight: '900', fontSize: '18px' }}>{a.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: 'white' }}>
                        <h3 style={{ color: 'white', marginBottom: '20px' }}>{t.actions}</h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <button
                                onClick={() => window.location.href = '/voters?filter=my-panna'}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '16px',
                                    color: 'white',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            >
                                <Users size={18} /> {t.viewVoters}
                            </button>
                            <button
                                onClick={() => window.location.href = '/jansampark'}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '16px',
                                    color: 'white',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            >
                                <Handshake size={18} /> {t.addContact}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function PointsKPICard({ workerId }: { workerId: number }) {
    const [points, setPoints] = useState(0);
    const [filterType, setFilterType] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'LIFETIME' | 'CUSTOM'>('THIS_MONTH');
    const [loading, setLoading] = useState(false);

    // Custom filter state
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(new Date().getMonth());

    useEffect(() => {
        fetchPoints();
    }, [filterType, year, month, workerId]);

    const fetchPoints = async () => {
        setLoading(true);
        try {
            const p = await getWorkerPointsSum(workerId, {
                type: filterType,
                year: filterType === 'CUSTOM' ? year : undefined,
                month: filterType === 'CUSTOM' ? month : undefined
            });
            setPoints(p);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const hindiMonths = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

    return (
        <div style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', borderRadius: '24px', padding: '24px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 20px -5px rgba(245, 158, 11, 0.4)', marginBottom: '24px' }}>
            {/* Background Decor */}
            <Crown size={120} color="white" style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, transform: 'rotate(15deg)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative', zIndex: 10 }}>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Medal size={20} /> आपके प्वॉइंट्स (My Points)
                    </h3>
                    <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>प्रदर्शन स्कोर कार्ड</p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '4px', display: 'flex', gap: '4px' }}>
                    <button onClick={() => setFilterType('THIS_MONTH')} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: filterType === 'THIS_MONTH' ? 'white' : 'transparent', color: filterType === 'THIS_MONTH' ? '#D97706' : 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>This Month</button>
                    <button onClick={() => setFilterType('LAST_MONTH')} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: filterType === 'LAST_MONTH' ? 'white' : 'transparent', color: filterType === 'LAST_MONTH' ? '#D97706' : 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Last Month</button>
                    <button onClick={() => setFilterType('LIFETIME')} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: filterType === 'LIFETIME' ? 'white' : 'transparent', color: filterType === 'LIFETIME' ? '#D97706' : 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Lifetime</button>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
                <div>
                    {loading ? (
                        <div style={{ height: '56px', display: 'flex', alignItems: 'center' }}>Loading...</div>
                    ) : (
                        <div style={{ fontSize: '56px', fontWeight: '900', lineHeight: 1 }}>{points}</div>
                    )}
                    <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9, marginTop: '8px' }}>
                        {filterType === 'LIFETIME' ? 'Total Lifetime Points' : 'Points Earned in Period'}
                    </div>
                </div>

                {/* Custom Filters Dropdown */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                        value={year}
                        onChange={(e) => { setYear(Number(e.target.value)); setFilterType('CUSTOM'); }}
                        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '8px', padding: '6px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                    >
                        {[currentYear, currentYear - 1].map(y => <option key={y} value={y} style={{ color: 'black' }}>{y}</option>)}
                    </select>
                    <select
                        value={month}
                        onChange={(e) => { setMonth(Number(e.target.value)); setFilterType('CUSTOM'); }}
                        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '8px', padding: '6px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                    >
                        {hindiMonths.map((m, i) => <option key={i} value={i} style={{ color: 'black' }}>{m}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}
