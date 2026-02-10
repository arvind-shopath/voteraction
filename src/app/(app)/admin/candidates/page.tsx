'use client';

import React, { useState, useEffect } from 'react';
import {
    getAssemblies, getUsers, getCampaigns, updateAssembly, deleteAssembly,
    toggleCandidateStatus, setUserStatus, deleteUser, updateUserName, assignUserToAssembly, assignUserToCampaign,
    clearAppCache, assignTeamToAssembly, removeTeamMember
} from '@/app/actions/admin';
import {
    Users, Star, MapPin, Search, Filter,
    ChevronDown, ChevronRight, Edit,
    LayoutGrid, List, Search as SearchIcon,
    Shield, Share2, Users as UsersIcon, Settings, X, CheckCircle, Trash2, UserPlus, Building2,
    AlertCircle, Trash, Lock, Key, Ghost, RefreshCw
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function CandidatesPage() {
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');

    // Modal States
    const [manageTeamModalOpen, setManageTeamModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [newName, setNewName] = useState('');

    // Message/Notify State
    const [msg, setMsg] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [aData, uData, cData] = await Promise.all([
                getAssemblies(),
                getUsers(),
                getCampaigns()
            ]);
            setAssemblies(aData);
            setUsers(uData);
            setCampaigns(cData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const showMsg = (title: string, text: string, type: 'success' | 'error' = 'success') => {
        setMsg({ title, text, type });
        setTimeout(() => setMsg(null), 3000);
    };

    // Action Confirmation Handlers
    const handleConfirmAssignToTeam = async (userId: number | null, campaignId: number | null) => {
        try {
            if (!userId) {
                fetchData();
                return;
            }

            // UNASSIGN PATH
            if (campaignId === null) {
                await removeTeamMember(userId, selectedUser.assemblyId);
                fetchData();
                return;
            }

            const userToAssign = users.find(u => u.id === userId);
            // If it's a SOCIAL_MEDIA user, we assign to ASSEMBLY (shared) instead of CAMPAIGN (exclusive)
            if (userToAssign?.role === 'SOCIAL_MEDIA') {
                await assignUserToAssembly(userId, selectedUser.assemblyId);
            } else {
                await assignUserToCampaign(userId, campaignId);
            }
            fetchData();
        } catch (e: any) {
            showMsg("त्रुटि", e.message, "error");
        }
    };
    const handleConfirmEditName = async () => {
        if (!selectedUser || !newName.trim()) return;
        try {
            await updateUserName(selectedUser.id, newName.trim());
            showMsg("सफलता", "नाम अपडेट कर दिया गया है।");
            setEditModalOpen(false);
            fetchData();
        } catch (e: any) {
            showMsg("त्रुटि", e.message, "error");
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedUser) return;
        try {
            await deleteUser(selectedUser.id);
            showMsg("सफलता", "यूजर को हटा दिया गया है।");
            setDeleteModalOpen(false);
            fetchData();
        } catch (e: any) {
            showMsg("त्रुटि", e.message, "error");
        }
    };

    const handleConfirmStatusToggle = async () => {
        if (!selectedUser) return;
        try {
            const newStatus = selectedUser.status === 'Active' ? 'Pending' : 'Active';
            await setUserStatus(selectedUser.id, newStatus);
            showMsg("सफलता", `स्टेटस ${newStatus === 'Active' ? 'एक्टिव' : 'पेंडिंग'} कर दिया गया है।`);
            setStatusModalOpen(false);
            fetchData();
        } catch (e: any) {
            showMsg("त्रुटि", e.message, "error");
        }
    };

    const handleConfirmAssignAssembly = async (assemblyId: number | null) => {
        if (!selectedUser) return;
        try {
            await assignUserToAssembly(selectedUser.id, assemblyId);
            showMsg("सफलता", assemblyId ? "विधानसभा असाइन कर दी गई है।" : "विधानसभा से हटा दिया गया है।");
            setAssignModalOpen(false);
            fetchData();
        } catch (e: any) {
            showMsg("त्रुटि", e.message, "error");
        }
    };

    const handleTriggerEditName = (u: any) => {
        setSelectedUser(u);
        setNewName(u.name || '');
        setEditModalOpen(true);
    };

    const handleTriggerDelete = (u: any) => {
        setSelectedUser(u);
        setDeleteModalOpen(true);
    };

    const handleTriggerStatusChange = (u: any) => {
        setSelectedUser(u);
        setStatusModalOpen(true);
    };

    const handleTriggerManageTeam = (u: any) => {
        setSelectedUser(u);
        setManageTeamModalOpen(true);
    };

    const handleTriggerAssign = (u: any) => {
        setSelectedUser(u);
        setAssignModalOpen(true);
    };

    // Filter Logic
    const candidates = users.filter(u => u.role === 'CANDIDATE');

    // We want to show:
    // 1. All actual candidate users
    // 2. All empty assembly seats (assemblies that have no MANAGER user assigned)
    const emptySeats = assemblies.filter(a => !users.some(u => u.role === 'CANDIDATE' && u.assemblyId === a.id));

    const displayItems = [
        ...candidates.map(c => ({ type: 'candidate', data: c })),
        ...emptySeats.map(s => ({ type: 'seat', data: s }))
    ].filter(item => {
        const name = item.type === 'candidate' ? item.data.name : 'खाली सीट';
        const assemblyName = item.type === 'candidate' ? item.data.assembly?.name : item.data.name;
        const searchLower = search.toLowerCase();
        return (name?.toLowerCase().includes(searchLower) || assemblyName?.toLowerCase().includes(searchLower));
    });

    return (
        <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto', background: '#F8FAFC', minHeight: '100vh' }}>

            {/* Notification Toast */}
            {msg && (
                <div style={{
                    position: 'fixed', top: '24px', right: '24px', zIndex: 99999,
                    padding: '16px 24px', borderRadius: '20px', background: msg.type === 'success' ? '#10B981' : '#EF4444',
                    color: 'white', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'slideIn 0.3s ease-out'
                }}>
                    {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {msg.text}
                </div>
            )}

            <div style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                        कैंडिडेट <span style={{ color: '#2563EB' }}>मैनेजमेंट</span>
                    </h1>
                    <p style={{ color: '#64748B', fontSize: '16px', fontWeight: '600' }}>सभी विधानसभा क्षेत्रों के उम्मीदवारों और विधानसभा सीटों की निगरानी</p>
                </div>

                <div style={{ display: 'flex', gap: '16px', background: 'white', padding: '8px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <button
                        onClick={() => setViewMode('grid')}
                        style={{ padding: '10px 20px', borderRadius: '18px', border: 'none', background: viewMode === 'grid' ? '#2563EB' : 'transparent', color: viewMode === 'grid' ? 'white' : '#64748B', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                    >
                        <LayoutGrid size={18} /> ग्रिड
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{ padding: '10px 20px', borderRadius: '18px', border: 'none', background: viewMode === 'list' ? '#2563EB' : 'transparent', color: viewMode === 'list' ? 'white' : '#64748B', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                    >
                        <List size={18} /> लिस्ट
                    </button>
                </div>
            </div>

            {/* Sticky Search Bar */}
            <div style={{ position: 'sticky', top: '24px', zIndex: 100, marginBottom: '40px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', padding: '12px', borderRadius: '28px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <SearchIcon style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={20} />
                        <input
                            placeholder="कैंडिडेट का नाम या विधानसभा खोजें..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '16px 16px 16px 56px', borderRadius: '20px', border: 'none', background: '#F8FAFC', outline: 'none', fontWeight: '700', fontSize: '15px' }}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '100px', textAlign: 'center' }}>
                    <RefreshCw className="animate-spin" size={48} color="#2563EB" style={{ margin: '0 auto 20px' }} />
                    <p style={{ fontWeight: '800', color: '#64748B' }}>डेटा लोड हो रहा है...</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(350px, 1fr))' : '1fr',
                    gap: '28px'
                }}>
                    {displayItems.map((item: any) => {
                        if (item.type === 'candidate') {
                            const u = item.data;
                            const a = assemblies.find(as => as.id === u.assemblyId);
                            const uIsActive = u.status === 'Active';

                            const smCount = users.filter(usr =>
                                ['SOCIAL_MEDIA', 'SM_MANAGER', 'DESIGNER', 'EDITOR'].includes(usr.role) &&
                                (usr.assemblyId === u.assemblyId || usr.sharedAssignments?.some((sa: any) => sa.assemblyId === u.assemblyId))
                            ).length;
                            const fieldCount = u.campaignId ? users.filter(usr => usr.campaignId === u.campaignId && usr.role === 'WORKER').length : 0;

                            return (
                                <div key={`candidate-${u.id}`} style={{
                                    background: 'white',
                                    border: u.assemblyId ? '1px solid #E2E8F0' : '2px dashed #F59E0B',
                                    borderRadius: '32px',
                                    padding: '28px',
                                    position: 'relative',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}>
                                    <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ width: '80px', height: '80px', background: u.assemblyId ? '#F8FAFC' : '#FFFBEB', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                                {u.image ? <img src={u.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={36} color={u.assemblyId ? "#94A3B8" : "#D97706"} />}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleTriggerEditName(u); }}
                                                style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'white', border: '1px solid #E2E8F0', width: '28px', height: '28px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                            >
                                                <Edit size={14} />
                                            </button>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', marginBottom: '4px' }}>{u.name}</h3>
                                                <div
                                                    onClick={() => handleTriggerStatusChange(u)}
                                                    style={{ padding: '4px 12px', borderRadius: '12px', background: uIsActive ? '#ECFDF5' : '#F1F5F9', color: uIsActive ? '#10B981' : '#64748B', fontSize: '11px', fontWeight: '800', cursor: 'pointer', border: uIsActive ? '1px solid #A7F3D0' : '1px solid #E2E8F0' }}
                                                >
                                                    {uIsActive ? 'Active' : 'Pending'}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '13px', fontWeight: '700' }}>
                                                <MapPin size={14} /> {a ? a.name : 'No Assembly Assigned'}
                                            </div>
                                            <div style={{ marginTop: '4px', fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>{u.mobile}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                        <div style={{ padding: '16px', background: '#F0F9FF', borderRadius: '24px', border: '1px solid #E0F2FE' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#0369A1', marginBottom: '4px', textTransform: 'uppercase' }}>सोशल सेना</div>
                                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#0C4A6E' }}>{smCount} <span style={{ fontSize: '12px', fontWeight: '700', color: '#0369A1' }}>सदस्य</span></div>
                                        </div>
                                        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>कार्यकर्ता</div>
                                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#334155' }}>{fieldCount} <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>फील्ड</span></div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleTriggerManageTeam(u)}
                                            style={{ flex: 3.5, padding: '14px', borderRadius: '18px', background: '#0F172A', color: 'white', border: 'none', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            <Shield size={16} /> टीम प्रबंधन
                                        </button>
                                        <button
                                            onClick={() => handleTriggerAssign(u)}
                                            style={{ flex: 1, padding: '14px', borderRadius: '18px', background: 'white', border: '1px solid #E2E8F0', color: '#64748B', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <Building2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleTriggerDelete(u)}
                                            style={{ flex: 1, padding: '14px', borderRadius: '18px', background: 'white', border: '1px solid #FEE2E2', color: '#EF4444', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        } else {
                            const s = item.data;
                            return (
                                <div key={`seat-${s.id}`} style={{
                                    background: '#FFFFFF',
                                    border: '2px dashed #E2E8F0',
                                    borderRadius: '32px',
                                    padding: '28px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    gap: '16px'
                                }}>
                                    <div style={{ width: '64px', height: '64px', background: '#F1F5F9', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                                        <Ghost size={32} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#64748B' }}>{s.name}</h3>
                                        <p style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>{s.district}, {s.state}</p>
                                    </div>
                                    <div style={{ padding: '8px 16px', background: '#FFF7ED', color: '#D97706', borderRadius: '12px', fontSize: '11px', fontWeight: '800', border: '1px solid #FFEDD5' }}>कैंडिडेट असाइन नहीं है</div>
                                    <button style={{ marginTop: '8px', padding: '12px 24px', borderRadius: '16px', background: 'white', border: '1px solid #E2E8F0', color: '#0F172A', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                        <UserPlus size={16} /> कैंडिडेट जोड़ें
                                    </button>
                                </div>
                            );
                        }
                    })}
                </div>
            )}

            {/* Modals */}
            {manageTeamModalOpen && selectedUser && (
                <ManageTeamModal
                    candidate={selectedUser}
                    users={users}
                    onAssign={handleConfirmAssignToTeam}
                    onClose={() => setManageTeamModalOpen(false)}
                />
            )}

            {editModalOpen && selectedUser && (
                <CustomModal
                    title="नाम अपडेट करें"
                    onClose={() => setEditModalOpen(false)}
                    onConfirm={handleConfirmEditName}
                >
                    <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="नया नाम लिखें"
                        style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: '700', fontSize: '16px' }}
                    />
                </CustomModal>
            )}

            {deleteModalOpen && selectedUser && (
                <CustomModal
                    title="यूजर हटाएं"
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    confirmLabel="हां, हटाएं"
                    confirmType="danger"
                >
                    <p style={{ fontWeight: '700', color: '#64748B' }}>क्या आप वाकई <span style={{ color: '#0F172A' }}>{selectedUser.name}</span> को हटाना चाहते हैं? यह क्रिया वापस नहीं ली जा सकती।</p>
                </CustomModal>
            )}

            {statusModalOpen && selectedUser && (
                <CustomModal
                    title="स्टेटस बदलें"
                    onClose={() => setStatusModalOpen(false)}
                    onConfirm={handleConfirmStatusToggle}
                >
                    <p style={{ fontWeight: '700', color: '#64748B' }}>यूजर <span style={{ color: '#0F172A' }}>{selectedUser.name}</span> का स्टेटस <span style={{ color: '#2563EB' }}>{selectedUser.status === 'Active' ? 'Pending' : 'Active'}</span> करना चाहते हैं?</p>
                </CustomModal>
            )}

            {assignModalOpen && selectedUser && (
                <SelectAssemblyModal
                    assemblies={assemblies}
                    currentId={selectedUser.assemblyId}
                    onClose={() => setAssignModalOpen(false)}
                    onConfirm={handleConfirmAssignAssembly}
                />
            )}

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

function ManageTeamModal({ candidate, users, onAssign, onClose }: any) {
    const [search, setSearch] = useState('');

    const currentLocalTeam = candidate.campaignId
        ? users.filter((u: any) =>
            u.campaignId === candidate.campaignId &&
            u.id !== candidate.id &&
            u.role === 'WORKER'
        )
        : [];

    const currentSocialSena = users.filter((u: any) =>
        ['SOCIAL_MEDIA', 'SM_MANAGER', 'DESIGNER', 'EDITOR'].includes(u.role) && (
            (candidate.assemblyId && u.assemblyId === candidate.assemblyId) ||
            (u.sharedAssignments && u.sharedAssignments.some((sa: any) => sa.assemblyId === candidate.assemblyId))
        )
    );

    // Fans, SM, Workers in the pool (no assembly or same assembly but no campaign)
    // Filter out Admins and Super Admins from being managed as team members
    const pool = users.filter((u: any) =>
        ['SOCIAL_MEDIA', 'SM_MANAGER', 'DESIGNER', 'EDITOR', 'WORKER'].includes(u.role) &&
        (
            (['SOCIAL_MEDIA', 'SM_MANAGER', 'DESIGNER', 'EDITOR'].includes(u.role) && !currentSocialSena.find((cs: any) => cs.id === u.id)) ||
            (u.role === 'WORKER' && !u.campaignId) ||
            (u.role === 'WORKER' && candidate.campaignId && u.campaignId === candidate.campaignId)
        )
    );

    const filteredPool = pool.filter((u: any) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.mobile?.includes(search)
    );

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px', backdropFilter: 'blur(8px)' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0 }}></div>
            <div style={{ background: 'white', borderRadius: '32px', maxWidth: '600px', width: '100%', position: 'relative', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>टीम प्रबंधन</h3>
                        <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>कैंडिडेट: {candidate.name}</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#F8FAFC', border: 'none', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Current Team Sections */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>सोशल सेना टीम ({currentSocialSena.length})</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                                {currentSocialSena.map((u: any) => (
                                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #DBEAFE' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E40AF' }}>{u.name}</span>
                                        <button onClick={() => onAssign(u.id, null)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px' }}><X size={14} /></button>
                                    </div>
                                ))}
                                {currentSocialSena.length === 0 && <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>कोई सोशल सेना सदस्य नहीं</p>}
                            </div>
                        </div>

                        <div>
                            <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>लोकल टीम ({currentLocalTeam.length})</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                                {currentLocalTeam.map((u: any) => (
                                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#F1F5F9', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{u.name}</span>
                                        <button onClick={() => onAssign(u.id, null)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px' }}><X size={14} /></button>
                                    </div>
                                ))}
                                {currentLocalTeam.length === 0 && <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>कोई लोकल सदस्य नहीं</p>}
                            </div>
                        </div>
                    </div>

                    {/* Add to Team */}
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>सदस्य जोड़ें (Pool)</h4>
                            <button
                                onClick={async () => {
                                    try {
                                        await assignTeamToAssembly('SOCIAL_MEDIA', candidate.assemblyId);
                                        // Refresh data via parent handler if available
                                        onAssign(null, null);
                                    } catch (e: any) {
                                        alert(e.message);
                                    }
                                }}
                                style={{ padding: '6px 12px', background: '#EFF6FF', border: '1px solid #2563EB', color: '#2563EB', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                            >
                                + पूरी सोशल सेना जोड़ें
                            </button>
                        </div>
                        <div style={{ position: 'relative', marginBottom: '12px' }}>
                            <SearchIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
                            <input
                                placeholder="यूजर का नाम या मोबाइल..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: '600' }}
                            />
                        </div>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {filteredPool.filter((u: any) => u.campaignId !== candidate.campaignId || !candidate.campaignId).map((u: any) => (
                                <div key={u.id} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #F8FAFC', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', color: '#1E293B', fontSize: '14px' }}>{u.name}</div>
                                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{['SOCIAL_MEDIA', 'SM_MANAGER', 'DESIGNER', 'EDITOR'].includes(u.role) ? 'Social Sena' : u.role} • {u.mobile}</div>
                                    </div>
                                    {u.role !== 'SOCIAL_MEDIA' ? (
                                        <button
                                            onClick={() => onAssign(u.id, candidate.campaignId)}
                                            style={{ padding: '6px 12px', background: 'white', border: '1px solid #2563EB', color: '#2563EB', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                                        >
                                            + जोड़ें
                                        </button>
                                    ) : (
                                        <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '800', fontStyle: 'italic' }}>पूरी टीम असाइन करें</span>
                                    )}
                                </div>
                            ))}
                            {filteredPool.length === 0 && <p style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '12px', fontWeight: '600' }}>कोई उपलब्ध सदस्य नहीं</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CustomModal({ title, children, onClose, onConfirm, confirmLabel = "अपडेट करें", confirmType = "primary" }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '20px', backdropFilter: 'blur(8px)' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0 }}></div>
            <div style={{ background: 'white', borderRadius: '32px', maxWidth: '450px', width: '100%', position: 'relative', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: '#F8FAFC', border: 'none', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ padding: '32px' }}>{children}</div>
                <div style={{ padding: '24px 32px', background: '#F8FAFC', display: 'flex', gap: '12px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>रद्द करें</button>
                    <button onClick={onConfirm} style={{ flex: 1.5, padding: '14px', borderRadius: '16px', background: confirmType === 'danger' ? '#EF4444' : '#2563EB', color: 'white', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}

function SelectAssemblyModal({ assemblies, currentId, onClose, onConfirm }: any) {
    const [selected, setSelected] = useState(currentId || '');
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '20px', backdropFilter: 'blur(8px)' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0 }}></div>
            <div style={{ background: 'white', borderRadius: '32px', maxWidth: '450px', width: '100%', position: 'relative', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>विधनसभा असाइन करें</h3>
                    <button onClick={onClose} style={{ background: '#F8FAFC', border: 'none', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ padding: '32px' }}>
                    <select
                        value={selected}
                        onChange={e => setSelected(e.target.value)}
                        style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: '700', fontSize: '15px', background: 'white' }}
                    >
                        <option value="">कोई नहीं (छोड़ें)</option>
                        {assemblies.map((a: any) => (
                            <option key={a.id} value={a.id}>{a.name} ({a.district})</option>
                        ))}
                    </select>
                </div>
                <div style={{ padding: '24px 32px', background: '#F8FAFC', display: 'flex', gap: '12px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>रद्द करें</button>
                    <button onClick={() => onConfirm(selected ? parseInt(selected) : null)} style={{ flex: 1.5, padding: '14px', borderRadius: '16px', background: '#2563EB', color: 'white', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>असाइन करें</button>
                </div>
            </div>
        </div>
    );
}
