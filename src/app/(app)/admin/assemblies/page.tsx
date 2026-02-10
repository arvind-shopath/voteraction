'use client';

import React, { useState, useEffect } from 'react';
import { getAssemblies, createAssembly, updateAssembly, getCampaigns, createCampaign, deleteAssembly } from '@/app/actions/admin';
import { Tent, Plus, MapPin, Loader2, X, Filter, Users, UserPlus, Trash2, Palette } from 'lucide-react';
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
    const router = useRouter();

    const [formData, setFormData] = useState<any>({
        number: '',
        name: '',
        district: '',
        state: 'Uttar Pradesh',
        party: PARTIES[0],
        themeColor: PARTY_CONFIG[PARTIES[0]].color,
        candidateName: '',
        candidateImageUrl: null,
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
    }, []);

    async function fetchAssemblies() {
        setLoading(true);
        try {
            const data = await getAssemblies();
            setAssemblies(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const uniqueStates = Array.from(new Set(assemblies.map(a => a.state))).sort();

    useEffect(() => {
        if (!filterState && uniqueStates.length > 0) {
            if (uniqueStates.includes('Uttar Pradesh')) setFilterState('Uttar Pradesh');
            else setFilterState(uniqueStates[0]);
        }
    }, [uniqueStates, filterState]);

    const filteredAssemblies = filterState ? assemblies.filter(a => a.state === filterState) : assemblies;

    const handleEdit = (assembly: any) => {
        setEditingAssembly(assembly);
        setFormData({
            number: assembly.number.toString(),
            name: assembly.name,
            district: assembly.district,
            state: assembly.state,
            party: assembly.party || PARTIES[0],
            themeColor: assembly.themeColor || PARTY_CONFIG[assembly.party || PARTIES[0]]?.color || '#1E3A8A',
            candidateName: assembly.candidateName || '',
            candidateImageUrl: assembly.candidateImageUrl || null,
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
            const payload = {
                number: parseInt(formData.number),
                name: formData.name,
                district: formData.district,
                state: formData.state,
                party: formData.party,
                themeColor: formData.themeColor,
                candidateName: formData.candidateName,
                candidateImageUrl: formData.candidateImageUrl,
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
                number: '', name: '', district: '',
                state: filterState || 'Uttar Pradesh',
                party: PARTIES[0],
                themeColor: PARTY_CONFIG[PARTIES[0]].color,
                candidateName: '',
                candidateImageUrl: null,
                lastElectionDate: null,
                nextElectionDate: null,
                historicalResults: '[]', casteEquation: [], electionHistory: []
            });
            fetchAssemblies();
        } catch (e) {
            console.error('Save error:', e);
            alert('Error saving assembly. Please check console for details.');
        } finally {
            setSaving(false);
        }
    };

    const openAddModal = () => {
        setEditingAssembly(null);
        setFormData({
            number: '', name: '', district: '',
            state: filterState || 'Uttar Pradesh',
            party: PARTIES[0],
            themeColor: PARTY_CONFIG[PARTIES[0]].color,
            candidateName: '',
            candidateImageUrl: null,
            lastElectionDate: null,
            nextElectionDate: null,
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
            partyName: PARTIES[0],
            candidateName: '',
            votesReceived: 0,
            votePercentage: 0
        };
        setFormData({ ...formData, electionHistory: [...formData.electionHistory, newEntry] });
    };

    const addCandidateToYear = (year: number) => {
        const newEntry = {
            year: year,
            partyName: PARTIES[0],
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
                            {activeTab === 'basic' && (
                                <>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>विधानसभा नंबर</label>
                                        <input required type="number" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }} placeholder="जैसे: 148" />
                                    </div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>विधानसभा का नाम</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }} placeholder="जैसे: लहरपुर" />
                                    </div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>जिला</label>
                                        <input required type="text" value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }} placeholder="जैसे: सीतापुर" />
                                    </div>
                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>राज्य</label>
                                        <input required type="text" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }} />
                                    </div>

                                    {/* Election Dates */}
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
                                            <div style={{ marginTop: '4px', fontSize: '11px', color: '#92400E', fontWeight: '600' }}>
                                                📅 Format: DD/MM/YYYY (जैसे: 15/02/2022)
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#78350F' }}>आने वाला चुनाव (Next Election Date)</label>
                                            <input
                                                type="date"
                                                value={formData.nextElectionDate ? new Date(formData.nextElectionDate).toISOString().slice(0, 10) : ''}
                                                onChange={e => setFormData({ ...formData, nextElectionDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                                style={{ width: '100%', padding: '12px', border: '2px solid #F59E0B', borderRadius: '8px', background: 'white', fontWeight: '600' }}
                                            />
                                            <div style={{ marginTop: '4px', fontSize: '11px', color: '#92400E', fontWeight: '600' }}>
                                                📅 Format: DD/MM/YYYY (जैसे: 07/03/2027)
                                            </div>
                                            <div style={{ marginTop: '8px', fontSize: '11px', color: '#78350F', fontWeight: '600' }}>
                                                ⚠️ यह तारीख सेट करने पर मतदान वार रूम एक्टिव हो जाएगा
                                            </div>
                                        </div>
                                    </div>

                                    {/* Party, Color, Candidate info removed from Admin view as requested */}
                                    <div style={{ display: 'none' }}>
                                        <select value={formData.party} onChange={e => setFormData({ ...formData, party: e.target.value })}>
                                            {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        <input type="text" value={formData.themeColor} onChange={e => setFormData({ ...formData, themeColor: e.target.value })} />
                                        <input type="text" value={formData.candidateName} onChange={e => setFormData({ ...formData, candidateName: e.target.value })} />
                                    </div>
                                </>
                            )}

                            {activeTab === 'historical' && (
                                <div style={{ marginBottom: '24px' }}>
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
                                                                    <div style={{ position: 'absolute', left: '8px', width: '20px', height: '20px', borderRadius: '4px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                                                        {PARTY_CONFIG[item.partyName]?.logo ? (
                                                                            <img src={PARTY_CONFIG[item.partyName].logo} style={{ width: '14px', height: '14px', objectFit: 'contain' }} alt="" />
                                                                        ) : (
                                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: PARTY_CONFIG[item.partyName]?.color || '#94A3B8' }}></div>
                                                                        )}
                                                                    </div>
                                                                    <select
                                                                        value={item.partyName}
                                                                        onChange={e => updateHistoryItem(idx, 'partyName', e.target.value)}
                                                                        style={{ width: '100%', padding: '10px 10px 10px 36px', border: '1px solid #D1D5DB', borderRadius: '10px', fontSize: '12px', background: 'white', fontWeight: '700' }}
                                                                    >
                                                                        {PARTIES.map(p => (
                                                                            <option key={p} value={p}>{p}</option>
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
                                {saving ? 'सेव हो रहा है...' : 'सुरक्षित करें (Save All)'}
                            </button>
                        </form>
                    </div>
                </div>
            )
            }

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {filteredAssemblies.map((assembly: any) => (
                    <div key={assembly.id} className="card" style={{ background: 'white', transition: 'transform 0.2s', borderTop: `6px solid ${assembly.themeColor || 'var(--primary-bg)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>सीट नं. {assembly.number}</div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>{assembly.name}</div>
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

                        <div style={{ fontSize: '12px', color: '#059669', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Palette size={14} /> पार्टी: {assembly.party || 'Independent'}
                        </div>

                        {/* Candidates Section */}
                        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px', marginBottom: '16px', border: '1px solid #F1F5F9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <Users size={14} color="#059669" />
                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B' }}>साझा कैंडिडेट्स:</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {assembly.users?.filter((u: any) => u.role === 'CANDIDATE').map((u: any) => (
                                    <div key={u.id} style={{ padding: '4px 10px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                                        {u.name}
                                    </div>
                                ))}
                                {assembly.users?.filter((u: any) => u.role === 'CANDIDATE').length === 0 && (
                                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>कोई कैंडिडेट नहीं</div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>मतदाता</div>
                                <div style={{ fontWeight: '800', fontSize: '15px' }}>{assembly._count?.voters?.toLocaleString('hi-IN') || 0}</div>
                            </div>
                            <div style={{ textAlign: 'center', borderLeft: '1px solid #F1F5F9' }}>
                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>बूथ</div>
                                <div style={{ fontWeight: '800', fontSize: '15px' }}>{assembly._count?.booths || 0}</div>
                            </div>
                            <div style={{ textAlign: 'center', borderLeft: '1px solid #F1F5F9' }}>
                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>कैंडिडेट्स</div>
                                <div style={{ fontWeight: '800', fontSize: '15px', color: '#059669' }}>{assembly.users?.filter((u: any) => u.role === 'CANDIDATE').length || 0}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleEdit(assembly)} style={{ flex: 1, padding: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>एडिट करें</button>
                                <button onClick={() => openCampaignModal(assembly)} style={{ flex: 1, padding: '10px', background: '#ECFDF5', border: '1px solid #059669', color: '#059669', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <Users size={14} /> अभियान ({assembly._count?.campaigns || 0})
                                </button>
                            </div>
                            <button onClick={() => handleViewData(assembly.id)} style={{ width: '100%', padding: '12px', background: 'white', border: '1px solid #2563EB', color: '#2563EB', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>वोटर डेटा देखें</button>
                        </div>
                    </div >
                ))
                }
            </div >

            {
                showCampaignModal && (
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
                )
            }
        </div >
    );
}
