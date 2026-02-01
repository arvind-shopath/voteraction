/* 🔒 LOCKED BY USER (FINAL CLEAN VERSION - APPROVED) */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import {
    getJansamparkRoutes, createJansamparkRoute, deleteJansamparkRoute, updateJansamparkRoute
} from '@/app/actions/jansampark';
import { getVoters, updateVoterFeedback, updateFamilySupport, createVoter, getFilterOptions } from '@/app/actions/voters';
import {
    Calendar, Clock, Search, User, Loader2, Navigation, CheckCircle,
    Plus, Trash2, Edit2, X, Check, ThumbsUp, ThumbsDown, Minus, Save, ChevronDown, MapPin
} from 'lucide-react';

export default function JansamparkPage() {
    const { effectiveRole, effectiveWorkerType } = useView();

    if (effectiveRole === 'WORKER' && effectiveWorkerType === 'FIELD') {
        return <GroundWorkerView />;
    }

    if (effectiveRole === 'WORKER') {
        return <BoothManagerView />;
    }

    return <AdminCandidateView />;
}

// ==========================================
// 1. ADMIN/CANDIDATE VIEW (Single Page Layout - No Tabs)
// ==========================================
function AdminCandidateView() {
    const { data: session }: any = useSession();
    const assemblyId = session?.user?.assemblyId || 1;

    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCreate, setShowCreate] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [date, setDate] = useState('');
    const [visits, setVisits] = useState<{ village: string, time: string, atmosphere: string }[]>([{ village: '', time: '', atmosphere: 'Neutral' }]);

    useEffect(() => {
        loadData();
    }, [assemblyId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const rData = await getJansamparkRoutes(assemblyId);
            setRoutes(rData);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        try {
            const payload = {
                date: new Date(date),
                assemblyId,
                visits: visits.filter(v => v.village)
            };
            if (editId) {
                await updateJansamparkRoute(editId, payload);
                alert('Route Updated Successfully');
            } else {
                await createJansamparkRoute(payload);
                alert('Route Created Successfully');
            }
            setShowCreate(false); setEditId(null); setDate(''); setVisits([{ village: '', time: '', atmosphere: 'Neutral' }]);
            loadData();
        } catch (e) { alert('Failed to save route'); }
    };

    const handleEdit = (route: any) => {
        setEditId(route.id);
        setDate(new Date(route.date).toISOString().split('T')[0]);
        setVisits(route.visits.map((v: any) => ({
            village: v.village, time: v.time || '', atmosphere: v.atmosphere || 'Neutral'
        })));
        setShowCreate(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this route?')) return;
        try { await deleteJansamparkRoute(id); loadData(); } catch (e) { alert('Failed to delete'); }
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingRoutes = routes.filter(r => new Date(r.date) >= new Date(new Date().setHours(0, 0, 0, 0)));
    const pastRoutes = routes.filter(r => new Date(r.date) < new Date(new Date().setHours(0, 0, 0, 0)));

    return (
        <div style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px' }}>Candidate Management</h1>
                    <p style={{ color: '#6B7280', fontWeight: '500', marginTop: '4px' }}>Manage daily routes and status</p>
                </div>
                {!showCreate && (
                    <button
                        onClick={() => { setEditId(null); setDate(''); setVisits([{ village: '', time: '', atmosphere: 'Neutral' }]); setShowCreate(true); }}
                        style={{ background: '#2563EB', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
                    >
                        <Plus size={20} /> New Route
                    </button>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showCreate && (
                <div style={{ background: 'white', padding: '32px', borderRadius: '24px', marginBottom: '40px', border: '1px solid #E5E7EB', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', color: '#1F2937' }}>{editId ? 'Edit Schedule' : 'Create New Schedule'}</h3>
                    <div style={{ display: 'grid', gap: '24px' }}>
                        <div>
                            <label style={{ fontSize: '14px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #E5E7EB', fontSize: '16px', fontWeight: '600' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '14px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Stops & Atmosphere</label>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {visits.map((v, idx) => (
                                    <VisitRow
                                        key={idx}
                                        visit={v}
                                        onChange={(field: string, val: string) => {
                                            const newVisits = [...visits];
                                            (newVisits as any)[idx][field] = val;
                                            setVisits(newVisits);
                                        }}
                                        onRemove={() => setVisits(visits.filter((_, i) => i !== idx))}
                                        showRemove={visits.length > 1}
                                    />
                                ))}
                            </div>
                            <button onClick={() => setVisits([...visits, { village: '', time: '', atmosphere: 'Neutral' }])} style={{ color: '#2563EB', background: '#EFF6FF', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Plus size={16} /> Add Stop
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', borderTop: '1px solid #F3F4F6', paddingTop: '24px' }}>
                            <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #E5E7EB', background: 'white', fontWeight: '700', color: '#4B5563', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSave} style={{ flex: 2, padding: '14px', borderRadius: '12px', background: '#2563EB', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '16px' }}>{editId ? 'Update Schedule' : 'Save Schedule'}</button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color="#2563EB" /></div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                    {/* Section: Upcoming */}
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1F2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', background: '#2563EB', borderRadius: '50%' }}></span>
                            Upcoming Routes
                        </h2>
                        <div style={{ display: 'grid', gap: '20px' }}>
                            {upcomingRoutes.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', background: '#F9FAFB', borderRadius: '16px', color: '#6B7280' }}>
                                    No upcoming routes scheduled.
                                </div>
                            ) : (
                                upcomingRoutes.map(r => <AdminRouteCard key={r.id} route={r} onDelete={handleDelete} onEdit={handleEdit} />)
                            )}
                        </div>
                    </div>

                    {/* Section: History */}
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1F2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                            <span style={{ width: '8px', height: '8px', background: '#9CA3AF', borderRadius: '50%' }}></span>
                            History
                        </h2>
                        <div style={{ display: 'grid', gap: '20px', opacity: 0.8 }}>
                            {pastRoutes.map(r => <AdminRouteCard key={r.id} route={r} onDelete={handleDelete} onEdit={handleEdit} />)}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

function VisitRow({ visit, onChange, onRemove, showRemove }: any) {
    const options = [
        { label: 'Positive', color: '#22C55E' }, // Green
        { label: 'Neutral', color: '#EAB308' },  // Yellow
        { label: 'Negative', color: '#EF4444' }  // Red
    ];

    return (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#F9FAFB', padding: '16px', borderRadius: '16px', border: '1px solid #F3F4F6' }}>
            <div style={{ flex: 1 }}>
                <input
                    placeholder="Village Name"
                    value={visit.village}
                    onChange={e => onChange('village', e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #D1D5DB', fontWeight: '600' }}
                />
            </div>
            <div style={{ width: '120px' }}>
                <input
                    placeholder="Time"
                    value={visit.time}
                    onChange={e => onChange('time', e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #D1D5DB' }}
                />
            </div>

            {/* Color Swatches */}
            <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '6px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                {options.map(opt => (
                    <button
                        key={opt.label}
                        onClick={() => onChange('atmosphere', opt.label)}
                        title={opt.label}
                        style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: opt.color,
                            border: visit.atmosphere === opt.label ? '3px solid #111827' : '3px solid transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        {visit.atmosphere === opt.label && <Check size={16} color="white" strokeWidth={4} />}
                    </button>
                ))}
            </div>

            {showRemove && (
                <button onClick={onRemove} style={{ padding: '8px', color: '#9CA3AF', cursor: 'pointer', border: 'none', background: 'none', marginLeft: '8px' }}>
                    <X size={20} />
                </button>
            )}
        </div>
    );
}

function AdminRouteCard({ route, onDelete, onEdit }: any) {
    const isToday = new Date(route.date).toDateString() === new Date().toDateString();

    return (
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '24px', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: isToday ? '#DCFCE7' : '#F3F4F6', padding: '10px', borderRadius: '12px' }}>
                        <Calendar size={24} color={isToday ? '#166534' : '#6B7280'} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>{new Date(route.date).toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                        {isToday && <span style={{ color: '#166534', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Schedule</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => onEdit(route)} style={{ padding: '10px', color: '#2563EB', background: '#EFF6FF', borderRadius: '10px', border: 'none', cursor: 'pointer' }}><Edit2 size={18} /></button>
                    <button onClick={() => onDelete(route.id)} style={{ padding: '10px', color: '#EF4444', background: '#FEF2F2', borderRadius: '10px', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {route.visits.map((v: any, i: number) => {
                    const colors = v.atmosphere === 'Positive' ? { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' }
                        : v.atmosphere === 'Negative' ? { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' }
                            : { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' }; // Neutral default
                    return (
                        <div key={i} style={{
                            background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                            padding: '10px 16px', borderRadius: '12px', fontSize: '15px', fontWeight: '700',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            {v.village}
                            {v.time && <span style={{ opacity: 0.8, fontSize: '13px', fontWeight: '500' }}>• {v.time}</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ==========================================
// 2. BOOTH MANAGER VIEW (MODIFIED)
// ==========================================
function BoothManagerView() {
    const { data: session }: any = useSession();
    const assemblyId = session?.user?.assemblyId || 1;

    // Remove tab state, keep separate section data
    const [routes, setRoutes] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [voters, setVoters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    // Add Voter Modal State
    const [showAddVoter, setShowAddVoter] = useState(false);
    const [newVoter, setNewVoter] = useState({
        name: '', relativeName: '', age: '', gender: 'M', mobile: '', village: '', houseNumber: '', boothNumber: '', address: ''
    });

    useEffect(() => {
        const fetchR = async () => {
            setLoading(true);
            try {
                const data = await getJansamparkRoutes(assemblyId);
                setRoutes(data);
                // Try to get booth info for new voter default
                import('@/app/actions/dashboard').then(m => m.getBoothDashboardStats((session?.user as any).id)).then(res => {
                    if (res?.booth?.number) {
                        setNewVoter(prev => ({ ...prev, boothNumber: res.booth.number }));
                    }
                });
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchR();
    }, [assemblyId]);

    const performSearch = useCallback(async (term: string) => {
        if (!term) { setVoters([]); return; }
        setSearchLoading(true);
        try {
            const res = await getVoters({ search: term, assemblyId, pageSize: 20 });
            setVoters(res.voters);
        } catch (e) { console.error(e); } finally { setSearchLoading(false); }
    }, [assemblyId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, performSearch]);

    const handleAddVoter = async () => {
        if (!newVoter.name || !newVoter.village) return alert('Name and Village are required');
        try {
            await createVoter({
                ...newVoter,
                age: parseInt(newVoter.age) || 0,
                assemblyId
            });
            alert('Voter Added Successfully');
            setShowAddVoter(false);
            setNewVoter({ name: '', relativeName: '', age: '', gender: 'M', mobile: '', village: '', houseNumber: '', boothNumber: newVoter.boothNumber, address: '' });
            // Refresh list if search matches
            if (searchTerm) performSearch(searchTerm);
        } catch (e) {
            alert('Failed to add voter');
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRoutes = routes.filter(r => new Date(r.date).toISOString().split('T')[0] === todayStr);
    const upcomingRoutes = routes.filter(r => new Date(r.date) > new Date() && new Date(r.date).toISOString().split('T')[0] !== todayStr);
    const historyRoutes = routes.filter(r => new Date(r.date) < new Date() && new Date(r.date).toISOString().split('T')[0] !== todayStr);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '80px', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#111827', marginBottom: '8px' }}>जनसंपर्क (Public Relations)</h1>
            </div>

            <div style={{ display: 'grid', gap: '40px' }}>

                {/* SECTION 1: CANDIDATE TOURS */}
                <section>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Navigation size={20} color="#2563EB" /> कैंडिडेट के दौरे
                    </h2>

                    <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '16px', border: '1px solid #DBEAFE' }}>
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[...todayRoutes, ...upcomingRoutes].length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8' }}>कोई आगामी दौरा नहीं है</div>}
                                {[...todayRoutes, ...upcomingRoutes].slice(0, 3).map(r => (
                                    <div key={r.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                                        <div style={{ fontWeight: '800', color: '#1E293B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Calendar size={14} /> {new Date(r.date).toLocaleDateString()}
                                            {new Date(r.date).toDateString() === new Date().toDateString() && <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>TODAY</span>}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {r.visits.map((v: any, i: number) => {
                                                const bg = v.atmosphere === 'Positive' ? '#DCFCE7' : v.atmosphere === 'Negative' ? '#FEE2E2' : '#FEF3C7';
                                                const color = v.atmosphere === 'Positive' ? '#166534' : v.atmosphere === 'Negative' ? '#991B1B' : '#92400E';
                                                return (
                                                    <span key={i} style={{ background: bg, color: color, padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                                                        {v.village}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* SECTION 2: MY BOOTH CONTACT (SEARCH & ADD) */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={20} color="#10B981" /> मेरा बूथ संपर्क (My Booth)
                        </h2>
                        <button
                            onClick={() => setShowAddVoter(true)}
                            style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Plus size={16} /> Add Voter
                        </button>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                        <Search size={20} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '16px' }} />
                        <input
                            placeholder="voter name, father name or mobile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '2px solid #E2E8F0', fontSize: '16px', fontWeight: '600' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gap: '16px' }}>
                        {voters.length === 0 && searchTerm.length > 2 && (
                            <div style={{ textAlign: 'center', padding: '40px', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
                                <p style={{ color: '#64748B', fontWeight: '600', marginBottom: '12px' }}>कोई मतदाता नहीं मिला</p>
                                <button onClick={() => setShowAddVoter(true)} style={{ color: '#2563EB', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                                    + नया मतदाता जोड़ें (Add New)
                                </button>
                            </div>
                        )}
                        {voters.map(v => <VoterCard key={v.id} voter={v} assemblyId={assemblyId} refresh={() => performSearch(searchTerm)} />)}
                    </div>
                </section>
            </div>

            {/* ADD VOTER MODAL */}
            {showAddVoter && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Add New Voter</h3>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <input value={newVoter.name} onChange={e => setNewVoter({ ...newVoter, name: e.target.value })} placeholder="Voter Name *" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
                            <input value={newVoter.relativeName} onChange={e => setNewVoter({ ...newVoter, relativeName: e.target.value })} placeholder="Father/Husband Name" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input value={newVoter.age} onChange={e => setNewVoter({ ...newVoter, age: e.target.value })} placeholder="Age" type="number" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
                                <select value={newVoter.gender} onChange={e => setNewVoter({ ...newVoter, gender: e.target.value })} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </div>
                            <input value={newVoter.mobile} onChange={e => setNewVoter({ ...newVoter, mobile: e.target.value })} placeholder="Mobile Number" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
                            <input value={newVoter.village} onChange={e => setNewVoter({ ...newVoter, village: e.target.value })} placeholder="Village/Area *" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />

                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button onClick={() => setShowAddVoter(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#F1F5F9', fontWeight: '700' }}>Cancel</button>
                                <button onClick={handleAddVoter} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#2563EB', color: 'white', fontWeight: '700' }}>Save Voter</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function VoterCard({ voter, assemblyId, refresh }: { voter: any, assemblyId: number, refresh: () => void }) {
    const [note, setNote] = useState(voter.notes || '');
    const [isFamilyMode, setIsFamilyMode] = useState(false);

    const handleUpdate = async (status: string) => {
        try {
            if (isFamilyMode && voter.houseNumber && voter.village) {
                await updateFamilySupport({ houseNumber: voter.houseNumber, village: voter.village, assemblyId, supportStatus: status });
                alert('Family Updated');
            } else {
                await updateVoterFeedback(voter.id, { supportStatus: status });
            }
            refresh();
        } catch (e) { alert('Error'); }
    };

    const saveNote = async () => {
        try { await updateVoterFeedback(voter.id, { notes: note }); alert('Note Saved'); } catch (e) { alert('Error'); }
    };

    const StatusBtn = ({ s, label, icon: Icon, color }: any) => {
        const active = voter.supportStatus === s;
        return (
            <button onClick={() => handleUpdate(s)} style={{ padding: '10px', borderRadius: '12px', border: active ? `2px solid ${color}` : '1px solid #E2E8F0', background: active ? `${color}20` : 'white', color: active ? color : '#64748B', cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <Icon size={18} /> <span style={{ fontSize: '12px', fontWeight: '700' }}>{label}</span>
            </button>
        )
    };

    return (
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontWeight: '800', marginBottom: '4px' }}>{voter.name}</div>
            <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>{voter.relativeName} • Booth {voter.boothNumber}</div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <StatusBtn s="Support" label="Support" icon={ThumbsUp} color="#166534" />
                <StatusBtn s="Neutral" label="Neutral" icon={Minus} color="#B45309" />
                <StatusBtn s="Against" label="Against" icon={ThumbsDown} color="#B91C1C" />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note..." style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', height: '40px' }} />
                {note !== (voter.notes || '') && <button onClick={saveNote} style={{ padding: '8px 12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px' }}>Save</button>}
            </div>

            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={isFamilyMode} onChange={e => setIsFamilyMode(e.target.checked)} id={`fam-${voter.id}`} />
                <label htmlFor={`fam-${voter.id}`} style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Update Full Family</label>
            </div>
        </div>
    );
}

/**
 * 3. GROUND WORKER VIEW (Specific for FIELD worker)
 * - Identical Dashboard to Candidate (handled in parent)
 * - Booth Selection + Voter Search in JAN SAMPARK
 */
function GroundWorkerView() {
    const { data: session }: any = useSession();
    const assemblyId = session?.user?.assemblyId || 1;

    const [routes, setRoutes] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBooth, setSelectedBooth] = useState('');
    const [booths, setBooths] = useState<any[]>([]);
    const [voters, setVoters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    // Add Voter Modal State
    const [showAddVoter, setShowAddVoter] = useState(false);
    const [newVoter, setNewVoter] = useState({
        name: '', relativeName: '', age: '', gender: 'M', mobile: '', village: '', houseNumber: '', boothNumber: '', address: ''
    });

    useEffect(() => {
        async function init() {
            setLoading(true);
            try {
                const rData = await getJansamparkRoutes(assemblyId);
                setRoutes(rData);
                const options = await getFilterOptions();
                setBooths(options.booths || []);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        }
        init();
    }, [assemblyId]);

    const performSearch = useCallback(async (term: string, booth: string) => {
        if (!term && !booth) { setVoters([]); return; }
        setSearchLoading(true);
        try {
            const res = await getVoters({ 
                search: term, 
                booth: booth || undefined,
                assemblyId, 
                pageSize: 20 
            });
            setVoters(res.voters);
        } catch (e) { console.error(e); } finally { setSearchLoading(false); }
    }, [assemblyId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(searchTerm, selectedBooth);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedBooth, performSearch]);

    const handleAddVoter = async () => {
        if (!newVoter.name || !newVoter.village) return alert('Name and Village are required');
        try {
            await createVoter({
                ...newVoter,
                age: parseInt(newVoter.age) || 0,
                assemblyId
            });
            alert('Voter Added Successfully');
            setShowAddVoter(false);
            setNewVoter({ name: '', relativeName: '', age: '', gender: 'M', mobile: '', village: '', houseNumber: '', boothNumber: selectedBooth, address: '' });
            performSearch(searchTerm, selectedBooth);
        } catch (e) { alert('Failed to add voter'); }
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRoutes = routes.filter(r => new Date(r.date).toISOString().split('T')[0] === todayStr);
    const upcomingRoutes = routes.filter(r => new Date(r.date) > new Date() && new Date(r.date).toISOString().split('T')[0] !== todayStr);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '80px', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#111827', marginBottom: '8px' }}>ग्राउंड वर्कर जनसंपर्क (PR Entry)</h1>
                <p style={{ color: '#64748B', fontWeight: '500' }}>बूथ सेलेक्ट करें और मतदाताओं से मुलाकात अपडेट करें</p>
            </div>

            <div style={{ display: 'grid', gap: '40px' }}>
                
                {/* SECTION: BOOTH SELECTION */}
                <section style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '2px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>बूथ का चयन करें (Select Booth)</label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    value={selectedBooth} 
                                    onChange={(e) => {
                                        setSelectedBooth(e.target.value);
                                        setNewVoter(prev => ({ ...prev, boothNumber: e.target.value }));
                                    }}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #CBD5E1', fontSize: '16px', fontWeight: '700', appearance: 'none', background: 'white' }}
                                >
                                    <option value="">-- बूथ सुनें (Choose Booth) --</option>
                                    {booths.map(b => (
                                        <option key={b.number} value={b.number}>बूथ नं: {b.number} - {b.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={20} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowAddVoter(true)}
                            style={{ background: '#10B981', color: 'white', padding: '14px 24px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Plus size={20} /> नया मतदाता जोड़ें
                        </button>
                    </div>
                </section>

                {/* SECTION: VOTER SEARCH & INTERACTION */}
                <section>
                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                        <Search size={24} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '16px' }} />
                        <input
                            placeholder="मतदाता का नाम या मोबाइल..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: '2px solid #E2E8F0', fontSize: '18px', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                        />
                        {searchLoading && <Loader2 className="animate-spin" style={{ position: 'absolute', right: '16px', top: '16px' }} color="#2563EB" />}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {voters.length === 0 && (searchTerm || selectedBooth) && !searchLoading && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: '#F8FAFC', borderRadius: '24px', border: '2px dashed #E2E8F0' }}>
                                <p style={{ color: '#64748B', fontWeight: '600' }}>कोई मतदाता नहीं मिला। कृपया सर्च बदलें या बूथ चुनें।</p>
                            </div>
                        )}
                        {voters.map(v => (
                            <VoterCard key={v.id} voter={v} assemblyId={assemblyId} refresh={() => performSearch(searchTerm, selectedBooth)} />
                        ))}
                    </div>
                </section>

                {/* SECTION: CANDIDATE TOURS (Same snippet) */}
                <section>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Navigation size={20} color="#2563EB" /> कैंडिडेट के आगामी दौरे
                    </h2>
                    <div style={{ background: '#EEF2FF', padding: '20px', borderRadius: '20px', border: '1px solid #E0E7FF' }}>
                        {[...todayRoutes, ...upcomingRoutes].length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#6366F1', fontWeight: '600' }}>अभी कोई आगामी दौरा शेड्यूल नहीं है।</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[...todayRoutes, ...upcomingRoutes].slice(0, 3).map(r => (
                                    <div key={r.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '15px' }}>{new Date(r.date).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' })}</div>
                                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                                {r.visits.map((v: any, i: number) => (
                                                    <span key={i} style={{ background: '#F3F4F6', color: '#4B5563', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>{v.village}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {new Date(r.date).toDateString() === new Date().toDateString() && <span style={{ background: '#DCFCE7', color: '#166534', fontWeight: '800', fontSize: '10px', padding: '4px 8px', borderRadius: '6px' }}>आज (TODAY)</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* ADD VOTER MODAL (Same as BoothManager but tailored) */}
            {showAddVoter && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>नया मतदाता जोड़ें</h3>
                            <button onClick={() => setShowAddVoter(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={24} /></button>
                        </div>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', marginBottom: '6px', display: 'block' }}>बूथ नंबर</label>
                                    <input value={newVoter.boothNumber} onChange={e => setNewVoter({ ...newVoter, boothNumber: e.target.value })} placeholder="Booth No" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontWeight: '700' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', marginBottom: '6px', display: 'block' }}>गांव/क्षेत्र</label>
                                    <input value={newVoter.village} onChange={e => setNewVoter({ ...newVoter, village: e.target.value })} placeholder="Village *" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
                                </div>
                            </div>
                            <input value={newVoter.name} onChange={e => setNewVoter({ ...newVoter, name: e.target.value })} placeholder="मतदाता का नाम *" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
                            <input value={newVoter.relativeName} onChange={e => setNewVoter({ ...newVoter, relativeName: e.target.value })} placeholder="पिता/पति का नाम" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input value={newVoter.age} onChange={e => setNewVoter({ ...newVoter, age: e.target.value })} placeholder="आयु" type="number" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
                                <select value={newVoter.gender} onChange={e => setNewVoter({ ...newVoter, gender: e.target.value })} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                                    <option value="M">पुरुष</option>
                                    <option value="F">महिला</option>
                                </select>
                            </div>
                            <input value={newVoter.mobile} onChange={e => setNewVoter({ ...newVoter, mobile: e.target.value })} placeholder="मोबाइल नंबर" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
                            
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button onClick={() => setShowAddVoter(false)} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: '#F1F5F9', fontWeight: '800', color: '#475569', border: 'none', cursor: 'pointer' }}>कैंसिल</button>
                                <button onClick={handleAddVoter} style={{ flex: 2, padding: '14px', borderRadius: '14px', background: '#2563EB', color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)' }}>सेव मतदाता</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

