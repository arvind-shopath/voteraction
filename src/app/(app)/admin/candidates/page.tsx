'use client';

import React, { useState, useEffect } from 'react';
import {
    getAssemblies, getUsers, getCampaigns, updateAssembly, deleteAssembly,
    toggleCandidateStatus, setUserStatus, deleteUser, updateUserName, assignUserToAssembly, assignUserToCampaign
} from '@/app/actions/admin';
import {
    Users, Star, MapPin, Search, Filter,
    ChevronDown, ChevronRight, Edit,
    LayoutGrid, List, Search as SearchIcon,
    Shield, Share2, Users as UsersIcon, Settings, X, CheckCircle, Trash2, UserPlus, Building2,
    AlertCircle, Trash, Lock, Key, Ghost
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_FEATURES, FEATURE_CATEGORIES, getEnabledFeatures } from '@/lib/features';

export default function CandidatesPage() {
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Modals State
    const [selectAssemblyModalOpen, setSelectAssemblyModalOpen] = useState(false);
    const [editNameModalOpen, setEditNameModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [manageTeamModalOpen, setManageTeamModalOpen] = useState(false);
    const [msgModalOpen, setMsgModalOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedAssembly, setSelectedAssembly] = useState<any>(null);
    const [newName, setNewName] = useState('');
    const [targetStatus, setTargetStatus] = useState('');
    const [modalMsg, setModalMsg] = useState({ title: '', message: '', type: 'success' });

    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [assemblyData, userData] = await Promise.all([
                getAssemblies(),
                getUsers()
            ]);
            setAssemblies(assemblyData || []);
            setUsers(userData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }

    const showMsg = (title: string, message: string, type: string = 'success') => {
        setModalMsg({ title, message, type });
        setMsgModalOpen(true);
    };

    // 1. Get all Managers
    const candidates = users.filter(u => u.role === 'MANAGER');

    // 2. Identify Assemblies that don't have ANY manager assigned
    const unassignedAssemblies = assemblies.filter(a =>
        !candidates.some(c => c.assemblyId === a.id)
    );

    // 3. Combine for display
    const rawItems = [
        ...candidates.map(u => ({ type: 'candidate', data: u })),
        ...unassignedAssemblies.map(a => ({ type: 'empty_seat', data: a }))
    ];

    const displayItems = rawItems.filter(item => {
        const query = searchQuery.toLowerCase();
        if (item.type === 'candidate') {
            const u = item.data;
            const assembly = assemblies.find(a => a.id === u.assemblyId);
            return !query ||
                u.name?.toLowerCase().includes(query) ||
                u.mobile?.includes(query) ||
                assembly?.name?.toLowerCase().includes(query);
        } else {
            const a = item.data;
            return !query || a.name?.toLowerCase().includes(query) || a.number?.toString().includes(query);
        }
    });

    // Modal Trigger Handlers
    const handleTriggerEditName = (user: any) => {
        setSelectedUser(user);
        setNewName(user.name);
        setEditNameModalOpen(true);
    };

    const handleTriggerDelete = (user: any) => {
        setSelectedUser(user);
        setDeleteModalOpen(true);
    };

    const handleTriggerStatusChange = (user: any) => {
        setSelectedUser(user);
        setTargetStatus(user.status === 'Active' ? 'Blocked' : 'Active');
        setStatusModalOpen(true);
    };

    const handleAssignAssemblyToUser = (user: any) => {
        setSelectedUser(user);
        setSelectAssemblyModalOpen(true);
    };

    const handleManageTeam = (user: any) => {
        setSelectedUser(user);
        setManageTeamModalOpen(true);
    };

    const handleAssignToEmptySeat = (assembly: any) => {
        setSelectedAssembly(assembly);
        // We probably need a "Select Manager" modal or "Create Manager"
        // For now, let's just use the SelectAssembly flow from the user's perspective
        showMsg("सूचना", "कृपया 'यूजर मास्टर' से नया कैंडिडेट बनाएं और उन्हें यह विधानसभा असाइन करें।", "info");
    };

    // Action Confirmation Handlers
    const handleConfirmAssignToTeam = async (userId: number, campaignId: number | null) => {
        try {
            await assignUserToCampaign(userId, campaignId);
            fetchData();
        } catch (e: any) {
            showMsg("त्रुटि", e.message, "error");
        }
    };
    const handleConfirmEditName = async () => {
        if (!selectedUser || !newName.trim()) return;
        try {
            await updateUserName(selectedUser.id, newName.trim());
            setEditNameModalOpen(false);
            fetchData();
            showMsg("सफलता", "नाम अपडेट कर दिया गया है।");
        } catch (e: any) {
            showMsg("त्रुटि", e.message, "error");
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedUser) return;
        try {
            await deleteUser(selectedUser.id);
            setDeleteModalOpen(false);
            fetchData();
            showMsg("सफलता", "कैंडिडेट को हटा दिया गया है।");
        } catch (e: any) {
            showMsg("त्रुटि", e.message, "error");
        }
    };

    const handleConfirmStatusChange = async () => {
        if (!selectedUser) return;
        try {
            await setUserStatus(selectedUser.id, targetStatus);
            setStatusModalOpen(false);
            fetchData();
            showMsg("सफलता", `कैंडिडेट अब ${targetStatus === 'Active' ? 'सक्रिय' : 'ब्लॉक'} हैं।`);
        } catch (e: any) {
            showMsg("त्रुटि", e.message, "error");
        }
    };

    const handleConfirmSelectAssembly = async (assemblyId: number) => {
        if (!selectedUser) return;
        try {
            await assignUserToAssembly(selectedUser.id, assemblyId);
            setSelectAssemblyModalOpen(false);
            fetchData();
            showMsg("सफलता", "विधानसभा सफलतापूर्वक बदल दी गई है।");
        } catch (e: any) {
            showMsg("त्रुटि", e.message, "error");
        }
    };

    if (loading) return (
        <div style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
            <p style={{ color: '#64748B', fontWeight: '800' }}>डेटा लोड हो रहा है...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ paddingBottom: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1E293B', letterSpacing: '-0.02em' }}>कैंडिडेट प्रबंधन</h1>
                    <p style={{ color: '#64748B', marginTop: '4px', fontSize: '16px', fontWeight: '500' }}>विधानसभा वार कैंडिडेट्स और उनकी सक्रियता की जानकारी</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', background: 'white', padding: '4px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{ padding: '10px 14px', borderRadius: '12px', background: viewMode === 'grid' ? '#F1F5F9' : 'transparent', border: 'none', color: viewMode === 'grid' ? '#2563EB' : '#94A3B8', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{ padding: '10px 14px', borderRadius: '12px', background: viewMode === 'list' ? '#F1F5F9' : 'transparent', border: 'none', color: viewMode === 'list' ? '#2563EB' : '#94A3B8', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            <List size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={20} />
                    <input
                        type="text"
                        placeholder="नाम, मोबाइल या विधानसभा से खोजें..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '20px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '16px', fontWeight: '500', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', background: 'white' }}
                    />
                </div>
            </div>

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

                        // FIX: Count teams based on campaignId to ensure candidates see ONLY their own team
                        const smCount = users.filter(usr => usr.campaignId === u.campaignId && usr.role === 'SOCIAL_MEDIA').length;
                        const fieldCount = users.filter(usr => usr.campaignId === u.campaignId && (usr.role === 'WORKER' || usr.role === 'OPERATOR')).length;

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
                                            style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '11px', fontWeight: '900', color: u.assemblyId ? '#2563EB' : '#D97706', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>
                                            {u.assemblyId ? 'सक्रिय कैंडिडेट' : 'नया कैंडिडेट (UNASSIGNED)'}
                                        </div>
                                        <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', marginBottom: '4px' }}>{u.name}</h3>
                                        {u.assemblyId ? (
                                            <div style={{ fontSize: '15px', color: '#64748B', fontWeight: '700' }}><MapPin size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> {a?.name} (#{a?.number})</div>
                                        ) : (
                                            <div style={{ fontSize: '15px', color: '#64748B', fontWeight: '600' }}>{u.mobile}</div>
                                        )}
                                    </div>
                                </div>

                                {u.assemblyId && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '20px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>फील्ड टीम</div>
                                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B' }}>{fieldCount}</div>
                                        </div>
                                        <div style={{ background: '#EFF6FF', padding: '14px', borderRadius: '20px', textAlign: 'center', border: '1px solid #DBEAFE' }}>
                                            <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>सोशल टीम</div>
                                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B' }}>{smCount}</div>
                                        </div>
                                    </div>
                                )}

                                {u.assemblyId && (
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                        <button
                                            onClick={() => handleManageTeam(u)}
                                            style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                        >
                                            <Share2 size={14} /> सोशल टीम जोड़ें (Creative)
                                        </button>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleTriggerStatusChange(u); }}
                                        style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: uIsActive ? '#DCFCE7' : '#FEE2E2', color: uIsActive ? '#15803D' : '#DC2626', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}
                                    >
                                        {uIsActive ? 'डिएक्टिवेट' : 'एक्टिवेट'}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleTriggerDelete(u); }}
                                        style={{ padding: '14px', borderRadius: '16px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleAssignAssemblyToUser(u)}
                                    style={{ width: '100%', marginTop: '12px', padding: u.assemblyId ? '14px' : '16px', background: u.assemblyId ? 'white' : '#F59E0B', color: u.assemblyId ? '#64748B' : 'white', border: u.assemblyId ? '1px solid #E2E8F0' : 'none', borderRadius: '20px', fontWeight: '800', fontSize: u.assemblyId ? '13px' : '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    {u.assemblyId ? 'विधानसभा बदलें' : <><Building2 size={20} /> विधानसभा असाइन करें</>}
                                </button>
                            </div>
                        );
                    } else {
                        // EMPTY SEAT CARD
                        const a = item.data;
                        return (
                            <div key={`empty-seat-${a.id}`} style={{
                                background: '#F8FAFC',
                                border: '2px dashed #CBD5E1',
                                borderRadius: '32px',
                                padding: '28px',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '300px'
                            }}>
                                <div style={{ width: '64px', height: '64px', background: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#94A3B8' }}>
                                    <Building2 size={32} />
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>खाली विधानसभा (EMPTY SEAT)</div>
                                <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#1E293B', marginBottom: '4px' }}>{a.name}</h3>
                                <div style={{ fontSize: '14px', color: '#64748B', fontWeight: '700', marginBottom: '24px' }}>सीट नं. #{a.number}</div>

                                <button
                                    onClick={() => handleAssignToEmptySeat(a)}
                                    style={{ padding: '12px 24px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', color: '#2563EB', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                >
                                    + नया कैंडिडेट जोड़ें
                                </button>
                                <p style={{ marginTop: '16px', fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>यहाँ अभी कोई कैंडिडेट असाइन नहीं है।</p>
                            </div>
                        );
                    }
                })}
            </div>

            {displayItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '100px 40px', background: 'white', borderRadius: '40px', border: '2px dashed #E2E8F0', marginTop: '40px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔍</div>
                    <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#1E293B', marginBottom: '8px' }}>कोई कैंडिडेट या विधानसभा नहीं मिली</h3>
                    <p style={{ color: '#64748B', fontSize: '16px', fontWeight: '500' }}>सर्च बदल कर कोशिश करें</p>
                </div>
            )}

            {/* --- Modals --- */}

            {editNameModalOpen && selectedUser && (
                <CustomModal
                    title="नाम बदलें"
                    onClose={() => setEditNameModalOpen(false)}
                    actions={[
                        { label: 'रद्द करें', onClick: () => setEditNameModalOpen(false), type: 'secondary' },
                        { label: 'अपडेट करें', onClick: handleConfirmEditName, type: 'primary' }
                    ]}
                >
                    <div style={{ padding: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#64748B', marginBottom: '8px' }}>कैंडिडेट का नया नाम</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            autoFocus
                            style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0', outline: 'none', fontSize: '16px', fontWeight: '600' }}
                        />
                    </div>
                </CustomModal>
            )}

            {deleteModalOpen && selectedUser && (
                <CustomModal
                    title="पक्का डिलीट करें?"
                    onClose={() => setDeleteModalOpen(false)}
                    actions={[
                        { label: 'नहीं, वापस जाएँ', onClick: () => setDeleteModalOpen(false), type: 'secondary' },
                        { label: 'हाँ, डिलीट करें', onClick: handleConfirmDelete, type: 'danger' }
                    ]}
                >
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: '#FEF2F2', borderRadius: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <AlertCircle size={32} color="#DC2626" />
                        </div>
                        <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>कैंडिडेट: {selectedUser.name}</h4>
                        <p style={{ color: '#64748B', fontSize: '15px', lineHeight: '1.6' }}>क्या आप वाकई इस कैंडिडेट को हटाना चाहते हैं? यह क्रिया वापस नहीं ली जा सकती।</p>
                    </div>
                </CustomModal>
            )}

            {statusModalOpen && selectedUser && (
                <CustomModal
                    title={targetStatus === 'Active' ? 'एक्टिवेट करें?' : 'डिएक्टिवेट करें?'}
                    onClose={() => setStatusModalOpen(false)}
                    actions={[
                        { label: 'रद्द करें', onClick: () => setStatusModalOpen(false), type: 'secondary' },
                        { label: `हाँ, ${targetStatus === 'Active' ? 'एक्टिवेट' : 'डिएक्टिवेट'} करें`, onClick: handleConfirmStatusChange, type: targetStatus === 'Active' ? 'success' : 'primary' }
                    ]}
                >
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: targetStatus === 'Active' ? '#DCFCE7' : '#F1F5F9', borderRadius: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Shield size={32} color={targetStatus === 'Active' ? '#15803D' : '#64748B'} />
                        </div>
                        <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>कैंडिडेट: {selectedUser.name}</h4>
                        <p style={{ color: '#64748B', fontSize: '15px', lineHeight: '1.6' }}>
                            {targetStatus === 'Active'
                                ? 'एक्टिवेट करने के बाद कैंडिडेट दोबारा लॉगिन कर पाएंगे और अपने डेटा को एक्सेस कर पाएंगे।'
                                : 'डिएक्टिवेट करने के बाद कैंडिडेट का लॉगिन बंद हो जाएगा, लेकिन उनका सारा डेटा सुरक्षित रहेगा।'}
                        </p>
                    </div>
                </CustomModal>
            )}

            {msgModalOpen && (
                <CustomModal
                    title={modalMsg.title}
                    onClose={() => setMsgModalOpen(false)}
                    actions={[{ label: 'ठीक है', onClick: () => setMsgModalOpen(false), type: 'primary' }]}
                >
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: modalMsg.type === 'success' ? '#DCFCE7' : modalMsg.type === 'error' ? '#FEE2E2' : '#EFF6FF', borderRadius: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            {modalMsg.type === 'success' ? <CheckCircle size={32} color="#15803D" /> : modalMsg.type === 'error' ? <AlertCircle size={32} color="#DC2626" /> : <AlertCircle size={32} color="#2563EB" />}
                        </div>
                        <p style={{ color: '#1E293B', fontSize: '16px', fontWeight: '700' }}>{modalMsg.message}</p>
                    </div>
                </CustomModal>
            )}

            {selectAssemblyModalOpen && selectedUser && (
                <SelectAssemblyModal
                    user={selectedUser}
                    assemblies={assemblies}
                    onSelect={handleConfirmSelectAssembly}
                    onClose={() => setSelectAssemblyModalOpen(false)}
                />
            )}

            {manageTeamModalOpen && selectedUser && (
                <ManageTeamModal
                    candidate={selectedUser}
                    users={users}
                    onAssign={handleConfirmAssignToTeam}
                    onClose={() => setManageTeamModalOpen(false)}
                />
            )}
        </div>
    );
}

function ManageTeamModal({ candidate, users, onAssign, onClose }: any) {
    const [search, setSearch] = useState('');

    // Fans, SM, Workers in the pool (no assembly or same assembly but no campaign)
    const pool = users.filter((u: any) =>
        u.role !== 'MANAGER' && u.role !== 'ADMIN' && u.role !== 'SUPERADMIN' &&
        (!u.campaignId || u.campaignId === candidate.campaignId)
    );

    const filteredPool = pool.filter((u: any) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.mobile?.includes(search)
    );

    const currentTeam = users.filter((u: any) => u.campaignId === candidate.campaignId && u.id !== candidate.id);

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
                    {/* Current Team */}
                    <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>वर्तमान टीम ({currentTeam.length})</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                            {currentTeam.map((u: any) => (
                                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#F1F5F9', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{u.name}</span>
                                    <button onClick={() => onAssign(u.id, null)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px' }}><X size={14} /></button>
                                </div>
                            ))}
                            {currentTeam.length === 0 && <p style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>अभी कोई टीम सदस्य नहीं है।</p>}
                        </div>
                    </div>

                    {/* Add to Team */}
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>सदस्य जोड़ें (Pool)</h4>
                        <div style={{ position: 'relative', marginBottom: '12px' }}>
                            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
                            <input
                                placeholder="यूजर का नाम या मोबाइल..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: '600' }}
                            />
                        </div>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {filteredPool.filter((u: any) => u.campaignId !== candidate.campaignId).map((u: any) => (
                                <div key={u.id} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #F8FAFC', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', color: '#1E293B', fontSize: '14px' }}>{u.name}</div>
                                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{u.role} • {u.mobile}</div>
                                    </div>
                                    <button
                                        onClick={() => onAssign(u.id, candidate.campaignId)}
                                        style={{ padding: '6px 12px', background: 'white', border: '1px solid #2563EB', color: '#2563EB', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                                    >
                                        + जोड़ें
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CustomModal({ title, children, onClose, actions }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', backdropFilter: 'blur(8px)' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0 }}></div>
            <div style={{ background: 'white', borderRadius: '32px', maxWidth: '450px', width: '100%', position: 'relative', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', overflow: 'hidden', animation: 'modalEntry 0.3s ease-out' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: '#F8FAFC', border: 'none', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
                </div>
                {children}
                <div style={{ padding: '24px 32px', background: '#F8FAFC', display: 'flex', gap: '12px' }}>
                    {actions.map((btn: any, idx: number) => (
                        <button
                            key={idx}
                            onClick={btn.onClick}
                            style={{
                                flex: 1,
                                padding: '14px',
                                borderRadius: '16px',
                                border: btn.type === 'secondary' ? '1px solid #E2E8F0' : 'none',
                                background: btn.type === 'primary' ? '#2563EB' : btn.type === 'danger' ? '#DC2626' : btn.type === 'success' ? '#16A34A' : 'white',
                                color: btn.type === 'secondary' ? '#64748B' : 'white',
                                fontWeight: '800',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>
            <style>{`
                @keyframes modalEntry {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}

function SelectAssemblyModal({ assemblies, onSelect, onClose, user }: any) {
    const [search, setSearch] = useState('');
    const filtered = assemblies.filter((a: any) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.number.toString().includes(search)
    );

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px', backdropFilter: 'blur(8px)' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0 }}></div>
            <div style={{ background: 'white', borderRadius: '32px', maxWidth: '500px', width: '100%', position: 'relative', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>विधानसभा चुनें</h3>
                    <button onClick={onClose} style={{ background: '#F8FAFC', border: 'none', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                        <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
                        <input
                            placeholder="विधानसभा का नाम या नंबर..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '16px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: '600' }}
                        />
                    </div>
                    <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
                        {filtered.map((a: any) => (
                            <button
                                key={a.id}
                                onClick={() => onSelect(a.id)}
                                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #F1F5F9', background: user.assemblyId === a.id ? '#EFF6FF' : 'white', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                onMouseLeave={e => e.currentTarget.style.background = user.assemblyId === a.id ? '#EFF6FF' : 'white'}
                            >
                                <div>
                                    <div style={{ fontWeight: '800', color: '#1E293B', fontSize: '15px' }}>{a.name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>सीट नं. #{a.number}</div>
                                </div>
                                {user.assemblyId === a.id && <CheckCircle size={20} color="#2563EB" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
