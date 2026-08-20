'use client';

import React, { useState, useEffect } from 'react';
import { getUsers, getAssemblies, setUserStatus, setUserRole, assignUserToAssembly, deleteUser, getCampaigns, assignUserToCampaign, setUserWorkerType, updateAssembly, updateUserName, createUserSecure, secureUpdateUserPassword } from '@/app/actions/admin';
import { useSession } from 'next-auth/react';
import {
    Shield, Clock, Trash2, Ban, CheckCircle,
    Users as UsersIcon, Building2, ChevronDown, ChevronRight,
    Mail, AlertCircle, UserCheck, Star, User, Edit, Share2, X, Lock, Key, Search,
    Crown, Briefcase, Award
} from 'lucide-react';

export default function UsersPage() {
    const { data: session } = useSession();
    const currentUser = session?.user as any;

    const [users, setUsers] = useState<any[]>([]);
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        'pending': true,
        'admins': true,
        'candidates': true,
        'workers': true,
        'others': true
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Premium Modals State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [editMode, setEditMode] = useState<'USER_NAME' | 'CANDIDATE_NAME'>('USER_NAME');
    const [newInput, setNewInput] = useState('');
    const [newMobileInput, setNewMobileInput] = useState('');
    const [targetAssemblyId, setTargetAssemblyId] = useState<number | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState({ title: '', message: '', type: 'success' });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const assemblyId = params.get('assembly');
        if (assemblyId) {
            setExpandedGroups(prev => ({ ...prev, [`assembly-${assemblyId}`]: true }));
        }
        fetchData();

        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    async function fetchData() {
        setLoading(true);
        const [userData, assemblyData, campaignData] = await Promise.all([getUsers(), getAssemblies(), getCampaigns()]);
        setUsers(userData);
        setAssemblies(assemblyData);
        setCampaigns(campaignData);
        setLoading(false);
    }

    const showFeedback = (title: string, message: string, type: string = 'success') => {
        setFeedbackMessage({ title, message, type });
        setFeedbackModalOpen(true);
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        await setUserStatus(id, status);
        fetchData();
    };

    const handleUpdateRole = async (id: number, role: string) => {
        try {
            await setUserRole(id, role);
            fetchData();
        } catch (error: any) {
            showFeedback('त्रुटि', error.message, 'error');
        }
    };

    const handleAssignAssembly = async (userId: number, assemblyId: string) => {
        await assignUserToAssembly(userId, assemblyId ? parseInt(assemblyId) : null);
        fetchData();
    };

    const handleAssignCampaign = async (userId: number, campaignId: string) => {
        await assignUserToCampaign(userId, campaignId ? parseInt(campaignId) : null);
        fetchData();
    };

    const handleUpdateWorkerType = async (userId: number, type: string) => {
        await setUserWorkerType(userId, type);
        fetchData();
    };

    // Trigger Handlers
    const triggerUpdateCandidateName = (assemblyId: number, currentName: string) => {
        setTargetAssemblyId(assemblyId);
        setNewInput(currentName || '');
        setEditMode('CANDIDATE_NAME');
        setEditModalOpen(true);
    };

    const triggerUpdateUserName = (user: any) => {
        setSelectedUser(user);
        setNewInput(user.name || '');
        setNewMobileInput(user.mobile || '');
        setEditMode('USER_NAME');
        setEditModalOpen(true);
    };

    const triggerChangePassword = (user: any) => {
        setSelectedUser(user);
        setNewInput('');
        setPasswordModalOpen(true);
    };

    const triggerDelete = (user: any) => {
        setSelectedUser(user);
        setDeleteModalOpen(true);
    };

    // Action Confirmation Handlers
    const confirmUpdateName = async () => {
        if (!newInput.trim()) return;
        if (editMode === 'CANDIDATE_NAME' && targetAssemblyId) {
            await updateAssembly(targetAssemblyId, { candidateName: newInput.trim() });
        } else if (editMode === 'USER_NAME' && selectedUser) {
            await updateUserName(selectedUser.id, newInput.trim(), newMobileInput.trim());
        }
        setEditModalOpen(false);
        fetchData();
    };

    const confirmChangePassword = async () => {
        if (!selectedUser || newInput.length < 6) {
            showFeedback('त्रुटि', 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए!', 'error');
            return;
        }
        try {
            await secureUpdateUserPassword(selectedUser.id, newInput);
            setPasswordModalOpen(false);
            showFeedback('सफलता', 'पासवर्ड सफलतापूर्वक बदल दिया गया है!');
        } catch (error: any) {
            showFeedback('त्रुटि', error.message, 'error');
        }
    };

    const confirmDelete = async () => {
        if (!selectedUser) return;
        await deleteUser(selectedUser.id);
        setDeleteModalOpen(false);
        fetchData();
        showFeedback('सफलता', 'यूजर को हटा दिया गया है।');
    };

    const handleCreateUser = async (data: any) => {
        try {
            await createUserSecure(data);
            fetchData();
            setShowCreateModal(false);
            showFeedback('सफलता', 'नया यूजर सफलतापूर्वक बना दिया गया है!');
        } catch (error: any) {
            showFeedback('त्रुटि', error.message, 'error');
        }
    };

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = !searchQuery ||
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.mobile?.includes(searchQuery) ||
            u.role?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'ALL' ||
            (roleFilter === 'WORKER' ? (u.role === 'WORKER' || u.role === 'ELECTION_MANAGER') : u.role === roleFilter);

        return matchesSearch && matchesRole;
    });

    const pendingUsers = filteredUsers.filter(u => u.status === 'Pending');
    const globalAdmins = filteredUsers.filter(u => (u.role === 'ADMIN' || u.role === 'SUPERADMIN') && u.status !== 'Pending');

    // Group candidates and their campaign workers together by Assembly
    const activeNonAdmins = filteredUsers.filter(u => u.status !== 'Pending' && u.role !== 'ADMIN' && u.role !== 'SUPERADMIN');

    const campaignGroupsMap: Record<string, { id: string, title: string, candidate: any | null, workers: any[] }> = {};
    const unassignedMembers: any[] = [];

    // Helper to determine worker rank in hierarchy
    const getWorkerHierarchyRank = (u: any) => {
        if (u.role === 'ELECTION_MANAGER') return 1;
        const wt = u.worker?.type || 'FIELD';
        if (wt === 'BOOTH_MANAGER' || wt === 'BOOTH') return 2;
        if (wt === 'PANNA_PRAMUKH' || wt === 'PANNA') return 3;
        return 4; // FIELD / GROUND
    };

    activeNonAdmins.forEach(u => {
        const asmId = u.assemblyId || u.campaign?.assemblyId;
        if (asmId) {
            const groupKey = `campaign-assembly-${asmId}`;
            if (!campaignGroupsMap[groupKey]) {
                const asmObj = assemblies.find(a => a.id === asmId) || u.assembly;
                const asmTitle = asmObj ? `${asmObj.nameHindi || asmObj.name} (${asmObj.number})` : `विधानसभा #${asmId}`;
                const candidateObj = activeNonAdmins.find(c => (c.assemblyId === asmId || c.campaign?.assemblyId === asmId) && c.role === 'CANDIDATE');
                const candName = candidateObj?.name || asmObj?.candidateName || 'प्रत्याशी';

                campaignGroupsMap[groupKey] = {
                    id: groupKey,
                    title: `प्रत्याशी ${candName} एवं टीम - ${asmTitle}`,
                    candidate: candidateObj || null,
                    workers: []
                };
            }

            if (u.role === 'CANDIDATE') {
                campaignGroupsMap[groupKey].candidate = u;
            } else {
                campaignGroupsMap[groupKey].workers.push(u);
            }
        } else {
            unassignedMembers.push(u);
        }
    });

    // Sort workers in each campaign team according to hierarchy: Election Manager -> Booth Manager -> Panna Pramukh -> Ground Worker
    Object.values(campaignGroupsMap).forEach(group => {
        group.workers.sort((a, b) => getWorkerHierarchyRank(a) - getWorkerHierarchyRank(b));
    });

    const campaignGroups = Object.values(campaignGroupsMap);

    if (loading) return (
        <div style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
            <p style={{ color: '#64748B', fontWeight: '800' }}>लोड हो रहा है...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ paddingBottom: '80px' }}>
            <div style={{ marginBottom: '32px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: '900', color: '#1E293B' }}>यूजर मास्टर</h1>
                    <p style={{ color: '#64748B', fontSize: '15px', fontWeight: '600' }}>सिस्टम के सभी मुख्य यूजर्स, प्रत्याशी और कार्यकर्ताओं का प्रबंधन</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        width: isMobile ? '100%' : 'auto',
                        padding: '14px 28px',
                        background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <UsersIcon size={20} /> नया यूजर बनाएं
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', marginBottom: '32px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                        type="text"
                        placeholder="नाम, मोबाइल या रोल से खोजें..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '20px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', fontWeight: '600', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{
                        width: isMobile ? '100%' : 'auto',
                        padding: '16px 24px',
                        borderRadius: '20px',
                        border: '1px solid #E2E8F0',
                        background: 'white',
                        outline: 'none',
                        fontWeight: '700',
                        color: '#475569',
                        cursor: 'pointer'
                    }}
                >
                    <option value="ALL">सभी रोल्स</option>
                    <option value="ADMIN">एडमिन (Admins)</option>
                    <option value="CANDIDATE">प्रत्याशी (Candidates)</option>
                    <option value="WORKER">कार्यकर्ता (Election Manager & Workers)</option>
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Pending Approval Section */}
                <UserGroupSection
                    title="पेंडिंग अप्रूवल"
                    icon={<Clock size={20} color="#F59E0B" />}
                    users={pendingUsers}
                    id="pending"
                    expanded={expandedGroups['pending'] ?? true}
                    onToggle={toggleGroup}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateRole={handleUpdateRole}
                    onAssignAssembly={handleAssignAssembly}
                    onEditName={triggerUpdateUserName}
                    onChangePassword={triggerChangePassword}
                    onDelete={triggerDelete}
                />

                {/* System Admins Section */}
                <UserGroupSection
                    title="सिस्टम एडमिन्स"
                    icon={<Shield size={20} color="#6366F1" />}
                    users={globalAdmins}
                    id="admins"
                    expanded={expandedGroups['admins'] ?? true}
                    onToggle={toggleGroup}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateRole={handleUpdateRole}
                    onAssignAssembly={handleAssignAssembly}
                    onEditName={triggerUpdateUserName}
                    onChangePassword={triggerChangePassword}
                    onDelete={triggerDelete}
                    isAdminSection={true}
                />

                {/* Candidate & Campaign Teams */}
                {campaignGroups.map(group => (
                    <CampaignTeamSection
                        key={group.id}
                        id={group.id}
                        title={group.title}
                        candidate={group.candidate}
                        workers={group.workers}
                        expanded={expandedGroups[group.id] ?? true}
                        onToggle={toggleGroup}
                        onUpdateStatus={handleUpdateStatus}
                        onUpdateRole={handleUpdateRole}
                        onUpdateWorkerType={handleUpdateWorkerType}
                        onEditName={triggerUpdateUserName}
                        onDelete={triggerDelete}
                        onChangePassword={triggerChangePassword}
                    />
                ))}

                {/* Unassigned Members */}
                {unassignedMembers.length > 0 && (
                    <UserGroupSection
                        title="अन्य सदस्य"
                        icon={<User size={20} color="#64748B" />}
                        users={unassignedMembers}
                        id="others"
                        expanded={expandedGroups['others'] ?? true}
                        onToggle={toggleGroup}
                        onUpdateStatus={handleUpdateStatus}
                        onUpdateRole={handleUpdateRole}
                        onUpdateWorkerType={handleUpdateWorkerType}
                        onAssignAssembly={handleAssignAssembly}
                        onEditName={triggerUpdateUserName}
                        onChangePassword={triggerChangePassword}
                        onDelete={triggerDelete}
                    />
                )}
            </div>

            {/* --- Modals --- */}
            {editModalOpen && (
                <PremiumModal
                    title={editMode === 'USER_NAME' ? "यूजर का नाम बदलें" : "कैंडिडेट का नाम बदलें"}
                    onClose={() => setEditModalOpen(false)}
                    actions={[
                        { label: 'रद्द करें', onClick: () => setEditModalOpen(false), type: 'secondary' },
                        { label: 'अपडेट करें', onClick: confirmUpdateName, type: 'primary' }
                    ]}
                >
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>
                                {editMode === 'USER_NAME' ? "यूजर का नाम" : "कैंडिडेट का नाम"}
                            </label>
                            <input
                                type="text"
                                value={newInput}
                                onChange={(e) => setNewInput(e.target.value)}
                                autoFocus
                                placeholder="यहाँ नाम लिखें..."
                                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0', outline: 'none', fontSize: '16px', fontWeight: '600' }}
                            />
                        </div>
                        {editMode === 'USER_NAME' && (
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>
                                    मोबाइल नंबर (लॉगिन आईडी)
                                </label>
                                <input
                                    type="text"
                                    value={newMobileInput}
                                    onChange={(e) => setNewMobileInput(e.target.value)}
                                    placeholder="यहाँ मोबाइल नंबर लिखें..."
                                    style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0', outline: 'none', fontSize: '16px', fontWeight: '600' }}
                                />
                            </div>
                        )}
                    </div>
                </PremiumModal>
            )}

            {passwordModalOpen && selectedUser && (
                <PremiumModal
                    title={`${selectedUser.name} का पासवर्ड बदलें`}
                    onClose={() => setPasswordModalOpen(false)}
                    actions={[
                        { label: 'रद्द करें', onClick: () => setPasswordModalOpen(false), type: 'secondary' },
                        { label: 'पासवर्ड बदलें', onClick: confirmChangePassword, type: 'primary' }
                    ]}
                >
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <p style={{ color: '#64748B', fontSize: '14px', fontWeight: '600' }}>
                            यूजर: <strong style={{ color: '#1E293B' }}>{selectedUser.name}</strong> ({selectedUser.mobile})
                        </p>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>नया पासवर्ड</label>
                            <input
                                type="password"
                                value={newInput}
                                onChange={(e) => setNewInput(e.target.value)}
                                autoFocus
                                placeholder="नया पासवर्ड लिखें (कम से कम 6 अक्षर)"
                                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0', outline: 'none', fontSize: '16px', fontWeight: '600' }}
                            />
                        </div>
                    </div>
                </PremiumModal>
            )}

            {deleteModalOpen && selectedUser && (
                <PremiumModal
                    title="यूजर को हटाएं"
                    onClose={() => setDeleteModalOpen(false)}
                    actions={[
                        { label: 'रद्द करें', onClick: () => setDeleteModalOpen(false), type: 'secondary' },
                        { label: 'हां, हटाएं', onClick: confirmDelete, type: 'danger' }
                    ]}
                >
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: '#FEF2F2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <AlertCircle size={32} color="#DC2626" />
                        </div>
                        <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B', marginBottom: '8px' }}>{selectedUser.name}</h4>
                        <p style={{ color: '#64748B', fontSize: '15px', fontWeight: '500' }}>क्या आप वाकई इस यूजर को सिस्टम से हटाना चाहते हैं? यह क्रिया वापस नहीं ली जा सकती।</p>
                    </div>
                </PremiumModal>
            )}

            {feedbackModalOpen && (
                <PremiumModal
                    title={feedbackMessage.title}
                    onClose={() => setFeedbackModalOpen(false)}
                    actions={[{ label: 'ठीक है', onClick: () => setFeedbackModalOpen(false), type: 'primary' }]}
                >
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: feedbackMessage.type === 'success' ? '#DCFCE7' : '#FEE2E2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            {feedbackMessage.type === 'success' ? <CheckCircle size={32} color="#15803D" /> : <AlertCircle size={32} color="#DC2626" />}
                        </div>
                        <p style={{ color: '#1E293B', fontSize: '16px', fontWeight: '700' }}>{feedbackMessage.message}</p>
                    </div>
                </PremiumModal>
            )}

            {showCreateModal && (
                <CreateUserModal
                    onClose={() => setShowCreateModal(false)}
                    onSave={handleCreateUser}
                    assemblies={assemblies}
                    campaigns={campaigns}
                />
            )}
        </div>
    );
}

