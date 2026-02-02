'use client';

import React, { useState, useEffect } from 'react';
import { getAssemblies, getUsers, getCampaigns, updateAssembly, deleteAssembly, toggleCandidateStatus } from '@/app/actions/admin';
import {
    Users, Star, MapPin, Search, Filter,
    ChevronDown, ChevronRight, Edit,
    LayoutGrid, List, Search as SearchIcon,
    Shield, Share2, Users as UsersIcon, Settings, X, CheckCircle, Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_FEATURES, FEATURE_CATEGORIES, getEnabledFeatures } from '@/lib/features';

export default function CandidatesPage() {
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [partyFilter, setPartyFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [featureModalOpen, setFeatureModalOpen] = useState(false);
    const [selectedAssembly, setSelectedAssembly] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        const [assemblyData, userData] = await Promise.all([
            getAssemblies(),
            getUsers()
        ]);
        setAssemblies(assemblyData);
        setUsers(userData);
        setLoading(false);
    }

    const filtered = assemblies.filter(a => {
        const matchesSearch = !searchQuery ||
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.number.toString().includes(searchQuery);
        const matchesParty = partyFilter === 'ALL' || a.party === partyFilter;
        return matchesSearch && matchesParty;
    });

    const handleEditName = async (id: number, current: string) => {
        const newName = prompt('कैंडिडेट का नया नाम:', current);
        if (newName && newName !== current) {
            await updateAssembly(id, { candidateName: newName });
            fetchData();
        }
    };

    const handleManageFeatures = (assembly: any) => {
        setSelectedAssembly(assembly);
        setFeatureModalOpen(true);
    };

    const handleSaveFeatures = async (features: string[]) => {
        if (!selectedAssembly) return;
        await updateAssembly(selectedAssembly.id, {
            enabledFeatures: JSON.stringify(features)
        } as any);
        setFeatureModalOpen(false);
        fetchData();
    };

    if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#64748B', fontWeight: '800' }}>लोड हो रहा है...</div>;

    return (
        <div style={{ paddingBottom: '60px' }}>
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1E293B' }}>कैंडिडेट्स (Candidates)</h1>
                    <p style={{ color: '#64748B', marginTop: '4px', fontSize: '15px' }}>सभी सक्रिय कैंडिडेट्स और उनकी टीमों का अवलोकन</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '4px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <button
                        onClick={() => setViewMode('grid')}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'grid' ? '#F1F5F9' : 'transparent', color: viewMode === 'grid' ? '#1E293B' : '#94A3B8', cursor: 'pointer' }}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'list' ? '#F1F5F9' : 'transparent', color: viewMode === 'list' ? '#1E293B' : '#94A3B8', cursor: 'pointer' }}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <SearchIcon size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="कैंडिडेट या विधानसभा से खोजें..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', fontWeight: '500', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    />
                </div>
                <select
                    value={partyFilter}
                    onChange={(e) => setPartyFilter(e.target.value)}
                    style={{ padding: '14px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', color: '#1E293B', fontWeight: '700', outline: 'none', cursor: 'pointer' }}
                >
                    <option value="ALL">सभी पार्टियां</option>
                    <option value="BJP">बीजेपी (BJP)</option>
                    <option value="INC">कांग्रेस (INC)</option>
                    <option value="SP">सपा (SP)</option>
                    <option value="BSP">बसपा (BSP)</option>
                    <option value="AAP">आप (AAP)</option>
                </select>
            </div>

            {/* Candidate Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(350px, 1fr))' : '1fr',
                gap: '24px'
            }}>
                {filtered.map(a => {
                    const assemblyUsers = users.filter(u => u.assemblyId === a.id);
                    // Social media count from sharedAssignments
                    const smCount = (a as any).sharedAssignments?.filter((sa: any) => sa.role === 'SOCIAL_MEDIA').length || 0;
                    const fieldCount = assemblyUsers.filter(u => u.role !== 'SOCIAL_MEDIA' && u.role !== 'ADMIN' && u.role !== 'SUPERADMIN').length;
                    const managerIsActive = assemblyUsers.some(u => u.role === 'MANAGER' && u.status === 'Active');

                    return (
                        <div
                            key={a.id}
                            onClick={() => router.push(`/admin/candidates/${a.id}`)}
                            style={{
                                background: 'white',
                                border: '1px solid #E2E8F0',
                                borderRadius: '24px',
                                padding: '24px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                transform: 'translateY(0)',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                                e.currentTarget.style.borderColor = '#2563EB';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                                e.currentTarget.style.borderColor = '#E2E8F0';
                            }}
                        >
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: '80px', height: '80px', background: '#F1F5F9', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                                        {a.candidateImageUrl ? (
                                            <img src={a.candidateImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Users size={40} color="#94A3B8" />
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEditName(a.id, a.candidateName || a.name); }}
                                        style={{ position: 'absolute', bottom: '-6px', right: '-6px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                    >
                                        <Edit size={14} />
                                    </button>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', marginBottom: '2px' }}>{a.candidateName || a.name}</h3>
                                    <div style={{ fontSize: '14px', color: '#64748B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={14} /> {a.name} (#{a.number})
                                    </div>
                                    <div style={{ marginTop: '8px', display: 'inline-block', padding: '2px 10px', borderRadius: '20px', background: a.themeColor + '15', color: a.themeColor, fontSize: '12px', fontWeight: '900' }}>
                                        {a.party}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <UsersIcon size={12} color="#059669" /> फील्ड टीम
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B' }}>{fieldCount} <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>सदस्य</span></div>
                                </div>
                                <div style={{ background: '#F0F9FF', padding: '12px', borderRadius: '16px', border: '1px solid #E0F2FE' }}>
                                    <div style={{ fontSize: '11px', color: '#0284C7', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Share2 size={12} color="#0284C7" /> सोशल टीम
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B' }}>{smCount} <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>सदस्य</span></div>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleManageFeatures(a);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '10px 16px',
                                        background: '#F8FAFC',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                        color: '#475569',
                                        fontWeight: '800',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Settings size={16} /> Features
                                </button>
                                <div
                                    style={{
                                        flex: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                        color: '#2563EB',
                                        fontWeight: '800',
                                        fontSize: '14px',
                                        gap: '4px'
                                    }}
                                >
                                    मैनेज करें <ChevronRight size={16} />
                                </div>
                            </div>

                            {/* Actions Overlay */}
                            <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm(`${a.candidateName} को ${managerIsActive ? 'Deactivate' : 'Activate'} करना चाहते हैं?`)) {
                                            await toggleCandidateStatus(a.id);
                                            fetchData();
                                        }
                                    }}
                                    style={{
                                        background: managerIsActive ? '#DCFCE7' : '#FEE2E2',
                                        color: managerIsActive ? '#166534' : '#991B1B',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '6px 10px',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {managerIsActive ? 'Active' : 'Inactive'}
                                </button>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm('क्या आप वाकई इस कैंडिडेट/विधानसभा को डिलीट करना चाहते हैं? यह डेटा रिकवर नहीं होगा!')) {
                                            await deleteAssembly(a.id);
                                            fetchData();
                                        }
                                    }}
                                    style={{
                                        background: '#FEF2F2',
                                        color: '#EF4444',
                                        border: '1px solid #FECACA',
                                        borderRadius: '8px',
                                        width: '28px',
                                        height: '28px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '24px', border: '1px dashed #E2E8F0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>कोई कैंडिडेट नहीं मिला</h3>
                    <p style={{ color: '#64748B' }}>सर्च या फिल्टर बदल कर कोशिश करें</p>
                </div>
            )}

            {/* Feature Management Modal */}
            {featureModalOpen && selectedAssembly && (
                <FeatureManagementModal
                    assembly={selectedAssembly}
                    onSave={handleSaveFeatures}
                    onClose={() => setFeatureModalOpen(false)}
                />
            )}
        </div>
    );
}

