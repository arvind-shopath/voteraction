'use client';

import React, { useState, useEffect } from 'react';
import { getEvents, createEvent, updateEvent, recordEventAttendance, deleteEvent } from '@/app/actions/events';
import { 
    Calendar, List, Plus, Search, Filter, MapPin, Clock, Users, 
    CheckCircle2, AlertCircle, Phone, ArrowUpRight, X, Loader2, 
    Share2, UserCheck, Flame, Tag, Check, Sparkles, Navigation
} from 'lucide-react';

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    // Filters
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState<any>(null);
    const [showDetailsModal, setShowDetailsModal] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    // Create Form State
    const [form, setForm] = useState({
        title: '',
        type: 'Public_Meeting',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '12:00',
        location: '',
        address: '',
        responsibleName: '',
        responsibleMobile: '',
        expectedAttendance: 100,
        priority: 'Medium',
        description: '',
        notes: ''
    });

    // Attendance Form State
    const [actualCount, setActualCount] = useState<number>(0);
    const [attendanceNotes, setAttendanceNotes] = useState('');

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await getEvents({
                search,
                type: typeFilter,
                status: statusFilter
            });
            setEvents(data.events);
            setStats(data.stats);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [typeFilter, statusFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchEvents();
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await createEvent({
                ...form,
                expectedAttendance: Number(form.expectedAttendance) || 0
            });
            if (res.success) {
                setShowCreateModal(false);
                setForm({
                    title: '',
                    type: 'Public_Meeting',
                    date: new Date().toISOString().split('T')[0],
                    startTime: '10:00',
                    endTime: '12:00',
                    location: '',
                    address: '',
                    responsibleName: '',
                    responsibleMobile: '',
                    expectedAttendance: 100,
                    priority: 'Medium',
                    description: '',
                    notes: ''
                });
                fetchEvents();
            }
        } catch (err) {
            alert('इवेंट बनाने में त्रुटि हुई');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRecordAttendance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showAttendanceModal) return;
        setSubmitting(true);
        try {
            const res = await recordEventAttendance(showAttendanceModal.id, {
                actualAttendance: Number(actualCount) || 0,
                notes: attendanceNotes
            });
            if (res.success) {
                setShowAttendanceModal(null);
                setActualCount(0);
                setAttendanceNotes('');
                fetchEvents();
            }
        } catch (err) {
            alert('उपस्थिति दर्ज करने में त्रुटि हुई');
        } finally {
            setSubmitting(false);
        }
    };

    const typeLabels: Record<string, { label: string, color: string, bg: string }> = {
        'Public_Meeting': { label: 'जनसभा / रैली', color: '#1D4ED8', bg: '#EFF6FF' },
        'Door_To_Door': { label: 'डोर-टू-डोर ड्राइव', color: '#047857', bg: '#ECFDF5' },
        'Worker_Meeting': { label: 'कार्यकर्ता बैठक', color: '#7C3AED', bg: '#F5F3FF' },
        'Nukkad_Sabha': { label: 'नुक्कड़ सभा', color: '#B45309', bg: '#FFFBEB' },
        'Training': { label: 'प्रशिक्षण सत्र', color: '#0F766E', bg: '#F0FDFA' },
        'Other': { label: 'अन्य गतिविधि', color: '#475569', bg: '#F8FAFC' }
    };

    const statusLabels: Record<string, { label: string, color: string, bg: string }> = {
        'Scheduled': { label: 'तयशुदा (Scheduled)', color: '#2563EB', bg: '#DBEAFE' },
        'Upcoming': { label: 'आगामी (Upcoming)', color: '#0284C7', bg: '#E0F2FE' },
        'Ongoing': { label: 'प्रगति पर (Ongoing)', color: '#D97706', bg: '#FEF3C7' },
        'Completed': { label: 'संपन्न (Completed)', color: '#16A34A', bg: '#DCFCE7' },
        'Cancelled': { label: 'रद्द (Cancelled)', color: '#DC2626', bg: '#FEE2E2' },
        'Postponed': { label: 'स्थगित (Postponed)', color: '#64748B', bg: '#F1F5F9' }
    };

    return (
        <div style={{ padding: isMobile ? '12px 8px 40px 8px' : '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={isMobile ? 22 : 28} color="#2563EB" /> कैंपेन इवेंट्स व सभा प्रबंधन
                    </h1>
                    <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                        जनसभाएं, कार्यकर्ता बैठकें, नुक्कड़ सभाएं और वास्तविक उपस्थिति ट्रैकिंग
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ background: '#F1F5F9', padding: '4px', borderRadius: '12px', display: 'flex' }}>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '6px 12px', borderRadius: '8px', border: 'none',
                                background: viewMode === 'list' ? 'white' : 'transparent',
                                color: viewMode === 'list' ? '#2563EB' : '#64748B',
                                fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            <List size={16} /> लिस्ट
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            style={{
                                padding: '6px 12px', borderRadius: '8px', border: 'none',
                                background: viewMode === 'calendar' ? 'white' : 'transparent',
                                color: viewMode === 'calendar' ? '#2563EB' : '#64748B',
                                fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                boxShadow: viewMode === 'calendar' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            <Calendar size={16} /> कैलेंडर
                        </button>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                        }}
                    >
                        <Plus size={16} /> नया इवेंट जोड़ें
                    </button>
                </div>
            </div>

            {/* Quick Stats Row */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '16px', marginBottom: '20px' }}>
                    <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>कुल इवेंट्स</div>
                        <div style={{ fontSize: '24px', fontWeight: 950, color: '#0F172A', marginTop: '2px' }}>{stats.total}</div>
                        <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700, marginTop: '4px' }}>📅 सभी शेड्यूल</div>
                    </div>

                    <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>आगामी कार्यक्रम</div>
                        <div style={{ fontSize: '24px', fontWeight: 950, color: '#0284C7', marginTop: '2px' }}>{stats.upcoming}</div>
                        <div style={{ fontSize: '11px', color: '#0284C7', fontWeight: 700, marginTop: '4px' }}>⏳ तैयारी में</div>
                    </div>

                    <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>संपन्न कार्यक्रम</div>
                        <div style={{ fontSize: '24px', fontWeight: 950, color: '#16A34A', marginTop: '2px' }}>{stats.completed}</div>
                        <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700, marginTop: '4px' }}>✅ सफलतापूर्वक संपन्न</div>
                    </div>

                    <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>अपेक्षित vs वास्तविक उपस्थिति</div>
                        <div style={{ fontSize: '20px', fontWeight: 950, color: '#8B5CF6', marginTop: '4px' }}>
                            {stats.totalActualAttendance} <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 700 }}>/ {stats.totalExpectedAttendance}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: 700, marginTop: '4px' }}>👥 जनभागीदारी</div>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div style={{ background: 'white', padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '220px', display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px' }} />
                        <input
                            type="text"
                            placeholder="इवेंट नाम, स्थान या जिम्मेदार व्यक्ति से खोजें..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '9px 12px 9px 36px',
                                borderRadius: '10px',
                                border: '1px solid #CBD5E1',
                                fontSize: '13px',
                                fontWeight: 600,
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button type="submit" style={{ background: '#0F172A', color: 'white', padding: '9px 14px', borderRadius: '10px', border: 'none', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                        खोजें
                    </button>
                </form>

                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, background: 'white', outline: 'none' }}
                >
                    <option value="ALL">सभी प्रकार (All Types)</option>
                    <option value="Public_Meeting">जनसभा / रैली</option>
                    <option value="Door_To_Door">डोर-टू-डोर ड्राइव</option>
                    <option value="Worker_Meeting">कार्यकर्ता बैठक</option>
                    <option value="Nukkad_Sabha">नुक्कड़ सभा</option>
                    <option value="Training">प्रशिक्षण सत्र</option>
                    <option value="Other">अन्य</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, background: 'white', outline: 'none' }}
                >
                    <option value="ALL">सभी स्टेटस (All Status)</option>
                    <option value="Scheduled">तयशुदा (Scheduled)</option>
                    <option value="Upcoming">आगामी (Upcoming)</option>
                    <option value="Ongoing">प्रगति पर (Ongoing)</option>
                    <option value="Completed">संपन्न (Completed)</option>
                    <option value="Cancelled">रद्द (Cancelled)</option>
                </select>
            </div>

            {/* Content View */}
            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
                    <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 12px auto', color: '#2563EB' }} />
                    <p style={{ fontWeight: 800 }}>इवेंट्स लोड हो रहे हैं...</p>
                </div>
            ) : events.length === 0 ? (
                <div style={{ background: 'white', padding: '40px 20px', borderRadius: '20px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <Calendar size={48} color="#94A3B8" style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>कोई इवेंट नहीं मिला</h3>
                    <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>इस फ़िल्टर या खोज के अंतर्गत कोई कार्यक्रम दर्ज नहीं है।</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{ background: '#2563EB', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                    >
                        + नया इवेंट प्लान करें
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                    {events.map((e) => {
                        const typeInfo = typeLabels[e.type] || typeLabels['Other'];
                        const statusInfo = statusLabels[e.status] || statusLabels['Scheduled'];
                        const eventDate = new Date(e.date).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });

                        return (
                            <div
                                key={e.id}
                                style={{
                                    background: 'white',
                                    borderRadius: '20px',
                                    padding: '20px',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    position: 'relative'
                                }}
                            >
                                <div>
                                    {/* Top Row: Date & Priority */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', background: typeInfo.bg, color: typeInfo.color }}>
                                            {typeInfo.label}
                                        </span>
                                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: statusInfo.bg, color: statusInfo.color }}>
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    {/* Event Title */}
                                    <h3 style={{ fontSize: '17px', fontWeight: 950, color: '#0F172A', marginBottom: '8px', lineHeight: 1.3 }}>
                                        {e.title}
                                    </h3>

                                    {/* Location & Time */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#475569', fontWeight: 700, marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={14} color="#2563EB" />
                                            <span>{eventDate} {e.startTime ? `(${e.startTime} - ${e.endTime || 'समाप्ति'})` : ''}</span>
                                        </div>
                                        {e.location && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MapPin size={14} color="#DC2626" />
                                                <span>{e.location} {e.address ? `• ${e.address}` : ''}</span>
                                            </div>
                                        )}
                                        {e.responsibleName && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <UserCheck size={14} color="#16A34A" />
                                                <span>प्रभारी: {e.responsibleName} {e.responsibleMobile ? `(${e.responsibleMobile})` : ''}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Attendance / Target Banner */}
                                    <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '12px', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 800 }}>अपेक्षित उपस्थिति</div>
                                            <div style={{ fontSize: '15px', fontWeight: 950, color: '#0F172A' }}>{e.expectedAttendance || 0} लोग</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '10px', color: '#16A34A', fontWeight: 800 }}>वास्तविक उपस्थिति</div>
                                            <div style={{ fontSize: '15px', fontWeight: 950, color: e.actualAttendance > 0 ? '#16A34A' : '#94A3B8' }}>
                                                {e.actualAttendance > 0 ? `${e.actualAttendance} उपस्थित` : 'लॉग बाकी'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                                    <button
                                        onClick={() => {
                                            setShowAttendanceModal(e);
                                            setActualCount(e.actualAttendance || e.expectedAttendance || 0);
                                            setAttendanceNotes(e.notes || '');
                                        }}
                                        style={{
                                            flex: 1,
                                            background: '#ECFDF5',
                                            color: '#059669',
                                            border: '1px solid #A7F3D0',
                                            padding: '8px 12px',
                                            borderRadius: '10px',
                                            fontWeight: 800,
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <CheckCircle2 size={15} /> उपस्थिति दर्ज करें
                                    </button>

                                    {e.responsibleMobile && (
                                        <a
                                            href={`tel:${e.responsibleMobile}`}
                                            style={{
                                                background: '#EFF6FF',
                                                color: '#2563EB',
                                                border: '1px solid #BFDBFE',
                                                padding: '8px 12px',
                                                borderRadius: '10px',
                                                textDecoration: 'none',
                                                fontWeight: 800,
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Phone size={15} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Event Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '10px' : '20px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: isMobile ? '20px' : '28px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 950, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Plus size={20} color="#2563EB" /> नया कैंपेन इवेंट शेड्यूल करें
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748B' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>इवेंट का नाम (शीर्षक) *</label>
                                <input
                                    type="text"
                                    placeholder="जैसे: वार्ड 12 जनसभा, बूथ 45 कार्यकर्ता बैठक..."
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>इवेंट का प्रकार</label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, background: 'white' }}
                                    >
                                        <option value="Public_Meeting">जनसभा / रैली</option>
                                        <option value="Door_To_Door">डोर-टू-डोर ड्राइव</option>
                                        <option value="Worker_Meeting">कार्यकर्ता बैठक</option>
                                        <option value="Nukkad_Sabha">नुक्कड़ सभा</option>
                                        <option value="Training">प्रशिक्षण सत्र</option>
                                        <option value="Other">अन्य</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>प्राथमिकता (Priority)</label>
                                    <select
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, background: 'white' }}
                                    >
                                        <option value="High">🔴 उच्च (High)</option>
                                        <option value="Medium">🟡 सामान्य (Medium)</option>
                                        <option value="Low">🟢 कम (Low)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>दिनांक *</label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>शुरू समय</label>
                                    <input
                                        type="time"
                                        value={form.startTime}
                                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>समाप्ति समय</label>
                                    <input
                                        type="time"
                                        value={form.endTime}
                                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>स्थान / वेन्यू</label>
                                    <input
                                        type="text"
                                        placeholder="जैसे: शिव मंदिर प्रांगण, पंचायत भवन..."
                                        value={form.location}
                                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>अपेक्षित उपस्थिति (लोग)</label>
                                    <input
                                        type="number"
                                        placeholder="100"
                                        value={form.expectedAttendance}
                                        onChange={(e) => setForm({ ...form, expectedAttendance: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>जिम्मेदार प्रभारी का नाम</label>
                                    <input
                                        type="text"
                                        placeholder="नाम"
                                        value={form.responsibleName}
                                        onChange={(e) => setForm({ ...form, responsibleName: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>प्रभारी मोबाइल नंबर</label>
                                    <input
                                        type="tel"
                                        placeholder="10 अंकों का मोबाइल नंबर"
                                        value={form.responsibleMobile}
                                        onChange={(e) => setForm({ ...form, responsibleMobile: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>विवरण / नोट्स</label>
                                <textarea
                                    rows={2}
                                    placeholder="इवेंट के मुख्य बिंदु, व्यवस्थाएं आदि..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 600 }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#F1F5F9', color: '#475569', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                                >
                                    रद्द करें
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#2563EB', color: 'white', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}
                                >
                                    {submitting ? 'शेड्यूल हो रहा है...' : 'इवेंट शेड्यूल करें'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attendance Record Modal */}
            {showAttendanceModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 950, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle2 size={20} color="#16A34A" /> वास्तविक उपस्थिति दर्ज करें
                            </h3>
                            <button onClick={() => setShowAttendanceModal(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, marginBottom: '16px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px' }}>
                            इवेंट: <strong style={{ color: '#0F172A' }}>{showAttendanceModal.title}</strong>
                        </div>

                        <form onSubmit={handleRecordAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>वास्तविक उपस्थिति संख्या (Actual Attendance) *</label>
                                <input
                                    type="number"
                                    value={actualCount}
                                    onChange={(e) => setActualCount(parseInt(e.target.value) || 0)}
                                    required
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '16px', fontWeight: 900, outline: 'none' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>इवेंट नोट्स व फीडबैक</label>
                                <textarea
                                    rows={3}
                                    placeholder="सफलतापूर्वक संपन्न, प्रमुख वक्ताओं के नाम, जनता का माहौल..."
                                    value={attendanceNotes}
                                    onChange={(e) => setAttendanceNotes(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 600 }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAttendanceModal(null)}
                                    style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#F1F5F9', color: '#475569', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                                >
                                    रद्द करें
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#16A34A', color: 'white', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}
                                >
                                    {submitting ? 'सेव हो रहा है...' : 'उपस्थिति सुरक्षित करें'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
