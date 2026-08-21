'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, Users } from 'lucide-react';
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
    const dataLoadedRef = React.useRef(false); // fix stale closure bug

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

        // Safety timeout — use ref, not stale closure
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
            // Validate JSON
            JSON.parse(editData.historical);
            JSON.parse(editData.caste);

            await updateBoothAnalytics(data.booth.id, {
                historicalResults: editData.historical,
                casteEquation: editData.caste
            });
            alert(lang === 'hi' ? 'डेटा सेव हो गया!' : 'Data Saved!');
            setIsEditing(false);
            // Refetch data
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
                    ? 'आपको बूथ मैनेजर के रूप में असाइन नहीं किया गया है। कृपया एडमिन से संपर्क करें।'
                    : 'You are not assigned as a Booth Manager. Please contact admin.'}
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
        panna: lang === 'hi' ? 'पन्ना प्रभारी' : 'Panna Pramukhs',
        tasks: lang === 'hi' ? 'मेरे पूरे कार्य' : 'Tasks Completed',
        sentiment: lang === 'hi' ? 'बूथ सेंटिमेंट (Live)' : 'Booth Sentiment',
        caste: lang === 'hi' ? 'बूथ जाति समीकरण' : 'Booth Caste Equation',
        age: lang === 'hi' ? 'आयु वर्ग' : 'Age Distribution',
        historical: lang === 'hi' ? 'पिछले चुनाव (बूथ रिकॉर्ड)' : 'Historical Votes',
        edit: lang === 'hi' ? 'डेटा एडिट' : 'Edit Data',
        save: lang === 'hi' ? 'सेव करें' : 'Save Changes'
    };

    const historical = JSON.parse(data.historicalResults || '[]');
    const adminCaste = JSON.parse(data.casteEquation || '[]');

    return (
        <div style={{ paddingBottom: '100px' }}>
            {data.worker && <DigitalIdCard worker={data.worker} assemblyName={assemblyName || data.assembly?.name} assembly={data.assembly} />}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '20px', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800' }}>बूथ डैशबोर्ड (Booth #{data.booth.number})</h1>
                    <p style={{ color: '#64748B' }}>{data.booth.name || 'Booth Incharge Interface'}</p>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} style={{ width: isMobile ? '100%' : 'auto', background: '#2563EB', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
                    {isEditing ? (lang === 'hi' ? 'कैंसिल' : 'Cancel') : t.edit}
                </button>
            </div>

            {isEditing ? (
                <div className="card" style={{ padding: isMobile ? '20px' : '32px', marginBottom: '32px' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: isMobile ? '14px' : '18px' }}>एनालिटिक्स डेटा अपडेट करें (JSON Format)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '24px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700' }}>{t.historical} (JSON)</label>
                            <textarea rows={10} value={editData.historical} onChange={e => setEditData({ ...editData, historical: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontFamily: 'monospace', fontSize: '13px' }} placeholder='[{"party": "BJP", "votes": 450}, ...]' />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700' }}>{t.caste} (JSON)</label>
                            <textarea rows={10} value={editData.caste} onChange={e => setEditData({ ...editData, caste: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontFamily: 'monospace', fontSize: '13px' }} placeholder='[{"name": "Brahmin", "percent": 25}, ...]' />
                        </div>
                    </div>
                    <button onClick={handleSave} style={{ width: '100%', padding: '16px', background: '#10B981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' }}>{t.save}</button>
                </div>
            ) : (
                <>
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-label">{t.voters}</div>
                            <div className="kpi-value">{data.stats.voters}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-label">{t.panna}</div>
                            <div className="kpi-value">{data.stats.pannaPramukhs}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-label">{t.tasks}</div>
                            <div className="kpi-value">{data.stats.tasks}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-label">बूथ सेंटिमेंट</div>
                            <div className="kpi-value" style={{ color: '#10B981' }}>{Math.round(((data.realTimeAnalytics.sentiment.support || 0) / (data.stats.voters || 1)) * 100)}% +</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr', gap: '24px', marginTop: '32px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* Caste Section */}
                            <div className="card">
                                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <PieChart size={20} color="#2563EB" /> {t.caste}
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px' }}>
                                    {/* Real-time (Calculated) */}
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '16px' }}>वास्तविक डेटा (Live)</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {data.realTimeAnalytics.caste.slice(0, 5).map((c: any, i: number) => (
                                                <div key={i}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                                                        <span>{c.name}</span>
                                                        <span style={{ fontWeight: '800' }}>{c.count}</span>
                                                    </div>
                                                    <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${(c.count / data.stats.voters) * 100}%`, height: '100%', background: '#2563EB', borderRadius: '10px' }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Manual / Admin input */}
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '16px' }}>अनुमानित (Target)</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {adminCaste.map((c: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: '700' }}>{c.name}</span>
                                                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#2563EB' }}>{c.percent}%</span>
                                                </div>
                                            ))}
                                            {adminCaste.length === 0 && <div style={{ color: '#94A3B8', fontSize: '12px' }}>डेटा सेट करें</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Historical Section */}
                            <div className="card">
                                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BarChart3 size={20} color="#1E293B" /> {t.historical}
                                </h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                            <th style={{ textAlign: 'left', padding: '12px' }}>पार्टी</th>
                                            <th style={{ textAlign: 'right', padding: '12px' }}>प्राप्त वोट</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historical.map((h: any, i: number) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                <td style={{ padding: '12px', fontWeight: '700' }}>{h.party}</td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '900', color: '#10B981' }}>{h.votes}</td>
                                            </tr>
                                        ))}
                                        {historical.length === 0 && <tr><td colSpan={2} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>डेटा उपलब्ध नहीं</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Sentiment Card */}
                            <div className="card" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)', color: 'white' }}>
                                <h3 style={{ color: 'white', marginBottom: '24px' }}>{t.sentiment}</h3>
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '12px', opacity: 0.7 }}>पार्टी समर्थक</div>
                                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{data.realTimeAnalytics.sentiment.support}</div>
                                    </div>
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '12px', opacity: 0.7 }}>विरोध / अन्य</div>
                                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{data.realTimeAnalytics.sentiment.oppose}</div>
                                    </div>
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '12px', opacity: 0.7 }}>सामान्य (Neutral)</div>
                                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{data.realTimeAnalytics.sentiment.neutral}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Age Card */}
                            <div className="card">
                                <h3 style={{ marginBottom: '20px' }}><Users size={18} /> {t.age}</h3>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {data.realTimeAnalytics.age.map((a: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '600' }}>{a.range}</span>
                                            <span style={{ fontWeight: '800' }}>{a.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
