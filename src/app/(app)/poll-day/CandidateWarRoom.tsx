/**
 * 🛡️ [PROTECTED] CANDIDATE WAR ROOM - LIVE MONITORING & COMMAND CENTER
 * ⚠️ Full interactive command center for Candidate & War Room Commander.
 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    AlertTriangle, TrendingUp, CheckCircle2, Clock, MapPin, Search, Eye, X,
    Phone, MessageSquare, Send, Megaphone, Users, ShieldAlert, ArrowUpRight,
    Loader2, Check, UserCheck, AlertOctagon, Sparkles, ExternalLink, RefreshCw
} from 'lucide-react';
import {
    getWarRoomStats, updateIssueStatus, getBoothWarRoomDetails,
    sendWarRoomAlert, getAssemblyWorkersList
} from '@/app/actions/dashboard';

export default function CandidateWarRoom({ assemblyId }: { assemblyId: number }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // All, Alert, Low, High
    const [searchTerm, setSearchTerm] = useState('');
    const [time, setTime] = useState<string | null>(null);

    const [showDrawer, setShowDrawer] = useState(false);
    const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
    const [isMobile, setIsMobile] = useState(false);

    // --- BOOTH COMMAND MODAL STATE ---
    const [selectedBoothNumber, setSelectedBoothNumber] = useState<number | null>(null);
    const [boothDetails, setBoothDetails] = useState<any>(null);
    const [loadingBoothDetails, setLoadingBoothDetails] = useState(false);

    // --- BROADCAST / DIRECT ALERT MODAL STATE ---
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [workersList, setWorkersList] = useState<any[]>([]);
    const [alertTargetType, setAlertTargetType] = useState<string>('ALL'); // ALL, BOOTH_MANAGERS, PANNA_PRAMUKHS, BOOTH, WORKER
    const [alertTargetBooth, setAlertTargetBooth] = useState<number | ''>('');
    const [alertTargetWorkerId, setAlertTargetWorkerId] = useState<number | ''>('');
    const [alertPriority, setAlertPriority] = useState<string>('High');
    const [alertTitle, setAlertTitle] = useState<string>('');
    const [alertMessage, setAlertMessage] = useState<string>('');
    const [sendingAlert, setSendingAlert] = useState(false);
    const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

    // --- BOOTH SPECIFIC INCIDENT FORM STATE ---
    const [showBoothIncidentForm, setShowBoothIncidentForm] = useState(false);
    const [incidentTitle, setIncidentTitle] = useState('');
    const [incidentDesc, setIncidentDesc] = useState('');
    const [incidentPriority, setIncidentPriority] = useState('High');
    const [submittingIncident, setSubmittingIncident] = useState(false);

    const load = async () => {
        try {
            const res = await getWarRoomStats(assemblyId);
            setData(res);
        } catch (error) {
            console.error("Failed to load War Room stats:", error);
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

    // Load booth details when a booth card is clicked
    const handleBoothClick = async (boothNum: number) => {
        setSelectedBoothNumber(boothNum);
        setLoadingBoothDetails(true);
        try {
            const res = await getBoothWarRoomDetails(boothNum, assemblyId);
            setBoothDetails(res);
        } catch (err) {
            console.error("Failed to load booth details:", err);
        } finally {
            setLoadingBoothDetails(false);
        }
    };

    const handleOpenAlertModal = async (defaultBooth?: number, defaultWorkerId?: number, defaultTarget?: string) => {
        setShowAlertModal(true);
        setAlertSuccessMsg(null);
        if (defaultBooth) {
            setAlertTargetType('BOOTH');
            setAlertTargetBooth(defaultBooth);
        } else if (defaultWorkerId) {
            setAlertTargetType('WORKER');
            setAlertTargetWorkerId(defaultWorkerId);
        } else if (defaultTarget) {
            setAlertTargetType(defaultTarget);
        }
        try {
            const wList = await getAssemblyWorkersList(assemblyId);
            setWorkersList(wList);
        } catch (e) {
            console.error("Failed to load workers list:", e);
        }
    };

    const handleSendAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!alertTitle.trim() || !alertMessage.trim()) {
            alert("कृपया अलर्ट का शीर्षक और संदेश दर्ज करें।");
            return;
        }
        setSendingAlert(true);
        try {
            await sendWarRoomAlert({
                assemblyId,
                targetType: alertTargetType,
                targetId: alertTargetWorkerId ? Number(alertTargetWorkerId) : undefined,
                boothNumber: alertTargetBooth ? Number(alertTargetBooth) : undefined,
                title: alertTitle.trim(),
                message: alertMessage.trim(),
                priority: alertPriority
            });
            setAlertSuccessMsg("अलर्ट सफलतापूर्वक भेजा गया और वॉर रूम में दर्ज हो गया!");
            setAlertTitle('');
            setAlertMessage('');
            load();
            if (selectedBoothNumber) {
                const updated = await getBoothWarRoomDetails(selectedBoothNumber, assemblyId);
                setBoothDetails(updated);
            }
            setTimeout(() => {
                setShowAlertModal(false);
                setAlertSuccessMsg(null);
            }, 1500);
        } catch (err: any) {
            alert(err.message || "अलर्ट भेजने में विफल।");
        } finally {
            setSendingAlert(false);
        }
    };

    const handleReportBoothIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBoothNumber || !incidentTitle.trim()) return;
        setSubmittingIncident(true);
        try {
            await sendWarRoomAlert({
                assemblyId,
                targetType: 'BOOTH',
                boothNumber: selectedBoothNumber,
                title: incidentTitle.trim(),
                message: incidentDesc.trim() || 'बूथ पर आपातकालीन स्थिति दर्ज की गई।',
                priority: incidentPriority
            });
            setIncidentTitle('');
            setIncidentDesc('');
            setShowBoothIncidentForm(false);
            load();
            const updated = await getBoothWarRoomDetails(selectedBoothNumber, assemblyId);
            setBoothDetails(updated);
        } catch (err: any) {
            alert(err.message || "शिकायत दर्ज करने में विफल।");
        } finally {
            setSubmittingIncident(false);
        }
    };

    if (loading || !data) {
        return (
            <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexDirection: 'column', gap: '20px' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #F1F5F9', borderTopColor: '#2563EB', borderRadius: '50%' }}></div>
                <p style={{ fontWeight: '700' }}>वार रूम डेटा लोड हो रहा है...</p>
            </div>
        );
    }

    const getSortedBooths = () => {
        if (!data?.booths) return [];
        let filtered = [...data.booths];
        if (filter === 'Alert') filtered = filtered.filter((b: any) => b.status === 'Alert');
        if (filter === 'Low') filtered = filtered.filter((b: any) => (b.turnout || 0) < 30);
        if (filter === 'High') filtered = filtered.filter((b: any) => (b.turnout || 0) > 60);

        if (searchTerm) {
            filtered = filtered.filter((b: any) =>
                b.number.toString().includes(searchTerm) ||
                (b.name && b.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        return filtered.sort((a: any, b: any) => {
            if (a.status === 'Alert' && b.status !== 'Alert') return -1;
            if (a.status !== 'Alert' && b.status === 'Alert') return 1;
            return a.number - b.number;
        });
    };

    const filteredBooths = getSortedBooths();

    const stats = {
        avgTurnout: 0,
        totalVoted: 0,
        totalVoters: 0,
        activeIncidents: 0,
        incidents: [],
        resolvedIncidents: [],
        ...(data?.stats || {})
    };

    if (!Array.isArray(stats.incidents)) stats.incidents = [];
    if (!Array.isArray(stats.resolvedIncidents)) stats.resolvedIncidents = [];

    return (
        <div style={{ padding: isMobile ? '10px' : '24px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'var(--font-geist-sans)' }}>

            {/* 1. HEADER & STATS BANNER */}
            <div style={{
                background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                borderRadius: isMobile ? '24px' : '32px',
                padding: isMobile ? '24px' : '36px',
                color: 'white',
                marginBottom: isMobile ? '24px' : '32px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)'
            }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', position: 'relative', zIndex: 10, gap: isMobile ? '20px' : '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h1 style={{ fontSize: isMobile ? '24px' : '34px', fontWeight: '950', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <TrendingUp size={isMobile ? 28 : 36} className="pulse-red" color="#EF4444" /> मतदान वार रूम (War Room)
                            </h1>
                            <span style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#FCA5A5', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} className="animate-ping"></div> LIVE TRACKING
                            </span>
                        </div>
                        <p style={{ fontSize: isMobile ? '13px' : '15px', color: '#94A3B8', fontWeight: '600', marginTop: '6px' }}>
                            मुख्य नियंत्रण कक्ष (विधानसभा: #{assemblyId}) • प्रति 15 सेकंड में स्वतः अपडेट
                        </p>
                    </div>

                    {/* Top Action Buttons & Clock */}
                    <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => handleOpenAlertModal()}
                            style={{
                                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                                color: 'white',
                                border: 'none',
                                padding: isMobile ? '12px 16px' : '12px 22px',
                                borderRadius: '14px',
                                fontWeight: '900',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 8px 20px -4px rgba(239, 68, 68, 0.5)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Megaphone size={18} /> 📢 अलर्ट / निर्देश भेजें
                        </button>

                        <div style={{ textAlign: isMobile ? 'left' : 'right', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: '900', color: '#10B981', lineHeight: 1 }}>
                                {time || '--:--'}
                            </div>
                            <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '800', marginTop: '2px', letterSpacing: '1px' }}>
                                LIVE POLL CLOCK
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '20px', marginTop: isMobile ? '20px' : '30px', position: 'relative', zIndex: 10 }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: isMobile ? '12px 10px' : '20px', borderRadius: isMobile ? '16px' : '20px', border: '1px solid rgba(255,255,255,0.1)', minWidth: 0 }}>
                        <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', wordBreak: 'break-word' }}>मतदान प्रतिशत</div>
                        <div style={{ fontSize: isMobile ? '22px' : '36px', fontWeight: '950', color: stats.avgTurnout > 50 ? '#10B981' : '#F59E0B' }}>
                            {stats.avgTurnout}%
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: isMobile ? '12px 10px' : '20px', borderRadius: isMobile ? '16px' : '20px', border: '1px solid rgba(255,255,255,0.1)', minWidth: 0 }}>
                        <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', wordBreak: 'break-word' }}>कुल वोट पड़े</div>
                        <div style={{ fontSize: isMobile ? '22px' : '36px', fontWeight: '950', color: 'white' }}>
                            {stats.totalVoted?.toLocaleString() || 0}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: isMobile ? '12px 10px' : '20px', borderRadius: isMobile ? '16px' : '20px', border: '1px solid rgba(255,255,255,0.1)', minWidth: 0 }}>
                        <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', wordBreak: 'break-word' }}>सक्रिय अलर्ट्स</div>
                        <div style={{ fontSize: isMobile ? '22px' : '36px', fontWeight: '950', color: (stats.activeIncidents || 0) > 0 ? '#EF4444' : '#10B981' }}>
                            {stats.activeIncidents || 0}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: isMobile ? '12px 10px' : '20px', borderRadius: isMobile ? '16px' : '20px', border: '1px solid rgba(255,255,255,0.1)', minWidth: 0 }}>
                        <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', wordBreak: 'break-word' }}>कुल मतदाता</div>
                        <div style={{ fontSize: isMobile ? '22px' : '36px', fontWeight: '950', color: '#94A3B8' }}>
                            {stats.totalVoters?.toLocaleString() || 0}
                        </div>
                    </div>
                </div>

                {/* Party Breakdown Section */}
                {stats.partyStats && stats.partyStats.length > 0 && (
                    <div style={{ marginTop: isMobile ? '18px' : '24px', position: 'relative', zIndex: 10, maxWidth: '100%', overflow: 'hidden' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
                            पार्टी-वार मतदान रुझान (Party-wise Share)
                        </div>
                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none', maxWidth: '100%' }}>
                            {stats.partyStats.map((ps: any) => (
                                <div key={ps.id} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    minWidth: isMobile ? '120px' : '150px',
                                    padding: isMobile ? '10px 14px' : '14px 18px',
                                    borderRadius: '14px',
                                    border: `1px solid ${ps.color}44`,
                                    borderLeft: `4px solid ${ps.color}`,
                                    flexShrink: 0
                                }}>
                                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', marginBottom: '2px' }}>{ps.name}</div>
                                    <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '950', color: ps.color }}>{ps.count.toLocaleString()}</div>
                                    <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '800', marginTop: '2px' }}>
                                        {Math.round((ps.count / (stats.totalVoted || 1)) * 100)}% शेयर
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* DECORATIVE BACKGROUND GLOW */}
                <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }}></div>
            </div>

            {/* 2. BOOTH MONITORING BAR & SEARCH */}
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                    <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '950', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <div style={{ width: '12px', height: '12px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 0 4px #D1FAE5' }}></div>
                        बूथ लाइव स्थिति ({filteredBooths.length})
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', margin: '4px 0 0 0' }}>
                        💡 किसी भी बूथ कार्ड पर क्लिक करके बूथ मैनेजर से बात करें, पन्ना टीम देखें या निर्देश भेजें।
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                    <div style={{ position: 'relative', flex: isMobile ? 1 : 'none' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
                        <input
                            placeholder="बूथ नंबर या नाम से खोजें..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '10px 16px 10px 38px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: '700', fontSize: '13px', width: isMobile ? '100%' : '220px', background: 'white' }}
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: '800', fontSize: '13px', background: 'white', cursor: 'pointer' }}
                    >
                        <option value="All">सभी बूथ ({data.booths?.length || 0})</option>
                        <option value="Alert">⚠️ केवल अलर्ट्स</option>
                        <option value="Low">🔻 कम मतदान (&lt;30%)</option>
                        <option value="High">🔥 तेज़ मतदान (&gt;60%)</option>
                    </select>
                    <button
                        onClick={() => setShowDrawer(true)}
                        style={{
                            background: '#0F172A',
                            color: 'white',
                            padding: '10px 18px',
                            borderRadius: '12px',
                            fontWeight: '800',
                            fontSize: '13px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        शिकायतें <span style={{ background: '#EF4444', padding: '2px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: '900' }}>{stats.activeIncidents || 0}</span>
                    </button>
                </div>
            </div>

            {/* 3. INTERACTIVE BOOTH GRID (CLICKABLE CARDS) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: isMobile ? '12px' : '16px' }}>
                {filteredBooths.map((b: any) => {
                    const isAlert = b.status === 'Alert';
                    const isLow = b.turnout < 30;
                    return (
                        <div
                            key={b.id}
                            onClick={() => handleBoothClick(b.number)}
                            style={{
                                background: 'white',
                                borderRadius: '20px',
                                padding: '20px',
                                border: isAlert ? '2px solid #EF4444' : '1px solid #E2E8F0',
                                animation: isAlert ? 'pulse-soft-red 2s infinite' : 'none',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                            }}
                            className="hover:shadow-lg hover:border-blue-400"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        बूथ #{b.number}
                                    </div>
                                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A', marginTop: '2px' }}>
                                        {b.name || `बूथ संख्या ${b.number}`}
                                    </div>
                                </div>
                                <div style={{
                                    background: isLow ? '#FEF2F2' : (b.turnout > 60 ? '#F0FDF4' : '#EFF6FF'),
                                    padding: '4px 10px',
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    fontWeight: '950',
                                    color: isLow ? '#EF4444' : (b.turnout > 60 ? '#16A34A' : '#2563EB')
                                }}>
                                    {b.turnout}%
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div style={{ height: '7px', width: '100%', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
                                <div style={{
                                    width: `${Math.min(100, b.turnout)}%`,
                                    height: '100%',
                                    background: isLow ? '#EF4444' : (b.turnout > 60 ? '#10B981' : '#2563EB'),
                                    transition: 'width 0.5s ease-in-out'
                                }}></div>
                            </div>

                            {isAlert && (
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#EF4444', background: '#FEF2F2', padding: '6px 10px', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertTriangle size={14} /> सक्रिय अलर्ट दर्ज है
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '800', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                                <span>{b.voted} / {b.total} वोट पड़े</span>
                                <span style={{ color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    कमांड <ArrowUpRight size={14} />
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ============================================================ */}
            {/* 4. BOOTH COMMAND & ACTION MODAL (CLICKED BOOTH) */}
            {/* ============================================================ */}
            {selectedBoothNumber !== null && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '12px' : '24px', backdropFilter: 'blur(6px)' }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '750px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative'
                    }}>
                        {/* Modal Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', position: 'sticky', top: 0, zIndex: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', fontSize: '18px' }}>
                                    #{selectedBoothNumber}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '950', color: '#0F172A', margin: 0 }}>
                                        {boothDetails?.booth?.name || `बूथ #${selectedBoothNumber}`}
                                    </h3>
                                    <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', margin: '2px 0 0 0' }}>
                                        📍 {boothDetails?.booth?.location || 'विधानसभा क्षेत्र'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedBoothNumber(null); setBoothDetails(null); }}
                                style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {loadingBoothDetails ? (
                                <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
                                    <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 12px auto', color: '#2563EB' }} />
                                    <p style={{ fontWeight: '800' }}>बूथ विवरण व टीम लोड हो रही है...</p>
                                </div>
                            ) : boothDetails ? (
                                <>
                                    {/* Turnout Summary Cards */}
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
                                        <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>मतदान प्रतिशत</div>
                                            <div style={{ fontSize: '24px', fontWeight: '950', color: boothDetails.booth.turnout < 30 ? '#EF4444' : '#16A34A', marginTop: '2px' }}>
                                                {boothDetails.booth.turnout}%
                                            </div>
                                        </div>
                                        <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>कुल मतदाता</div>
                                            <div style={{ fontSize: '24px', fontWeight: '950', color: '#0F172A', marginTop: '2px' }}>
                                                {boothDetails.booth.totalVoters}
                                            </div>
                                        </div>
                                        <div style={{ background: '#F0FDF4', padding: '14px', borderRadius: '14px', border: '1px solid #DCFCE7' }}>
                                            <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: '800', textTransform: 'uppercase' }}>वोट डल चुके</div>
                                            <div style={{ fontSize: '24px', fontWeight: '950', color: '#16A34A', marginTop: '2px' }}>
                                                {boothDetails.booth.votedCount}
                                            </div>
                                        </div>
                                        <div style={{ background: '#FEF2F2', padding: '14px', borderRadius: '14px', border: '1px solid #FEE2E2' }}>
                                            <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: '800', textTransform: 'uppercase' }}>बाकी वोटर्स</div>
                                            <div style={{ fontSize: '24px', fontWeight: '950', color: '#EF4444', marginTop: '2px' }}>
                                                {boothDetails.booth.pendingCount}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions Row */}
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <Link
                                            href={`/voters?booth=${selectedBoothNumber}`}
                                            target="_blank"
                                            style={{
                                                flex: 1,
                                                background: '#EFF6FF',
                                                color: '#2563EB',
                                                border: '1px solid #DBEAFE',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                fontWeight: '800',
                                                fontSize: '13px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            <Users size={16} /> 📋 इस बूथ की मतदाता सूची देखें <ExternalLink size={14} />
                                        </Link>

                                        <button
                                            onClick={() => setShowBoothIncidentForm(!showBoothIncidentForm)}
                                            style={{
                                                background: '#FEF2F2',
                                                color: '#EF4444',
                                                border: '1px solid #FECACA',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                fontWeight: '800',
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <AlertOctagon size={16} /> 🚨 इस बूथ पर शिकायत / अलर्ट दर्ज करें
                                        </button>

                                        <button
                                            onClick={() => handleOpenAlertModal(selectedBoothNumber)}
                                            style={{
                                                background: '#0F172A',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                fontWeight: '800',
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Send size={16} /> 📢 बूथ टीम को निर्देश भेजें
                                        </button>
                                    </div>

                                    {/* Embedded Booth Incident Form */}
                                    {showBoothIncidentForm && (
                                        <form onSubmit={handleReportBoothIncident} style={{ background: '#FFF1F2', padding: '18px', borderRadius: '16px', border: '1px solid #FECDD3', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#9F1239', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <AlertTriangle size={16} /> बूथ #{selectedBoothNumber} पर नई शिकायत / इमरजेंसी अलर्ट दर्ज करें
                                            </div>
                                            <input
                                                placeholder="शिकायत का शीर्षक (जैसे: EVM खराबी, धीमी वोटिंग, सुरक्षा समस्या)..."
                                                value={incidentTitle}
                                                onChange={(e) => setIncidentTitle(e.target.value)}
                                                required
                                                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #FDA4AF', outline: 'none', fontWeight: '700', fontSize: '13px', background: 'white' }}
                                            />
                                            <textarea
                                                placeholder="विवरण (आवश्यकता, स्थान, संपर्क व्यक्ति)..."
                                                value={incidentDesc}
                                                onChange={(e) => setIncidentDesc(e.target.value)}
                                                rows={2}
                                                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #FDA4AF', outline: 'none', fontWeight: '600', fontSize: '13px', background: 'white' }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <select
                                                    value={incidentPriority}
                                                    onChange={(e) => setIncidentPriority(e.target.value)}
                                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #FDA4AF', fontWeight: '800', fontSize: '12px', background: 'white' }}
                                                >
                                                    <option value="Urgent">🔴 अति आवश्यक (Urgent)</option>
                                                    <option value="High">🟠 उच्च प्राथमिकता (High)</option>
                                                    <option value="Medium">🟡 सामान्य (Medium)</option>
                                                </select>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button type="button" onClick={() => setShowBoothIncidentForm(false)} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#E2E8F0', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>रद्द करें</button>
                                                    <button type="submit" disabled={submittingIncident} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#E11D48', color: 'white', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>
                                                        {submittingIncident ? 'दर्ज हो रहा है...' : 'दर्ज करें'}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    )}

                                    {/* BOOTH MANAGER SECTION */}
                                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '18px', padding: '18px', background: '#FAFAFA' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <UserCheck size={16} color="#2563EB" /> बूथ मैनेजर (Booth Incharge)
                                        </div>
                                        {boothDetails.boothManager ? (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                                <div>
                                                    <div style={{ fontSize: '16px', fontWeight: '950', color: '#0F172A' }}>
                                                        {boothDetails.boothManager.name}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
                                                        📞 {boothDetails.boothManager.mobile || 'नंबर उपलब्ध नहीं'}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {boothDetails.boothManager.mobile && (
                                                        <>
                                                            <a
                                                                href={`tel:${boothDetails.boothManager.mobile}`}
                                                                style={{
                                                                    background: '#10B981', color: 'white', padding: '8px 16px',
                                                                    borderRadius: '10px', fontWeight: '800', fontSize: '13px',
                                                                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px'
                                                                }}
                                                            >
                                                                <Phone size={15} /> कॉल करें
                                                            </a>
                                                            <a
                                                                href={`https://wa.me/91${boothDetails.boothManager.mobile}?text=${encodeURIComponent(`नमस्ते ${boothDetails.boothManager.name} जी, मैं वॉर रूम से बात कर रहा हूँ। बूथ #${selectedBoothNumber} पर अभी तक ${boothDetails.booth.turnout}% मतदान हुआ है। कृपया मतदान की गति बढ़ाएँ और कोई समस्या हो तो बताएं।`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    background: '#25D366', color: 'white', padding: '8px 16px',
                                                                    borderRadius: '10px', fontWeight: '800', fontSize: '13px',
                                                                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px'
                                                                }}
                                                            >
                                                                <MessageSquare size={15} /> व्हाट्सएप
                                                            </a>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ color: '#EF4444', fontWeight: '700', fontSize: '13px' }}>
                                                ⚠️ इस बूथ पर कोई बूथ मैनेजर नियुक्त नहीं है।
                                            </div>
                                        )}
                                    </div>

                                    {/* PANNA PRAMUKH TEAM SECTION */}
                                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '18px', padding: '18px', background: 'white' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Users size={16} color="#7C3AED" /> पन्ना प्रमुख टीम ({boothDetails.pannaPramukhs.length})
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>पन्ना-वार वोटिंग स्थिति</span>
                                        </div>

                                        {boothDetails.pannaPramukhs.length === 0 ? (
                                            <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontWeight: '700', fontSize: '13px' }}>
                                                इस बूथ पर अभी तक कोई पन्ना प्रमुख असाइन नहीं है।
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {boothDetails.pannaPramukhs.map((p: any) => {
                                                    const isLowPanna = p.turnout < 30;
                                                    return (
                                                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isLowPanna ? '#FFF7ED' : '#F8FAFC', padding: '12px 16px', borderRadius: '14px', border: isLowPanna ? '1px solid #FFEDD5' : '1px solid #E2E8F0', flexWrap: 'wrap', gap: '10px' }}>
                                                            <div>
                                                                <div style={{ fontSize: '14px', fontWeight: '900', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    {p.name}
                                                                    <span style={{ background: isLowPanna ? '#FEE2E2' : '#DCFCE7', color: isLowPanna ? '#EF4444' : '#16A34A', fontSize: '11px', padding: '2px 8px', borderRadius: '6px', fontWeight: '900' }}>
                                                                        {p.turnout}% वोटिंग
                                                                    </span>
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
                                                                    वोट्स: <strong style={{ color: '#16A34A' }}>{p.votedCount}</strong> / कुल: {p.totalVoters} (बाकी: {p.pendingCount})
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                                {p.mobile && (
                                                                    <>
                                                                        <a
                                                                            href={`tel:${p.mobile}`}
                                                                            style={{ background: '#10B981', color: 'white', padding: '6px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                        >
                                                                            <Phone size={13} /> कॉल
                                                                        </a>
                                                                        <a
                                                                            href={`https://wa.me/91${p.mobile}?text=${encodeURIComponent(`नमस्ते ${p.name} जी, वॉर रूम से सूचना: आपके पन्ने के कुल ${p.totalVoters} वोटर्स में से अभी तक केवल ${p.votedCount} वोट पड़े हैं (${p.turnout}%)। कृपया बाकी ${p.pendingCount} वोटर्स को तुरंत बूथ तक लाएं!`)}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            style={{ background: '#25D366', color: 'white', padding: '6px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                        >
                                                                            <MessageSquare size={13} /> व्हाट्सएप
                                                                        </a>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => handleOpenAlertModal(undefined, p.id)}
                                                                    style={{ background: '#0F172A', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                >
                                                                    <Send size={13} /> निर्देश
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* 5. BROADCAST / DIRECT ALERT MODAL */}
            {/* ============================================================ */}
            {showAlertModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '12px' : '24px', backdropFilter: 'blur(6px)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative' }}>
                        {/* Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Megaphone size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '950', color: '#0F172A', margin: 0 }}>अलर्ट व निर्देश भेजें</h3>
                                    <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', margin: '2px 0 0 0' }}>वॉर रूम से कार्यकर्ताओं तक सीधा संदेश</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAlertModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSendAlert} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            {alertSuccessMsg && (
                                <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircle2 size={18} /> {alertSuccessMsg}
                                </div>
                            )}

                            {/* Target Selection */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
                                    1. किसे भेजना है (Target Audience):
                                </label>
                                <select
                                    value={alertTargetType}
                                    onChange={(e) => setAlertTargetType(e.target.value)}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontWeight: '800', fontSize: '14px', background: 'white' }}
                                >
                                    <option value="ALL">🌐 पूरी विधानसभा टीम (सभी बूथ मैनेजर व पन्ना प्रमुख)</option>
                                    <option value="BOOTH_MANAGERS">👤 केवल सभी बूथ मैनेजर्स (All Booth Managers)</option>
                                    <option value="PANNA_PRAMUKHS">📄 केवल सभी पन्ना प्रमुख (All Panna Pramukhs)</option>
                                    <option value="BOOTH">🎯 विशिष्ट बूथ टीम (Specific Booth Team)</option>
                                    <option value="WORKER">📱 किसी एक विशेष कार्यकर्ता को (Specific Person)</option>
                                </select>
                            </div>

                            {/* If Target is BOOTH */}
                            {alertTargetType === 'BOOTH' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
                                        बूथ चुनें:
                                    </label>
                                    <select
                                        value={alertTargetBooth}
                                        onChange={(e) => setAlertTargetBooth(Number(e.target.value))}
                                        required
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontWeight: '800', fontSize: '14px', background: 'white' }}
                                    >
                                        <option value="">-- बूथ संख्या चुनें --</option>
                                        {data.booths?.map((b: any) => (
                                            <option key={b.id} value={b.number}>बूथ #{b.number} - {b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* If Target is WORKER */}
                            {alertTargetType === 'WORKER' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
                                        कार्यकर्ता चुनें:
                                    </label>
                                    <select
                                        value={alertTargetWorkerId}
                                        onChange={(e) => setAlertTargetWorkerId(Number(e.target.value))}
                                        required
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontWeight: '800', fontSize: '14px', background: 'white' }}
                                    >
                                        <option value="">-- कार्यकर्ता चुनें --</option>
                                        {workersList.map((w: any) => (
                                            <option key={w.id} value={w.id}>
                                                {w.name} ({w.type === 'BOOTH_MANAGER' ? 'बूथ मैनेजर' : (w.type === 'PANNA_PRAMUKH' ? 'पन्ना प्रमुख' : 'कार्यकर्ता')}) - 📞 {w.mobile || w.user?.mobile || 'N/A'} {w.boothNumber ? `(बूथ #${w.boothNumber})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Priority Level */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
                                    2. प्राथमिकता (Priority Level):
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setAlertPriority('Urgent')}
                                        style={{
                                            padding: '10px', borderRadius: '10px',
                                            border: alertPriority === 'Urgent' ? '2px solid #EF4444' : '1px solid #E2E8F0',
                                            background: alertPriority === 'Urgent' ? '#FEF2F2' : 'white',
                                            color: '#EF4444', fontWeight: '900', fontSize: '12px', cursor: 'pointer'
                                        }}
                                    >
                                        🔴 अति आवश्यक (Urgent)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAlertPriority('High')}
                                        style={{
                                            padding: '10px', borderRadius: '10px',
                                            border: alertPriority === 'High' ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                                            background: alertPriority === 'High' ? '#FFFBEB' : 'white',
                                            color: '#D97706', fontWeight: '900', fontSize: '12px', cursor: 'pointer'
                                        }}
                                    >
                                        ⚡ टर्नआउट बढ़ाएँ (High)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAlertPriority('Medium')}
                                        style={{
                                            padding: '10px', borderRadius: '10px',
                                            border: alertPriority === 'Medium' ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                                            background: alertPriority === 'Medium' ? '#EFF6FF' : 'white',
                                            color: '#2563EB', fontWeight: '900', fontSize: '12px', cursor: 'pointer'
                                        }}
                                    >
                                        ℹ️ सामान्य निर्देश (Normal)
                                    </button>
                                </div>
                            </div>

                            {/* Title & Message */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
                                    3. अलर्ट का शीर्षक:
                                </label>
                                <input
                                    placeholder="जैसे: दोपहर 2 बजे तक 50% मतदान का लक्ष्य, धीमी वोटिंग पर तुरंत संज्ञान लें..."
                                    value={alertTitle}
                                    onChange={(e) => setAlertTitle(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
                                    4. संदेश / दिशा-निर्देश:
                                </label>
                                <textarea
                                    placeholder="कार्यकर्ताओं के लिए विस्तृत निर्देश लिखें..."
                                    value={alertMessage}
                                    onChange={(e) => setAlertMessage(e.target.value)}
                                    required
                                    rows={3}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontWeight: '600', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="submit"
                                    disabled={sendingAlert}
                                    style={{
                                        flex: 1,
                                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        fontWeight: '900',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {sendingAlert ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                    {sendingAlert ? 'अलर्ट भेजा जा रहा है...' : 'अलर्ट जारी करें (Send Broadcast)'}
                                </button>

                                {alertTitle && (
                                    <a
                                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`📢 *[वॉर रूम अलर्ट]*\n\n📌 *${alertTitle}*\n${alertMessage}\n\n- वॉर रूम कमांड सेंटर`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            background: '#25D366',
                                            color: 'white',
                                            padding: '14px 18px',
                                            borderRadius: '12px',
                                            fontWeight: '900',
                                            fontSize: '14px',
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                        title="व्हाट्सएप पर शेयर करें"
                                    >
                                        <MessageSquare size={18} /> व्हाट्सएप
                                    </a>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* 6. INCIDENTS DRAWER (ALL ISSUES) */}
            {/* ============================================================ */}
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
                        <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#0F172A', margin: 0 }}>शिकायत व अलर्ट नियंत्रण</h2>
                        <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', margin: '2px 0 0 0' }}>लाइव अलर्ट्स और इतिहास</p>
                    </div>
                    <button onClick={() => setShowDrawer(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px' }}>
                        <X size={24} color="#64748B" />
                    </button>
                </div>

                <div style={{ padding: '0 24px', borderBottom: '1px solid #E2E8F0', display: 'flex' }}>
                    <button onClick={() => setActiveTab('live')} style={{ flex: 1, padding: '16px', borderBottom: `2px solid ${activeTab === 'live' ? '#EF4444' : 'transparent'}`, fontWeight: '800', color: activeTab === 'live' ? '#EF4444' : '#64748B', background: 'none', cursor: 'pointer' }}>
                        सक्रिय अलर्ट ({stats.incidents.length})
                    </button>
                    <button onClick={() => setActiveTab('history')} style={{ flex: 1, padding: '16px', borderBottom: `2px solid ${activeTab === 'history' ? '#10B981' : 'transparent'}`, fontWeight: '800', color: activeTab === 'history' ? '#10B981' : '#64748B', background: 'none', cursor: 'pointer' }}>
                        समाधान इतिहास
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#F8FAFC' }}>
                    {activeTab === 'live' && (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {stats.incidents.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontWeight: '700' }}>कोई सक्रिय अलर्ट नहीं है 🎉</div>}
                            {stats.incidents.map((incident: any) => (
                                <div key={incident.id} style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #FECACA', borderLeft: '4px solid #EF4444' }}>
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                        <div style={{ background: '#FEE2E2', padding: '8px', borderRadius: '50%', height: 'fit-content' }}>
                                            <AlertTriangle size={16} color="#EF4444" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#0F172A' }}>
                                                {incident.title} {incident.boothNumber ? `(बूथ #${incident.boothNumber})` : ''}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                                {incident.description}
                                            </div>
                                            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', display: 'block', marginTop: '6px' }}>
                                                {incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString('hi-IN') : '--:--'} • द्वारा: {incident.reportedBy || 'वॉर रूम'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (confirm('क्या यह समस्या सुलझ गई है?')) {
                                                await updateIssueStatus(incident.id, 'Resolved');
                                                load();
                                            }
                                        }}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#DCFCE7', color: '#16A34A', border: 'none', fontWeight: '800', cursor: 'pointer' }}
                                    >
                                        ✓ समाधान हो गया (Mark Resolved)
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {stats.resolvedIncidents?.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontWeight: '700' }}>कोई हल की गई शिकायत नहीं है</div>}
                            {stats.resolvedIncidents?.map((incident: any) => (
                                <div key={incident.id} style={{ background: 'white', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', borderLeft: '4px solid #10B981' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{incident.title}</div>
                                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{incident.description}</div>
                                    <div style={{ fontSize: '10px', color: '#10B981', fontWeight: '800', marginTop: '6px' }}>✓ हल हो चुका है</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showDrawer && <div onClick={() => setShowDrawer(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 9999 }}></div>}

            {(stats.activeIncidents || 0) > 0 && <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', border: '6px solid #EF4444', pointerEvents: 'none', zIndex: 9990, animation: 'emergency-flash 1.5s infinite' }}></div>}

            <style jsx global>{`
                @keyframes pulse-soft-red {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
                    50% { transform: scale(1.01); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                @keyframes emergency-flash {
                    0% { opacity: 0; }
                    50% { opacity: 0.4; }
                    100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
}