function FeatureManagementModal({ assembly, onSave, onClose }: any) {
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
        getEnabledFeatures(assembly)
    );

    const toggleFeature = (featureKey: string) => {
        setSelectedFeatures(prev =>
            prev.includes(featureKey)
                ? prev.filter(f => f !== featureKey)
                : [...prev, featureKey]
        );
    };

    const handleSelectAll = () => {
        const allKeys = Object.keys(APP_FEATURES).map(k => (APP_FEATURES as any)[k].key);
        setSelectedFeatures(allKeys);
    };

    const handleDeselectAll = () => {
        setSelectedFeatures([]);
    };

    // Group features by category
    const featuresByCategory: any = {};
    Object.keys(APP_FEATURES).forEach(key => {
        const feature = (APP_FEATURES as any)[key];
        if (!featuresByCategory[feature.category]) {
            featuresByCategory[feature.category] = [];
        }
        featuresByCategory[feature.category].push(feature);
    });

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)'
        }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0 }}></div>
            <div style={{
                background: 'white',
                borderRadius: '32px',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '32px',
                    borderBottom: '1px solid #E2E8F0',
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1E293B', marginBottom: '8px' }}>
                                फीचर्स मैनेज करें
                            </h2>
                            <p style={{ color: '#64748B', fontSize: '15px' }}>
                                {assembly.candidateName || assembly.name} के लिए उपलब्ध features चुनें
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(0,0,0,0.05)',
                                border: 'none',
                                borderRadius: '12px',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#64748B'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Select All / Deselect All */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button
                            onClick={handleSelectAll}
                            style={{
                                padding: '8px 16px',
                                background: '#F1F5F9',
                                border: '1px solid #E2E8F0',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#475569',
                                cursor: 'pointer'
                            }}
                        >
                            सभी चुनें
                        </button>
                        <button
                            onClick={handleDeselectAll}
                            style={{
                                padding: '8px 16px',
                                background: '#F1F5F9',
                                border: '1px solid #E2E8F0',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#475569',
                                cursor: 'pointer'
                            }}
                        >
                            सभी हटाएँ
                        </button>
                        <div style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: '700', color: '#64748B' }}>
                            {selectedFeatures.length} / {Object.keys(APP_FEATURES).length} चुने गए
                        </div>
                    </div>
                </div>

                {/* Features List */}
                <div style={{ padding: '32px', overflowY: 'auto', maxHeight: 'calc(90vh - 280px)' }}>
                    {Object.keys(FEATURE_CATEGORIES).map(categoryKey => {
                        const features = featuresByCategory[categoryKey] || [];
                        if (features.length === 0) return null;

                        return (
                            <div key={categoryKey} style={{ marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {(FEATURE_CATEGORIES as any)[categoryKey]}
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                                    {features.map((feature: any) => {
                                        const isSelected = selectedFeatures.includes(feature.key);
                                        return (
                                            <div
                                                key={feature.key}
                                                onClick={() => toggleFeature(feature.key)}
                                                style={{
                                                    padding: '16px',
                                                    background: isSelected ? '#EFF6FF' : '#F8FAFC',
                                                    border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                                                    borderRadius: '16px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        background: isSelected ? '#DBEAFE' : 'white',
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '20px',
                                                        flexShrink: 0
                                                    }}>
                                                        {feature.icon}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontSize: '14px',
                                                            fontWeight: '800',
                                                            color: isSelected ? '#1E40AF' : '#1E293B',
                                                            marginBottom: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            {feature.name.split('(')[0].trim()}
                                                            {isSelected && <CheckCircle size={16} color="#2563EB" />}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                                                            {feature.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '24px 32px',
                    borderTop: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 24px',
                            background: 'white',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '800',
                            color: '#475569',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(selectedFeatures)}
                        style={{
                            padding: '12px 32px',
                            background: '#2563EB',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '800',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                        }}
                    >
                        सेव करें ({selectedFeatures.length} features)
                    </button>
                </div>
            </div>
        </div>
    );
}
