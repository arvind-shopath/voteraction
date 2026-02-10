'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAssemblies, updateAssembly } from '@/app/actions/admin';
import { ArrowLeft, Save, Loader, ShieldCheck } from 'lucide-react';
import TagInput from '@/components/TagInput';

export default function CandidateSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const assemblyId = params.id as string;

    const [assembly, setAssembly] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Campaign Info State
    const [importantAreas, setImportantAreas] = useState<string[]>([]);
    const [importantNewspapers, setImportantNewspapers] = useState<string[]>([]);
    const [campaignTags, setCampaignTags] = useState<string[]>([]);
    const [candidateBusiness, setCandidateBusiness] = useState('');
    const [importantIssues, setImportantIssues] = useState<string[]>([]);
    const [importantCastes, setImportantCastes] = useState<string[]>([]);

    // Security Settings
    const [proxyEnabled, setProxyEnabled] = useState(false);
    const [proxyHost, setProxyHost] = useState('');
    const [proxyPort, setProxyPort] = useState('');
    const [proxyUsername, setProxyUsername] = useState('');
    const [proxyPassword, setProxyPassword] = useState('');

    useEffect(() => {
        fetchData();
    }, [assemblyId]);

    async function fetchData() {
        setLoading(true);
        const assemblyData = await getAssemblies();
        const currentAssembly = assemblyData.find((a: any) => a.id === parseInt(assemblyId));

        if (currentAssembly) {
            setAssembly(currentAssembly);

            // Parse JSON fields
            try {
                setImportantAreas(currentAssembly.importantAreas ? JSON.parse(currentAssembly.importantAreas) : []);
                setImportantNewspapers(currentAssembly.importantNewspapers ? JSON.parse(currentAssembly.importantNewspapers) : []);
                setCampaignTags(currentAssembly.campaignTags ? JSON.parse(currentAssembly.campaignTags) : []);
                setCandidateBusiness(currentAssembly.candidateBusiness || '');
                setImportantIssues(currentAssembly.importantIssues ? JSON.parse(currentAssembly.importantIssues) : []);
                setImportantCastes(currentAssembly.importantCastes ? JSON.parse(currentAssembly.importantCastes) : []);

                // Security
                setProxyEnabled(currentAssembly.proxyEnabled || false);
                setProxyHost(currentAssembly.proxyHost || '');
                setProxyPort(currentAssembly.proxyPort || '');
                setProxyUsername(currentAssembly.proxyUsername || '');
                setProxyPassword(currentAssembly.proxyPassword || '');
            } catch (e) {
                console.error('Error parsing JSON:', e);
            }
        }

        setLoading(false);
    }

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateAssembly(parseInt(assemblyId), {
                importantAreas: JSON.stringify(importantAreas),
                importantNewspapers: JSON.stringify(importantNewspapers),
                campaignTags: JSON.stringify(campaignTags),
                candidateBusiness: candidateBusiness,
                importantIssues: JSON.stringify(importantIssues),
                importantCastes: JSON.stringify(importantCastes),
                // Security
                proxyEnabled,
                proxyHost,
                proxyPort,
                proxyUsername,
                proxyPassword
            } as any);

            alert('✅ Campaign Info सेव हो गई!');
            router.push(`/admin/candidates/${assemblyId}`);
        } catch (error) {
            alert('❌ Error saving campaign info');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ height: '80vh', display: 'flex', alignItems: '  center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader className="animate-spin" size={40} color="#3B82F6" />
                    <p style={{ marginTop: '16px', color: '#64748B' }}>लोड हो रहा है...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '60px' }}>
            {/* Header */}
            <button
                onClick={() => router.push(`/admin/candidates/${assemblyId}`)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#64748B',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '24px',
                    fontWeight: '700'
                }}
            >
                <ArrowLeft size={20} /> वापस जाएं
            </button>

            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1E293B', marginBottom: '8px' }}>
                    सेटिंग्स & ब्रांडिंग
                </h1>
                <p style={{ color: '#64748B', fontSize: '15px' }}>
                    {assembly?.candidateName || assembly?.name} के लिए campaign information
                </p>
            </div>

            {/* Campaign Info Section */}
            <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #E2E8F0' }}>
                    📋 Campaign Information
                </h2>

                <TagInput
                    label="📍 महत्वपूर्ण इलाके"
                    placeholder="इलाके का नाम टाइप करें और comma दबाएं..."
                    tags={importantAreas}
                    onChange={setImportantAreas}
                />

                <TagInput
                    label="📰 महत्वपूर्ण अखबार"
                    placeholder="अखबार का नाम टाइप करें और comma दबाएं..."
                    tags={importantNewspapers}
                    onChange={setImportantNewspapers}
                />

                <TagInput
                    label="🏷️ टैग"
                    placeholder="टैग टाइप करें और comma दबाएं..."
                    tags={campaignTags}
                    onChange={setCampaignTags}
                />

                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#1E293B',
                        marginBottom: '8px'
                    }}>
                        💼 कैंडिडेट के व्यापार
                    </label>
                    <input
                        type="text"
                        value={candidateBusiness}
                        onChange={(e) => setCandidateBusiness(e.target.value)}
                        placeholder="जैसे: व्यापारी, डॉक्टर, वकील..."
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #E2E8F0',
                            borderRadius: '12px',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                </div>

                <TagInput
                    label="⚡ महत्वपूर्ण मुद्दे"
                    placeholder="मुद्दा टाइप करें और comma दबाएं..."
                    tags={importantIssues}
                    onChange={setImportantIssues}
                />

                <TagInput
                    label="👥 महत्वपूर्ण जातियां"
                    placeholder="जाति का नाम टाइप करें और comma दबाएं..."
                    tags={importantCastes}
                    onChange={setImportantCastes}
                />
            </div>

            {/* Security & Proxy Section */}
            <div className="card" style={{ padding: '32px', marginBottom: '24px', border: '1px solid #FEE2E2', background: '#FFFDFD' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#B91C1C', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={24} /> 🔒 सोशल मीडिया सुरक्षा (Security & Proxy)
                </h2>
                <p style={{ fontSize: '13px', color: '#991B1B', marginBottom: '24px', fontWeight: '600' }}>
                    सूचना: सोशल मीडिया अकाउंट्स (Facebook/Twitter) को एक से अधिक जगह से चलाने पर "Account Ban" होने का खतरा रहता है। इससे बचने के लिए नीचे दिए गए Proxy सेटिंग्स का उपयोग करें।
                </p>

                <div style={{ marginBottom: '24px', padding: '16px', background: '#FEE2E2', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                        type="checkbox"
                        id="proxy-toggle"
                        checked={proxyEnabled}
                        onChange={e => setProxyEnabled(e.target.checked)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <label htmlFor="proxy-toggle" style={{ fontSize: '15px', fontWeight: '800', color: '#991B1B', cursor: 'pointer' }}>
                        इस कैंडिडेट के लिए Dedicated Proxy एक्टिव करें
                    </label>
                </div>

                {proxyEnabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Proxy Host (IP)</label>
                            <input
                                type="text"
                                placeholder="e.g. 154.23.xx.xx"
                                value={proxyHost}
                                onChange={e => setProxyHost(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #E2E8F0' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Proxy Port</label>
                            <input
                                type="text"
                                placeholder="e.g. 8080"
                                value={proxyPort}
                                onChange={e => setProxyPort(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #E2E8F0' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Proxy Username</label>
                            <input
                                type="text"
                                value={proxyUsername}
                                onChange={e => setProxyUsername(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #E2E8F0' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Proxy Password</label>
                            <input
                                type="password"
                                value={proxyPassword}
                                onChange={e => setProxyPassword(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #E2E8F0' }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                    onClick={() => router.push(`/admin/candidates/${assemblyId}`)}
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
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        padding: '12px 32px',
                        background: saving ? '#94A3B8' : '#3B82F6',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '800',
                        color: 'white',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                >
                    {saving ? (
                        <>
                            <Loader className="animate-spin" size={16} />
                            सेव हो रहा है...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            सेव करें
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
