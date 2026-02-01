'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    getWorkersInAssembly,
    createWorker,
    assignVotersToWorker,
    getWorkerAssignedVoters,
    bulkTransferVoters,
    updateWorker,
    updateWorkerPassword,
    autoAssignVotersByCount
} from '@/app/actions/worker';
import { getBoothsWithAssignment, getBoothCoverageStats } from '@/app/actions/booth';
import { getUnassignedVoters, updateVoterFeedback } from '@/app/actions/voters';
import { getAssemblyInfo, updateElectionDate } from '@/app/actions/admin';
import {
    UserPlus, Plus, Phone, Users, Share2, X, ShieldCheck,
    LayoutList, Filter, Search, CheckCircle, ChevronRight,
    Home, UserCheck, AlertCircle, Calendar, RefreshCcw,
    TrendingUp, Zap, Map as MapIcon, Edit2, Lock, Key, ChevronDown, User, Network
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';

export default function WorkersPage() {
    const [workers, setWorkers] = useState<any[]>([]);
    const [booths, setBooths] = useState<any[]>([]);
    const [coverage, setCoverage] = useState<any>(null);
    const [assembly, setAssembly] = useState<any>(null);

    const [viewMode, setViewMode] = useState<'grid' | 'hierarchy'>('grid');
    const [showAdd, setShowAdd] = useState(false);
    const [showAssignVoters, setShowAssignVoters] = useState<any>(null);
    const [showVoterList, setShowVoterList] = useState<any>(null);
    const [showTransfer, setShowTransfer] = useState<any>(null);
    const [showDatePanel, setShowDatePanel] = useState(false);
    const [showEdit, setShowEdit] = useState<any>(null);
    const [showPasswordReset, setShowPasswordReset] = useState<any>(null);

    const [voterSearch, setVoterSearch] = useState('');
    const [availableVoters, setAvailableVoters] = useState<any[]>([]);
    const [viewingVoters, setViewingVoters] = useState<any[]>([]);
    const [selectedVoterIds, setSelectedVoterIds] = useState<number[]>([]);
    const [transferTargetId, setTransferTargetId] = useState('');
    const [newElectionDate, setNewElectionDate] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        type: 'FIELD',
        boothId: '',
        password: ''
    });

    const [editData, setEditData] = useState({
        name: '',
        mobile: '',
        type: '',
        boothId: ''
    });

    const [newPassword, setNewPassword] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const { data: session }: any = useSession();
    const { effectiveRole, effectiveWorkerType } = useView();
    const role = effectiveRole || session?.user?.role;
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(role);
    const isCandidate = role === 'MANAGER';
    const isBoothManager = role === 'WORKER' && effectiveWorkerType === 'BOOTH_MANAGER';
    const isPannaPramukh = role === 'WORKER' && effectiveWorkerType === 'PANNA_PRAMUKH';
    const canEditWorkers = isAdmin || isCandidate || isBoothManager;

    const assemblyId = session?.user?.assemblyId || 1;

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        if (isBoothManager) {
            const [wData, bData, aData] = await Promise.all([
                getWorkersInAssembly(assemblyId),
                getBoothsWithAssignment(assemblyId),
                getAssemblyInfo(assemblyId)
            ]);
            setWorkers(wData);
            setBooths(bData);
            setAssembly(aData);
            if (aData?.electionDate) {
                setNewElectionDate(new Date(aData.electionDate).toISOString().split('T')[0]);
            }
        } else {
            const [wData, bData, cData, aData] = await Promise.all([
                getWorkersInAssembly(assemblyId),
                getBoothsWithAssignment(assemblyId),
                getBoothCoverageStats(assemblyId),
                getAssemblyInfo(assemblyId)
            ]);
            setWorkers(wData);
            setBooths(bData);
            setCoverage(cData);
            setAssembly(aData);
            if (aData?.electionDate) {
                setNewElectionDate(new Date(aData.electionDate).toISOString().split('T')[0]);
            }
        }
        setLoading(false);
    }

    const validatePassword = (pwd: string) => {
        const hasUpperCase = /[A-Z]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        return hasUpperCase && hasNumber && hasSpecialChar;
    };

    const handleCreateWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validatePassword(formData.password)) {
            alert('Password must contain at least 1 Uppercase, 1 Number, and 1 Special Character.');
            return;
        }
        await createWorker({
            ...formData,
            boothId: formData.boothId ? parseInt(formData.boothId) : undefined,
            assemblyId
        });
        setShowAdd(false);
        setFormData({ name: '', mobile: '', type: 'FIELD', boothId: '', password: '' });
        fetchData();
    };

    const handleUpdateWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showEdit) return;
        setLoading(true);
        await updateWorker(showEdit.id, {
            name: editData.name,
            mobile: editData.mobile,
            type: editData.type,
            boothId: editData.boothId ? parseInt(editData.boothId) : null
        });
        setShowEdit(null);
        fetchData();
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showPasswordReset) return;
        if (!validatePassword(newPassword)) {
            alert('Password must contain at least 1 Uppercase, 1 Number, and 1 Special Character.');
            return;
        }
        const res = await updateWorkerPassword(showPasswordReset.id, newPassword);
        if (res.success) {
            alert('Password updated successfully');
            setShowPasswordReset(null);
            setNewPassword('');
        } else {
            alert('Failed to update password');
        }
    };

    const openEditModal = (worker: any) => {
        setEditData({
            name: worker.name,
            mobile: worker.mobile || '',
            type: worker.type,
            boothId: worker.boothId?.toString() || ''
        });
        setShowEdit(worker);
    };

    const handleOpenAssign = async (worker: any) => {
        if (!worker.booth) {
            alert('कृपया पहले इस कार्यकर्ता को एक बूथ असाइन करें!');
            return;
        }
        setShowAssignVoters(worker);
        const voters = await getUnassignedVoters(assemblyId, worker.booth.number);
        setAvailableVoters(voters);
        setSelectedVoterIds([]);
    };

    const handleAssignSubmit = async () => {
        if (selectedVoterIds.length === 0) return;
        setLoading(true);
        await assignVotersToWorker(showAssignVoters.id, selectedVoterIds);
        setLoading(false);
        setShowAssignVoters(null);
        fetchData();
    };

    const handleAutoAssign = async (count: number) => {
        if (!showAssignVoters) return;
        setLoading(true);
        const res = await autoAssignVotersByCount(showAssignVoters.id, count, assemblyId, showAssignVoters.booth.number);
        setLoading(false);
        setShowAssignVoters(null);
        fetchData();
        alert(`${res.count} वोटर सफलतापूर्वक असाइन किए गए।`);
    };

    const handleViewVoters = async (worker: any) => {
        setLoading(true);
        const voters = await getWorkerAssignedVoters(worker.id);
        setViewingVoters(voters);
        setShowVoterList(worker);
        setLoading(false);
    };

    const handleToggleVoted = async (voterId: number, current: boolean) => {
        await updateVoterFeedback(voterId, { isVoted: !current } as any);
        const updated = viewingVoters.map(v => v.id === voterId ? { ...v, isVoted: !current } : v);
        setViewingVoters(updated);
    };

    const handleTransfer = async () => {
        if (!transferTargetId) return;
        setLoading(true);
        await bulkTransferVoters(showTransfer.id, parseInt(transferTargetId));
        setShowTransfer(null);
        setTransferTargetId('');
        fetchData();
    };

    const handleDateUpdate = async () => {
        if (!newElectionDate) return;
        setLoading(true);
        await updateElectionDate(assemblyId, new Date(newElectionDate));
        setShowDatePanel(false);
        fetchData();
    };

    const filteredWorkers = workers.filter(w => filterType === 'ALL' || w.type === filterType);
    const availableBoothsForForm = booths.filter(b => formData.type === 'BOOTH_MANAGER' ? b.workers.length === 0 : true);
    const availableBoothsForEdit = booths.filter(b => {
        if (editData.type === 'BOOTH_MANAGER') {
            return b.id.toString() === editData.boothId || b.workers.length === 0;
        }
        return true;
    });

    const hierarchyData = useMemo(() => {
        const generalWorkers = workers.filter(w => w.type === 'FIELD' || w.type === 'SOCIAL_MEDIA');
        const boothGroups = booths.map(booth => {
            const manager = workers.find(w => w.type === 'BOOTH_MANAGER' && w.boothId === booth.id);
            const pannaPramukhs = workers.filter(w => w.type === 'PANNA_PRAMUKH' && w.boothId === booth.id);
            return {
                ...booth,
                manager,
                pannaPramukhs
            };
        }).filter(group => group.manager || group.pannaPramukhs.length > 0);

        return { generalWorkers, boothGroups };
    }, [workers, booths]);

    if (loading && workers.length === 0) {
        return <div style={{ textAlign: 'center', padding: '100px', fontWeight: '700' }}>डेटा लोड हो रहा है...</div>;
    }

    return (
        <div className="overflow-x-hidden" style={{ paddingBottom: '80px' }}>
            {/* Header */}
            <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1E293B' }}>कार्यकर्ता एवं टीम मैनेजमेंट</h1>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <div style={{ fontSize: '14px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={16} /> वोटिंग तिथि:
                            <span
                                onClick={() => setShowDatePanel(true)}
                                style={{ fontWeight: '800', color: '#2563EB', cursor: 'pointer', borderBottom: '1px dashed #2563EB' }}
                            >
                                {assembly?.electionDate ? new Date(assembly.electionDate).toLocaleDateString('hi-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'सेट नहीं है'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mobile-full-width" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="mobile-full-width" style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
                        <button className="mobile-full-width" onClick={() => setViewMode('grid')} style={{ flex: 1, padding: '8px 12px', background: viewMode === 'grid' ? 'white' : 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: viewMode === 'grid' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <LayoutList size={16} /> <span style={{ fontSize: '13px', fontWeight: '700' }}>Grid</span>
                        </button>
                        <button className="mobile-full-width" onClick={() => setViewMode('hierarchy')} style={{ flex: 1, padding: '8px 12px', background: viewMode === 'hierarchy' ? 'white' : 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: viewMode === 'hierarchy' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Network size={16} /> <span style={{ fontSize: '13px', fontWeight: '700' }}>Hierarchy</span>
                        </button>
                    </div>
                    {viewMode === 'grid' && (
                        <div className="mobile-full-width" style={{ position: 'relative' }}>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                style={{ width: '100%', padding: '12px 16px', paddingRight: '40px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: '700', appearance: 'none', cursor: 'pointer' }}
                            >
                                <option value="ALL">सभी कार्यकर्ता</option>
                                <option value="FIELD">ग्राउंड कार्यकर्ता</option>
                                <option value="SOCIAL_MEDIA">सोशल मीडिया</option>
                                <option value="BOOTH_MANAGER">बूथ मैनेजर</option>
                                <option value="PANNA_PRAMUKH">पन्ना प्रमुख</option>
                            </select>
                            <Filter size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
                        </div>
                    )}
                    <button className="mobile-full-width" onClick={() => setShowAdd(true)} style={{ padding: '12px 24px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <UserPlus size={18} /> नया सदस्य
                    </button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <>
                    {/* Coverage Map */}
                    {coverage && (
                        <div className="card" style={{ marginBottom: '32px', padding: '24px', borderRadius: '24px', background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)', border: '1px solid #E0F2FE' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ padding: '10px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <MapIcon size={20} color="#2563EB" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: '800', color: '#1E293B' }}>बूथ कवरेज रिपोर्ट (Deployment)</h3>
                                        <p style={{ fontSize: '13px', color: '#64748B' }}>कुल {coverage.total} बूथों में से {coverage.assigned} पर मैनेजर तैनात</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#2563EB' }}>{coverage.percent}%</div>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>कवरेज स्कोर</div>
                                </div>
                            </div>
                            <div style={{ height: '12px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${coverage.percent}%`, height: '100%', background: 'linear-gradient(90deg, #2563EB, #60A5FA)', borderRadius: '10px', transition: 'width 1s ease-out' }}></div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {filteredWorkers.map((worker: any) => (
                            <div key={worker.id} className="card" style={{
                                position: 'relative', overflow: 'hidden', borderRadius: '24px', border: '1px solid #E2E8F0',
                                backgroundColor: worker.stats?.progress === 100 ? '#F0FDF4' : 'white'
                            }}>
                                {canEditWorkers && (
                                    <button onClick={() => openEditModal(worker)} style={{ position: 'absolute', top: 12, left: 12, padding: '8px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '50%', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <Edit2 size={14} color="#64748B" />
                                    </button>
                                )}

                                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', marginTop: '10px' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #E2E8F0' }}>
                                        <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-bg)' }}>{worker.name[0]}</span>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '18px' }}>{worker.name}</div>
                                        <div style={{ fontSize: '13px', color: '#64748B' }}>{worker.mobile}</div>
                                        <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: '800', color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px', display: 'inline-block' }}>
                                            {worker.type.split('_').join(' ')}
                                        </div>
                                    </div>
                                </div>

                                {worker.booth && (
                                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: '700', padding: '8px 12px', background: '#F8FAFC', borderRadius: '12px' }}>
                                        <Home size={14} color="#2563EB" /> बूथ {worker.booth.number}: {worker.booth.name || 'N/A'}
                                    </div>
                                )}

                                {worker.type === 'PANNA_PRAMUKH' && (
                                    <div style={{ marginBottom: '20px', padding: '16px', background: '#F8FAFC', borderRadius: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>संपर्क प्रोग्रेस</span>
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B' }}>{worker.stats?.contactedVoters} / {worker.stats?.totalVoters}</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${worker.stats?.progress}%`, height: '100%', background: '#2563EB' }}></div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {worker.type === 'PANNA_PRAMUKH' ? (
                                        <>
                                            <button onClick={() => handleOpenAssign(worker)} style={{ flex: 1, padding: '10px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>वोटर जोड़े</button>
                                            <button onClick={() => handleViewVoters(worker)} style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>लिस्ट</button>
                                        </>
                                    ) : (
                                        <button style={{ flex: 1, padding: '10px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700' }}>टास्क असाइन करें</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    {/* Level 1: Candidate (Implicit Header) */}
                    <div style={{ textAlign: 'center', position: 'relative' }}>
                        <div style={{ background: '#1E3A8A', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 32px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(30,58,138,0.3)', border: '2px solid white' }}>
                            <ShieldCheck size={20} />
                            <span style={{ fontWeight: '900', fontSize: '18px' }}>कैंडिडेट (Candidate / Admin)</span>
                        </div>
                        <div style={{ width: '2px', height: '20px', background: '#E2E8F0', margin: '0 auto' }}></div>
                    </div>

                    {/* Level 2: Ground Workers & Social Media */}
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#64748B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Users size={18} /> जमीनी कार्यकर्ता एवं सोशल मीडिया टीम
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {hierarchyData.generalWorkers.map((w: any) => (
                                <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: w.type === 'SOCIAL_MEDIA' ? '#FDF2F8' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: w.type === 'SOCIAL_MEDIA' ? '#DB2777' : '#2563EB', fontWeight: '800' }}>{w.name[0]}</div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '14px' }}>{w.name}</div>
                                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8' }}>{w.type === 'SOCIAL_MEDIA' ? 'डिजिटल प्रचार' : 'ग्राउंड सपोर्ट'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Level 2 -> 3: Booth Manager -> Panna Pramukhs */}
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#64748B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Network size={18} /> बूथ स्तर की टीम (बूथ मैनेजर {'>'} पन्ना प्रमुख)
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                            {hierarchyData.boothGroups.map((group: any) => (
                                <div key={group.id} style={{ border: '2px solid #F1F5F9', borderRadius: '24px', overflow: 'hidden', background: '#F8FAFC' }}>
                                    <div style={{ padding: '16px 20px', background: '#1E3A8A', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '900', fontSize: '15px' }}>बूथ नं. {group.number}</span>
                                        <span style={{ fontSize: '11px', fontWeight: '700' }}>{group.area}</span>
                                    </div>

                                    <div style={{ padding: '20px' }}>
                                        {/* Booth Manager */}
                                        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FFF7ED', border: '1px solid #FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}><UserCheck size={20} /></div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B' }}>{group.manager?.name || 'मैनेजर नियुक्त नहीं'}</div>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#D97706' }}>बूथ इंचार्ज</div>
                                            </div>
                                            {canEditWorkers && group.manager && (
                                                <button onClick={() => openEditModal(group.manager)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Panna Pramukhs (Children) */}
                                        <div style={{ paddingLeft: '24px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ position: 'absolute', left: '10px', top: -16, bottom: 20, width: '2px', background: '#E2E8F0' }}></div>
                                            {group.pannaPramukhs.map((p: any) => (
                                                <div key={p.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                                    <div style={{ position: 'absolute', left: '-14px', top: '50%', width: '14px', height: '2px', background: '#E2E8F0' }}></div>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#2563EB' }}>{p.name[0]}</div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '800' }}>{p.name}</div>
                                                        <div style={{ fontSize: '10px', color: '#64748B' }}>पन्ना प्रमुख | {p.stats?.totalVoters} वोटर</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {group.pannaPramukhs.length === 0 && (
                                                <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', paddingLeft: '8px' }}>कोई पन्ना प्रमुख नहीं</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showAdd && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="card" style={{ background: 'white', width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: '900' }}>नया सदस्य जोड़ें</h2>
                            <button onClick={() => setShowAdd(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '6px' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateWorker}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>नाम (Full Name)</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px' }} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>मोबाइल नंबर (वोटर हेल्पलाइन सर्च के लिए भी)</label>
                                <input required type="text" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px' }} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>पासवर्ड (Login)</label>
                                <input required type="text" placeholder="Strong Password (e.g. Abc@1234)" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px' }} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>प्रकार</label>
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value, boothId: '' })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px', background: 'white' }}>
                                    <option value="FIELD">ग्राउंड कार्यकर्ता</option>
                                    <option value="SOCIAL_MEDIA">सोशल मीडिया</option>
                                    <option value="BOOTH_MANAGER">बूथ मैनेजर</option>
                                    <option value="PANNA_PRAMUKH">पन्ना प्रमुख</option>
                                </select>
                            </div>
                            {(formData.type === 'BOOTH_MANAGER' || formData.type === 'PANNA_PRAMUKH') && (
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>बूथ असाइन करें</label>
                                    <select required value={formData.boothId} onChange={e => setFormData({ ...formData, boothId: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px', background: 'white' }}>
                                        <option value="">बूथ चुनें...</option>
                                        {availableBoothsForForm.map(b => <option key={b.id} value={b.id}>बूथ {b.number}: {b.name || 'N/A'}</option>)}
                                    </select>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px' }}>कैंसिल</button>
                                <button type="submit" style={{ flex: 1, padding: '14px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900' }}>जोड़ें</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Worker Modal */}
            {showEdit && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card" style={{ background: 'white', width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: '900' }}>कार्यकर्ता माहिती अपडेट करें</h2>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setShowPasswordReset(showEdit)} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><Key size={18} /></button>
                                <button onClick={() => setShowEdit(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '6px' }}><X size={20} /></button>
                            </div>
                        </div>
                        <form onSubmit={handleUpdateWorker}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>नाम</label>
                                <input required type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px' }} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>मोबाइल</label>
                                <input required type="text" value={editData.mobile} onChange={e => setEditData({ ...editData, mobile: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px' }} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>कार्यकर्ता टाइप</label>
                                <select value={editData.type} onChange={e => setEditData({ ...editData, type: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px', background: 'white' }}>
                                    <option value="FIELD">ग्राउंड कार्यकर्ता</option>
                                    <option value="SOCIAL_MEDIA">सोशल मीडिया</option>
                                    <option value="BOOTH_MANAGER">बूथ मैनेजर</option>
                                    <option value="PANNA_PRAMUKH">पन्ना प्रमुख</option>
                                </select>
                            </div>
                            {(editData.type === 'BOOTH_MANAGER' || editData.type === 'PANNA_PRAMUKH') && (
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>बूथ बदलें</label>
                                    <select value={editData.boothId} onChange={e => setEditData({ ...editData, boothId: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px', background: 'white' }}>
                                        <option value="">कोई बूथ नहीं</option>
                                        {availableBoothsForEdit.map(b => <option key={b.id} value={b.id}>बूथ {b.number}: {b.name || 'N/A'}</option>)}
                                    </select>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button type="button" onClick={() => setShowEdit(null)} style={{ flex: 1, padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px' }}>कैंसिल</button>
                                <button type="submit" style={{ flex: 1, padding: '14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900' }}>अपडेट करें</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Voter List Modal */}
            {showVoterList && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="card" style={{ background: 'white', width: '100%', maxWidth: '700px', borderRadius: '28px', overflow: 'hidden' }}>
                        <div style={{ padding: '24px 32px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '900' }}>पन्ना वोटर लिस्ट</h2>
                                <p style={{ fontSize: '13px', color: '#64748B' }}>{showVoterList.name} के अंतर्गत {viewingVoters.length} वोटर</p>
                            </div>
                            <button onClick={() => setShowVoterList(null)} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '50%', padding: '8px' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {viewingVoters.map((v: any) => (
                                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: v.isVoted ? '#ECFDF5' : '#F8FAFC', borderRadius: '16px', border: v.isVoted ? '1px solid #A7F3D0' : '1px solid #F1F5F9' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '800', fontSize: '15px' }}>{v.name}</div>
                                            <div style={{ fontSize: '11px', color: '#64748B' }}>{v.gender}, {v.age} | EPIC: {v.epic}</div>
                                        </div>
                                        <button onClick={() => handleToggleVoted(v.id, v.isVoted)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: v.isVoted ? '#10B981' : '#E2E8F0', color: v.isVoted ? 'white' : '#475569', fontSize: '11px', fontWeight: '800' }}>{v.isVoted ? 'Undo' : 'Voted ✅'}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Voter Assignment Modal */}
            {showAssignVoters && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="card" style={{ background: 'white', width: '100%', maxWidth: '600px', padding: '32px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '900' }}>वोटर असाइनमेंट</h2>
                                <p style={{ fontSize: '13px', color: '#64748B' }}>{showAssignVoters.name} (बूथ {showAssignVoters.booth.number})</p>
                            </div>
                            <button onClick={() => setShowAssignVoters(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '6px' }}><X size={20} /></button>
                        </div>

                        {/* Quick Preference Buttons */}
                        <div style={{ marginBottom: '24px', padding: '16px', background: '#F0F9FF', borderRadius: '16px', border: '1px solid #BAE6FD' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#0369A1', marginBottom: '12px' }}>कितने वोटर असाइन करना चाहते हैं? (Preference)</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => handleAutoAssign(50)} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #7DD3FC', borderRadius: '12px', color: '#0369A1', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Zap size={16} /> 50 वोटर
                                </button>
                                <button onClick={() => handleAutoAssign(100)} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #7DD3FC', borderRadius: '12px', color: '#0369A1', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Zap size={16} /> 100 वोटर
                                </button>
                            </div>
                            <p style={{ fontSize: '11px', color: '#64748B', marginTop: '10px' }}>*यह उस बूथ के अनमैप मतदाताओं में से क्रमवार असाइन करेगा।</p>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>मैनुअल चयन ({selectedVoterIds.length} सिलेक्टेड)</label>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px' }}>
                                {availableVoters.map(v => (
                                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderBottom: '1px solid #F1F5F9' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedVoterIds.includes(v.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedVoterIds([...selectedVoterIds, v.id]);
                                                else setSelectedVoterIds(selectedVoterIds.filter(id => id !== v.id));
                                            }}
                                        />
                                        <div style={{ fontSize: '13px' }}>
                                            <div style={{ fontWeight: '700' }}>{v.name}</div>
                                            <div style={{ fontSize: '11px', color: '#64748B' }}>{v.gender}, {v.age} | EPIC: {v.epic}</div>
                                        </div>
                                    </div>
                                ))}
                                {availableVoters.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8' }}>कोई अनअसाइन वोटर नहीं मिला।</div>}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                            <button onClick={() => setShowAssignVoters(null)} style={{ flex: 1, padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px' }}>कैंसिल</button>
                            <button onClick={handleAssignSubmit} disabled={selectedVoterIds.length === 0} style={{ flex: 1, padding: '14px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', opacity: selectedVoterIds.length === 0 ? 0.5 : 1 }}>चयनित सेव करें</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
