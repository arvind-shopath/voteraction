'use client';

import React, { useState, useEffect } from 'react';
import { getAssemblies, createAssembly, updateAssembly, getCampaigns, createCampaign, deleteAssembly, getParties } from '@/app/actions/admin';
import { Tent, Plus, MapPin, Loader2, X, Filter, Users, UserPlus, Trash2, CheckCircle2, FolderOpen, Zap, Upload, FileArchive } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PARTIES, PARTY_CONFIG } from '@/lib/constants';

export default function AssembliesPage() {
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingAssembly, setEditingAssembly] = useState<any>(null);
    const [filterState, setFilterState] = useState('');
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [selectedAssembly, setSelectedAssembly] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [campaignName, setCampaignName] = useState('');
    const [candidateName, setCandidateName] = useState('');
    const [dbParties, setDbParties] = useState<any[]>([]);
    const [bulkImporting, setBulkImporting] = useState<{ [id: number]: boolean }>({});
    const [uploadingZip, setUploadingZip] = useState<{ [id: number]: boolean }>({});
    const [zipFiles, setZipFiles] = useState<{ [id: number]: File | null }>({});
    const [bulkMsg, setBulkMsg] = useState<{ [id: number]: string }>({});
    const router = useRouter();

    const handleZipUpload = async (assembly: any) => {
        const file = zipFiles[assembly.id];
        if (!file) {
            alert('कृपया पहले एक .zip फ़ाइल चुनें।');
            return;
        }

        setUploadingZip(prev => ({ ...prev, [assembly.id]: true }));
        setBulkMsg(prev => ({ ...prev, [assembly.id]: 'ZIP अपलोड और अनजिप हो रही है...' }));

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('assemblyId', assembly.id.toString());

            const res = await fetch('/api/assembly/upload-zip', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                setBulkMsg(prev => ({ ...prev, [assembly.id]: data.message }));
                setZipFiles(prev => ({ ...prev, [assembly.id]: null }));
                fetchAssemblies();
            } else {
                setBulkMsg(prev => ({ ...prev, [assembly.id]: 'Error: ' + data.error }));
            }
        } catch (e: any) {
            setBulkMsg(prev => ({ ...prev, [assembly.id]: 'Upload Error: ' + e.message }));
        } finally {
            setUploadingZip(prev => ({ ...prev, [assembly.id]: false }));
        }
    };

    const handleBulkImport = async (assembly: any) => {
        setBulkImporting(prev => ({ ...prev, [assembly.id]: true }));
        setBulkMsg(prev => ({ ...prev, [assembly.id]: 'PDF फ़ोल्डर स्कैन हो रहा है...' }));
        try {
            const res = await fetch('/api/assembly/bulk-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assemblyId: assembly.id })
            });
            const data = await res.json();
            if (data.success) {
                setBulkMsg(prev => ({ ...prev, [assembly.id]: data.message }));
            } else {
                setBulkMsg(prev => ({ ...prev, [assembly.id]: 'Error: ' + data.error }));
            }
        } catch (e: any) {
            setBulkMsg(prev => ({ ...prev, [assembly.id]: 'Error: ' + e.message }));
        } finally {
            setBulkImporting(prev => ({ ...prev, [assembly.id]: false }));
        }
    };

    const [formData, setFormData] = useState<any>({
        number: '',
        nameHindi: '',
        nameEnglish: '',
        district: '',
        state: 'Uttar Pradesh',
        lastElectionDate: null,
        nextElectionDate: null,
        historicalResults: '[]',
        casteEquation: [],
        electionHistory: []
    });

    const [lang, setLang] = useState<'hi' | 'en'>('hi');
    const [activeTab, setActiveTab] = useState<'basic' | 'historical' | 'caste'>('basic');

    useEffect(() => {
        fetchAssemblies();
        // Live progress updates polling every 3 seconds
        const timer = setInterval(() => {
            getAssemblies().then(data => setAssemblies(data)).catch(() => { });
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    async function fetchAssemblies() {
        setLoading(true);
        try {
            const data = await getAssemblies();
            setAssemblies(data);

            const pData = await getParties();
            setDbParties(pData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (formData.state) {
            getParties(formData.state).then(setDbParties);
        }
    }, [formData.state]);

    const uniqueStates = Array.from(new Set(assemblies.map(a => a.state))).sort();
    const filteredAssemblies = filterState ? assemblies.filter(a => a.state === filterState) : assemblies;

    const handleEdit = (assembly: any) => {
        setEditingAssembly(assembly);
        setFormData({
            number: assembly.number?.toString() || '',
            nameHindi: assembly.nameHindi || assembly.name || '',
            nameEnglish: assembly.nameEnglish || assembly.name || '',
            district: assembly.district || '',
            state: assembly.state || 'Uttar Pradesh',
            lastElectionDate: assembly.lastElectionDate || null,
            nextElectionDate: assembly.nextElectionDate || null,
            historicalResults: assembly.historicalResults || '[]',
            casteEquation: JSON.parse(assembly.casteEquation || '[]'),
            electionHistory: assembly.electionHistory || []
        });
        setActiveTab('basic');
        setShowModal(true);
    };

    const handleViewData = (assemblyId: number) => {
        router.push(`/dashboard`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const displayName = formData.nameHindi || formData.nameEnglish || `विधानसभा ${formData.number}`;
            const payload = {
                number: parseInt(formData.number),
                name: displayName,
                nameHindi: formData.nameHindi || displayName,
                nameEnglish: formData.nameEnglish || displayName,
                district: formData.district,
                state: formData.state,
                lastElectionDate: formData.lastElectionDate,
                nextElectionDate: formData.nextElectionDate,
                historicalResults: formData.historicalResults,
                casteEquation: JSON.stringify(formData.casteEquation),
                electionHistory: formData.electionHistory
            };

            if (editingAssembly) {
                await updateAssembly(editingAssembly.id, payload);
            } else {
                await createAssembly(payload as any);
            }
            setShowModal(false);
            setEditingAssembly(null);
            setFormData({
                number: '', nameHindi: '', nameEnglish: '', district: '',
                state: filterState || 'Uttar Pradesh',
                lastElectionDate: null, nextElectionDate: null,
                historicalResults: '[]', casteEquation: [], electionHistory: []
            });
            fetchAssemblies();
        } catch (e: any) {
            console.error('Save error:', e);
            alert('Error saving assembly: ' + (e?.message || e));
        } finally {
            setSaving(false);
        }
    };

    const openAddModal = () => {
        setEditingAssembly(null);
        setFormData({
            number: '', nameHindi: '', nameEnglish: '', district: '',
            state: filterState || 'Uttar Pradesh',
            lastElectionDate: null, nextElectionDate: null,
            historicalResults: '[]', casteEquation: [], electionHistory: []
        });
        setActiveTab('basic');
        setShowModal(true);
    };

    const addYearToHistory = () => {
        const yearStr = prompt(lang === 'hi' ? 'साल भरें (उदाहरण: 2022)' : 'Enter Year (e.g. 2022)');
        const yearNum = parseInt(yearStr || '');
        if (isNaN(yearNum)) return;

        const newEntry = {
            year: yearNum,
            partyName: dbParties[0]?.name || 'Independent',
            candidateName: '',
            votesReceived: 0,
            votePercentage: 0
        };
        setFormData({ ...formData, electionHistory: [...formData.electionHistory, newEntry] });
    };

    const addCandidateToYear = (year: number) => {
        const newEntry = {
            year: year,
            partyName: dbParties[0]?.name || 'Independent',
            candidateName: '',
            votesReceived: 0,
            votePercentage: 0
        };
        setFormData({ ...formData, electionHistory: [...formData.electionHistory, newEntry] });
    };

    const updateHistoryItem = (idx: number, field: string, value: any) => {
        const history = [...formData.electionHistory];
        history[idx] = { ...history[idx], [field]: field === 'votesReceived' ? parseInt(value) || 0 : value };
        setFormData({ ...formData, electionHistory: history });
    };

    const removeHistoryItem = (idx: number) => {
        const history = [...formData.electionHistory];
        history.splice(idx, 1);
        setFormData({ ...formData, electionHistory: history });
    };

    const addCaste = () => {
        setFormData({ ...formData, casteEquation: [...formData.casteEquation, { name: '', percent: 0 }] });
    };

    const updateCaste = (idx: number, field: string, value: any) => {
        const caste = [...formData.casteEquation];
        caste[idx] = { ...caste[idx], [field]: field === 'percent' ? parseFloat(value) || 0 : value };
        setFormData({ ...formData, casteEquation: caste });
    };

    const removeCaste = (idx: number) => {
        const caste = [...formData.casteEquation];
        caste.splice(idx, 1);
        setFormData({ ...formData, casteEquation: caste });
    };

    const openCampaignModal = async (assembly: any) => {
        setSelectedAssembly(assembly);
        setShowCampaignModal(true);
        setLoadingCampaigns(true);
        setCampaignName('');
        setCandidateName('');
        try {
            const data = await getCampaigns(assembly.id);
            setCampaigns(data);
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssembly) return;
        setSaving(true);
        try {
            await createCampaign({
                name: campaignName,
                candidateName: candidateName,
                assemblyId: selectedAssembly.id
            });
            const data = await getCampaigns(selectedAssembly.id);
            setCampaigns(data);
            setCampaignName('');
            setCandidateName('');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <Loader2 className="animate-spin" size={40} color="#2563EB" />
        </div>
    );

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1E293B' }}>विधानसभा प्रबंधन (Assemblies)</h1>
                    <p style={{ color: '#64748B', marginTop: '4px' }}>एप्लीकेशन में जुड़ी हुई कुल विधानसभाएं और उनके आंकड़े</p>
                </div>
                <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <Plus size={20} /> नई सीट जोड़ें
                </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
                <button onClick={() => setFilterState('')} style={{ padding: '8px 20px', borderRadius: '100px', border: 'none', background: filterState === '' ? '#1E293B' : 'white', color: filterState === '' ? 'white' : '#64748B', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>All State</button>
                {uniqueStates.map(state => (
                    <button key={state} onClick={() => setFilterState(state)} style={{ padding: '8px 20px', borderRadius: '100px', border: 'none', background: filterState === state ? '#1E293B' : 'white', color: filterState === state ? 'white' : '#64748B', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{state}</button>
                ))}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '650px', borderRadius: '24px', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', right: '24px', top: '24px', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={24} /></button>

                        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>{editingAssembly ? 'विधानसभा अपडेट करें' : 'नई विधानसभा जोड़ें'}</h2>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#F3F4F6', padding: '4px', borderRadius: '10px' }}>
                            <button onClick={() => setActiveTab('basic')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', background: activeTab === 'basic' ? 'white' : 'transparent', color: activeTab === 'basic' ? '#111827' : '#6B7280', boxShadow: activeTab === 'basic' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Basic</button>
                            <button onClick={() => setActiveTab('historical')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', background: activeTab === 'historical' ? 'white' : 'transparent', color: activeTab === 'historical' ? '#111827' : '#6B7280', boxShadow: activeTab === 'historical' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>History</button>
                            <button onClick={() => setActiveTab('caste')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', background: activeTab === 'caste' ? 'white' : 'transparent', color: activeTab === 'caste' ? '#111827' : '#6B7280', boxShadow: activeTab === 'caste' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Caste</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* BASIC TAB: Strict 5 fields only (State, District, Hindi Name, English Name, Number) */}
                            {activeTab === 'basic' && (
                                <>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#334155' }}>1. राज्य (State) <span style={{ color: 'red' }}>*</span></label>
                                        <input
                                            required
                                            list="states-list"
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', background: 'white', fontWeight: '600' }}
                                            placeholder="राज्य चुनें या टाइप करें..."
                                        />
                                        <datalist id="states-list">
                                            <option value="Uttar Pradesh" />
                                            <option value="Bihar" />
                                            <option value="Madhya Pradesh" />
                                            <option value="Rajasthan" />
                                            <option value="Haryana" />
                                            <option value="Delhi" />
                                            <option value="Uttarakhand" />
                                            <option value="Jharkhand" />
                                            <option value="Chhattisgarh" />
                                        </datalist>
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#334155' }}>2. जिला (District) <span style={{ color: 'red' }}>*</span></label>
                                        <input required type="text" value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: '600' }} placeholder="जैसे: सीतापुर" />
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#334155' }}>3. विधानसभा का नाम हिन्दी (Hindi) <span style={{ color: 'red' }}>*</span></label>
                                        <input required type="text" value={formData.nameHindi} onChange={e => setFormData({ ...formData, nameHindi: e.target.value })}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: '600' }} placeholder="जैसे: लहरपुर" />
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#334155' }}>4. विधानसभा का नाम इ्ंग्लिश (English) <span style={{ color: 'red' }}>*</span></label>
                                        <input required type="text" value={formData.nameEnglish} onChange={e => setFormData({ ...formData, nameEnglish: e.target.value })}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: '600' }} placeholder="जैसे: Laharpur" />
                                    </div>

                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#334155' }}>5. विधानसभा नंबर (Assembly No.) <span style={{ color: 'red' }}>*</span></label>
                                        <input required type="number" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: '600' }} placeholder="जैसे: 148" />
                                    </div>
                                </>
                            )}

                            {/* HISTORY TAB: Election Dates Moved Here as per Requirement */}
                            {activeTab === 'historical' && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ background: '#FEF3C7', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '2px solid #F59E0B' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#92400E', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            🗳️ चुनाव की तारीखें (Election Dates)
                                        </h4>

                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#78350F' }}>पिछला चुनाव (Last Election Date)</label>
                                            <input
                                                type="date"
                                                value={formData.lastElectionDate ? new Date(formData.lastElectionDate).toISOString().slice(0, 10) : ''}
                                                onChange={e => setFormData({ ...formData, lastElectionDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                                style={{ width: '100%', padding: '12px', border: '2px solid #F59E0B', borderRadius: '8px', background: 'white', fontWeight: '600' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#78350F' }}>आने वाला चुनाव (Next Election Date)</label>
                                            <input
                                                type="date"
                                                value={formData.nextElectionDate ? new Date(formData.nextElectionDate).toISOString().slice(0, 10) : ''}
                                                onChange={e => setFormData({ ...formData, nextElectionDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                                style={{ width: '100%', padding: '12px', border: '2px solid #F59E0B', borderRadius: '8px', background: 'white', fontWeight: '600' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '800' }}>{lang === 'hi' ? 'चुनाव परिणाम (History)' : 'Election Results'}</h3>
                                        <button type="button" onClick={addYearToHistory} style={{ padding: '6px 14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ नया साल जोड़ें</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {Array.from(new Set(formData.electionHistory.map((h: any) => h.year))).sort((a: any, b: any) => b - a).map((year: any) => (
                                            <div key={year} style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                    <div style={{ fontWeight: '900', fontSize: '16px', color: '#1E293B' }}>वर्ष: {year}</div>
                                                    <button type="button" onClick={() => addCandidateToYear(year)} style={{ fontSize: '12px', color: '#2563EB', background: 'white', border: '1px solid #2563EB', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>+ प्रत्याशी जोड़ें</button>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 100px 40px', gap: '8px', paddingBottom: '4px' }}>
                                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B' }}>पार्टी</div>
                                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B' }}>प्रत्याशी</div>
                                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B' }}>वोट</div>
                                                        <div></div>
                                                    </div>
                                                    {formData.electionHistory.map((item: any, idx: number) => {
                                                        if (item.year !== year) return null;
                                                        return (
                                                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) 1.2fr 100px 40px', gap: '8px', alignItems: 'center' }}>
                                                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                                    <select
                                                                        value={item.partyName}
                                                                        onChange={e => updateHistoryItem(idx, 'partyName', e.target.value)}
                                                                        style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '12px', background: 'white', fontWeight: '700' }}
                                                                    >
                                                                        {dbParties.map(p => (
                                                                            <option key={p.id} value={p.name}>{p.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <input placeholder="प्रत्याशी का नाम" value={item.candidateName} onChange={e => updateHistoryItem(idx, 'candidateName', e.target.value)} style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '12px', fontWeight: '600' }} />
                                                                <input type="number" value={item.votesReceived} onChange={e => updateHistoryItem(idx, 'votesReceived', e.target.value)} style={{ padding: '10px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '12px', fontWeight: '800' }} />
                                                                <button type="button" onClick={() => removeHistoryItem(idx)} style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {formData.electionHistory.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', border: '1px dashed #E2E8F0', borderRadius: '12px' }}>
                                                {lang === 'hi' ? 'कोई इतिहास डेटा नहीं है। "नया साल जोड़ें" बटन क्लिक करें।' : 'No history data. Click "Add Year".'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'caste' && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{ fontSize: '15px', fontWeight: '800' }}>{lang === 'hi' ? 'जाति समीकरण (Caste Demographics)' : 'Caste Demographics'}</div>
                                        <button type="button" onClick={addCaste} style={{ padding: '6px 14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ जाति जोड़ें</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {(formData.casteEquation as any[]).map((c: any, idx: number) => (
                                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <input placeholder="Caste Name" value={c.name} onChange={e => updateCaste(idx, 'name', e.target.value)} style={{ flex: 1, padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px' }} />
                                                <div style={{ position: 'relative', width: '100px' }}>
                                                    <input type="number" placeholder="%" value={c.percent} onChange={e => updateCaste(idx, 'percent', e.target.value)} style={{ width: '100%', padding: '10px 24px 10px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px' }} />
                                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94A3B8' }}>%</span>
                                                </div>
                                                <button type="button" onClick={() => removeCaste(idx)} style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer' }}><X size={16} /></button>
                                            </div>
                                        ))}

                                        {(formData.casteEquation as any[]).length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', border: '1px dashed #E2E8F0', borderRadius: '12px' }}>
                                                जाति डेटा उपलब्ध नहीं है। "+ जाति जोड़ें" क्लिक करें।
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button type="submit" disabled={saving} style={{ width: '100%', padding: '14px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                {saving ? 'सेव हो रहा है...' : 'सुरक्षित करें और वोटर लिस्ट इंपोर्ट शुरू करें (Save & Trigger)'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {filteredAssemblies.map((assembly: any) => {
                    const jobs = assembly.importJobs || [];
                    const completedJobs = jobs.filter((j: any) => j.status === 'COMPLETED' || j.status === 'VERIFIED');
                    const processingJob = jobs.find((j: any) => j.status === 'PROCESSING');
                    const pendingJobs = jobs.filter((j: any) => j.status === 'PENDING');
                    const activeJob = processingJob || pendingJobs[0];
                    const totalExtractedVotersFromJobs = jobs.reduce((sum: number, j: any) => sum + (j.totalVoters || 0), 0);

                    const votersCount = Math.max(assembly._count?.voters || 0, assembly.totalVoters || 0, totalExtractedVotersFromJobs);
                    const boothsCount = Math.max(assembly._count?.booths || 0, assembly.totalBooths || 0, completedJobs.length);

                    const hasRunningJob = jobs.some((j: any) => j.status === 'PROCESSING' || j.status === 'PENDING');
                    const isComplete = votersCount > 0 || (jobs.length > 0 && jobs.every((j: any) => j.status === 'COMPLETED' || j.status === 'VERIFIED'));

                    const progressPct = jobs.length > 0
                        ? Math.round((completedJobs.length / jobs.length) * 100)
                        : (votersCount > 0 ? 100 : 0);

                    return (
                        <div key={assembly.id} className="card" style={{ background: 'white', transition: 'transform 0.2s', borderTop: `6px solid ${assembly.themeColor || 'var(--primary-bg)'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>सीट नं. {assembly.number}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>
                                            {assembly.nameHindi || assembly.name}
                                        </div>
                                        {assembly.nameEnglish && (
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748B' }}>
                                                ({assembly.nameEnglish})
                                            </div>
                                        )}
                                        {isComplete && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', border: '1px solid #BBF7D0' }}>
                                                <CheckCircle2 size={15} color="#16A34A" /> इंपोर्ट पूर्ण
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm(`Warning: Deleting ${assembly.name} will delete ALL associated data (Voters, Booths, Users)! Are you sure?`)) {
                                                await deleteAssembly(assembly.id);
                                                fetchAssemblies();
                                            }
                                        }}
                                        style={{ padding: '10px', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <div style={{ padding: '10px', background: '#F0F7FF', borderRadius: '10px' }}>
                                        <Tent size={24} color={assembly.themeColor || "#2563EB"} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ fontSize: '14px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                                <MapPin size={14} /> {assembly.district}, {assembly.state}
                            </div>

                            {/* Live Import Detailed Status & Progress Panel */}
                            {(hasRunningJob || jobs.length > 0) && (
                                <div style={{ margin: '14px 0', background: '#EFF6FF', padding: '14px', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', color: '#1E40AF', marginBottom: '6px' }}>
                                        <span>⚡ वोटर लिस्ट इंपोर्ट प्रोग्रेस</span>
                                        <span>{progressPct}% ({completedJobs.length}/{jobs.length} PDFs पूर्ण)</span>
                                    </div>
                                    <div style={{ background: '#DBEAFE', borderRadius: '100px', height: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                                        <div style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #2563EB, #059669)', height: '100%', transition: 'width 0.4s ease' }} />
                                    </div>

                                    {activeJob ? (
                                        <div style={{ background: 'white', padding: '10px 12px', borderRadius: '10px', border: '1px solid #93C5FD', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800', color: '#0F172A' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    📄 <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', color: '#2563EB', fontSize: '11px' }}>{activeJob.fileName}</code>
                                                </span>
                                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: activeJob.status === 'PROCESSING' ? '#FEF3C7' : '#F1F5F9', color: activeJob.status === 'PROCESSING' ? '#92400E' : '#64748B', fontWeight: '800' }}>
                                                    {activeJob.status === 'PROCESSING' ? '🔄 एक्सट्रैक्ट हो रहा है...' : '⏳ प्रतीक्षा (Queue)'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#475569', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
                                                <span>📍 <strong>बूथ:</strong> {activeJob.boothNumber ? `बूथ नं. ${activeJob.boothNumber}` : 'स्कैनिंग जारी'} {activeJob.boothName ? `(${activeJob.boothName})` : ''}</span>
                                                <span style={{ color: '#059669', fontWeight: '800' }}>👥 <strong>निकले मतदाता:</strong> {activeJob.totalVoters ? `${activeJob.totalVoters} मतदाता` : (activeJob.status === 'PROCESSING' ? 'पढ़ा जा रहा है...' : 'प्रतीक्षारत')}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '11px', color: '#059669', fontWeight: '800', textAlign: 'center', background: '#ECFDF5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                                            ✓ कुल {completedJobs.length} PDFs सफलतापूर्वक प्रोसेस हो चुकी हैं ({totalExtractedVotersFromJobs.toLocaleString('hi-IN')} मतदाता)
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px', marginTop: '12px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>मतदाता</div>
                                    <div style={{ fontWeight: '800', fontSize: '15px' }}>{votersCount.toLocaleString('hi-IN')}</div>
                                </div>
                                <div style={{ textAlign: 'center', borderLeft: '1px solid #F1F5F9' }}>
                                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>बूथ</div>
                                    <div style={{ fontWeight: '800', fontSize: '15px' }}>{boothsCount}</div>
                                </div>
                                <div style={{ textAlign: 'center', borderLeft: '1px solid #F1F5F9' }}>
                                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>कैंडिडेट्स</div>
                                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#059669' }}>{assembly.users?.filter((u: any) => u.role === 'CANDIDATE').length || 0}</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {/* ZIP UPLOAD BOX — VPS & Cloud Ready */}
                                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1.5px dashed #CBD5E1', textAlign: 'center' }}>
                                    <label htmlFor={`zip-input-${assembly.id}`} style={{ cursor: 'pointer', display: 'block' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' }}>
                                            <FileArchive size={18} color="#2563EB" />
                                            {zipFiles[assembly.id] ? zipFiles[assembly.id]?.name : 'वोटर PDFs की ZIP फाइल अपलोड करें'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                                            {zipFiles[assembly.id] ? 'चेंज करने के लिए क्लिक करें' : 'क्लिक करके .zip फाइल चुनें (सभी PDF युक्त)'}
                                        </div>
                                    </label>
                                    <input
                                        id={`zip-input-${assembly.id}`}
                                        type="file"
                                        accept=".zip"
                                        style={{ display: 'none' }}
                                                onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setZipFiles(prev => ({ ...prev, [assembly.id]: e.target.files![0] }));
                                            }
                                        }}
                                    />
                                    {zipFiles[assembly.id] && (
                                        <button
                                            onClick={() => handleZipUpload(assembly)}
                                            disabled={!!uploadingZip[assembly.id]}
                                            style={{
                                                marginTop: '10px', width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
                                                background: 'linear-gradient(135deg, #059669, #10B981)', color: 'white', fontWeight: '800', fontSize: '13px',
                                                cursor: uploadingZip[assembly.id] ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                            }}
                                        >
                                            {uploadingZip[assembly.id]
                                                ? <><Loader2 size={16} className="animate-spin" /> अपलोड व अनजिप हो रहा है...</>
                                                : <><Upload size={16} /> ZIP अपलोड और ऑटो-इम्पोर्ट</>
                                            }
                                        </button>
                                    )}
                                </div>

                                {hasRunningJob && (
                                    <div style={{ background: '#ECFDF5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #A7F3D0', color: '#065F46', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <Loader2 size={16} className="animate-spin" /> बैकग्राउंड में ऑटो-इम्पोर्ट चल रहा है ({progressPct}%)
                                    </div>
                                )}

                                {/* Bulk import result message */}
                                {bulkMsg[assembly.id] && (
                                    <div style={{ background: '#FEF3C7', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', color: '#92400E', border: '1px solid #FDE68A', wordBreak: 'break-word' }}>
                                        {bulkMsg[assembly.id]}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => handleEdit(assembly)} style={{ flex: 1, padding: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>एडिट करें</button>
                                    <button onClick={() => openCampaignModal(assembly)} style={{ flex: 1, padding: '10px', background: '#ECFDF5', border: '1px solid #059669', color: '#059669', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <Users size={14} /> अभियान ({assembly._count?.campaigns || 0})
                                    </button>
                                </div>
                                <button onClick={() => handleViewData(assembly.id)} style={{ width: '100%', padding: '12px', background: 'white', border: '1px solid #2563EB', color: '#2563EB', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>वोटर डेटा देखें</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {showCampaignModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '32px', position: 'relative' }}>
                        <button onClick={() => setShowCampaignModal(false)} style={{ position: 'absolute', right: '24px', top: '24px', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={24} /></button>

                        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>कैंडिडेट्स (Campaigns)</h2>
                        <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '14px' }}>{selectedAssembly?.name} विधानसभा के लिए सक्रिय अभियान</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
                            {loadingCampaigns ? <p>लोड हो रहा है...</p> : campaigns.map(c => (
                                <div key={c.id} style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', color: '#1E293B' }}>{c.candidateName || 'Unnamed Candidate'}</div>
                                        <div style={{ fontSize: '11px', color: '#64748B' }}>{c.name}</div>
                                    </div>
                                    <UserPlus size={18} color="#94A3B8" />
                                </div>
                            ))}
                            {campaigns.length === 0 && !loadingCampaigns && <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>कोई अभियान नहीं मिला।</p>}
                        </div>

                        <form onSubmit={handleCreateCampaign} style={{ borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px' }}>नया कैंडिडेट जोड़ें</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <input required placeholder="कैंडिडेट का नाम" value={candidateName} onChange={e => setCandidateName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }} />
                                <input required placeholder="अभियान का नाम (जैसे: चुनाव 2026)" value={campaignName} onChange={e => setCampaignName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }} />
                                <button type="submit" disabled={saving} style={{ width: '100%', padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                                    {saving ? 'सेव हो रहा है...' : 'कैंडिडेट जोड़ें'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
