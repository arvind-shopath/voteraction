'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCampaignProgressStats } from '@/app/actions/campaign-progress';
import { 
    Activity, TrendingUp, Users, Home, Calendar, CheckSquare, 
    AlertTriangle, ShieldCheck, ArrowUpRight, Flame, Target, 
    Sparkles, RefreshCw, Loader2, CheckCircle2, ChevronRight, BarChart3 
} from 'lucide-react';

export default function CampaignProgressPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'booths' | 'workers'>('booths');

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const stats = await getCampaignProgressStats();
            setData(stats);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading || !data) {
        return (
            <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <Loader2 className="animate-spin" size={40} color="#2563EB" />
                <p style={{ fontWeight: 800, color: '#64748B' }}>कैंपेन प्रोग्रेस व रेडीनेस लोड हो रही है...</p>
            </div>
        );
    }

    const { readinessScore, pillars, issues, boothDrillDown, workerProgress } = data;

    return (
        <div style={{ padding: isMobile ? '12px 8px 40px 8px' : '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={isMobile ? 22 : 28} color="#2563EB" /> कैंपेन प्रोग्रेस व इलेक्शन रेडीनेस
                    </h1>
                    <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                        वास्तविक फील्ड डेटा, इवेंट निष्पादन और टीम कवरेज से लाइव गणना
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={fetchData}
                        style={{ background: '#F1F5F9', border: 'none', padding: '10px 14px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}
                    >
                        <RefreshCw size={15} /> रिफ्रेश डेटा
                    </button>
                </div>
            </div>

            {/* Top Readiness Hero Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                borderRadius: '24px',
                padding: isMobile ? '20px' : '32px',
                color: 'white',
                marginBottom: '24px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 900 }}>
                                🎯 Explainable Readiness Engine
                            </span>
                            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>
                                {data.assembly?.name} (#{data.assembly?.number})
                            </span>
                        </div>
                        <h2 style={{ fontSize: isMobile ? '22px' : '30px', fontWeight: 950, margin: '0 0 8px 0', lineHeight: 1.2 }}>
                            समग्र चुनावी तैयारी (Overall Readiness)
                        </h2>
                        <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0, fontWeight: 600, maxWidth: '550px' }}>
                            यह स्कोर 5 वास्तविक मानकों (डोर-टू-डोर 30%, टीम असाइनमेंट 20%, मैपिंग 20%, इवेंट्स 15%, टास्क 15%) पर आधारित है।
                        </p>
                    </div>

                    {/* Circular Score Gauge */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        padding: '20px 28px',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)',
                        minWidth: '160px'
                    }}>
                        <div style={{ fontSize: isMobile ? '38px' : '48px', fontWeight: 950, color: readinessScore > 70 ? '#86EFAC' : (readinessScore > 40 ? '#FCD34D' : '#FCA5A5'), lineHeight: 1 }}>
                            {readinessScore}%
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginTop: '6px' }}>
                            {readinessScore > 70 ? '🟢 उत्कृष्ट तैयारी' : (readinessScore > 40 ? '🟡 मध्यम स्तर' : '🔴 ध्यान देने योग्य')}
                        </div>
                    </div>
                </div>
            </div>

            {/* 5 Core Pillars Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                {/* Pillar 1: Field Coverage */}
                <div style={{ background: 'white', padding: '18px', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669', background: '#ECFDF5', padding: '3px 8px', borderRadius: '6px' }}>
                            30% Weight
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: 950, color: '#059669' }}>
                            {pillars.fieldCoverage.rate}%
                        </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 950, color: '#0F172A', marginBottom: '4px' }}>🚪 डोर-टू-डोर विजिट</div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                        {pillars.fieldCoverage.visited} / {pillars.fieldCoverage.total} परिवार संपर्कित
                    </div>
                    <div style={{ height: '6px', width: '100%', background: '#F1F5F9', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${pillars.fieldCoverage.rate}%`, height: '100%', background: '#059669' }} />
                    </div>
                </div>

                {/* Pillar 2: Team Assignment */}
                <div style={{ background: 'white', padding: '18px', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: '6px' }}>
                            20% Weight
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: 950, color: '#2563EB' }}>
                            {pillars.teamAssignment.rate}%
                        </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 950, color: '#0F172A', marginBottom: '4px' }}>👥 टीम व बूथ असाइनमेंट</div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                        {pillars.teamAssignment.assignedBooths} / {pillars.teamAssignment.totalBooths} बूथ पर टीम तैनात
                    </div>
                    <div style={{ height: '6px', width: '100%', background: '#F1F5F9', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${pillars.teamAssignment.rate}%`, height: '100%', background: '#2563EB' }} />
                    </div>
                </div>

                {/* Pillar 3: Household Mapping */}
                <div style={{ background: 'white', padding: '18px', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#7C3AED', background: '#F5F3FF', padding: '3px 8px', borderRadius: '6px' }}>
                            20% Weight
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: 950, color: '#7C3AED' }}>
                            {pillars.householdMapping.rate}%
                        </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 950, color: '#0F172A', marginBottom: '4px' }}>📍 हाउसहोल्ड मैपिंग</div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                        {pillars.householdMapping.verified + pillars.householdMapping.geocoded} मैप पर स्थित
                    </div>
                    <div style={{ height: '6px', width: '100%', background: '#F1F5F9', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${pillars.householdMapping.rate}%`, height: '100%', background: '#7C3AED' }} />
                    </div>
                </div>

                {/* Pillar 4: Event Execution */}
                <div style={{ background: 'white', padding: '18px', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#D97706', background: '#FEF3C7', padding: '3px 8px', borderRadius: '6px' }}>
                            15% Weight
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: 950, color: '#D97706' }}>
                            {pillars.eventExecution.rate}%
                        </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 950, color: '#0F172A', marginBottom: '4px' }}>📅 सभा व इवेंट्स</div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                        {pillars.eventExecution.completed} / {pillars.eventExecution.total} कार्यक्रम संपन्न
                    </div>
                    <div style={{ height: '6px', width: '100%', background: '#F1F5F9', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${pillars.eventExecution.rate}%`, height: '100%', background: '#D97706' }} />
                    </div>
                </div>

                {/* Pillar 5: Tasks */}
                <div style={{ background: 'white', padding: '18px', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#0891B2', background: '#ECFEFF', padding: '3px 8px', borderRadius: '6px' }}>
                            15% Weight
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: 950, color: '#0891B2' }}>
                            {pillars.taskCompletion.rate}%
                        </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 950, color: '#0F172A', marginBottom: '4px' }}>📋 टास्क निष्पादन</div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                        {pillars.taskCompletion.completed} / {pillars.taskCompletion.total} कार्य पूर्ण
                    </div>
                    <div style={{ height: '6px', width: '100%', background: '#F1F5F9', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${pillars.taskCompletion.rate}%`, height: '100%', background: '#0891B2' }} />
                    </div>
                </div>
            </div>

            {/* Drill-down Section Tabs */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
                        <button
                            onClick={() => setActiveTab('booths')}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', border: 'none',
                                background: activeTab === 'booths' ? 'white' : 'transparent',
                                color: activeTab === 'booths' ? '#2563EB' : '#64748B',
                                fontWeight: 900, fontSize: '13px', cursor: 'pointer',
                                boxShadow: activeTab === 'booths' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            📊 बूथ-वार तैयारी (Booth Drill-Down)
                        </button>
                        <button
                            onClick={() => setActiveTab('workers')}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', border: 'none',
                                background: activeTab === 'workers' ? 'white' : 'transparent',
                                color: activeTab === 'workers' ? '#2563EB' : '#64748B',
                                fontWeight: 900, fontSize: '13px', cursor: 'pointer',
                                boxShadow: activeTab === 'workers' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            👥 कार्यकर्ता वर्कलोड (Worker Progress)
                        </button>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 800 }}>
                        कुल {activeTab === 'booths' ? `${boothDrillDown.length} बूथ` : `${workerProgress.length} कार्यकर्ता`}
                    </div>
                </div>

                {activeTab === 'booths' ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', fontWeight: 900, color: '#475569' }}>बूथ संख्या व नाम</th>
                                    <th style={{ padding: '12px', fontWeight: 900, color: '#475569' }}>कुल परिवार</th>
                                    <th style={{ padding: '12px', fontWeight: 900, color: '#475569' }}>विजिट कवरेज</th>
                                    <th style={{ padding: '12px', fontWeight: 900, color: '#475569' }}>तैनात टीम</th>
                                    <th style={{ padding: '12px', fontWeight: 900, color: '#475569' }}>स्थिति</th>
                                </tr>
                            </thead>
                            <tbody>
                                {boothDrillDown.map((b: any) => (
                                    <tr key={b.boothNumber} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '12px', fontWeight: 900, color: '#0F172A' }}>
                                            बूथ #{b.boothNumber} • <span style={{ fontWeight: 700, color: '#475569' }}>{b.name}</span>
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: 800, color: '#334155' }}>
                                            {b.totalHouseholds} परिवार
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 900, color: b.visitPercent > 70 ? '#16A34A' : (b.visitPercent > 30 ? '#D97706' : '#DC2626'), minWidth: '35px' }}>
                                                    {b.visitPercent}%
                                                </span>
                                                <div style={{ width: '80px', height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${b.visitPercent}%`, height: '100%', background: b.visitPercent > 70 ? '#16A34A' : (b.visitPercent > 30 ? '#D97706' : '#DC2626') }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: 700 }}>
                                            {b.workerCount > 0 ? (
                                                <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '11px' }}>
                                                    ✓ {b.workerCount} कार्यकर्ता
                                                </span>
                                            ) : (
                                                <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '11px' }}>
                                                    ✗ टीम बाकी
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 900, padding: '3px 8px', borderRadius: '6px',
                                                background: b.status === 'Good' ? '#DCFCE7' : (b.status === 'Average' ? '#FEF3C7' : '#FEE2E2'),
                                                color: b.status === 'Good' ? '#166534' : (b.status === 'Average' ? '#92400E' : '#991B1B')
                                            }}>
                                                {b.status === 'Good' ? 'उत्कृष्ट' : (b.status === 'Average' ? 'मध्यम' : 'सक्रियता आवश्यक')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', fontWeight: 900, color: '#475569' }}>कार्यकर्ता नाम</th>
                                    <th style={{ padding: '12px', fontWeight: 900, color: '#475569' }}>भूमिका</th>
                                    <th style={{ padding: '12px', fontWeight: 900, color: '#475569' }}>संबंधित बूथ</th>
                                    <th style={{ padding: '12px', fontWeight: 900, color: '#475569' }}>डोर-टू-डोर विजिट्स</th>
                                    <th style={{ padding: '12px', fontWeight: 900, color: '#475569' }}>पूर्ण टास्क</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workerProgress.map((w: any) => (
                                    <tr key={w.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '12px', fontWeight: 900, color: '#0F172A' }}>
                                            {w.name} {w.mobile && <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>({w.mobile})</span>}
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: 800, color: '#475569' }}>
                                            {w.type === 'BOOTH_MANAGER' ? 'बूथ मैनेजर' : (w.type === 'PANNA_PRAMUKH' ? 'पन्ना प्रमुख' : 'ग्राउंड कार्यकर्ता')}
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: 800, color: '#2563EB' }}>
                                            {w.boothNumber ? `बूथ #${w.boothNumber}` : 'विधानसभा स्तर'}
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: 900, color: '#059669' }}>
                                            ✅ {w.totalVisits} परिवार मिले
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: 800, color: '#475569' }}>
                                            {w.completedTasks} / {w.assignedTasks}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
