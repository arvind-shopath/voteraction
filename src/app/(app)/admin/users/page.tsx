'use client';

import React, { useState, useEffect } from 'react';
import { getUsers, getAssemblies, setUserStatus, setUserRole, assignUserToAssembly, deleteUser, getCampaigns, assignUserToCampaign, setUserWorkerType, updateAssembly, updateUserName, createUserSecure, secureUpdateUserPassword } from '@/app/actions/admin';
import { useSession } from 'next-auth/react';
import {
    Shield, Clock, Trash2, Ban, CheckCircle,
    Users as UsersIcon, Building2, ChevronDown, ChevronRight,
    Mail, AlertCircle, UserCheck, Star, User, Edit, Share2, X, Lock, Key, Search
} from 'lucide-react';

export default function UsersPage() {
    const { data: session } = useSession();
    const currentUser = session?.user as any;

    const [users, setUsers] = useState<any[]>([]);
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'pending': true });
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);

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
        await setUserRole(id, role);
        fetchData();
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

        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

        const isMasterContext = u.role === 'ADMIN' || u.role === 'SUPERADMIN' ||
            u.status === 'Pending' ||
            !u.assemblyId;

        return matchesSearch && matchesRole && isMasterContext;
    });

    const pendingUsers = filteredUsers.filter(u => u.status === 'Pending');
    const globalAdmins = filteredUsers.filter(u => (u.role === 'ADMIN' || u.role === 'SUPERADMIN') && u.status !== 'Pending');
    const creativeSMTeam = filteredUsers.filter(u => ['SOCIAL_MEDIA', 'SM_MANAGER', 'DESIGNER', 'EDITOR'].includes(u.role) && !u.assemblyId && u.status !== 'Pending');
    const candidatePool = filteredUsers.filter(u => u.role === 'CANDIDATE' && !u.assemblyId && u.status !== 'Pending');
    const otherUnassigned = filteredUsers.filter(u => !['SOCIAL_MEDIA', 'SM_MANAGER', 'DESIGNER', 'EDITOR', 'CANDIDATE', 'ADMIN', 'SUPERADMIN'].includes(u.role) && u.status !== 'Pending');

    if (loading) return (
        <div style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
            <p style={{ color: '#64748B', fontWeight: '800' }}>लोड हो रहा है...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ paddingBottom: '80px' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1E293B' }}>यूजर मास्टर</h1>
                    <p style={{ color: '#64748B', fontSize: '15px', fontWeight: '600' }}>सिस्टम के सभी मुख्य यूजर्स और एडमिन्स का प्रबंधन</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <UsersIcon size={20} /> नया यूजर बनाएं
                </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
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
                    style={{ padding: '16px 24px', borderRadius: '20px', border: '1px solid #E2E8F0', background: 'white', outline: 'none', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                >
                    <option value="ALL">सभी रोल्स</option>
                    <option value="ADMIN">एडमिन</option>
                    <option value="CANDIDATE">कैंडिडेट</option>
                    <option value="SOCIAL_MEDIA">सोशल सेना (General)</option>
                    <option value="SM_MANAGER">सोशल सेना मैनेजर</option>
                    <option value="DESIGNER">डिजाइनर</option>
                    <option value="EDITOR">वीडियो एडिटर</option>
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <UserGroupSection
                    title="पेंडिंग अप्रूवल"
                    icon={<Clock size={20} color="#F59E0B" />}
                    users={pendingUsers}
                    id="pending"
                    expanded={expandedGroups['pending']}
                    onToggle={toggleGroup}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateRole={handleUpdateRole}
                    onAssignAssembly={handleAssignAssembly}
                />
                <UserGroupSection
                    title="सिस्टम एडमिन्स"
                    icon={<Shield size={20} color="#6366F1" />}
                    users={globalAdmins}
                    id="admins"
                    expanded={expandedGroups['admins']}
                    onToggle={toggleGroup}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateRole={handleUpdateRole}
                    onAssignAssembly={handleAssignAssembly}
                    onEditName={triggerUpdateUserName}
                    onDelete={triggerDelete}
                />
                <UserGroupSection
                    title="Social Sena"
                    icon={<Share2 size={20} color="#EF4444" />}
                    users={creativeSMTeam}
                    id="sm_team"
                    expanded={expandedGroups['sm_team']}
                    onToggle={toggleGroup}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateRole={handleUpdateRole}
                    onAssignAssembly={handleAssignAssembly}
                    onEditName={triggerUpdateUserName}
                    onDelete={triggerDelete}
                />
                <UserGroupSection
                    title="Candidate Pool (Unassigned)"
                    icon={<Star size={20} color="#F59E0B" />}
                    users={candidatePool}
                    id="candidate_pool"
                    expanded={expandedGroups['candidate_pool']}
                    onToggle={toggleGroup}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateRole={handleUpdateRole}
                    onAssignAssembly={handleAssignAssembly}
                    onEditName={triggerUpdateUserName}
                    onDelete={triggerDelete}
                    onChangePassword={triggerChangePassword}
                />
                <UserGroupSection
                    title="Other Members"
                    icon={<UsersIcon size={20} color="#64748B" />}
                    users={otherUnassigned}
                    id="others"
                    expanded={expandedGroups['others']}
                    onToggle={toggleGroup}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateRole={handleUpdateRole}
                    onAssignAssembly={handleAssignAssembly}
                    onEditName={triggerUpdateUserName}
                    onDelete={triggerDelete}
                />

            </div>

            {/* --- Premium Modals --- */}

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
                                    placeholder="मोबाइल नंबर बदलें..."
                                    style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0', outline: 'none', fontSize: '16px', fontWeight: '600' }}
                                />
                            </div>
                        )}
                    </div>
                </PremiumModal>
            )}

            {passwordModalOpen && selectedUser && (
                <PremiumModal
                    title="पासवर्ड बदलें"
                    onClose={() => setPasswordModalOpen(false)}
                    actions={[
                        { label: 'रद्द करें', onClick: () => setPasswordModalOpen(false), type: 'secondary' },
                        { label: 'पासवर्ड बदलें', onClick: confirmChangePassword, type: 'primary' }
                    ]}
                >
                    <div style={{ padding: '24px' }}>
                        <p style={{ marginBottom: '16px', color: '#64748B', fontSize: '14px', fontWeight: '600' }}>यूजर: <span style={{ color: '#1E293B' }}>{selectedUser.name}</span></p>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                value={newInput}
                                onChange={(e) => setNewInput(e.target.value)}
                                autoFocus
                                placeholder="नया पासवर्ड (कम से कम 6 अक्षर)"
                                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '2px solid #E2E8F0', outline: 'none', fontSize: '16px', fontWeight: '600' }}
                            />
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748B', fontWeight: '700', paddingLeft: '8px' }}>
                            अनिवार्य: कम से कम 1 बड़ा अक्षर (Caps), 1 स्पेशल चिन्ह (@, #, $), और 1 अंक
                        </div>
                    </div>
                </PremiumModal>
            )}

            {deleteModalOpen && selectedUser && (
                <PremiumModal
                    title="पक्का डिलीट करें?"
                    onClose={() => setDeleteModalOpen(false)}
                    actions={[
                        { label: 'नहीं, छोड़ें', onClick: () => setDeleteModalOpen(false), type: 'secondary' },
                        { label: 'हाँ, डिलीट करें', onClick: confirmDelete, type: 'danger' }
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

function UserGroupSection({ title, icon, users, id, expanded, onToggle, onUpdateStatus, onUpdateRole, onAssignAssembly, onEditName, onDelete, isAssemblyGroup, onChangePassword }: any) {
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
                <div style={{ borderTop: '1px solid #F1F5F9', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>यूजर / मोबाइल</th>
                                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>रोल (Role)</th>
                                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>स्टेटस</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>एक्शन</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u: any) => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#FCFDFF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', background: '#F1F5F9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}><User size={18} /></div>
                                            <div>
                                                <div style={{ fontWeight: '800', color: '#1E293B', fontSize: '14px' }}>{u.name}</div>
                                                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>{u.mobile}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <select
                                            value={u.role}
                                            onChange={(e) => onUpdateRole(u.id, e.target.value)}
                                            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer', background: 'white' }}
                                        >
                                            <option value="SUPERADMIN">Super Admin</option>
                                            <option value="ADMIN">Admin</option>
                                            <option value="CANDIDATE">Candidate</option>
                                            <option value="SOCIAL_MEDIA">Social Sena (General)</option>
                                            <option value="SM_MANAGER">Social Sena Manager</option>
                                            <option value="DESIGNER">Graphics Designer</option>
                                            <option value="EDITOR">Video Editor</option>
                                            <option value="WORKER">Worker</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', background: u.status === 'Active' ? '#DCFCE7' : u.status === 'Pending' ? '#FEF3C7' : '#FEE2E2', color: u.status === 'Active' ? '#15803D' : u.status === 'Pending' ? '#92400E' : '#991B1B', fontSize: '12px', fontWeight: '800' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                                            {u.status === 'Active' ? 'सक्रिय' : u.status === 'Pending' ? 'पेंडिंग' : 'ब्लॉक'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {u.status === 'Pending' && (
                                                <button onClick={() => onUpdateStatus(u.id, 'Active')} style={{ padding: '8px 16px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>अप्रूव करें</button>
                                            )}
                                            {onEditName && <button onClick={() => onEditName(u)} style={{ width: '32px', height: '32px', border: '1px solid #E2E8F0', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }} title="नाम सुधारें"><Edit size={14} /></button>}
                                            {onChangePassword && <button onClick={() => onChangePassword(u)} style={{ width: '32px', height: '32px', border: '1px solid #E2E8F0', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', cursor: 'pointer' }} title="पासवर्ड बदलें"><Key size={14} /></button>}
                                            <button onClick={() => onUpdateStatus(u.id, u.status === 'Active' ? 'Blocked' : 'Active')} style={{ width: '32px', height: '32px', border: '1px solid #E2E8F0', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: u.status === 'Active' ? '#DC2626' : '#16A34A', cursor: 'pointer' }} title={u.status === 'Active' ? 'ब्लॉक करें' : 'अनब्लॉक करें'}>{u.status === 'Active' ? <Ban size={14} /> : <CheckCircle size={14} />}</button>
                                            {onDelete && <button onClick={() => onDelete(u)} style={{ width: '32px', height: '32px', border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', cursor: 'pointer' }} title="हटाएं"><Trash2 size={14} /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>मोबाइल नंबर</label>
                        <input type="text" placeholder="मोबाइल नंबर" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>रोल (Role)</label>
                        <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', background: 'white' }}>
                            <option value="CANDIDATE">Candidate (कैंडिडेट)</option>
                            <option value="SOCIAL_MEDIA">Social Sena (General)</option>
                            <option value="SM_MANAGER">Social Sena Manager</option>
                            <option value="DESIGNER">Graphics Designer</option>
                            <option value="EDITOR">Video Editor</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>पासवर्ड</label>
                        <input type="password" placeholder="पासवर्ड बनाएं" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px' }} />
                        <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748B', fontWeight: '700' }}>
                            जरूरी: 1 बड़ा अक्षर (Caps), 1 स्पेशल चिन्ह (@, #, $), 1 अंक
                        </div>
                    </div>
                    {(formData.role === 'WORKER') && (
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>विधानसभा</label>
                            <select value={formData.assemblyId} onChange={e => setFormData({ ...formData, assemblyId: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', background: 'white' }}>
                                <option value="">विधानसभा चुनें</option>
                                {assemblies.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
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
