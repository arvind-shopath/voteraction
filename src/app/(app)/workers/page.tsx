'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    getWorkersInAssembly,
    createWorker,
    assignVotersToWorker,
    getWorkerAssignedVoters,
    updateWorker,
    updateWorkerPassword,
    autoAssignVotersByCount,
    checkCreativeTeamStatus,
    getAssemblyVillages
} from '@/app/actions/worker';
import { getBoothsWithAssignment, getBoothCoverageStats } from '@/app/actions/booth';
import { getUnassignedVoters, updateVoterFeedback } from '@/app/actions/voters';
import { getAssemblyInfo, updateElectionDate } from '@/app/actions/admin';
import {
    UserPlus, Plus, Phone, Users, Share2, X, ShieldCheck,
    LayoutList, Filter, Search, CheckCircle, ChevronRight,
    Home, UserCheck, AlertCircle, Calendar, RefreshCcw,
    TrendingUp, Zap, Map as MapIcon, Edit2, Lock, Key, ChevronDown, User, Network, MapPin
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';

export default function WorkersPage() {
    const [workers, setWorkers] = useState<any[]>([]);
    const [booths, setBooths] = useState<any[]>([]);
    const [villages, setVillages] = useState<any[]>([]);
    const [coverage, setCoverage] = useState<any>(null);
    const [assembly, setAssembly] = useState<any>(null);
    const [hasCreativeTeam, setHasCreativeTeam] = useState(false);

    const [viewMode, setViewMode] = useState<'grid' | 'hierarchy'>('grid');
    const [showAdd, setShowAdd] = useState(false);
    const [showAssignVoters, setShowAssignVoters] = useState<any>(null);
    const [showVoterList, setShowVoterList] = useState<any>(null);
    const [showTransfer, setShowTransfer] = useState<any>(null);
    const [showDatePanel, setShowDatePanel] = useState(false);
    const [showEdit, setShowEdit] = useState<any>(null);
    const [showPasswordReset, setShowPasswordReset] = useState<any>(null);

    const [boothSearch, setBoothSearch] = useState('');
    const [villageSearch, setVillageSearch] = useState('');
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
        boothIds: [] as string[],
        assignedVillages: [] as string[],
        password: ''
    });

    const [editData, setEditData] = useState({
        name: '',
        mobile: '',
        type: '',
        boothId: '',
        boothIds: [] as string[],
        assignedVillages: [] as string[]
    });

    const [newPassword, setNewPassword] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [sortBy, setSortBy] = useState('NAME');
    const [loading, setLoading] = useState(true);
    const { data: session, status: sessionStatus }: any = useSession();
    const { effectiveRole, effectiveWorkerType } = useView();
    const isSuperAdmin = (session?.user as any)?.role === 'SUPERADMIN';
    const role = (isSuperAdmin ? effectiveRole : null) || (session?.user as any)?.role;
    const currentWorkerType = isSuperAdmin ? effectiveWorkerType : (session?.user as any)?.workerType;
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(role);
    const isCandidate = role === 'CANDIDATE' || role === 'ELECTION_MANAGER';
    const isBoothManager = role === 'WORKER' && currentWorkerType === 'BOOTH_MANAGER';
    const isPannaPramukh = role === 'WORKER' && currentWorkerType === 'PANNA_PRAMUKH';
    const canEditWorkers = isAdmin || isCandidate;

    const userAsmId = (session?.user as any)?.assemblyId;
    const assemblyId = userAsmId ? parseInt(userAsmId.toString(), 10) : 1;

    useEffect(() => {
        // Wait for session to load before fetching — prevents empty assemblyId race condition
        if (sessionStatus === 'loading') return;
        fetchData();
    }, [sessionStatus, userAsmId]);

    async function fetchData() {
        setLoading(true);
        try {
            const currentAsmId = (session?.user as any)?.assemblyId ? parseInt((session?.user as any).assemblyId.toString(), 10) : assemblyId;
            if (isBoothManager) {
                const [wData, bData, aData, vilData] = await Promise.all([
                    getWorkersInAssembly(currentAsmId),
                    getBoothsWithAssignment(currentAsmId),
                    getAssemblyInfo(currentAsmId),
                    getAssemblyVillages(currentAsmId)
                ]);
                setWorkers(wData || []);
                setBooths(bData || []);
                setAssembly(aData || null);
                setVillages(vilData || []);
                if (aData?.electionDate) {
                    setNewElectionDate(new Date(aData.electionDate).toISOString().split('T')[0]);
                }
            } else {
                const [wData, bData, cData, aData, teamStatus, vilData] = await Promise.all([
                    getWorkersInAssembly(currentAsmId),
                    getBoothsWithAssignment(currentAsmId),
                    getBoothCoverageStats(currentAsmId),
                    getAssemblyInfo(currentAsmId),
                    checkCreativeTeamStatus(currentAsmId),
                    getAssemblyVillages(currentAsmId)
                ]);
                setWorkers(wData || []);
                setBooths(bData || []);
                setCoverage(cData || null);
                setAssembly(aData || null);
                setHasCreativeTeam(teamStatus || false);
                setVillages(vilData || []);
                if (aData?.electionDate) {
                    setNewElectionDate(new Date(aData.electionDate).toISOString().split('T')[0]);
                }
            }
        } catch (e) {
            console.error("Error fetching workers data:", e);
        } finally {
            setLoading(false);
        }
    }

    const validatePassword = (pwd: string) => {
        if (pwd.length < 6) return false;
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
            boothIds: formData.type === 'BOOTH_MANAGER' && formData.boothIds.length > 0 ? formData.boothIds.map(id => parseInt(id)) : undefined,
            assignedVillages: formData.type === 'FIELD' && formData.assignedVillages.length > 0 ? formData.assignedVillages : undefined,
            assemblyId
        });
        setShowAdd(false);
        setFormData({ name: '', mobile: '', type: 'FIELD', boothId: '', boothIds: [], assignedVillages: [], password: '' });
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
            boothId: editData.boothId ? parseInt(editData.boothId) : null,
            boothIds: editData.type === 'BOOTH_MANAGER' && editData.boothIds.length > 0
                ? editData.boothIds.map(id => parseInt(id))
                : undefined,
            assignedVillages: editData.type === 'FIELD'
                ? editData.assignedVillages
                : undefined
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
        let existingBoothIds: string[] = [];
        if (worker.boothIds) {
            try { existingBoothIds = JSON.parse(worker.boothIds).map(String); } catch { existingBoothIds = []; }
        } else if (worker.boothId) {
            existingBoothIds = [worker.boothId.toString()];
        }

        let existingVillages: string[] = [];
        if (worker.assignedVillages) {
            try { existingVillages = JSON.parse(worker.assignedVillages); } catch { existingVillages = []; }
        }

        setEditData({
            name: worker.name,
            mobile: worker.mobile || worker.user?.mobile || '',
            type: worker.type,
            boothId: worker.boothId?.toString() || '',
            boothIds: existingBoothIds,
            assignedVillages: existingVillages
        });
        setBoothSearch('');
        setVillageSearch('');
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
        if (res.success) {
            alert(res.message);
        } else {
            alert(res.message || 'कोई अनअसाइन वोटर नहीं मिला।');
        }
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

    const filteredWorkers = workers
        .filter(w => {
            if (filterType === 'ALL') return true;
            if (filterType === 'ELECTION_MANAGER') return w.type === 'ELECTION_MANAGER';
            if (filterType === 'FIELD' || filterType === 'GROUND') return ['FIELD', 'GROUND'].includes(w.type);
            if (filterType === 'BOOTH_MANAGER' || filterType === 'BOOTH') return ['BOOTH_MANAGER', 'BOOTH'].includes(w.type);
            if (filterType === 'PANNA_PRAMUKH' || filterType === 'PANNA') return ['PANNA_PRAMUKH', 'PANNA'].includes(w.type);
            return w.type === filterType;
        })
        .sort((a, b) => {
            if (sortBy === 'POINTS_HIGH') return (b.totalPoints || 0) - (a.totalPoints || 0);
            if (sortBy === 'POINTS_LOW') return (a.totalPoints || 0) - (b.totalPoints || 0);
            return 0; // Default order from API
        });
    // For Booth Manager: all booths available (no restriction - one BM can manage multiple booths)
    const availableBoothsForForm = booths;
    const availableBoothsForEdit = booths;

    const hierarchyData = useMemo(() => {
        const isBoothMgr = (w: any) => ['BOOTH_MANAGER', 'BOOTH'].includes(w.type);
        const isPanna = (w: any) => ['PANNA_PRAMUKH', 'PANNA'].includes(w.type);
        const isGround = (w: any) => ['FIELD', 'GROUND'].includes(w.type);

        const generalWorkers = workers.filter(w => isGround(w));
        const boothGroups = booths.map(booth => {
            const manager = workers.find(w => isBoothMgr(w) && w.boothId === booth.id);
            const pannaPramukhs = workers.filter(w => isPanna(w) && w.boothId === booth.id);
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
                    {!isBoothManager && (
                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                            <div style={{ fontSize: '14px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={16} /> वोटिंग तिथि:
                                <span
                                    onClick={() => (isAdmin || isCandidate) && setShowDatePanel(true)}
                                    style={{ fontWeight: '800', color: '#2563EB', cursor: (isAdmin || isCandidate) ? 'pointer' : 'default', borderBottom: (isAdmin || isCandidate) ? '1px dashed #2563EB' : 'none' }}
                                >
                                    {assembly?.electionDate ? new Date(assembly.electionDate).toLocaleDateString('hi-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'सेट नहीं है'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mobile-full-width" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Points Sort Filter */}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                padding: '10px 12px', paddingRight: '32px',
                                background: sortBy.includes('POINTS') ? '#FFFBEB' : 'white',
                                border: sortBy.includes('POINTS') ? '1px solid #F59E0B' : '1px solid #E2E8F0',
                                borderRadius: '12px', fontWeight: '700', fontSize: '13px',
                                color: sortBy.includes('POINTS') ? '#B45309' : '#64748B',
                                appearance: 'none', cursor: 'pointer'
                            }}
                        >
                            <option value="NAME">Sort: Normal</option>
                            <option value="POINTS_HIGH">Points: High to Low</option>
                            <option value="POINTS_LOW">Points: Low to High</option>
                        </select>
                        <TrendingUp size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: sortBy.includes('POINTS') ? '#B45309' : '#64748B', pointerEvents: 'none' }} />
                    </div>

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
                                {!isBoothManager && (
                                    <>
                                        <option value="ELECTION_MANAGER">इलेक्शन मैनेजर</option>
                                        <option value="BOOTH_MANAGER">बूथ मैनेजर</option>
                                        <option value="FIELD">ग्राउंड कार्यकर्ता</option>
                                    </>
                                )}
                                <option value="PANNA_PRAMUKH">पन्ना प्रमुख</option>
                            </select>
                            <Filter size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
                        </div>
                    )}
                    {!isBoothManager && (
                        <button className="mobile-full-width" onClick={() => setShowAdd(true)} style={{ padding: '12px 24px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <UserPlus size={18} /> नया सदस्य
                        </button>
                    )}
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
                                        <p style={{ fontSize: '13px', color: '#64748B' }}>कुल {coverage.total} बूथों में से {coverage.assigned} पर कैंडिडेट तैनात</p>
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

                                <div style={{ position: 'absolute', top: 12, right: 12, padding: '6px 12px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: 'white', borderRadius: '12px', fontSize: '16px', fontWeight: '900', boxShadow: '0 4px 6px rgba(124, 58, 237, 0.4)', zIndex: 5, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {worker.totalPoints || 0} <span style={{ fontSize: '12px' }}>✨</span>
                                </div>

                                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', marginTop: '10px' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #E2E8F0' }}>
                                        <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-bg)' }}>{worker.name[0]}</span>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '18px' }}>{worker.name}</div>
                                        <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: '800', color: worker.type === 'ELECTION_MANAGER' ? '#7C3AED' : '#2563EB', background: worker.type === 'ELECTION_MANAGER' ? '#F5F3FF' : '#EFF6FF', padding: '2px 8px', borderRadius: '6px', display: 'inline-block' }}>
                                            {worker.type === 'ELECTION_MANAGER' ? '🗄️ इलेक्शन मैनेजर' : ['BOOTH_MANAGER', 'BOOTH'].includes(worker.type) ? '🏢 बूथ मैनेजर' : ['PANNA_PRAMUKH', 'PANNA'].includes(worker.type) ? '📄 पन्ना प्रमुख' : '🚶‍♂️ ग्राउंड कार्यकर्ता'}
                                        </div>
                                    </div>
                                </div>

                                {worker.type === 'BOOTH_MANAGER' && (() => {
                                    let bIds: string[] = [];
                                    if (worker.boothIds) {
                                        try { bIds = JSON.parse(worker.boothIds).map(String); } catch {}
                                    }
                                    const matchedBooths = booths.filter(b => bIds.includes(b.id.toString()));
                                    return (
                                        <div style={{ marginBottom: '16px', fontSize: '13px', color: '#1E40AF', fontWeight: '700', padding: '8px 12px', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Home size={14} color="#2563EB" />
                                                <span>असाइंड बूथ ({matchedBooths.length || (worker.booth ? 1 : 0)}):</span>
                                            </div>
                                            <div style={{ marginTop: '4px', fontSize: '12px', color: '#3B82F6', fontWeight: '800' }}>
                                                {matchedBooths.length > 0
                                                    ? matchedBooths.map(b => `बूथ #${b.number}`).join(', ')
                                                    : (worker.booth ? `बूथ #${worker.booth.number}: ${worker.booth.name || ''}` : 'कोई बूथ नहीं')}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {worker.type === 'FIELD' && (() => {
                                    let vilList: string[] = [];
                                    if (worker.assignedVillages) {
                                        try { vilList = JSON.parse(worker.assignedVillages); } catch {}
                                    }
                                    return (
                                        <div style={{ marginBottom: '16px', fontSize: '13px', color: '#047857', fontWeight: '700', padding: '8px 12px', background: '#ECFDF5', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span>🏡</span>
                                                <span>असाइंड गांव ({vilList.length || 'सभी'}):</span>
                                            </div>
                                            <div style={{ marginTop: '4px', fontSize: '12px', color: '#059669', fontWeight: '800' }}>
                                                {vilList.length > 0 ? vilList.join(', ') : 'सभी गांव (असीमित)'}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {worker.type !== 'BOOTH_MANAGER' && worker.type !== 'FIELD' && worker.booth && (
                                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: '700', padding: '8px 12px', background: '#F8FAFC', borderRadius: '12px' }}>
                                        <Home size={14} color="#2563EB" /> बूथ {worker.booth.number}: {worker.booth.name || 'N/A'}
                                    </div>
                                )}

                                {['PANNA_PRAMUKH', 'PANNA'].includes(worker.type) && (
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
                                    {['PANNA_PRAMUKH', 'PANNA'].includes(worker.type) ? (
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
                    {!isBoothManager && (
                        <>
                            <div style={{ textAlign: 'center', position: 'relative' }}>
                                <div style={{ background: '#1E3A8A', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 32px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(30,58,138,0.3)', border: '2px solid white' }}>
                                    <ShieldCheck size={20} />
                                    <span style={{ fontWeight: '900', fontSize: '18px' }}>कैंडिडेट (Candidate / Admin)</span>
                                </div>
                                <div style={{ width: '2px', height: '20px', background: '#E2E8F0', margin: '0 auto' }}></div>
                            </div>

                            {/* Level 2: Ground Workers */}
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#64748B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Users size={18} /> जमीनी कार्यकर्ता (Ground Workers)
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                    {hierarchyData.generalWorkers.map((w: any) => (
                                        <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: '800' }}>{w.name[0]}</div>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '15px' }}>{w.name}</div>
                                                <div style={{ fontSize: '12px', color: '#64748B' }}>{w.mobile || 'कोई नंबर नहीं'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Level 3: Booth Hierarchy */}
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#64748B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Home size={18} /> बूथ एवं पन्ना प्रमुख नेटवर्क
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                            {hierarchyData.boothGroups.map(group => (
                                <div key={group.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: '900', color: '#1E293B', fontSize: '15px' }}>बूथ {group.number}</span>
                                            <span style={{ fontSize: '13px', color: '#64748B' }}>{group.name}</span>
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', background: group.manager ? '#DCFCE7' : '#FEE2E2', color: group.manager ? '#15803D' : '#B91C1C' }}>
                                            {group.manager ? 'मैनेजर तैनात' : 'मैनेजर खाली'}
                                        </span>
                                    </div>

                                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {/* Booth Manager */}
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>बूथ मैनेजर</div>
                                            {group.manager ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #DBEAFE' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#2563EB', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>{group.manager.name[0]}</div>
                                                    <div>
                                                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#1E3A8A' }}>{group.manager.name}</div>
                                                        <div style={{ fontSize: '12px', color: '#60A5FA' }}>{group.manager.mobile || 'कोई नंबर नहीं'}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ padding: '10px', background: '#FFF1F2', borderRadius: '12px', border: '1px dashed #FECDD3', textAlign: 'center', fontSize: '12px', color: '#E11D48', fontWeight: '700' }}>
                                                    बूथ मैनेजर असाइन नहीं है
                                                </div>
                                            )}
                                        </div>

                                        {/* Panna Pramukhs */}
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>पन्ना प्रमुख ({group.pannaPramukhs.length})</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {group.pannaPramukhs.map(p => (
                                                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#E2E8F0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px' }}>{p.name[0]}</div>
                                                            <span style={{ fontWeight: '700', fontSize: '13px' }}>{p.name}</span>
                                                        </div>
                                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB' }}>{p.stats?.contactedVoters || 0} संपर्क</span>
                                                    </div>
                                                ))}
                                                {group.pannaPramukhs.length === 0 && (
                                                    <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', paddingLeft: '8px' }}>कोई पन्ना प्रमुख नहीं</div>
                                                )}
                                            </div>
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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
                    <div className="card" style={{ background: 'white', width: '100%', maxWidth: '520px', padding: '28px 32px', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: '900' }}>नया सदस्य जोड़ें</h2>
                            <button onClick={() => setShowAdd(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateWorker}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>नाम (Full Name)</label>
                                <input required type="text" placeholder="नाम लिखें" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px' }} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>मोबाइल नंबर (Login Username)</label>
                                <input required type="text" placeholder="10 अंकों का मोबाइल नंबर" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px' }} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>पासवर्ड (Login)</label>
                                <input required type="text" placeholder="Abc@1234" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px' }} />
                                <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748B', fontWeight: '700' }}>
                                    अनिवार्य: कम से कम 6 अक्षर, 1 बड़ा अक्षर (Caps), 1 स्पेशल चिन्ह, 1 अंक
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>प्रकार (Role / पद)</label>
                                <select value={formData.type} onChange={e => {
                                    setFormData({ ...formData, type: e.target.value, boothId: '', boothIds: [], assignedVillages: [] });
                                    setBoothSearch('');
                                    setVillageSearch('');
                                }} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px', background: 'white' }}>
                                    <option value="ELECTION_MANAGER">🗄️ इलेक्शन मैनेजर (Election Manager)</option>
                                    <option value="BOOTH_MANAGER">🏢 बूथ मैनेजर (Booth Manager)</option>
                                    <option value="PANNA_PRAMUKH">📄 पन्ना प्रमुख (Panna Pramukh)</option>
                                    <option value="FIELD">🚶‍♂️ ग्राउंड कार्यकर्ता (Ground Worker)</option>
                                </select>
                            </div>

                            {/* Booth Manager: Searchable Multi-Booth Picker */}
                            {formData.type === 'BOOTH_MANAGER' && (() => {
                                const filteredBooths = availableBoothsForForm.filter(b =>
                                    b.number.toString().includes(boothSearch) ||
                                    (b.name && b.name.toLowerCase().includes(boothSearch.toLowerCase())) ||
                                    (b.villageNameHi && b.villageNameHi.toLowerCase().includes(boothSearch.toLowerCase()))
                                );
                                return (
                                    <div style={{ marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: '800' }}>🗳️ बूथ चुनें (एक से अधिक)</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button type="button" onClick={() => setFormData({ ...formData, boothIds: availableBoothsForForm.map(b => b.id.toString()), boothId: availableBoothsForForm[0]?.id.toString() || '' })} style={{ fontSize: '11px', color: '#2563EB', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>सभी चुनें</button>
                                                <span style={{ color: '#CBD5E1' }}>|</span>
                                                <button type="button" onClick={() => setFormData({ ...formData, boothIds: [], boothId: '' })} style={{ fontSize: '11px', color: '#EF4444', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>हटाएं</button>
                                            </div>
                                        </div>

                                        {/* Sticky Search Bar */}
                                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
                                            <input
                                                type="text"
                                                placeholder="🔍 बूथ नंबर, नाम या गांव से खोजें..."
                                                value={boothSearch}
                                                onChange={e => setBoothSearch(e.target.value)}
                                                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '13px', background: 'white' }}
                                            />
                                        </div>

                                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px', background: '#FAFAFA' }}>
                                            {filteredBooths.length === 0 ? (
                                                <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>कोई बूथ नहीं मिला</div>
                                            ) : (
                                                filteredBooths.map(b => {
                                                    const isChecked = formData.boothIds.includes(b.id.toString());
                                                    return (
                                                        <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: isChecked ? '#EFF6FF' : 'transparent', marginBottom: '4px', border: isChecked ? '1px solid #BFDBFE' : '1px solid transparent' }}>
                                                            <input
                                                                type="checkbox"
                                                                value={b.id}
                                                                checked={isChecked}
                                                                onChange={e => {
                                                                    const newIds = e.target.checked
                                                                        ? [...formData.boothIds, b.id.toString()]
                                                                        : formData.boothIds.filter(id => id !== b.id.toString());
                                                                    const primaryBooth = newIds.length > 0 ? newIds[0] : '';
                                                                    setFormData({ ...formData, boothIds: newIds, boothId: primaryBooth });
                                                                }}
                                                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563EB' }}
                                                            />
                                                            <div>
                                                                <span style={{ fontSize: '14px', fontWeight: '700' }}>बूथ {b.number}: {b.name || 'N/A'}</span>
                                                                {b.villageNameHi && <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '6px' }}>({b.villageNameHi})</span>}
                                                            </div>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>
                                        {formData.boothIds.length > 0 && (
                                            <div style={{ marginTop: '8px', padding: '8px 12px', background: '#DCFCE7', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#15803D' }}>
                                                ✅ {formData.boothIds.length} बूथ चुने गए — प्राइमरी: बूथ #{availableBoothsForForm.find(b => b.id.toString() === formData.boothIds[0])?.number || '-'}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Panna Pramukh: Single Booth */}
                            {formData.type === 'PANNA_PRAMUKH' && (
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>बूथ चुनें</label>
                                    <select required value={formData.boothId} onChange={e => setFormData({ ...formData, boothId: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px', background: 'white' }}>
                                        <option value="">बूथ चुनें...</option>
                                        {availableBoothsForForm.map(b => <option key={b.id} value={b.id}>बूथ {b.number}: {b.name || 'N/A'}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Ground Worker (FIELD): Searchable Multi-Village Assignment */}
                            {formData.type === 'FIELD' && (() => {
                                const filteredVillages = villages.filter(v =>
                                    v.name.toLowerCase().includes(villageSearch.toLowerCase())
                                );
                                return (
                                    <div style={{ marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: '800' }}>🏡 गांव असाइन करें (एक से अधिक चुन सकते हैं)</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button type="button" onClick={() => setFormData({ ...formData, assignedVillages: villages.map(v => v.name) })} style={{ fontSize: '11px', color: '#2563EB', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>सभी चुनें</button>
                                                <span style={{ color: '#CBD5E1' }}>|</span>
                                                <button type="button" onClick={() => setFormData({ ...formData, assignedVillages: [] })} style={{ fontSize: '11px', color: '#EF4444', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>हटाएं</button>
                                            </div>
                                        </div>

                                        {/* Sticky Village Search Bar */}
                                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
                                            <input
                                                type="text"
                                                placeholder="🔍 गांव का नाम खोजें..."
                                                value={villageSearch}
                                                onChange={e => setVillageSearch(e.target.value)}
                                                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '13px', background: 'white' }}
                                            />
                                        </div>

                                        <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px', background: '#FAFAFA' }}>
                                            {filteredVillages.length === 0 ? (
                                                <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>कोई गांव नहीं मिला</div>
                                            ) : (
                                                filteredVillages.map(v => {
                                                    const isChecked = formData.assignedVillages.includes(v.name);
                                                    return (
                                                        <label key={v.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: isChecked ? '#ECFDF5' : 'transparent', marginBottom: '4px', border: isChecked ? '1px solid #A7F3D0' : '1px solid transparent' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    value={v.name}
                                                                    checked={isChecked}
                                                                    onChange={e => {
                                                                        const newVils = e.target.checked
                                                                            ? [...formData.assignedVillages, v.name]
                                                                            : formData.assignedVillages.filter(name => name !== v.name);
                                                                        setFormData({ ...formData, assignedVillages: newVils });
                                                                    }}
                                                                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#059669' }}
                                                                />
                                                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{v.name}</span>
                                                            </div>
                                                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', background: '#D1FAE5', padding: '2px 8px', borderRadius: '6px' }}>
                                                                {v.voterCount.toLocaleString('hi-IN')} वोटर
                                                            </span>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>
                                        {formData.assignedVillages.length > 0 && (
                                            <div style={{ marginTop: '8px', padding: '8px 12px', background: '#ECFDF5', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#047857' }}>
                                                ✅ {formData.assignedVillages.length} गांव चुने गए: {formData.assignedVillages.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
                    <div className="card" style={{ background: 'white', width: '100%', maxWidth: '520px', padding: '28px 32px', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: '900' }}>कार्यकर्ता विवरण अपडेट करें</h2>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setShowPasswordReset(showEdit)} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><Key size={18} /></button>
                                <button onClick={() => setShowEdit(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}><X size={20} /></button>
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
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>कार्यकर्ता पद (Role)</label>
                                <select value={editData.type} onChange={e => {
                                    setEditData({ ...editData, type: e.target.value });
                                    setBoothSearch('');
                                    setVillageSearch('');
                                }} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px', background: 'white' }}>
                                    <option value="ELECTION_MANAGER">🗄️ इलेक्शन मैनेजर (Election Manager)</option>
                                    <option value="BOOTH_MANAGER">🏢 बूथ मैनेजर (Booth Manager)</option>
                                    <option value="PANNA_PRAMUKH">📄 पन्ना प्रमुख (Panna Pramukh)</option>
                                    <option value="FIELD">🚶‍♂️ ग्राउंड कार्यकर्ता (Ground Worker)</option>
                                </select>
                            </div>

                            {/* Booth Manager: Searchable Multi-Booth Picker in Edit Modal */}
                            {editData.type === 'BOOTH_MANAGER' && (() => {
                                const filteredBooths = availableBoothsForEdit.filter(b =>
                                    b.number.toString().includes(boothSearch) ||
                                    (b.name && b.name.toLowerCase().includes(boothSearch.toLowerCase())) ||
                                    (b.villageNameHi && b.villageNameHi.toLowerCase().includes(boothSearch.toLowerCase()))
                                );
                                return (
                                    <div style={{ marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: '800' }}>🗳️ बूथ चुनें (एक से अधिक)</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button type="button" onClick={() => setEditData({ ...editData, boothIds: availableBoothsForEdit.map(b => b.id.toString()), boothId: availableBoothsForEdit[0]?.id.toString() || '' })} style={{ fontSize: '11px', color: '#2563EB', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>सभी चुनें</button>
                                                <span style={{ color: '#CBD5E1' }}>|</span>
                                                <button type="button" onClick={() => setEditData({ ...editData, boothIds: [], boothId: '' })} style={{ fontSize: '11px', color: '#EF4444', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>हटाएं</button>
                                            </div>
                                        </div>

                                        {/* Sticky Search Bar */}
                                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
                                            <input
                                                type="text"
                                                placeholder="🔍 बूथ नंबर, नाम या गांव से खोजें..."
                                                value={boothSearch}
                                                onChange={e => setBoothSearch(e.target.value)}
                                                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '13px', background: 'white' }}
                                            />
                                        </div>

                                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px', background: '#FAFAFA' }}>
                                            {filteredBooths.length === 0 ? (
                                                <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>कोई बूथ नहीं मिला</div>
                                            ) : (
                                                filteredBooths.map((b: any) => {
                                                    const isChecked = editData.boothIds.includes(b.id.toString());
                                                    return (
                                                        <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', background: isChecked ? '#EFF6FF' : 'transparent', marginBottom: '4px', border: isChecked ? '1px solid #BFDBFE' : '1px solid transparent' }}>
                                                            <input
                                                                type="checkbox"
                                                                value={b.id}
                                                                checked={isChecked}
                                                                onChange={e => {
                                                                    const newIds = e.target.checked
                                                                        ? [...editData.boothIds, b.id.toString()]
                                                                        : editData.boothIds.filter(id => id !== b.id.toString());
                                                                    const primaryBooth = newIds.length > 0 ? newIds[0] : '';
                                                                    setEditData({ ...editData, boothIds: newIds, boothId: primaryBooth });
                                                                }}
                                                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563EB' }}
                                                            />
                                                            <div>
                                                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>बूथ {b.number}: {b.name || 'N/A'}</div>
                                                                {b.villageNameHi && <div style={{ fontSize: '11px', color: '#64748B' }}>गांव: {b.villageNameHi}</div>}
                                                            </div>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>
                                        {editData.boothIds.length > 0 && (
                                            <div style={{ marginTop: '8px', padding: '8px 12px', background: '#DCFCE7', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#15803D' }}>
                                                ✅ {editData.boothIds.length} बूथ चुने गए — प्राइमरी: बूथ #{availableBoothsForEdit.find((b: any) => b.id.toString() === editData.boothIds[0])?.number || '-'}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Panna Pramukh: Single Booth in Edit Modal */}
                            {editData.type === 'PANNA_PRAMUKH' && (
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>बूथ बदलें</label>
                                    <select value={editData.boothId} onChange={e => setEditData({ ...editData, boothId: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px', background: 'white' }}>
                                        <option value="">कोई बूथ नहीं</option>
                                        {availableBoothsForEdit.map((b: any) => <option key={b.id} value={b.id}>बूथ {b.number}: {b.name || 'N/A'}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Ground Worker (FIELD): Searchable Multi-Village in Edit Modal */}
                            {editData.type === 'FIELD' && (() => {
                                const filteredVillages = villages.filter(v =>
                                    v.name.toLowerCase().includes(villageSearch.toLowerCase())
                                );
                                return (
                                    <div style={{ marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '14px', fontWeight: '800' }}>🏡 गांव असाइन करें (एक से अधिक चुन सकते हैं)</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button type="button" onClick={() => setEditData({ ...editData, assignedVillages: villages.map(v => v.name) })} style={{ fontSize: '11px', color: '#2563EB', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>सभी चुनें</button>
                                                <span style={{ color: '#CBD5E1' }}>|</span>
                                                <button type="button" onClick={() => setEditData({ ...editData, assignedVillages: [] })} style={{ fontSize: '11px', color: '#EF4444', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>हटाएं</button>
                                            </div>
                                        </div>

                                        {/* Sticky Village Search Bar */}
                                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
                                            <input
                                                type="text"
                                                placeholder="🔍 गांव का नाम खोजें..."
                                                value={villageSearch}
                                                onChange={e => setVillageSearch(e.target.value)}
                                                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '13px', background: 'white' }}
                                            />
                                        </div>

                                        <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px', background: '#FAFAFA' }}>
                                            {filteredVillages.length === 0 ? (
                                                <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>कोई गांव नहीं मिला</div>
                                            ) : (
                                                filteredVillages.map(v => {
                                                    const isChecked = editData.assignedVillages.includes(v.name);
                                                    return (
                                                        <label key={v.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: isChecked ? '#ECFDF5' : 'transparent', marginBottom: '4px', border: isChecked ? '1px solid #A7F3D0' : '1px solid transparent' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    value={v.name}
                                                                    checked={isChecked}
                                                                    onChange={e => {
                                                                        const newVils = e.target.checked
                                                                            ? [...editData.assignedVillages, v.name]
                                                                            : editData.assignedVillages.filter(name => name !== v.name);
                                                                        setEditData({ ...editData, assignedVillages: newVils });
                                                                    }}
                                                                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#059669' }}
                                                                />
                                                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{v.name}</span>
                                                            </div>
                                                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', background: '#D1FAE5', padding: '2px 8px', borderRadius: '6px' }}>
                                                                {v.voterCount.toLocaleString('hi-IN')} वोटर
                                                            </span>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>
                                        {editData.assignedVillages.length > 0 && (
                                            <div style={{ marginTop: '8px', padding: '8px 12px', background: '#ECFDF5', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#047857' }}>
                                                ✅ {editData.assignedVillages.length} गांव चुने गए: {editData.assignedVillages.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button type="button" onClick={() => setShowEdit(null)} style={{ flex: 1, padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px' }}>कैंसिल</button>
                                <button type="submit" style={{ flex: 1, padding: '14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900' }}>अपडेट करें</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Voter List Modal (Jan-Sampark & Campaign Progress) */}
            {showVoterList && (() => {
                const total = viewingVoters.length;
                const contacted = viewingVoters.filter(v => {
                    const fb = v.feedbacks?.[0];
                    return (fb?.supportStatus && fb.supportStatus !== 'Neutral') || (v.supportStatus && v.supportStatus !== 'Neutral') || fb?.notes || v.notes || fb?.updatedByName || v.updatedByName;
                }).length;
                const supporters = viewingVoters.filter(v => {
                    const fb = v.feedbacks?.[0];
                    return (fb?.supportStatus === 'Support') || (v.supportStatus === 'Support');
                }).length;
                const pending = total - contacted;

                return (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <div className="card" style={{ background: 'white', width: '100%', maxWidth: '750px', borderRadius: '28px', overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                            {/* Modal Header */}
                            <div style={{ padding: '24px 32px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>पन्ना प्रमुख जनसंपर्क रिपोर्ट</h2>
                                    <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{showVoterList.name} (बूथ #{showVoterList.booth?.number || '-'})</p>
                                </div>
                                <button onClick={() => setShowVoterList(null)} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            {/* Summary Bar */}
                            <div style={{ padding: '16px 32px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
                                <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>कुल वोटर</div>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>{total}</div>
                                </div>
                                <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                                    <div style={{ fontSize: '11px', color: '#15803D', fontWeight: '700' }}>संपर्क हुआ</div>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#15803D' }}>{contacted}</div>
                                </div>
                                <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                                    <div style={{ fontSize: '11px', color: '#1D4ED8', fontWeight: '700' }}>समर्थक</div>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#1D4ED8' }}>{supporters}</div>
                                </div>
                                <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #FED7AA' }}>
                                    <div style={{ fontSize: '11px', color: '#C2410C', fontWeight: '700' }}>संपर्क बाकी</div>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#C2410C' }}>{pending}</div>
                                </div>
                            </div>

                            {/* Voters List */}
                            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {viewingVoters.map((v: any) => {
                                        const fb = v.feedbacks?.[0];
                                        const isContacted = Boolean((fb?.supportStatus && fb.supportStatus !== 'Neutral') || (v.supportStatus && v.supportStatus !== 'Neutral') || fb?.notes || v.notes || fb?.updatedByName || v.updatedByName);
                                        const currentSupport = fb?.supportStatus || v.supportStatus || 'Neutral';
                                        const notes = fb?.notes || v.notes;
                                        const updater = fb?.updatedByName || v.updatedByName;

                                        return (
                                            <div key={v.id} style={{ padding: '16px', background: isContacted ? '#F8FAFC' : '#FFFFFF', borderRadius: '16px', border: isContacted ? '1px solid #CBD5E1' : '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '800', fontSize: '15px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {v.name}
                                                            {v.houseNumber && (
                                                                <span style={{ fontSize: '11px', background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                                                    🏠 मकान: {v.houseNumber}
                                                                </span>
                                                            )}
                                                            {v.village && (
                                                                <span style={{ fontSize: '11px', color: '#64748B' }}>
                                                                    📍 {v.village}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                            <span>{v.gender === 'M' ? 'पुरुष' : 'महिला'}, {v.age} वर्ष</span>
                                                            {v.epic && <span>EPIC: <b>{v.epic}</b></span>}
                                                            {v.mobile && <span>📞 <b>{v.mobile}</b></span>}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {isContacted ? (
                                                            <span style={{ padding: '4px 10px', borderRadius: '20px', background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: '800' }}>
                                                                ✓ संपर्क संपन्न
                                                            </span>
                                                        ) : (
                                                            <span style={{ padding: '4px 10px', borderRadius: '20px', background: '#FEF3C7', color: '#B45309', fontSize: '11px', fontWeight: '800' }}>
                                                                ⏳ संपर्क बाकी
                                                            </span>
                                                        )}

                                                        {currentSupport === 'Support' && (
                                                            <span style={{ padding: '4px 10px', borderRadius: '20px', background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: '800' }}>
                                                                🟢 समर्थक
                                                            </span>
                                                        )}
                                                        {currentSupport === 'Oppose' && (
                                                            <span style={{ padding: '4px 10px', borderRadius: '20px', background: '#FEE2E2', color: '#DC2626', fontSize: '11px', fontWeight: '800' }}>
                                                                🔴 विरोधी
                                                            </span>
                                                        )}
                                                        {currentSupport === 'Neutral' && (
                                                            <span style={{ padding: '4px 10px', borderRadius: '20px', background: '#F1F5F9', color: '#64748B', fontSize: '11px', fontWeight: '700' }}>
                                                                ⚪ न्यूट्रल
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {(notes || updater) && (
                                                    <div style={{ marginTop: '10px', padding: '8px 12px', background: '#F1F5F9', borderRadius: '10px', fontSize: '12px', color: '#334155', borderLeft: '3px solid #2563EB' }}>
                                                        {notes && <div><b>📝 अपडेट / नोट:</b> {notes}</div>}
                                                        {updater && <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>👤 दर्जकर्ता: {updater}</div>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Voter Assignment Modal */}
            {showAssignVoters && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="card" style={{ background: 'white', width: '100%', maxWidth: '600px', padding: '32px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '900' }}>परिवारवार वोटर असाइनमेंट</h2>
                                <p style={{ fontSize: '13px', color: '#64748B' }}>{showAssignVoters.name} (बूथ {showAssignVoters.booth.number})</p>
                            </div>
                            <button onClick={() => setShowAssignVoters(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '6px' }}><X size={20} /></button>
                        </div>

                        {/* Quick Preference Buttons */}
                        <div style={{ marginBottom: '24px', padding: '16px', background: '#F0FDF4', borderRadius: '16px', border: '1px solid #BBF7D0' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#166534', marginBottom: '12px' }}>मकान क्रम से परिवार असाइन करें (Family-Atomic Assignment)</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => handleAutoAssign(50)} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #86EFAC', borderRadius: '12px', color: '#15803D', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Zap size={16} /> ~50 वोटर (मकानवार)
                                </button>
                                <button onClick={() => handleAutoAssign(100)} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #86EFAC', borderRadius: '12px', color: '#15803D', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Zap size={16} /> ~100 वोटर (मकानवार)
                                </button>
                            </div>
                            <p style={{ fontSize: '11px', color: '#475569', marginTop: '10px', lineHeight: '1.5' }}>
                                💡 <b>नियम:</b> एड्रेस/मकान संख्या के क्रम में पूरे-पूरे परिवार असाइन होंगे ताकि किसी भी परिवार के सदस्य अलग-अलग पन्ना प्रमुखों में न बंटें (उदा. 92 के बाद अगला मकान 8 सदस्यों का होने पर कुल 100 मतदाता पूरे परिवार सहित असाइन होंगे)।
                            </p>
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
                                            <div style={{ fontWeight: '700' }}>{v.name} {v.houseNumber ? <span style={{ color: '#2563EB', fontSize: '11px', fontWeight: '800' }}>(मकान: {v.houseNumber})</span> : ''}</div>
                                            <div style={{ fontSize: '11px', color: '#64748B' }}>{v.gender === 'M' ? 'पुरुष' : 'महिला'}, {v.age} वर्ष | EPIC: {v.epic || 'N/A'}</div>
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

            {/* Password Reset Modal */}
            {showPasswordReset && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
                    <div className="card" style={{ background: 'white', width: '100%', maxWidth: '450px', padding: '32px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '900' }}>पासवर्ड रीसेट करें</h2>
                            <button onClick={() => { setShowPasswordReset(null); setNewPassword(''); }} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '6px' }}><X size={20} /></button>
                        </div>
                        <p style={{ marginBottom: '16px', fontSize: '14px', color: '#64748B' }}>कार्यकर्ता: <span style={{ fontWeight: '800', color: '#1E293B' }}>{showPasswordReset.name}</span></p>
                        <form onSubmit={handlePasswordUpdate}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>नया पासवर्ड</label>
                                <div style={{ position: 'relative' }}>
                                    <Key size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                    <input
                                        required
                                        type="text"
                                        placeholder="नया पासवर्ड लिखें"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        style={{ width: '100%', padding: '14px 14px 14px 44px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px' }}
                                    />
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748B', fontWeight: '700' }}>
                                    नियम: कम से कम 6 अक्षर, 1 बड़ा अक्षर, 1 चिन्ह, 1 अंक
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => { setShowPasswordReset(null); setNewPassword(''); }} style={{ flex: 1, padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: '700' }}>कैंसिल</button>
                                <button type="submit" style={{ flex: 1, padding: '14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900' }}>अपडेट करें</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
