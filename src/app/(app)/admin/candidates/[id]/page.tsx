/*
 * 🔒 LOCKED BY USER
 * -------------------------------------------------------------------------
 * This file is considered STABLE and LOCKED.
 * DO NOT MODIFY this file without explicit permission from the user.
 * -------------------------------------------------------------------------
 */
'use client';

import React, { useState, useEffect } from 'react';
// ... (rest of imports)
import { useParams, useRouter } from 'next/navigation';
import {
    getUsers, getAssemblies, setUserStatus, setUserRole,
    assignUserToAssembly, deleteUser, getCampaigns,
    assignUserToCampaign, setUserWorkerType, updateAssembly,
    updateUserName, assignTeamToAssembly
} from '@/app/actions/admin';
import { useSession } from 'next-auth/react';
import {
    Shield, ArrowLeft, Users, Star, Edit,
    Share2, Mail, CheckCircle, Ban, Trash2,
    UserCheck, MapPin, ExternalLink, PlusSquare, UserPlus
} from 'lucide-react';

export default function CandidateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const assemblyId = params.id as string;

    const { data: session } = useSession();
    const currentUser = session?.user as any;
    const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

    const [users, setUsers] = useState<any[]>([]);
    const [assembly, setAssembly] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'field' | 'social'>('field');

    useEffect(() => {
        fetchData();
    }, [assemblyId]);

    async function fetchData() {
        setLoading(true);
        const [userData, assemblyData, campaignData] = await Promise.all([
            getUsers(),
            getAssemblies(),
            getCampaigns()
        ]);

        const currentAssembly = assemblyData.find((a: any) => a.id === parseInt(assemblyId));
        setAssembly(currentAssembly);
        setUsers(userData);
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

    const handleAssignAssembly = async (userId: number, aId: string) => {
        await assignUserToAssembly(userId, aId ? parseInt(aId) : null);
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

    const handleUpdateUserName = async (userId: number, currentName: string) => {
        const newName = prompt('यूजर का नया नाम लिखें:', currentName);
        if (newName && newName !== currentName) {
            await updateUserName(userId, newName);
            fetchData();
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (confirm('क्या आप इस यूजर को हटाना चाहते हैं?')) {
            await deleteUser(id);
            fetchData();
        }
    };

    if (loading) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: '800' }}>डेटा लोड हो रहा है...</div>;
    if (!assembly) return <div style={{ padding: '100px', textAlign: 'center' }}>कैंडिडेट नहीं मिला।</div>;

    const assemblyUsers = users.filter(u => u.assemblyId === assembly.id && u.status !== 'Pending');
    const candidateUser = assemblyUsers.find(u => u.role === 'CANDIDATE');
    const fieldTeam = assemblyUsers.filter(u => !['SOCIAL_MEDIA', 'CANDIDATE', 'ADMIN', 'SUPERADMIN'].includes(u.role));

    // Social team comes from sharedAssignments (many-to-many)
    const socialTeam = (assembly as any).sharedAssignments
        ?.filter((a: any) => a.role === 'SOCIAL_MEDIA' && !['ADMIN', 'SUPERADMIN'].includes(a.user?.role))
        ?.map((a: any) => a.user) || [];

    // Talent Pool for adding new members
    // Social Media can be shared across multiple candidates
    const socialPool = users.filter(u => u.role === 'SOCIAL_MEDIA' && u.status === 'Active');
    const workerPool = users.filter(u => u.role === 'WORKER' && !u.assemblyId && u.status === 'Active');

    return (
        <div style={{ paddingBottom: '60px' }}>
            {/* Header / Back Navigation */}
            <button
                onClick={() => router.push('/admin/candidates')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '24px', fontWeight: '700' }}
            >
                <ArrowLeft size={18} /> कैंडिडेट्स सूची पर वापस जाएं
            </button>

            {/* Candidate Hero Card */}
            <div style={{
                background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
                borderRadius: '32px',
                padding: '40px',
                color: 'white',
                marginBottom: '40px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
                <div style={{ position: 'absolute', right: '-50px', top: '-50px', opacity: 0.1 }}>
                    <Star size={300} fill="white" />
                </div>

                <div style={{ display: 'flex', gap: '40px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.2)' }}>
                        {assembly.candidateImageUrl ? (
                            <img src={assembly.candidateImageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '28px', objectFit: 'cover' }} />
                        ) : (
                            <Star size={60} fill="white" />
                        )}
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <span style={{ background: '#2563EB', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '900' }}>#{assembly.number}</span>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>{assembly.party}</span>
                        </div>
                        <h1 style={{ fontSize: '40px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>{assembly.candidateName || assembly.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px', color: 'rgba(255,255,255,0.8)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={16} /> <span style={{ fontWeight: '700' }}>{assembly.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Users size={16} /> <span style={{ fontWeight: '700' }}>{assemblyUsers.length} कुल सदस्य</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Assignment Section */}
            {isSuperAdmin && (
                <div style={{
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                    borderRadius: '24px',
                    padding: '32px',
                    marginBottom: '40px',
                    border: '2px solid #BFDBFE'
                }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <UserPlus size={28} /> कॉमन टीम असाइन करें
                        </h2>
                        <p style={{ color: '#64748B', fontSize: '15px', fontWeight: '600' }}>
                            पूरी की पूरी टीम को इस कैंडिडेट के साथ जोड़ें (Social Media, Survey, आदि)
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        {/* Social Media Team */}
                        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '2px solid #E0E7FF', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '48px', height: '48px', background: '#EEF2FF', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Share2 size={24} color="#4F46E5" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B' }}>Social Media Team</div>
                                    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>{socialPool.length} सदस्य उपलब्ध</div>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    if (confirm(`क्या आप पूरी Social Media Team (${socialPool.length} सदस्य) को इस कैंडिडेट को असाइन करना चाहते हैं?`)) {
                                        await assignTeamToAssembly('SOCIAL_MEDIA', assembly.id);
                                        fetchData();
                                    }
                                }}
                                disabled={socialPool.length === 0}
                                style={{
                                    width: '100%',
                                    padding: '12px 20px',
                                    background: socialPool.length > 0 ? '#4F46E5' : '#E2E8F0',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '800',
                                    fontSize: '14px',
                                    cursor: socialPool.length > 0 ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <UserPlus size={18} /> {socialPool.length > 0 ? `${socialPool.length} सदस्य असाइन करें` : 'कोई सदस्य उपलब्ध नहीं'}
                            </button>
                        </div>

                        {/* Ground Team */}
                        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '2px solid #D1FAE5', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '48px', height: '48px', background: '#F0FDF4', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={24} color="#059669" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B' }}>Ground Workers</div>
                                    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>{workerPool.length} सदस्य उपलब्ध</div>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    if (confirm(`क्या आप पूरी Worker Team (${workerPool.length} सदस्य) को इस कैंडिडेट को असाइन करना चाहते हैं?`)) {
                                        await assignTeamToAssembly('WORKER', assembly.id);
                                        fetchData();
                                    }
                                }}
                                disabled={workerPool.length === 0}
                                style={{
                                    width: '100%',
                                    padding: '12px 20px',
                                    background: workerPool.length > 0 ? '#059669' : '#E2E8F0',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '800',
                                    fontSize: '14px',
                                    cursor: workerPool.length > 0 ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <UserPlus size={18} /> {workerPool.length > 0 ? `${workerPool.length} सदस्य असाइन करें` : 'कोई सदस्य उपलब्ध नहीं'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leading Candidate (Manager) */}
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={24} color="#059669" /> मुख्य प्रत्याशी खाता (Manager)
                </h2>

                {candidateUser ? (
                    <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', padding: '24px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ width: '56px', height: '56px', background: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                <UserCheck size={28} color="#059669" />
                            </div>
                            <div>
                                <div style={{ fontSize: '20px', fontWeight: '900', color: '#064E3B' }}>{candidateUser.name}</div>
                                <div style={{ fontSize: '14px', color: '#64748B' }}>{candidateUser.email}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => handleUpdateUserName(candidateUser.id, candidateUser.name)}
                                style={{ padding: '10px 20px', background: 'white', border: '1px solid #D1FAE5', color: '#059669', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Edit size={16} /> नाम बदलें
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '32px', textAlign: 'center', background: '#F8FAFC', borderRadius: '24px', border: '1px dashed #E2E8F0' }}>
                        <p style={{ color: '#64748B', fontWeight: '600', marginBottom: '16px' }}>इस विधानसभा के लिए अभी तक किसी 'कैंडिडेट यूजर' को असाइन नहीं किया गया है।</p>
                        <button
                            onClick={() => router.push('/admin/users')}
                            style={{ padding: '12px 24px', background: '#1E293B', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
                        >
                            यूजर मास्टर से कैंडिडेट चुनें
                        </button>
                    </div>
                )}
            </div>

            {/* Team Tabs */}
            <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid #E2E8F0', marginBottom: '32px' }}>
                <button
                    onClick={() => setActiveTab('field')}
                    style={{ padding: '16px 8px', background: 'none', border: 'none', borderBottom: activeTab === 'field' ? '4px solid #059669' : '4px solid transparent', color: activeTab === 'field' ? '#059669' : '#64748B', fontWeight: '800', cursor: 'pointer', fontSize: '16px' }}
                >
                    ग्राउंड फील्ड टीम ({fieldTeam.length})
                </button>
                <button
                    onClick={() => setActiveTab('social')}
                    style={{ padding: '16px 8px', background: 'none', border: 'none', borderBottom: activeTab === 'social' ? '4px solid #2563EB' : '4px solid transparent', color: activeTab === 'social' ? '#2563EB' : '#64748B', fontWeight: '800', cursor: 'pointer', fontSize: '16px' }}
                >
                    सोशल मीडिया टीम ({socialTeam.length})
                </button>
            </div>

            {/* Team Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
                <div className="card" style={{ padding: '32px', minHeight: '500px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B' }}>
                            {activeTab === 'field' ? 'कार्यकर्ता दल (Ground Team)' : 'सोशल मीडिया एक्सपर्ट्स'}
                        </h3>
                    </div>

                    <UserListTable
                        users={activeTab === 'field' ? fieldTeam : socialTeam}
                        onStatus={handleUpdateStatus}
                        onRole={handleUpdateRole}
                        onAssign={handleAssignAssembly}
                        onWorkerType={handleUpdateWorkerType}
                        onEditName={handleUpdateUserName}
                        onDelete={handleDeleteUser}
                        isSuperAdmin={isSuperAdmin}
                        campaigns={campaigns}
                        onAssignCampaign={handleAssignCampaign}
                        assemblyId={assembly.id}
                    />
                </div>

                {/* Quick Assign / Talent Pool Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card" style={{ padding: '24px', background: activeTab === 'social' ? '#F0F9FF' : '#F8FAFC', border: activeTab === 'social' ? '1px solid #BAE6FD' : '1px solid #E2E8F0' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '900', color: activeTab === 'social' ? '#0369A1' : '#475569', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <PlusSquare size={18} /> {activeTab === 'social' ? 'सोशल टैलेंट पूल' : 'कार्यकर्ता पूल'}
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '430px', overflowY: 'auto', paddingRight: '4px' }}>
                            {(activeTab === 'social' ? socialPool : workerPool).length > 0 ? (
                                (activeTab === 'social' ? socialPool : workerPool).map(u => (
                                    <div key={u.id} style={{ padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                                            <div style={{ fontSize: '11px', color: '#64748B' }}>{u.email}</div>
                                        </div>
                                        <button
                                            onClick={() => handleAssignAssembly(u.id, assemblyId)}
                                            style={{ padding: '6px 10px', background: activeTab === 'social' ? '#2563EB' : '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', flexShrink: 0, marginLeft: '8px' }}
                                        >
                                            असाइन
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>कोई सदस्य उपलब्ध नहीं है।</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => router.push('/admin/users')}
                            style={{ width: '100%', marginTop: '16px', padding: '10px', background: 'none', border: '1px dashed #CBD5E1', borderRadius: '12px', color: '#64748B', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                            <UserCheck size={14} /> यूजर मास्टर देखें
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserListTable({ users, onStatus, onRole, onAssign, onWorkerType, onEditName, onDelete, isSuperAdmin, campaigns, onAssignCampaign, assemblyId }: any) {
    if (users.length === 0) return (
        <div style={{ textAlign: 'center', padding: '100px 40px', color: '#94A3B8' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>👥</div>
            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>इस टीम में अभी कोई सदस्य नहीं है।</div>
            <p style={{ fontSize: '14px' }}>दाहिनी ओर "टैलेंट पूल" से सदस्यों को इस टीम में जोड़ें।</p>
        </div>
    );

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>
                        <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>प्रयोक्ता (User)</th>
                        <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>रोल / प्रकार</th>
                        <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>कार्य (Campaign)</th>
                        <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>एक्शन</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user: any) => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '16px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F1F5F9', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {user.image ? <img src={user.image} style={{ width: '100%', height: '100%', borderRadius: '10px' }} /> : <Users size={20} color="#94A3B8" />}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: '800', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                                        <div style={{ fontSize: '11px', color: '#64748B' }}>{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={{ padding: '16px 12px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>{user.role}</div>
                                {user.role === 'SOCIAL_MEDIA' && (
                                    <select
                                        value={user.worker?.type || ''}
                                        onChange={(e) => onWorkerType(user.id, e.target.value)}
                                        style={{ marginTop: '4px', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', maxWidth: '120px' }}
                                    >
                                        <option value="">सम्पादक चुनें</option>
                                        <option value="CENTRAL_MANAGER">सोशल मैनेजर</option>
                                        <option value="CENTRAL_DESIGNER">ग्राफ़िक डिज़ाइनर</option>
                                        <option value="CENTRAL_EDITOR">वीडियो एडिटर</option>
                                    </select>
                                )}
                            </td>
                            <td style={{ padding: '16px 12px' }}>
                                <select
                                    value={user.campaignId || ''}
                                    onChange={(e) => onAssignCampaign(user.id, e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E8F0', width: '100%', cursor: 'pointer' }}
                                >
                                    <option value="">कोई अभियान नहीं</option>
                                    {campaigns.filter((c: any) => c.assemblyId === assemblyId).map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.candidateName || c.name}</option>
                                    ))}
                                </select>
                            </td>
                            <td style={{ padding: '16px 12px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        onClick={() => onEditName(user.id, user.name)}
                                        style={{ padding: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#64748B', cursor: 'pointer' }}
                                        title="नाम बदलें"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => onAssign(user.id, '')}
                                        style={{ padding: '8px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', color: '#EF4444', cursor: 'pointer' }}
                                        title="टीम से निकालें"
                                    >
                                        <Share2 size={14} style={{ transform: 'rotate(180deg)' }} />
                                    </button>
                                    {isSuperAdmin && (
                                        <button
                                            onClick={() => onDelete(user.id)}
                                            style={{ padding: '8px', background: '#FFF1F2', border: '1px solid #FFE4E6', borderRadius: '8px', color: '#E11D48', cursor: 'pointer' }}
                                            title="यूजर हटाएँ (Delete)"
                                        >
                                            <Trash2 size={14} />
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
