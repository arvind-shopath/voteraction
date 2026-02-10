'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getAssemblySettings, updateAssemblySettings } from '@/app/actions/settings';
import { getParties, getAssemblies } from '@/app/actions/admin';
import { useSession } from 'next-auth/react';
import { Palette, User, Flag, Save, Check, Image as ImageIcon, TrendingUp, Upload, Shield, ChevronDown, List, PieChart, Languages, Plus, Trash2, Facebook, Instagram, Twitter } from 'lucide-react';

import TagInput from '@/components/TagInput';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { data: session } = useSession();

    // Campaign Info State
    const [importantAreas, setImportantAreas] = useState<string[]>([]);
    const [importantNewspapers, setImportantNewspapers] = useState<string[]>([]);
    const [campaignTags, setCampaignTags] = useState<string[]>([]);
    const [candidateBusiness, setCandidateBusiness] = useState('');
    const [importantIssues, setImportantIssues] = useState<string[]>([]);
    const [importantCastes, setImportantCastes] = useState<string[]>([]);

    // Admin features
    const [userRole, setUserRole] = useState('CANDIDATE');
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | null>(null);
    const [dbParties, setDbParties] = useState<any[]>([]);

    // Language
    const [lang, setLang] = useState<'hi' | 'en'>('hi');

    // Historical Results (6 lines)
    const [historical, setHistorical] = useState<any[]>([
        { party: '', candidate: '', votes: '' },
        { party: '', candidate: '', votes: '' },
        { party: '', candidate: '', votes: '' },
        { party: '', candidate: '', votes: '' },
        { party: '', candidate: '', votes: '' },
        { party: '', candidate: '', votes: '' },
    ]);

    // Caste Equation
    const [castes, setCastes] = useState<any[]>([
        { name: 'General', percent: 0 },
        { name: 'OBC', percent: 0 },
        { name: 'SC', percent: 0 },
        { name: 'Muslim', percent: 0 },
    ]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const role = localStorage.getItem('userRole') || 'CANDIDATE';
        setUserRole(role);

        const savedLang = localStorage.getItem('app_lang') as 'hi' | 'en' || 'hi';
        setLang(savedLang);

        async function init() {
            setLoading(true);
            let targetId = 1;

            try {
                const partyList = await getParties();
                setDbParties(partyList);
            } catch (e) {
                console.error('Failed to load parties', e);
            }

            if (role === 'ADMIN' || role === 'SUPERADMIN') {
                try {
                    const list = await getAssemblies();
                    setAssemblies(list);

                    const savedId = localStorage.getItem('admin_selected_assembly');
                    if (savedId) {
                        targetId = parseInt(savedId);
                    } else if (list.length > 0) {
                        targetId = list[0].id;
                    }
                    setSelectedAssemblyId(targetId);
                } catch (e) {
                    console.error('Failed to load assemblies', e);
                }
            }

            await loadSettings(targetId);
        }
        init();
    }, []);

    const loadSettings = async (id: number) => {
        setLoading(true);
        try {
            const data = await getAssemblySettings(id);
            if (data) {
                setSettings(data);

                // Load Campaign Info
                try {
                    setImportantAreas(data.importantAreas ? JSON.parse(data.importantAreas) : []);
                    setImportantNewspapers(data.importantNewspapers ? JSON.parse(data.importantNewspapers) : []);
                    setCampaignTags(data.campaignTags ? JSON.parse(data.campaignTags) : []);
                    setCandidateBusiness(data.candidateBusiness || '');
                    setImportantIssues(data.importantIssues ? JSON.parse(data.importantIssues) : []);
                    setImportantCastes(data.importantCastes ? JSON.parse(data.importantCastes) : []);
                } catch (e) {
                    console.error('Error parsing campaign info JSON:', e);
                }

                // Load historical results
                if (data.historicalResults) {
                    try {
                        const parsed = JSON.parse(data.historicalResults);
                        if (Array.isArray(parsed)) {
                            // Ensure 6 lines
                            const lines = [...parsed];
                            while (lines.length < 6) lines.push({ party: '', candidate: '', votes: '' });
                            setHistorical(lines.slice(0, 6));
                        }
                    } catch (e) { }
                } else {
                    setHistorical([
                        { party: '', candidate: '', votes: '' },
                        { party: '', candidate: '', votes: '' },
                        { party: '', candidate: '', votes: '' },
                        { party: '', candidate: '', votes: '' },
                        { party: '', candidate: '', votes: '' },
                        { party: '', candidate: '', votes: '' },
                    ]);
                }

                // Load caste equation
                if (data.casteEquation) {
                    try {
                        const parsed = JSON.parse(data.casteEquation);
                        if (Array.isArray(parsed)) setCastes(parsed);
                    } catch (e) { }
                } else {
                    setCastes([
                        { name: 'General', percent: 0 },
                        { name: 'OBC', percent: 0 },
                        { name: 'SC', percent: 0 },
                        { name: 'Muslim', percent: 0 },
                    ]);
                }
            } else {
                setSettings({
                    candidateName: '',
                    candidateImageUrl: '',
                    party: 'Independent',
                    themeColor: '#1E3A8A',
                    logoUrl: '',
                    facebookUrl: '',
                    instagramUrl: '',
                    twitterUrl: '',
                    prevPartyVotes: 0,
                    prevCandidateVotes: 0
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAssemblyChange = (id: number) => {
        setSelectedAssemblyId(id);
        localStorage.setItem('admin_selected_assembly', id.toString());
        loadSettings(id);
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setSettings({ ...settings, [name]: value });
        setSaved(false);
    };

    const handlePartySelect = (party: any) => {
        setSettings({
            ...settings,
            party: party.name,
            themeColor: party.color,
            logoUrl: party.logo
        });
        setSaved(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setSettings({ ...settings, candidateImageUrl: data.url });
            }
        } catch (err) {
            alert('File upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleHistoricalChange = (idx: number, field: string, value: string) => {
        const newList = [...historical];
        newList[idx][field] = value;
        setHistorical(newList);
        setSaved(false);
    };

    const handleCasteChange = (idx: number, field: string, value: any) => {
        const newList = [...castes];
        newList[idx][field] = value;
        setCastes(newList);
        setSaved(false);
    };

    const addCaste = () => {
        setCastes([...castes, { name: '', percent: 0 }]);
    };

    const removeCaste = (idx: number) => {
        setCastes(castes.filter((_, i) => i !== idx));
    };

    const toggleLanguage = (l: 'hi' | 'en') => {
        setLang(l);
        localStorage.setItem('app_lang', l);
        window.location.reload();
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const targetId = selectedAssemblyId || 1;
            const userId = (session?.user as any)?.id;

            await updateAssemblySettings(targetId, {
                candidateName: settings.candidateName,
                candidateImageUrl: settings.candidateImageUrl,
                party: settings.party,
                themeColor: settings.themeColor,
                logoUrl: settings.logoUrl,
                facebookUrl: settings.facebookUrl,
                instagramUrl: settings.instagramUrl,
                twitterUrl: settings.twitterUrl,
                prevPartyVotes: settings.prevPartyVotes,
                prevCandidateVotes: settings.prevCandidateVotes,
                electionDate: settings.electionDate || null,
                historicalResults: JSON.stringify(historical),
                casteEquation: JSON.stringify(castes),
                // Campaign Info
                importantAreas: JSON.stringify(importantAreas),
                importantNewspapers: JSON.stringify(importantNewspapers),
                campaignTags: JSON.stringify(campaignTags),
                candidateBusiness: candidateBusiness,
                importantIssues: JSON.stringify(importantIssues),
                importantCastes: JSON.stringify(importantCastes),
                candidateUserId: userId
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            window.location.reload();
        } catch (error) {
            alert('सेव करने में त्रुटि हुई');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
            <div className="spinner"></div>
            <div style={{ fontWeight: '600', color: '#6B7280' }}>सेटिंग्स लोड हो रही हैं...</div>
        </div>
    );

    const t = {
        title: lang === 'hi' ? 'ब्रांडिंग और सेटिंग्स' : 'Branding & Settings',
        subtitle: lang === 'hi' ? 'अपनी विधानसभा, थीम, और फोटो का प्रबंधन करें' : 'Manage your assembly, theme, and photos',
        langSet: lang === 'hi' ? 'भाषा (Language)' : 'Language Select',
        candidateInfo: lang === 'hi' ? 'उम्मीदवार की जानकारी' : 'Candidate Information',
        todayStatus: lang === 'hi' ? 'आज की स्थिति' : "Today's Status",
        prevElection: lang === 'hi' ? 'पिछले चुनाव के आंकड़े (Historical)' : 'Previous Election Data',
        casteEquation: lang === 'hi' ? 'विधानसभा का जाति समीकरण (Caste Equation)' : 'Assembly Caste Equation',
        save: lang === 'hi' ? 'सभी बदलाव सेव करें' : 'Save All Changes',
        saved: lang === 'hi' ? 'सेटिंग्स सुरक्षित हुईं!' : 'Settings Saved!'
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827' }}>{t.title}</h1>
                    <p style={{ color: '#6B7280', fontSize: '16px' }}>{t.subtitle}</p>
                </div>

                <div style={{ display: 'flex', background: '#F3F4F6', padding: '4px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    <button
                        onClick={() => toggleLanguage('hi')}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: lang === 'hi' ? 'white' : 'transparent', color: lang === 'hi' ? '#1E293B' : '#6B7280', fontWeight: '800', cursor: 'pointer', boxShadow: lang === 'hi' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', fontSize: '14px' }}
                    >हिन्दी</button>
                    <button
                        onClick={() => toggleLanguage('en')}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: lang === 'en' ? 'white' : 'transparent', color: lang === 'en' ? '#1E293B' : '#6B7280', fontWeight: '800', cursor: 'pointer', boxShadow: lang === 'en' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', fontSize: '14px' }}
                    >English</button>
                </div>
            </div>

            {(userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
                <div className="card" style={{ marginBottom: '24px', padding: '24px', borderLeft: '4px solid var(--primary-bg)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={18} color="var(--primary-bg)" />
                        विधानसभा चुनें (Admin Control)
                    </h3>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={selectedAssemblyId || ''}
                            onChange={(e) => handleAssemblyChange(parseInt(e.target.value))}
                            style={{ width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '15px', fontWeight: '600', appearance: 'none', background: 'white' }}
                        >
                            {assemblies.map(a => (
                                <option key={a.id} value={a.id}>{a.number} - {a.name} ({a.district})</option>
                            ))}
                        </select>
                        <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} />
                    </div>
                </div>
            )}

            <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div className="card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1E293B' }}>
                            <User size={20} color="var(--primary-bg)" /> {t.candidateInfo}
                        </h3>

                        <div style={{ display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#F3F4F6', border: '3px solid var(--primary-bg)', overflow: 'hidden', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {settings.candidateImageUrl ? (
                                        <img src={settings.candidateImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={48} color="#9CA3AF" />
                                    )}
                                    {uploading && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div className="spinner-small"></div>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => fileInputRef.current?.click()} style={{ padding: '6px 16px', fontSize: '11px', fontWeight: '700', background: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', cursor: 'pointer' }}>
                                    <Upload size={12} style={{ marginRight: '4px' }} /> फोटो बदलें
                                </button>
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#374151' }}>उम्मीदवार का नाम</label>
                                <input name="candidateName" type="text" value={settings.candidateName || ''} onChange={handleChange} style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} placeholder="उदा. श्री पंकज गुप्ता" />
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '24px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B', marginBottom: '16px' }}>सोशल मीडिया प्रोफाइल लिंक्स</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#1877F2' }}><Facebook size={14} /> Facebook</label>
                                    <input name="facebookUrl" value={settings.facebookUrl || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px' }} placeholder="Link" />
                                </div>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#E4405F' }}><Instagram size={14} /> Instagram</label>
                                    <input name="instagramUrl" value={settings.instagramUrl || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px' }} placeholder="Link" />
                                </div>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#1DA1F2' }}><Twitter size={14} /> Twitter/X</label>
                                    <input name="twitterUrl" value={settings.twitterUrl || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px' }} placeholder="Link" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1E293B' }}>
                            <TrendingUp size={20} color="var(--primary-bg)" /> {t.todayStatus}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#374151' }}>पार्टी के कुल वोट (आज की ताकत)</label>
                                <input name="prevPartyVotes" type="number" value={settings.prevPartyVotes || 0} onChange={handleChange} style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#374151' }}>प्रत्याशी के अपने वोट</label>
                                <input name="prevCandidateVotes" type="number" value={settings.prevCandidateVotes || 0} onChange={handleChange} style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
                            </div>
                        </div>
                    </div>

                    {/* Election Date Settings */}
                    <div className="card" style={{ padding: '32px', background: 'linear-gradient(135deg, #FEF3C7 0%, #FEF9E7 100%)', border: '2px solid #F59E0B' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#92400E' }}>
                            🗳️ मतदान की तारीख (Election Date)
                        </h3>
                        <p style={{ fontSize: '13px', color: '#78350F', marginBottom: '16px', fontWeight: '600' }}>
                            ⚠️ यह तारीख सेट करने पर "मतदान वार रूम" एक्टिव हो जाएगा। कार्यकर्ता और कैंडिडेट दोनों को वार रूम दिखेगा।
                        </p>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#78350F' }}>मतदान का दिन (Election Date)</label>
                            <input
                                name="electionDate"
                                type="date"
                                value={settings.electionDate ? new Date(settings.electionDate).toISOString().slice(0, 10) : ''}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    border: '2px solid #F59E0B',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    background: 'white'
                                }}
                            />
                            {settings.electionDate && (
                                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(34,197,94,0.1)', borderRadius: '10px', border: '1px solid #22C55E' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#166534' }}>
                                        ✅ सेट की गई तारीख: {new Date(settings.electionDate).toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {(userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
                        <>
                            <div className="card" style={{ padding: '32px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1E293B' }}>
                                    <List size={20} color="var(--primary-bg)" /> {t.prevElection}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '12px', paddingBottom: '8px', borderBottom: '2px solid #F3F4F6' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B' }}>पार्टी (Party)</div>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B' }}>प्रत्याशी का नाम (Candidate)</div>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B' }}>वोट (Votes)</div>
                                    </div>
                                    {historical.map((line, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '12px' }}>
                                            <input placeholder="उदा. BJP/SP" value={line.party} onChange={e => handleHistoricalChange(idx, 'party', e.target.value)} style={{ padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
                                            <input placeholder="नाम" value={line.candidate} onChange={e => handleHistoricalChange(idx, 'candidate', e.target.value)} style={{ padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
                                            <input type="number" placeholder="वोट" value={line.votes} onChange={e => handleHistoricalChange(idx, 'votes', e.target.value)} style={{ padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="card" style={{ padding: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: '#1E293B' }}>
                                        <PieChart size={20} color="var(--primary-bg)" /> {t.casteEquation}
                                    </h3>
                                    <button onClick={addCaste} style={{ padding: '6px 12px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Plus size={14} /> जाति जोड़ें
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {castes.map((c, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <input value={c.name} onChange={e => handleCasteChange(idx, 'name', e.target.value)} placeholder="जाति का नाम" style={{ flex: 1, padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
                                                <div style={{ position: 'relative', width: '90px' }}>
                                                    <input type="number" value={c.percent} onChange={e => handleCasteChange(idx, 'percent', parseFloat(e.target.value))} style={{ width: '100%', padding: '10px 25px 10px 10px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
                                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: '#94A3B8' }}>%</span>
                                                </div>
                                                {idx >= 4 && (
                                                    <button onClick={() => removeCaste(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <p style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', marginBottom: '16px' }}>प्रोफाइल प्रीव्यू (Profile Preview)</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {castes.map((c, idx) => {
                                                const total = castes.reduce((acc, curr) => acc + (parseFloat(curr.percent) || 0), 0);
                                                const w = total > 0 ? ((parseFloat(c.percent) || 0) / total) * 100 : 0;
                                                return (
                                                    <div key={idx}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                                            <span style={{ fontWeight: '700' }}>{c.name || '---'}</span>
                                                            <span style={{ fontWeight: '900' }}>{c.percent}%</span>
                                                        </div>
                                                        <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${w}%`, height: '100%', background: 'var(--primary-bg)', opacity: 0.7 - (idx * 0.1), borderRadius: '10px' }}></div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Campaign Info Section */}
                    <div style={{ marginTop: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={20} className="text-blue-600" />
                            {lang === 'hi' ? 'कंपेन इंफॉर्मेशन' : 'Campaign Information'}
                        </h2>
                        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>
                            {lang === 'hi' ? 'अपने चुनावी अभियान की महत्वपूर्ण जानकारी भरें' : 'Fill important details for your election campaign'}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <TagInput
                                label={lang === 'hi' ? "📍 महत्वपूर्ण इलाके" : "📍 Important Areas"}
                                placeholder={lang === 'hi' ? "इलाके का नाम टाइप करें और comma दबाएं..." : "Type area name and press comma..."}
                                tags={importantAreas}
                                onChange={setImportantAreas}
                            />

                            <TagInput
                                label={lang === 'hi' ? "📰 महत्वपूर्ण अखबार" : "📰 Important Newspapers"}
                                placeholder={lang === 'hi' ? "अखबार का नाम टाइप करें और comma दबाएं..." : "Type newspaper name and press comma..."}
                                tags={importantNewspapers}
                                onChange={setImportantNewspapers}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <TagInput
                                label={lang === 'hi' ? "🏷️ टैग" : "🏷️ Tags"}
                                placeholder={lang === 'hi' ? "टैग टाइप करें और comma दबाएं..." : "Type tag and press comma..."}
                                tags={campaignTags}
                                onChange={setCampaignTags}
                            />

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>
                                    {lang === 'hi' ? "💼 कैंडिडेट के व्यापार" : "💼 Candidate Business/Profession"}
                                </label>
                                <input
                                    type="text"
                                    value={candidateBusiness}
                                    onChange={(e) => setCandidateBusiness(e.target.value)}
                                    placeholder={lang === 'hi' ? "जैसे: व्यापारी, डॉक्टर, वकील..." : "e.g. Businessman, Doctor, Lawyer..."}
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
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <TagInput
                                label={lang === 'hi' ? "⚡ महत्वपूर्ण मुद्दे" : "⚡ Key Issues"}
                                placeholder={lang === 'hi' ? "मुद्दा टाइप करें और comma दबाएं..." : "Type issue and press comma..."}
                                tags={importantIssues}
                                onChange={setImportantIssues}
                            />

                            <TagInput
                                label={lang === 'hi' ? "👥 महत्वपूर्ण जातियां" : "👥 Important Castes"}
                                placeholder={lang === 'hi' ? "जाति का नाम टाइप करें और comma दबाएं..." : "Type caste and press comma..."}
                                tags={importantCastes}
                                onChange={setImportantCastes}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Flag size={18} color="var(--primary-bg)" /> पार्टी चुनें
                        </h3>
                        {dbParties.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', background: '#F9FAFB', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
                                <p style={{ fontSize: '12px', color: '#9CA3AF' }}>कोई पार्टी नहीं मिली।</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {dbParties.map((p) => (
                                    <div key={p.name} onClick={() => handlePartySelect(p)} style={{ padding: '12px 16px', border: settings.party === p.name ? `2px solid ${p.color}` : '1px solid #E5E7EB', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: settings.party === p.name ? `${p.color}08` : 'white', transition: 'all 0.2s' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {p.logo ? <img src={p.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Flag size={16} color={p.color} />}
                                        </div>
                                        <span style={{ fontWeight: '700', fontSize: '14px', color: settings.party === p.name ? p.color : '#4B5563' }}>{p.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Palette size={18} color="var(--primary-bg)" /> थीम कलर
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input name="themeColor" type="color" value={settings.themeColor} onChange={handleChange} style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>कस्टम कलर सेट करें</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed-action-bar" style={{ position: 'fixed', bottom: '0', left: '260px', right: '0', background: 'white', padding: '20px 40px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ padding: '14px 40px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', opacity: saving ? 0.7 : 1 }}
                >
                    {saved ? <><Check size={20} /> {t.saved}</> : <><Save size={20} /> {t.save}</>}
                </button>
            </div>

            <style jsx>{`
                .spinner-small { width: 24px; height: 24px; border: 3px solid #E5E7EB; border-top: 3px solid var(--primary-bg); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @media (max-width: 900px) {
                    .settings-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .fixed-action-bar {
                        left: 0 !important;
                        padding: 16px 20px !important;
                    }
                }
            `}</style>
        </div>
    );
}
