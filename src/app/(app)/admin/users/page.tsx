'use client';

import React, { useState, useEffect } from 'react';
import { getUsers, getAssemblies, setUserStatus, setUserRole, assignUserToAssembly, deleteUser, getCampaigns, assignUserToCampaign, setUserWorkerType, updateAssembly, updateUserName, createUserSecure, secureUpdateUserPassword } from '@/app/actions/admin';
import { useSession } from 'next-auth/react';
import {
    Shield, Clock, Trash2, Ban, CheckCircle,
    Users as UsersIcon, Building2, ChevronDown, ChevronRight,
    Mail, AlertCircle, UserCheck, Star, User, Edit, Share2
} from 'lucide-react';

export default function UsersPage() {
    const { data: session } = useSession();
    const currentUser = session?.user as any;
    const isSuperAdmin = currentUser?.role === 'SUPERADMIN';
    const isMainAdmin = currentUser?.mobile === '9723338321';

    const [users, setUsers] = useState<any[]>([]);
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'pending': true });
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

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

    const handleUpdateCandidateName = async (assemblyId: number, currentName: string) => {
        const newName = prompt('कैंडिडेट का नया नाम लिखें:', currentName);
        if (newName && newName !== currentName) {
            await updateAssembly(assemblyId, { candidateName: newName });
            fetchData();
        }
    };

    const handleUpdateUserName = async (userId: number, currentName: string) => {
        const newName = prompt('यूजर का नया नाम लिखें:', currentName);
        if (newName && newName !== currentName) {
            await updateUserName(userId, newName);
            fetchData();
        }
    };

    const handleChangePassword = async (userId: number) => {
        const newPassword = prompt('नया पासवर्ड दर्ज करें (कम से कम 6 अक्षर):');
        if (newPassword && newPassword.length >= 6) {
            try {
                await secureUpdateUserPassword(userId, newPassword);
                alert('पासवर्ड सफलतापूर्वक बदल दिया गया है!');
            } catch (error: any) {
                alert(error.message);
            }
        }
    };

    const handleCreateUser = async () => {
        const name = prompt('यूजर का नाम:');
        if (!name) return;
        const mobile = prompt('मोबाइल नंबर:');
        if (!mobile) return;
        const password = prompt('पासवर्ड सेट करें:');
        if (!password) return;
        const role = prompt('रोल चुनें (ADMIN, MANAGER, SOCIAL_MEDIA):', 'MANAGER');
        if (!role) return;

        try {
            await createUserSecure({ name, mobile, password, role: role.toUpperCase() });
            fetchData();
            alert('यूजर सफलतापूर्वक बना दिया गया है!');
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('क्या आप इस यूजर को स्थायी रूप से हटाना चाहते हैं?')) {
            await deleteUser(id);
            fetchData();
        }
    };

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // 1. Filtering Logic - Show only unassigned users or Admins
    const filteredUsers = users.filter(u => {
        const matchesSearch = !searchQuery ||
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.role?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

        // User Master context: Admins, Pending, or anyone NOT assigned to an assembly
        const isMasterContext = u.role === 'ADMIN' || u.role === 'SUPERADMIN' ||
            u.status === 'Pending' ||
            !u.assemblyId;

        return matchesSearch && matchesRole && isMasterContext;
    });

    // Logical Grouping
    const pendingUsers = filteredUsers.filter(u => u.status === 'Pending');
    const globalAdmins = filteredUsers.filter(u => (u.role === 'ADMIN' || u.role === 'SUPERADMIN') && u.status !== 'Pending');
    const socialMediaPool = filteredUsers.filter(u => u.role === 'SOCIAL_MEDIA' && u.status !== 'Pending');
    const otherUnassigned = filteredUsers.filter(u => u.role !== 'SOCIAL_MEDIA' && u.role !== 'ADMIN' && u.role !== 'SUPERADMIN' && u.status !== 'Pending');


    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>डेटा लोड हो रहा है...</div>;

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1E293B' }}>यूजर मैनेजमेंट</h1>
                    <p style={{ color: '#64748B', marginTop: '4px' }}>प्रतीक्षित मंजूरी, कैंडिडेट्स और उनकी टीमों का प्रबंधन करें</p>
                </div>
                {isSuperAdmin && (
                    <button
                        onClick={handleCreateUser}
                        style={{ background: '#2563EB', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        + नया यूजर बनाएं
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <UsersIcon size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
                    <input
                        type="text"
                        placeholder="यूजर का नाम, ईमेल या रोल से खोजें..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }}
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#1E293B', fontWeight: '600', outline: 'none' }}
                >
                    <option value="ALL">सभी रोल (All Roles)</option>
                    <option value="SUPERADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                    <option value="MANAGER">Candidate (Manager)</option>
                    <option value="WORKER">Worker</option>
                </select>
            </div>

            {/* 1. Pending Approvals */}
            {pendingUsers.length > 0 && (
                <div className="card" style={{ padding: 0, marginBottom: '24px', overflow: 'hidden', border: '1px solid #FEF3C7' }}>
                    <div onClick={() => toggleGroup('pending')} style={{ padding: '16px 24px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AlertCircle size={20} color="#D97706" />
                            <span style={{ fontWeight: '800', color: '#92400E' }}>प्रतीक्षित यूज़र्स ({pendingUsers.length})</span>
                        </div>
                        {expandedGroups['pending'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    {expandedGroups['pending'] && (
                        <div style={{ padding: '0 24px 24px' }}>
                            <UserTable
                                users={pendingUsers}
                                assemblies={assemblies}
                                campaigns={campaigns}
                                onStatus={handleUpdateStatus}
                                onRole={handleUpdateRole}
                                onAssign={handleAssignAssembly}
                                onAssignCampaign={handleAssignCampaign}
                                onWorkerType={handleUpdateWorkerType}
                                onEditName={handleUpdateUserName}
                                onChangePassword={handleChangePassword}
                                onDelete={handleDelete}
                                isSuperAdmin={isSuperAdmin}
                                isMainAdmin={isMainAdmin}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* 2. CreatiAV Social Media Team */}
            <div className="card" style={{ padding: 0, marginBottom: '32px', overflow: 'hidden', border: '1px solid #E0F2FE' }}>
                <div onClick={() => toggleGroup('social-media-pool')} style={{ padding: '16px 24px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UsersIcon size={20} color="#0284C7" />
                        <span style={{ fontWeight: '800', color: '#075985' }}>CreatiAV सोशल मीडिया टीम ({socialMediaPool.length})</span>
                        <span style={{ fontSize: '11px', background: '#BAE6FD', color: '#0369A1', padding: '2px 8px', borderRadius: '20px', fontWeight: '800' }}>उपलब्ध सदस्य</span>
                    </div>
                    {expandedGroups['social-media-pool'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                {expandedGroups['social-media-pool'] && (
                    <div style={{ padding: '24px' }}>
                        <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>ये वे सदस्य हैं जो किसी कैंडिडेट को असाइन नहीं किए गए हैं। नीचे कैंडिडेट्स के कार्ड में जाकर उन्हें यहाँ से चुन सकते हैं।</p>
                        <UserTable
                            users={socialMediaPool}
                            assemblies={assemblies}
                            campaigns={campaigns}
                            onStatus={handleUpdateStatus}
                            onRole={handleUpdateRole}
                            onAssign={handleAssignAssembly}
                            onAssignCampaign={handleAssignCampaign}
                            onWorkerType={handleUpdateWorkerType}
                            onEditName={handleUpdateUserName}
                            onChangePassword={handleChangePassword}
                            onDelete={handleDelete}
                            isSuperAdmin={isSuperAdmin}
                            isMainAdmin={isMainAdmin}
                        />
                    </div>
                )}
            </div>

            {/* 2b. CreatiAV Survey Team */}
            <div className="card" style={{ padding: 0, marginBottom: '32px', overflow: 'hidden', border: '1px solid #DBEAFE' }}>
                <div onClick={() => toggleGroup('survey-team')} style={{ padding: '16px 24px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UsersIcon size={20} color="#3B82F6" />
                        <span style={{ fontWeight: '800', color: '#1E40AF' }}>CreatiAV सर्वे टीम (0)</span>
                        <span style={{ fontSize: '11px', background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '20px', fontWeight: '800' }}>जल्द आ रहा है</span>
                    </div>
                    {expandedGroups['survey-team'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                {expandedGroups['survey-team'] && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                        <p style={{ fontSize: '14px' }}>सर्वे टीम के सदस्य जल्द ही जोड़े जाएंगे</p>
                    </div>
                )}
            </div>

            {/* 2c. CreatiAV Ground Team */}
            <div className="card" style={{ padding: 0, marginBottom: '32px', overflow: 'hidden', border: '1px solid #D1FAE5' }}>
                <div onClick={() => toggleGroup('ground-team')} style={{ padding: '16px 24px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UsersIcon size={20} color="#059669" />
                        <span style={{ fontWeight: '800', color: '#065F46' }}>CreatiAV ग्राउंड टीम (0)</span>
                        <span style={{ fontSize: '11px', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '20px', fontWeight: '800' }}>जल्द आ रहा है</span>
                    </div>
                    {expandedGroups['ground-team'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                {expandedGroups['ground-team'] && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                        <p style={{ fontSize: '14px' }}>ग्राउंड टीम के सदस्य जल्द ही जोड़े जाएंगे</p>
                    </div>
                )}
            </div>

            {/* 3. Global Administrators */}
            {globalAdmins.length > 0 && !searchQuery && roleFilter === 'ALL' && (
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <Shield size={20} color="#6366F1" />
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>मुख्य एडमिनिस्ट्रेटर्स (Global Admins)</h2>
                    </div>
                    <UserTable
                        users={globalAdmins}
                        assemblies={assemblies}
                        campaigns={campaigns}
                        onStatus={handleUpdateStatus}
                        onRole={handleUpdateRole}
                        onAssign={handleAssignAssembly}
                        onAssignCampaign={handleAssignCampaign}
                        onWorkerType={handleUpdateWorkerType}
                        onEditName={handleUpdateUserName}
                        onChangePassword={handleChangePassword}
                        onDelete={handleDelete}
                        isSuperAdmin={isSuperAdmin}
                        isMainAdmin={isMainAdmin}
                    />
                </div>
            )}

            {/* 4. Other Unassigned Workers (Talent Pool) */}
            {otherUnassigned.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <UserCheck size={20} color="#F59E0B" />
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>प्रतीक्षित असाइनमेंट (Unassigned Workers)</h2>
                    </div>
                    <UserTable
                        users={otherUnassigned}
                        assemblies={assemblies}
                        campaigns={campaigns}
                        onStatus={handleUpdateStatus}
                        onRole={handleUpdateRole}
                        onAssign={handleAssignAssembly}
                        onAssignCampaign={handleAssignCampaign}
                        onWorkerType={handleUpdateWorkerType}
                        onEditName={handleUpdateUserName}
                        onChangePassword={handleChangePassword}
                        onDelete={handleDelete}
                        isSuperAdmin={isSuperAdmin}
                        isMainAdmin={isMainAdmin}
                    />
                </div>
            )}
        </div>
    );
}

function UserTable({ users, assemblies, campaigns, onStatus, onRole, onAssign, onAssignCampaign, onWorkerType, onEditName, onChangePassword, onDelete, isSuperAdmin, isMainAdmin }: any) {
    if (users.length === 0) return <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>कोई यूजर नहीं मिला।</div>;

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>
                        <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>यूजर</th>
                        <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>रोल</th>
                        <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>विधानसभा</th>
                        <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>कैंडिडेट (Campaign)</th>
                        <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>एक्शन</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user: any) => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {user.image ? <img src={user.image} style={{ width: '32px', height: '32px', borderRadius: '50%' }} /> : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UsersIcon size={14} color="#94A3B8" /></div>}
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {user.name || 'User'}
                                            {isSuperAdmin && (
                                                <button
                                                    onClick={() => onEditName(user.id, user.name || 'User')}
                                                    style={{ border: 'none', background: 'none', padding: '0', cursor: 'pointer', color: '#94A3B8' }}
                                                >
                                                    <Edit size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={{ padding: '12px' }}>
                                {isSuperAdmin ? (
                                    <select
                                        value={user.role}
                                        onChange={(e) => onRole(user.id, e.target.value)}
                                        style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid #E2E8F0' }}
                                    >
                                        <option value="MANAGER">Candidate (Manager)</option>
                                        <option value="WORKER">Worker</option>
                                        <option value="SOCIAL_MEDIA">Social Media</option>
                                    </select>
                                ) : (
                                    <span style={{ fontSize: '12px', fontWeight: '700' }}>{user.role}</span>
                                )}

                                {user.role === 'SOCIAL_MEDIA' && isSuperAdmin && (
                                    <div style={{ marginTop: '4px' }}>
                                        <div style={{ fontSize: '9px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Designation</div>
                                        <select
                                            value={user.worker?.type || ''}
                                            onChange={(e) => onWorkerType(user.id, e.target.value)}
                                            style={{ padding: '2px 4px', borderRadius: '4px', fontSize: '10px', border: '1px solid #E2E8F0', width: '100%', background: '#F8FAFC' }}
                                        >
                                            <option value="">Choose...</option>
                                            <option value="CENTRAL_MANAGER">Manager</option>
                                            <option value="CENTRAL_DESIGNER">Designer</option>
                                            <option value="CENTRAL_EDITOR">Video Editor</option>
                                            <option value="CENTRAL_MONITOR">Monitoring</option>
                                            <option value="SOCIAL_CENTRAL">Social Central (Admin)</option>
                                        </select>
                                    </div>
                                )}
                                {user.role === 'SOCIAL_MEDIA' && !isSuperAdmin && user.worker?.type && (
                                    <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>({user.worker.type})</div>
                                )}
                            </td>
                            <td style={{ padding: '12px' }}>
                                <select
                                    value={user.assemblyId || ''}
                                    onChange={(e) => onAssign(user.id, e.target.value)}
                                    style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid #E2E8F0', width: '130px' }}
                                >
                                    <option value="">None</option>
                                    {assemblies.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </td>
                            <td style={{ padding: '12px' }}>
                                <select
                                    disabled={!user.assemblyId}
                                    value={user.campaignId || ''}
                                    onChange={(e) => onAssignCampaign(user.id, e.target.value)}
                                    style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid #E2E8F0', width: '130px', background: !user.assemblyId ? '#F1F5F9' : 'white' }}
                                >
                                    <option value="">None</option>
                                    {campaigns && campaigns.filter((c: any) => c.assemblyId === user.assemblyId).map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.candidateName || c.name}</option>
                                    ))}
                                </select>
                            </td>
                            <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {user.status === 'Pending' ? (
                                        <button onClick={() => onStatus(user.id, 'Active')} style={{ padding: '4px 10px', background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>अप्रूव</button>
                                    ) : (
                                        <button
                                            disabled={user.mobile === '9723338321'}
                                            onClick={() => onStatus(user.id, user.status === 'Active' ? 'Blocked' : 'Active')}
                                            style={{
                                                padding: '4px',
                                                background: user.status === 'Active' ? '#FEE2E2' : '#D1FAE5',
                                                color: user.status === 'Active' ? '#DC2626' : '#059669',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: user.mobile === '9723338321' ? 'not-allowed' : 'pointer',
                                                opacity: user.mobile === '9723338321' ? 0.5 : 1
                                            }}
                                            title={user.mobile === '9723338321' ? 'Primary Super Admin cannot be blocked' : ''}
                                        >
                                            {user.status === 'Active' ? <Ban size={14} /> : <CheckCircle size={14} />}
                                        </button>
                                    )}
                                    <button
                                        disabled={user.mobile === '9723338321'}
                                        onClick={() => onDelete(user.id)}
                                        style={{
                                            padding: '4px',
                                            background: '#F1F5F9',
                                            color: '#64748B',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: user.mobile === '9723338321' ? 'not-allowed' : 'pointer',
                                            opacity: user.mobile === '9723338321' ? 0.5 : 1
                                        }}
                                        title={user.mobile === '9723338321' ? 'Primary Super Admin cannot be deleted' : ''}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    {isSuperAdmin && (
                                        <button
                                            onClick={() => onChangePassword(user.id)}
                                            style={{
                                                padding: '4px 8px',
                                                background: '#F1F5F9',
                                                color: '#2563EB',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '10px',
                                                fontWeight: '800',
                                                cursor: 'pointer'
                                            }}
                                            title="पासवर्ड बदलें"
                                        >
                                            PW
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
