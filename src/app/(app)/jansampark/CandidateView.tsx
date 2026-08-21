/**
 * 🛡️ [PROTECTED] CANDIDATE VIEW - JANSAMPARK
 * ⚠️ DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER CONSENT.
 * This is a stable, premium component isolated for Candidate/Manager roles.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Navigation, Clock, ChevronRight, X, TrendingUp, Users, MapPin, Search, CheckCircle2, AlertCircle, BarChart3, Calendar, Filter, Target } from 'lucide-react';
import { getJansamparkRoutes, createJansamparkRoute, updateJansamparkVisit, getJansamparkSupportStats, getVillageCoverageData } from '@/app/actions/jansampark';

/**
 * 👑 ULTRA PREMIUM CANDIDATE VIEW - JANSAMPARK
 * Designed for maximum impact and clear visualization of ground support.
 */
export default function CandidateJansamparkView({ assemblyId }: { assemblyId: number }) {
    const [routes, setRoutes] = useState<any[]>([]);
    const [stats, setStats] = useState<Record<string, any>>({});
    const [villageCoverage, setVillageCoverage] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [editingVisit, setEditingVisit] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [coverageFilter, setCoverageFilter] = useState('All'); // All, Done, Pending
    const [supportFilter, setSupportFilter] = useState('All'); // All, Support, Neutral, Against

    const load = async () => {
        try {
            const [rData, sData, vData] = await Promise.all([
                getJansamparkRoutes(assemblyId),
                getJansamparkSupportStats(assemblyId),
                getVillageCoverageData(assemblyId)
            ]);
            setRoutes(rData);
            setStats(sData);
            setVillageCoverage(vData);
        } catch (error) {
            console.error("Failed to load Jansampark data", error);
        }
    };

    useEffect(() => { load(); }, [assemblyId]);

    const handleUpdateVisit = async (visitId: number, data: any) => {
        await updateJansamparkVisit(visitId, data);
        load();
        setEditingVisit(null);
    };

    // Date filter for routes
    const [routeDateFilter, setRouteDateFilter] = useState('All'); // All, Today, Past, Future

    // Derived Global Stats
    const totalPositive = Object.values(stats).reduce((acc, s) => acc + (s.positive || 0), 0);
    const totalVoters = Object.values(stats).reduce((acc, s) => acc + (s.positive + s.neutral + s.negative || 0), 0);
    const supportPercent = totalVoters > 0 ? Math.round((totalPositive / totalVoters) * 100) : 0;

    const villageList = Object.keys(stats).filter(v =>
        v.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div style={{ marginBottom: '80px', animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            {/* Header & Global Stats Area */}
            <div style={{ marginBottom: isMobile ? '24px' : '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', marginBottom: isMobile ? '20px' : '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h2 style={{ fontSize: isMobile ? '22px' : '32px', fontWeight: '950', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.5px' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #2563EB, #4F46E5)', padding: isMobile ? '8px' : '12px', borderRadius: '16px',
                                boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)', display: 'flex'
                            }}>
                                <Navigation size={isMobile ? 22 : 32} color="white" />
                            </div>
                            जनसंपर्क कमांड सेंटर
                        </h2>
                        <p style={{ color: '#64748B', fontWeight: '700', marginTop: '4px', fontSize: isMobile ? '13px' : '15px' }}>विधानसभा क्षेत्र में जनसंपर्क और समर्थन की वास्तविक स्थिति</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        style={{
                            background: 'linear-gradient(135deg, #0F172A, #1E293B)', color: 'white', padding: isMobile ? '12px 20px' : '16px 32px', borderRadius: '18px', border: 'none',
                            fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            boxShadow: '0 12px 20px -6px rgba(15, 23, 42, 0.3)', transition: 'all 0.3s ease', fontSize: isMobile ? '14px' : '15px'
                        }}
                    >
                        <Plus size={isMobile ? 18 : 22} /> नया रूट प्लान तैयार करें
                    </button>
                </div>

                {/* --- PREMIUM SUPPORT SUMMARY CARDS --- */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: isMobile ? '14px' : '24px', marginBottom: isMobile ? '24px' : '40px' }}>
                    <div style={{ background: 'white', padding: isMobile ? '20px' : '30px', borderRadius: isMobile ? '20px' : '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, padding: '20px', opacity: 0.1 }}><BarChart3 size={60} color="#2563EB" /></div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>कुल समर्थन (Support Score)</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <div style={{ fontSize: isMobile ? '32px' : '42px', fontWeight: '950', color: '#0F172A' }}>{supportPercent}%</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#10B981' }}>सर्वेक्षण आधारित</div>
                        </div>
                        <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', marginTop: '16px', overflow: 'hidden' }}>
                            <div style={{ width: `${supportPercent}%`, height: '100%', background: 'linear-gradient(90deg, #2563EB, #60A5FA)', borderRadius: '4px' }} />
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: isMobile ? '20px' : '30px', borderRadius: isMobile ? '20px' : '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>मतदाता प्रतिक्रिया (Overall Summary)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#22C55E" /> फेवर में (Positive)</div>
                                <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '950', color: '#15803D' }}>{totalPositive}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} color="#94A3B8" /> न्यूट्रल/अन्य</div>
                                <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '950', color: '#475569' }}>{totalVoters - totalPositive}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🆕 MERGED VILLAGE COMMAND CENTER */}
            <div style={{ marginBottom: '50px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', marginBottom: isMobile ? '20px' : '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h3 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '950', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.5px' }}>
                            <TrendingUp size={isMobile ? 22 : 28} color="#4F46E5" /> गांव-वार विश्लेषण (VILLAGE ANALYTICS)
                        </h3>
                        <p style={{ color: '#64748B', fontSize: isMobile ? '13px' : '15px', marginTop: '4px', fontWeight: '700' }}>समर्थन, बूथ और जनसंपर्क की विस्तृत जानकारी</p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: isMobile ? '100%' : '260px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                placeholder="गांव खोजें..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 14px 10px 44px', borderRadius: '14px', border: '1px solid #E2E8F0',
                                    fontSize: '14px', fontWeight: '700', outline: 'none', background: 'white'
                                }}
                            />
                        </div>
                        <select
                            value={coverageFilter}
                            onChange={(e) => setCoverageFilter(e.target.value)}
                            style={{ flex: isMobile ? 1 : 'none', padding: '10px 14px', borderRadius: '14px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: '800', background: 'white', cursor: 'pointer', outline: 'none' }}
                        >
                            <option value="All">विजिट स्थिति</option>
                            <option value="Done">विजिट पूर्ण</option>
                            <option value="Pending">विजिट बाकी</option>
                        </select>
                        <select
                            value={supportFilter}
                            onChange={(e) => setSupportFilter(e.target.value)}
                            style={{ flex: isMobile ? 1 : 'none', padding: '10px 14px', borderRadius: '14px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: '800', background: 'white', cursor: 'pointer', outline: 'none' }}
                        >
                            <option value="All">समर्थन टाइप</option>
                            <option value="Support">पक्ष में</option>
                            <option value="Neutral">तटस्थ</option>
                            <option value="Against">विरोध में</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: isMobile ? '16px' : '24px' }}>
                    {villageCoverage
                        .filter(vc => {
                            // Search Filter
                            if (searchTerm && !vc.village.toLowerCase().includes(searchTerm.toLowerCase())) return false;

                            // Coverage Filter
                            if (coverageFilter === 'Done' && !vc.jansamparkDone) return false;
                            if (coverageFilter === 'Pending' && vc.jansamparkDone) return false;

                            // Support Filter
                            if (supportFilter === 'Support' && vc.support.positive <= vc.support.neutral && vc.support.positive <= vc.support.negative) return false;
                            if (supportFilter === 'Neutral' && vc.support.neutral <= vc.support.positive && vc.support.neutral <= vc.support.negative) return false;
                            if (supportFilter === 'Against' && vc.support.negative <= vc.support.positive && vc.support.negative <= vc.support.neutral) return false;

                            return true;
                        })
                        .map((vc: any) => {
                            const total = vc.support.positive + vc.support.neutral + vc.support.negative;
                            const supportPercent = total > 0 ? Math.round((vc.support.positive / total) * 100) : 0;
                            const negativePercent = total > 0 ? Math.round((vc.support.negative / total) * 100) : 0;

                            // Dynamic Colors
                            let bgColor = '#F8FAFC'; // Default Neutral Grey
                            let borderColor = '#E2E8F0';
                            let accentColor = '#64748B';

                            if (supportPercent > 50 || (vc.support.positive > vc.support.neutral && vc.support.positive > vc.support.negative)) {
                                bgColor = '#F0FDF4'; // Green
                                borderColor = '#BBF7D0';
                                accentColor = '#22C55E';
                            } else if (negativePercent > 20 || (vc.support.negative > vc.support.positive && vc.support.negative > vc.support.neutral)) {
                                bgColor = '#FEF2F2'; // Red
                                borderColor = '#FECACA';
                                accentColor = '#EF4444';
                            }

                            return (
                                <div key={vc.village} style={{
                                    background: bgColor, padding: isMobile ? '20px 16px' : '28px', borderRadius: isMobile ? '20px' : '28px', border: `1px solid ${borderColor}`,
                                    position: 'relative', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                                    transition: 'all 0.3s ease', minWidth: 0
                                }}>
                                    {/* Top Status */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <div style={{ fontWeight: '950', color: '#0F172A', fontSize: isMobile ? '18px' : '20px', marginBottom: '4px' }}>{vc.village}</div>
                                            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MapPin size={13} color="#9333EA" />
                                                बूथ: {vc.booths.length > 0 ? vc.booths.sort((a: any, b: any) => a - b).join(', ') : 'N/A'}
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '900',
                                            background: vc.jansamparkDone ? '#16A34A' : '#F1F5F9',
                                            color: vc.jansamparkDone ? 'white' : '#64748B', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            {vc.jansamparkDone ? <><CheckCircle2 size={13} /> किया</> : '⏳ बाकी'}
                                        </div>
                                    </div>

                                    {/* Support Level Bar */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '6px', textTransform: 'uppercase' }}>
                                            <span>समर्थन स्तर</span>
                                            <span style={{ color: accentColor }}>{supportPercent}%</span>
                                        </div>
                                        <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex' }}>
                                            <div style={{ width: `${(vc.support.positive / (total || 1)) * 100}%`, background: '#22C55E' }} />
                                            <div style={{ width: `${(vc.support.neutral / (total || 1)) * 100}%`, background: '#94A3B8' }} />
                                            <div style={{ width: `${(vc.support.negative / (total || 1)) * 100}%`, background: '#EF4444' }} />
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '18px', background: 'rgba(255,255,255,0.4)', padding: '12px 8px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
                                        <div><div style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', marginBottom: '2px' }}>पक्ष</div><div style={{ fontSize: '16px', fontWeight: '950', color: '#15803D' }}>{vc.support.positive}</div></div>
                                        <div><div style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', marginBottom: '2px' }}>तटस्थ</div><div style={{ fontSize: '16px', fontWeight: '950', color: '#475569' }}>{vc.support.neutral}</div></div>
                                        <div><div style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', marginBottom: '2px' }}>विरोध</div><div style={{ fontSize: '16px', fontWeight: '950', color: '#B91C1C' }}>{vc.support.negative}</div></div>
                                    </div>

                                    {/* Footer Details */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '800' }}>
                                            कुल मतदाता: <span style={{ color: '#0F172A' }}>{vc.totalVoters}</span>
                                        </div>
                                        {vc.lastVisit && (
                                            <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={13} /> {new Date(vc.lastVisit).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    {villageCoverage.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '80px', textAlign: 'center', background: 'white', borderRadius: '32px', border: '1px dashed #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                            कोई डेटा उपलब्ध नहीं है।
                        </div>
                    )}
                </div>
            </div>

            {/* Routes Section */}
            <div style={{ background: 'white', borderRadius: '40px', padding: '40px', marginTop: '40px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h3 style={{ fontSize: '22px', fontWeight: '950', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.5px' }}>
                            <Calendar size={28} color="#2563EB" /> जनसंपर्क कार्यक्रम (Planned Routes)
                        </h3>
                        <p style={{ color: '#64748B', fontSize: '14px', marginTop: '6px', fontWeight: '700' }}>अपने आने वाले और पिछले कार्यक्रमों को देखें</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <select
                            value={routeDateFilter}
                            onChange={(e) => setRouteDateFilter(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '14px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: '800', background: 'white', cursor: 'pointer', outline: 'none' }}
                        >
                            <option value="All">सभी कार्यक्रम</option>
                            <option value="Future">आने वाले</option>
                            <option value="Today">आज के</option>
                            <option value="Past">पिछले</option>
                        </select>
                        <button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)', color: 'white', padding: '12px 24px', borderRadius: '16px', border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                            <Plus size={20} /> नया रूट बनाएं
                        </button>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                    {routes
                        .filter(r => {
                            const routeDate = new Date(r.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            routeDate.setHours(0, 0, 0, 0);

                            if (routeDateFilter === 'Today') return routeDate.getTime() === today.getTime();
                            if (routeDateFilter === 'Past') return routeDate < today;
                            if (routeDateFilter === 'Future') return routeDate > today;
                            return true;
                        })
                        .map(r => (
                            <div key={r.id} style={{
                                background: 'white', borderRadius: '40px', padding: '36px', border: '1px solid #E2E8F0',
                                boxShadow: '0 20px 40px -15px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: 32, right: 32, padding: '10px 20px', background: '#F8FAFC', borderRadius: '14px', fontSize: '13px', fontWeight: '900', color: '#64748B', border: '1px solid #F1F5F9' }}>
                                    {r.visits?.length || 0} पड़ाव
                                </div>
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
                                        {new Date(r.date).toLocaleDateString('hi-IN', { weekday: 'long' })}
                                    </div>
                                    <div style={{ fontSize: '28px', fontWeight: '950', color: '#0F172A' }}>
                                        {new Date(r.date).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {r.visits.map((v: any, vIdx: number) => (
                                        <div
                                            key={v.id}
                                            onClick={() => setEditingVisit({ ...v, date: r.date })}
                                            style={{
                                                padding: '22px',
                                                background: v.atmosphere === 'Support' ? '#F0FDF4' : v.atmosphere === 'Oppose' ? '#FEF2F2' : '#F8FAFC',
                                                borderRadius: '26px',
                                                border: `1px solid ${v.atmosphere === 'Support' ? '#BBF7D0' : v.atmosphere === 'Oppose' ? '#FECACA' : '#E2E8F0'}`,
                                                cursor: 'pointer',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '44px', height: '44px', borderRadius: '16px', background: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '16px', fontWeight: '950', color: '#2563EB', border: '1px solid #E2E8F0',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.04)'
                                                }}>
                                                    {vIdx + 1}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '950', color: '#1E293B', fontSize: '18px' }}>{v.village}</div>
                                                    <div style={{ fontSize: '14px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontWeight: '750' }}>
                                                        <Clock size={16} color="#94A3B8" /> {v.time || 'N/A'} •
                                                        <span style={{ color: v.atmosphere === 'Support' ? '#16A34A' : v.atmosphere === 'Oppose' ? '#DC2626' : '#64748B' }}>
                                                            {v.atmosphere === 'Support' ? 'पूर्ण समर्थन' : v.atmosphere === 'Oppose' ? 'असंतुष्ट/विरोध' : 'सामान्य/न्यूट्रल'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ background: 'white', padding: '10px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                                                <ChevronRight size={22} color="#CBD5E1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {showCreate && <CreateRouteModal onClose={() => setShowCreate(false)} assemblyId={assemblyId} onSuccess={load} villageCoverage={villageCoverage} />}
            {editingVisit && <StatusEditModal visit={editingVisit} onClose={() => setEditingVisit(null)} onSave={handleUpdateVisit} />}

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
            `}</style>
        </div>
    );
}

// Internal Modals
function CreateRouteModal({ onClose, assemblyId, onSuccess, villageCoverage }: any) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [date, setDate] = useState(tomorrow.toISOString().split('T')[0]);
    const [visits, setVisits] = useState([{ village: '', time: '10:00', atmosphere: 'Neutral' }]);

    const getVillageStats = (name: string) => {
        const vc = villageCoverage.find((v: any) => v.village === name);
        if (!vc) return null;
        const total = vc.support.positive + vc.support.neutral + vc.support.negative;
        const percent = total > 0 ? Math.round((vc.support.positive / total) * 100) : 0;
        return { percent, totalVoters: vc.totalVoters, jansamparkDone: vc.jansamparkDone };
    };

    const handleSave = async () => {
        if (visits.some(v => !v.village)) {
            alert('कृपया गांव का नाम भरें');
            return;
        }
        await createJansamparkRoute({ assemblyId, date: new Date(date), visits });
        onSuccess(); onClose();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '48px', padding: '54px', width: '100%', maxWidth: '640px', boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.7)', animation: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
                    <div>
                        <h3 style={{ fontSize: '30px', fontWeight: '950', color: '#0F172A', letterSpacing: '-0.7px' }}>नया जनसंपर्क तैयार करें</h3>
                        <p style={{ color: '#64748B', fontWeight: '700', marginTop: '6px', fontSize: '16px' }}>दौरे के पड़ाव और समय निर्धारित करें</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '50%', cursor: 'pointer' }}><X size={28} /></button>
                </div>

                <div style={{ marginBottom: '36px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>तारीख का चयन</label>
                    <div style={{ position: 'relative' }}>
                        <Calendar size={22} style={{ position: 'absolute', left: '18px', top: '20px', color: '#2563EB', zIndex: 10 }} />
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '20px 20px 20px 56px', borderRadius: '24px', border: '2px solid #F1F5F9', fontSize: '19px', fontWeight: '900', outline: 'none', color: '#1E293B', background: '#F8FAFC', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} />
                    </div>
                </div>

                <div style={{ marginBottom: '28px', maxHeight: '380px', overflowY: 'auto', paddingRight: '15px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: '#64748B', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>विजिट पड़ाव (Add Villages)</label>
                    {visits.map((v, i) => {
                        const stats = getVillageStats(v.village);
                        return (
                            <div key={i} style={{ marginBottom: '24px', animation: 'fadeIn 0.3s ease-out' }}>
                                <div style={{ display: 'flex', gap: '18px', marginBottom: '8px' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <MapPin size={22} style={{ position: 'absolute', left: '18px', top: '22px', color: '#94A3B8', zIndex: 5 }} />
                                        <input
                                            list={`villages-list-${i}`}
                                            placeholder="गांव का नाम लिखें..."
                                            value={v.village}
                                            onChange={e => { const n = [...visits]; n[i].village = e.target.value; setVisits(n); }}
                                            style={{ width: '100%', padding: '20px 20px 20px 54px', borderRadius: '22px', border: '2px solid #F1F5F9', fontSize: '17px', fontWeight: '900', outline: 'none', background: 'white' }}
                                        />
                                        <datalist id={`villages-list-${i}`}>
                                            {villageCoverage.map((vc: any) => (
                                                <option key={vc.village} value={vc.village} />
                                            ))}
                                        </datalist>
                                        {i > 0 && <button onClick={() => setVisits(visits.filter((_, idx) => idx !== i))} style={{ position: 'absolute', right: '-8px', top: '-8px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', zIndex: 10 }}><X size={14} /></button>}
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <Clock size={22} style={{ position: 'absolute', left: '16px', top: '22px', color: '#94A3B8', zIndex: 5 }} />
                                        <input type="time" value={v.time} onChange={e => { const n = [...visits]; n[i].time = e.target.value; setVisits(n); }} style={{ width: '160px', padding: '20px 20px 20px 48px', borderRadius: '22px', border: '2px solid #F1F5F9', fontSize: '17px', fontWeight: '900', outline: 'none', background: 'white' }} />
                                    </div>
                                </div>
                                {stats && (
                                    <div style={{ paddingLeft: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: stats.percent > 50 ? '#10B981' : stats.percent > 30 ? '#F59E0B' : '#EF4444', background: stats.percent > 50 ? '#DCFCE7' : stats.percent > 30 ? '#FEF3C7' : '#FEE2E2', padding: '4px 12px', borderRadius: '10px' }}>
                                            समर्थन: {stats.percent}%
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B' }}>
                                            कुल मतदाता: {stats.totalVoters}
                                        </div>
                                        {stats.jansamparkDone && (
                                            <div style={{ fontSize: '11px', fontWeight: '900', color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <CheckCircle2 size={12} /> विजिट पूर्ण
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <button onClick={() => setVisits([...visits, { village: '', time: '11:00', atmosphere: 'Neutral' }])} style={{ width: '100%', padding: '20px', border: '2.5px dashed #CBD5E1', borderRadius: '24px', fontWeight: '900', color: '#64748B', cursor: 'pointer', background: 'transparent', transition: 'all 0.2s', fontSize: '16px' }}>
                        + एक और गांव जोड़ें
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '24px', marginTop: '15px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '22px', borderRadius: '26px', border: '2px solid #F1F5F9', fontWeight: '950', fontSize: '18px', cursor: 'pointer', color: '#475569', background: 'white' }}>Cancel</button>
                    <button onClick={handleSave} style={{ flex: 1.5, padding: '22px', borderRadius: '26px', border: 'none', background: 'linear-gradient(135deg, #0F172A, #2D3748)', color: 'white', fontWeight: '950', fontSize: '18px', cursor: 'pointer', boxShadow: '0 20px 30px -8px rgba(15, 23, 42, 0.4)' }}>शेड्यूल लाइव करें</button>
                </div>
            </div>
        </div>
    );
}

function StatusEditModal({ visit, onClose, onSave }: any) {
    const [atmosphere, setAtmosphere] = useState(visit.atmosphere || 'Neutral');
    const [notes, setNotes] = useState(visit.notes || '');

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(32px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
            <div style={{ background: 'white', padding: '54px', borderRadius: '54px', width: '100%', maxWidth: '520px', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <h3 style={{ fontSize: '32px', fontWeight: '950', color: '#0F172A', letterSpacing: '-0.8px' }}>{visit.village} रिपोर्ट</h3>
                        <p style={{ color: '#64748B', fontWeight: '750', fontSize: '17px', marginTop: '6px' }}>दौरे के बाद का जमीनी फीडबैक</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', marginBottom: '36px' }}>
                    {[
                        { id: 'Support', label: 'भारी समर्थन', color: '#10B981', icon: CheckCircle2 },
                        { id: 'Neutral', label: 'तटस्थ/मिक्स', color: '#94A3B8', icon: AlertCircle },
                        { id: 'Oppose', label: 'विरोध/कठिन', color: '#EF4444', icon: X }
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setAtmosphere(opt.id)}
                            style={{
                                flex: 1, padding: '28px 12px', borderRadius: '28px',
                                background: atmosphere === opt.id ? opt.color : '#F8FAFC',
                                color: atmosphere === opt.id ? 'white' : '#64748B',
                                fontWeight: '950', border: 'none', cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)', fontSize: '15px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                                boxShadow: atmosphere === opt.id ? `0 15px 30px -5px ${opt.color}66` : 'none'
                            }}
                        >
                            <opt.icon size={26} strokeWidth={3} />
                            {opt.label}
                        </button>
                    ))}
                </div>

                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                        <label style={{ fontSize: '14px', fontWeight: '950', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '1px' }}>विजिट के मुख्य नोट्स</label>
                    </div>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="विजिट की खास बातें, लोगों की शिकायतें या मुख्य मांगें दर्ज करें..."
                        style={{ width: '100%', padding: '24px', borderRadius: '28px', border: '2px solid #F1F5F9', minHeight: '160px', fontSize: '17px', fontWeight: '750', outline: 'none', color: '#1E293B', background: '#F8FAFC', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '24px', borderRadius: '28px', border: '2px solid #F1F5F9', fontWeight: '950', cursor: 'pointer', color: '#64748B', background: 'white' }}>Cancel</button>
                    <button onClick={() => onSave(visit.id, { atmosphere, notes })} style={{ flex: 2, padding: '24px', borderRadius: '28px', border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: '950', cursor: 'pointer', fontSize: '18px', boxShadow: '0 20px 30px -10px rgba(16, 185, 129, 0.4)' }}>रिपोर्ट अपडेट करें</button>
                </div>
            </div>
        </div>
    );
}