/**
 * 👑 Campaign & Candidate Team Section with Hierarchical Layout
 */
function CampaignTeamSection({ id, title, candidate, workers, expanded, onToggle, onUpdateStatus, onUpdateRole, onUpdateWorkerType, onEditName, onDelete, onChangePassword }: any) {
    const totalCount = (candidate ? 1 : 0) + (workers?.length || 0);

    const getWorkerSelectValue = (user: any) => {
        if (user.role === 'ELECTION_MANAGER') return 'ELECTION_MANAGER';
        const wt = user.worker?.type || 'FIELD';
        if (wt === 'BOOTH_MANAGER' || wt === 'BOOTH') return 'WORKER_BOOTH_MANAGER';
        if (wt === 'PANNA_PRAMUKH' || wt === 'PANNA') return 'WORKER_PANNA_PRAMUKH';
        return 'WORKER_FIELD';
    };

    return (
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            {/* Group Header Button */}
            <button
                onClick={() => onToggle(id)}
                style={{ width: '100%', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: expanded ? '#F8FAFC' : 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', border: '1px solid #FCD34D', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Star size={22} color="#D97706" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#1E293B' }}>{title}</h3>
                        <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                            1 मुख्य प्रत्याशी + {workers?.length || 0} कार्यकर्ता (कुल {totalCount} सदस्य)
                        </p>
                    </div>
                </div>
                {expanded ? <ChevronDown size={20} color="#94A3B8" /> : <ChevronRight size={20} color="#94A3B8" />}
            </button>

            {expanded && (
                <div style={{ borderTop: '1px solid #F1F5F9', padding: '20px' }}>
                    {/* 👑 CANDIDATE CARD (Top Leader) */}
                    {candidate ? (
                        <div style={{
                            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                            border: '2px solid #FDE68A',
                            borderRadius: '18px',
                            padding: '18px 24px',
                            marginBottom: '20px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '48px', height: '48px', background: '#F59E0B', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)' }}>
                                    <Crown size={26} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#92400E' }}>{candidate.name}</h4>
                                        <span style={{ padding: '4px 10px', background: '#B45309', color: 'white', borderRadius: '8px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <Award size={14} /> मुख्य प्रत्याशी (Candidate)
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#B45309', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                        <span>📞 {candidate.mobile}</span>
                                        {candidate.assembly?.name && (
                                            <span style={{ padding: '2px 8px', background: 'white', border: '1px solid #FCD34D', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: '#92400E' }}>
                                                📍 {candidate.assembly.nameHindi || candidate.assembly.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', background: candidate.status === 'Active' ? '#DCFCE7' : '#FEE2E2', color: candidate.status === 'Active' ? '#15803D' : '#991B1B', fontSize: '12px', fontWeight: '800', marginRight: '8px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                                    {candidate.status === 'Active' ? 'सक्रिय' : 'ब्लॉक'}
                                </div>
                                {onEditName && <button onClick={() => onEditName(candidate)} style={{ width: '36px', height: '36px', border: '1px solid #FCD34D', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#92400E', cursor: 'pointer' }} title="नाम सुधारें"><Edit size={16} /></button>}
                                {onChangePassword && <button onClick={() => onChangePassword(candidate)} style={{ width: '36px', height: '36px', border: '1px solid #FCD34D', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', cursor: 'pointer' }} title="पासवर्ड बदलें"><Key size={16} /></button>}
                                <button onClick={() => onUpdateStatus(candidate.id, candidate.status === 'Active' ? 'Blocked' : 'Active')} style={{ width: '36px', height: '36px', border: '1px solid #FCD34D', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: candidate.status === 'Active' ? '#DC2626' : '#16A34A', cursor: 'pointer' }} title={candidate.status === 'Active' ? 'ब्लॉक करें' : 'अनब्लॉक करें'}>{candidate.status === 'Active' ? <Ban size={16} /> : <CheckCircle size={16} />}</button>
                                {onDelete && <button onClick={() => onDelete(candidate)} style={{ width: '36px', height: '36px', border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', cursor: 'pointer' }} title="हटाएं"><Trash2 size={16} /></button>}
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '14px 20px', background: '#F8FAFC', borderRadius: '14px', border: '1px dashed #CBD5E1', marginBottom: '16px', color: '#64748B', fontSize: '13px', fontWeight: '700' }}>
                            ⚠️ इस विधानसभा के लिए कोई प्रत्याशी असाइन नहीं है।
                        </div>
                    )}

                    {/* 👥 WORKERS & TEAM TABLE */}
                    <div style={{ marginBottom: '8px', padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h5 style={{ fontSize: '14px', fontWeight: '900', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Briefcase size={16} color="#2563EB" /> प्रत्याशी की टीम व कार्यकर्ता ({workers?.length || 0})
                        </h5>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>
                            हेरारिकी: इलेक्शन मैनेजर ➔ बूथ मैनेजर ➔ पन्ना प्रमुख ➔ ग्राउंड वर्कर
                        </span>
                    </div>

                    <div className="responsive-table-wrapper" style={{ border: '1px solid #E2E8F0', borderRadius: '16px', overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>कार्यकर्ता / मोबाइल</th>
                                    <th style={{ padding: '14px', fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>पद / रोल (Role)</th>
                                    <th style={{ padding: '14px', fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>स्टेटस</th>
                                    <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>एक्शन</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workers?.map((u: any) => {
                                    const isElectionManager = u.role === 'ELECTION_MANAGER';
                                    return (
                                        <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9', background: isElectionManager ? '#F8FAFC' : 'white', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        background: isElectionManager ? '#EFF6FF' : '#F1F5F9',
                                                        color: isElectionManager ? '#2563EB' : '#64748B',
                                                        border: isElectionManager ? '1px solid #BFDBFE' : 'none',
                                                        borderRadius: '10px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {isElectionManager ? <Briefcase size={18} /> : <User size={18} />}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '800', color: '#1E293B', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {u.name}
                                                            {isElectionManager && (
                                                                <span style={{ fontSize: '10px', padding: '1px 6px', background: '#DBEAFE', color: '#1E40AF', borderRadius: '4px', fontWeight: '800' }}>
                                                                    इलेक्शन मैनेजर
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', marginTop: '2px' }}>
                                                            📞 {u.mobile}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px' }}>
                                                <select
                                                    value={getWorkerSelectValue(u)}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'ELECTION_MANAGER') {
                                                            onUpdateRole(u.id, 'ELECTION_MANAGER');
                                                        } else if (val === 'WORKER_BOOTH_MANAGER') {
                                                            if (u.role !== 'WORKER') onUpdateRole(u.id, 'WORKER');
                                                            if (onUpdateWorkerType) onUpdateWorkerType(u.id, 'BOOTH_MANAGER');
                                                        } else if (val === 'WORKER_PANNA_PRAMUKH') {
                                                            if (u.role !== 'WORKER') onUpdateRole(u.id, 'WORKER');
                                                            if (onUpdateWorkerType) onUpdateWorkerType(u.id, 'PANNA_PRAMUKH');
                                                        } else if (val === 'WORKER_FIELD') {
                                                            if (u.role !== 'WORKER') onUpdateRole(u.id, 'WORKER');
                                                            if (onUpdateWorkerType) onUpdateWorkerType(u.id, 'FIELD');
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: '10px',
                                                        border: '1px solid #E2E8F0',
                                                        fontSize: '13px',
                                                        fontWeight: '700',
                                                        color: '#334155',
                                                        cursor: 'pointer',
                                                        background: isElectionManager ? '#EFF6FF' : 'white'
                                                    }}
                                                >
                                                    <option value="ELECTION_MANAGER">🗄️ इलेक्शन मैनेजर (Election Manager)</option>
                                                    <optgroup label="कार्यकर्ता श्रेणी (Worker Roles)">
                                                        <option value="WORKER_BOOTH_MANAGER">🏢 बूथ मैनेजर (Booth Manager)</option>
                                                        <option value="WORKER_PANNA_PRAMUKH">📄 पन्ना प्रमुख (Panna Pramukh)</option>
                                                        <option value="WORKER_FIELD">🚶‍♂️ ग्राउंड कार्यकर्ता (Ground Worker)</option>
                                                    </optgroup>
                                                </select>
                                            </td>
                                            <td style={{ padding: '14px' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', background: u.status === 'Active' ? '#DCFCE7' : u.status === 'Pending' ? '#FEF3C7' : '#FEE2E2', color: u.status === 'Active' ? '#15803D' : u.status === 'Pending' ? '#92400E' : '#991B1B', fontSize: '12px', fontWeight: '800' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                                                    {u.status === 'Active' ? 'सक्रिय' : u.status === 'Pending' ? 'पेंडिंग' : 'ब्लॉक'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    {u.status === 'Pending' && (
                                                        <button onClick={() => onUpdateStatus(u.id, 'Active')} style={{ padding: '6px 14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>अप्रूव करें</button>
                                                    )}
                                                    {onEditName && <button onClick={() => onEditName(u)} style={{ width: '32px', height: '32px', border: '1px solid #E2E8F0', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }} title="नाम सुधारें"><Edit size={14} /></button>}
                                                    {onChangePassword && <button onClick={() => onChangePassword(u)} style={{ width: '32px', height: '32px', border: '1px solid #E2E8F0', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', cursor: 'pointer' }} title="पासवर्ड बदलें"><Key size={14} /></button>}
                                                    <button onClick={() => onUpdateStatus(u.id, u.status === 'Active' ? 'Blocked' : 'Active')} style={{ width: '32px', height: '32px', border: '1px solid #E2E8F0', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: u.status === 'Active' ? '#DC2626' : '#16A34A', cursor: 'pointer' }} title={u.status === 'Active' ? 'ब्लॉक करें' : 'अनब्लॉक करें'}>{u.status === 'Active' ? <Ban size={14} /> : <CheckCircle size={14} />}</button>
                                                    {onDelete && <button onClick={() => onDelete(u)} style={{ width: '32px', height: '32px', border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', cursor: 'pointer' }} title="हटाएं"><Trash2 size={14} /></button>}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!workers || workers.length === 0) && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontWeight: '600' }}>इस टीम में अभी कोई कार्यकर्ता नहीं है</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * 🛡️ Generic / Admin User Group Section
 */
function UserGroupSection({ title, icon, users, id, expanded, onToggle, onUpdateStatus, onUpdateRole, onAssignAssembly, onEditName, onDelete, onChangePassword, isAdminSection }: any) {
    if (users.length === 0) return null;
    return (
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <button
                onClick={() => onToggle(id)}
                style={{ width: '100%', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: expanded ? '#F8FAFC' : 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#1E293B' }}>{title}</h3>
                        <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>{users.length} सदस्य</p>
                    </div>
                </div>
                {expanded ? <ChevronDown size={20} color="#94A3B8" /> : <ChevronRight size={20} color="#94A3B8" />}
            </button>

            {expanded && (
                <div className="responsive-table-wrapper" style={{ borderTop: '1px solid #F1F5F9', overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>यूजर / मोबाइल</th>
                                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>रोल (Role)</th>
                                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>स्टेटस</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>एक्शन</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u: any) => {
                                const isArvind = u.mobile === '9723338321' || u.role === 'SUPERADMIN';
                                return (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#FCFDFF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', background: isArvind ? '#EEF2FF' : '#F1F5F9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isArvind ? '#4F46E5' : '#64748B' }}>
                                                    {isArvind ? <Shield size={20} /> : <User size={18} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '800', color: '#1E293B', fontSize: '14px' }}>{u.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                                        <span>📞 {u.mobile}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {isArvind ? (
                                                <span style={{ padding: '6px 12px', background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE', borderRadius: '8px', fontSize: '13px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    👑 सुपर एडमिन (Super Admin)
                                                </span>
                                            ) : isAdminSection ? (
                                                <span style={{ padding: '6px 12px', background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '13px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    🛡️ सिस्टम एडमिन (Admin)
                                                </span>
                                            ) : (
                                                <span style={{ padding: '6px 12px', background: '#F1F5F9', color: '#475569', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
                                                    {u.role}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', background: u.status === 'Active' ? '#DCFCE7' : u.status === 'Pending' ? '#FEF3C7' : '#FEE2E2', color: u.status === 'Active' ? '#15803D' : u.status === 'Pending' ? '#92400E' : '#991B1B', fontSize: '12px', fontWeight: '800' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                                                {u.status === 'Active' ? 'सक्रिय' : u.status === 'Pending' ? 'पेंडिंग' : 'ब्लॉक'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                {u.status === 'Pending' && (
                                                    <button onClick={() => onUpdateStatus(u.id, 'Active')} style={{ padding: '8px 16px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>अप्रूव करें</button>
                                                )}
                                                {!isArvind && (
                                                    <>
                                                        {onEditName && <button onClick={() => onEditName(u)} style={{ width: '32px', height: '32px', border: '1px solid #E2E8F0', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }} title="नाम सुधारें"><Edit size={14} /></button>}
                                                        {onChangePassword && <button onClick={() => onChangePassword(u)} style={{ width: '32px', height: '32px', border: '1px solid #E2E8F0', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', cursor: 'pointer' }} title="पासवर्ड बदलें"><Key size={14} /></button>}
                                                        <button onClick={() => onUpdateStatus(u.id, u.status === 'Active' ? 'Blocked' : 'Active')} style={{ width: '32px', height: '32px', border: '1px solid #E2E8F0', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: u.status === 'Active' ? '#DC2626' : '#16A34A', cursor: 'pointer' }} title={u.status === 'Active' ? 'ब्लॉक करें' : 'अनब्लॉक करें'}>{u.status === 'Active' ? <Ban size={14} /> : <CheckCircle size={14} />}</button>
                                                        {onDelete && <button onClick={() => onDelete(u)} style={{ width: '32px', height: '32px', border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', cursor: 'pointer' }} title="हटाएं"><Trash2 size={14} /></button>}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontWeight: '600' }}>कोई सदस्य नहीं मिला</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/**
 * ➕ Create User Modal (Supports Admin, Candidate, Election Manager, and Workers)
 */
function CreateUserModal({ onClose, onSave, assemblies, campaigns }: any) {
    const [formData, setFormData] = useState({ name: '', mobile: '', password: '', role: 'CANDIDATE', assemblyId: '', campaignId: '' });

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', backdropFilter: 'blur(8px)' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0 }}></div>
            <div style={{ background: 'white', borderRadius: '32px', maxWidth: '500px', width: '100%', position: 'relative', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>नया यूजर जोड़ें</h3>
                    <button onClick={onClose} style={{ background: '#F8FAFC', border: 'none', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>पूरा नाम</label>
                        <input type="text" placeholder="नाम लिखें" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>मोबाइल नंबर (लॉगिन आईडी)</label>
                        <input type="text" placeholder="10 अंकों का मोबाइल नंबर" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>रोल (Role)</label>
                        <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', background: 'white' }}>
                            <option value="ADMIN">🛡️ सिस्टम एडमिन (Admin)</option>
                            <option value="CANDIDATE">🏆 विधानसभा प्रत्याशी (Candidate)</option>
                            <optgroup label="प्रत्याशी के कार्यकर्ता (Worker Roles)">
                                <option value="ELECTION_MANAGER">🗄️ इलेक्शन मैनेजर (Election Manager)</option>
                                <option value="WORKER_BOOTH_MANAGER">🏢 बूथ मैनेजर (Booth Manager)</option>
                                <option value="WORKER_PANNA_PRAMUKH">📄 पन्ना प्रमुख (Panna Pramukh)</option>
                                <option value="WORKER_FIELD">🚶‍♂️ ग्राउंड कार्यकर्ता (Ground Worker)</option>
                            </optgroup>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>पासवर्ड</label>
                        <input type="password" placeholder="पासवर्ड बनाएं" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px' }} />
                        <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748B', fontWeight: '700' }}>
                            जरूरी: 1 बड़ा अक्षर (Caps), 1 स्पेशल चिन्ह (@, #, $), 1 अंक
                        </div>
                    </div>
                    {formData.role !== 'ADMIN' && (
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>विधानसभा</label>
                            <select value={formData.assemblyId} onChange={e => setFormData({ ...formData, assemblyId: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', background: 'white' }}>
                                <option value="">विधानसभा चुनें</option>
                                {assemblies.map((a: any) => <option key={a.id} value={a.id}>{a.nameHindi || a.name} ({a.number})</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <div style={{ padding: '24px 32px', background: '#F8FAFC', display: 'flex', gap: '12px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>रद्द करें</button>
                    <button onClick={() => onSave({ ...formData, assemblyId: formData.assemblyId ? parseInt(formData.assemblyId) : null })} style={{ flex: 1, padding: '14px', borderRadius: '16px', background: '#2563EB', color: 'white', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>यूजर बनाएं</button>
                </div>
            </div>
        </div>
    );
}

function PremiumModal({ title, children, onClose, actions }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px', backdropFilter: 'blur(8px)' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0 }}></div>
            <div style={{ background: 'white', borderRadius: '32px', maxWidth: '450px', width: '100%', position: 'relative', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', overflow: 'hidden', animation: 'modalEntry 0.3s ease-out' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>{title}</h3>
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
                                background: btn.type === 'primary' ? '#2563EB' : btn.type === 'danger' ? '#DC2626' : 'white',
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
