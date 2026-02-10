'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Navigation, UserPlus, Clock, Loader2, X, Target, MapPin, Save, User, Camera, Check, UserCheck, AlertCircle } from 'lucide-react';
import { getJansamparkRoutes, getWorkerJanSamparks, getVillageCoverageData, createWorkerJanSampark } from '@/app/actions/jansampark';
import { getVoters, createVoter } from '@/app/actions/voters';

const inputStyle = {
    width: '100%',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    fontSize: '15px',
    fontWeight: '500',
    color: '#334155',
    background: '#F8FAFC',
    outline: 'none',
    transition: 'all 0.2s'
};

const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '800',
    color: '#475569',
    marginBottom: '8px',
    letterSpacing: '0.3px'
};

/**
 * 🛡️ WORKER JANSAMPARK VIEW
 * Enhanced for attractive UI and precise functionality.
 */
export default function WorkerJansamparkView({ assemblyId, workerType }: { assemblyId: number, workerType: string }) {
    const { data: session }: any = useSession();
    const [lang, setLang] = useState('hi');
    const [searchTerm, setSearchTerm] = useState('');
    const [routes, setRoutes] = useState<any[]>([]);
    const [villageCoverage, setVillageCoverage] = useState<any[]>([]);
    const [voters, setVoters] = useState<any[]>([]);
    const [entries, setEntries] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // UI State
    const [showPRForm, setShowPRForm] = useState(false);
    const [showVoterModal, setShowVoterModal] = useState<any>(null);
    const [selectedVoter, setSelectedVoter] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Voter Search in PR Form
    const [prSearchQuery, setPrSearchQuery] = useState('');
    const [prSearchResults, setPrSearchResults] = useState<any[]>([]);
    const [isPrSearching, setIsPrSearching] = useState(false);
    const [voterNotFound, setVoterNotFound] = useState(false);

    // Forms
    const [voterForm, setVoterForm] = useState({
        name: '', relativeName: '', relationType: '',
        age: '', gender: 'M', mobile: '', epic: '',
        village: '', boothNumber: '', houseNumber: '', area: '',
        supportStatus: 'Neutral'
    });

    const [prForm, setPrForm] = useState({
        personName: '',
        mobile: '',
        village: '',
        atmosphere: 'Neutral',
        description: '',
        imageUrl: ''
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('app_lang');
            if (stored) setLang(stored);
        }
        getJansamparkRoutes(assemblyId).then(setRoutes);
        loadEntries();
        getVillageCoverageData(assemblyId).then(setVillageCoverage);
    }, [assemblyId]);

    const loadEntries = () => {
        getWorkerJanSamparks({ assemblyId }).then(setEntries);
    };

    const performSearch = async (val: string) => {
        setSearchTerm(val);
        if (val.length < 2) { setVoters([]); return; }
        setSearching(true);
        try {
            const res = await getVoters({ search: val, assemblyId, page: 1, pageSize: 12 });
            setVoters(res.voters || []);
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    };

    const handlePrSearch = async (val: string) => {
        setPrSearchQuery(val);
        if (val.length < 2) {
            setPrSearchResults([]);
            setVoterNotFound(false);
            return;
        }
        setIsPrSearching(true);
        try {
            const res = await getVoters({ search: val, assemblyId, page: 1, pageSize: 5 });
            setPrSearchResults(res.voters || []);
            setVoterNotFound((res.voters || []).length === 0);
        } catch (e) {
            console.error(e);
        } finally {
            setIsPrSearching(false);
        }
    };

    const selectVoterForPR = (voter: any) => {
        setSelectedVoter(voter);
        setPrForm({
            ...prForm,
            personName: voter.name,
            mobile: voter.mobile || '',
            village: voter.village || '',
            atmosphere: voter.supportStatus || 'Neutral'
        });
        setPrSearchQuery('');
        setPrSearchResults([]);
        setVoterNotFound(false);
    };

    const handleVoterSubmit = async () => {
        if (!voterForm.name || !voterForm.relationType) {
            alert(lang === 'hi' ? 'कृपया नाम और रिश्ता चुनें' : 'Please fill name and select relation');
            return;
        }
        setIsSubmitting(true);
        try {
            // Ensure boothNumber is positive or null
            const finalBooth = voterForm.boothNumber && parseInt(voterForm.boothNumber) > 0
                ? parseInt(voterForm.boothNumber)
                : null;

            await createVoter({ ...voterForm, boothNumber: finalBooth, assemblyId });
            setShowVoterModal(null);
            setVoterForm({
                name: '', relativeName: '', relationType: '',
                age: '', gender: 'M', mobile: '', epic: '',
                village: '', boothNumber: '', houseNumber: '', area: '',
                supportStatus: 'Neutral'
            });
            alert(lang === 'hi' ? 'नया वोटर सफलतापूर्वक जोड़ा गया!' : 'Voter added successfully!');
        } catch (e: any) {
            console.error(e);
            alert(e.message || 'Error adding voter');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePRSubmit = async () => {
        const workerId = session?.user?.id ? parseInt(session.user.id) : 0;
        if (!prForm.personName) {
            alert(lang === 'hi' ? 'कृपया व्यक्ति का नाम भरें' : 'Please fill person name');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                personName: prForm.personName,
                mobile: prForm.mobile,
                village: prForm.village,
                workerId: workerId || 1,
                assemblyId,
                atmosphere: prForm.atmosphere,
                description: prForm.description,
                imageUrl: prForm.imageUrl,
                voterId: selectedVoter?.id
            };
            await createWorkerJanSampark(payload);
            setShowPRForm(false);
            setSelectedVoter(null);
            setPrForm({ personName: '', mobile: '', village: '', atmosphere: 'Neutral', description: '', imageUrl: '' });
            setPrSearchQuery('');
            loadEntries();
            alert(lang === 'hi' ? 'एंट्री दर्ज कर ली गई है!' : 'Entry saved successfully!');
        } catch (e) {
            console.error(e);
            alert('Error saving entry');
        } finally {
            setIsSubmitting(false);
        }
    };

    const t = (hi: string, en: string) => lang === 'hi' ? hi : en;

    return (
        <div>
            {/* 1. Candidate Upcoming Schedule */}
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#2563EB15', padding: '8px', borderRadius: '12px' }}><Navigation size={24} color="#2563EB" /></div>
                    {t('कैंडिडेट का आगामी कार्यक्रम', 'Upcoming Schedule')}
                </h2>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none' }}>
                    {routes.filter(r => new Date(r.date) >= new Date(new Date().setHours(0, 0, 0, 0))).map((r: any) => (
                        <div key={r.id} style={{ flex: '0 0 300px', background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '11px', fontWeight: '900', color: '#2563EB', textTransform: 'uppercase', marginBottom: '4px' }}>
                                {new Date(r.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long' })}
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '950', color: '#1E293B', marginBottom: '16px' }}>
                                {new Date(r.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'long' })}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {r.visits?.map((v: any, idx: number) => (
                                    <div key={v.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#475569', padding: '8px 12px', background: '#F8FAFC', borderRadius: '12px' }}>
                                        <span style={{ fontWeight: '800' }}>{idx + 1}. {v.village}</span>
                                        <span style={{ fontSize: '12px', opacity: 0.7 }}><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />{v.time || 'N/A'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {routes.filter(r => new Date(r.date) >= new Date()).length === 0 && (
                        <div style={{ padding: '30px', background: 'white', borderRadius: '24px', border: '1px dashed #CBD5E1', color: '#94A3B8', textAlign: 'center', width: '100%' }}>
                            {t('कोई आगामी कार्यक्रम निर्धारित नहीं है।', 'No upcoming schedule set.')}
                        </div>
                    )}
                </div>
            </div>

            {/* Village Coverage Status */}
            <div style={{ background: 'white', borderRadius: '28px', padding: '32px', marginBottom: '32px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '950', color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Target size={24} color="#7C3AED" /> {t('गांव-वार जनसंपर्क स्थिति', 'Village Coverage Status')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                    {villageCoverage.map((vc: any) => {
                        const supportTotal = vc.support.positive + vc.support.neutral + vc.support.negative;
                        const supportPercent = supportTotal > 0 ? Math.round((vc.support.positive / supportTotal) * 100) : 0;

                        return (
                            <div key={vc.village} style={{
                                background: vc.jansamparkDone ? '#F0FDF4' : '#FEF9F3',
                                border: `2px solid ${vc.jansamparkDone ? '#BBF7D0' : '#FED7AA'}`,
                                borderRadius: '20px',
                                padding: '20px'
                            }}>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    background: vc.jansamparkDone ? '#16A34A' : '#EA580C',
                                    color: 'white',
                                    marginBottom: '12px',
                                    textTransform: 'uppercase'
                                }}>
                                    {vc.jansamparkDone ? t('✓ किया', '✓ Done') : t('⏳ बाकी', '⏳ Pending')}
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '950', color: '#0F172A', marginBottom: '6px' }}>{vc.village}</div>
                                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                                    <MapPin size={12} color="#9333EA" />
                                    {t('बूथ:', 'Booth:')}{(vc.booths || []).length > 0 ? vc.booths.sort((a: number, b: number) => a - b).join(', ') : 'N/A'}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: supportPercent > 50 ? '#16A34A' : '#EF4444' }}>
                                    {supportPercent}% {t('समर्थन', 'Support')}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* My Report Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#1E293B' }}>{t('मेरी जनसंपर्क रिपोर्ट', 'My PR Report')}</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowVoterModal({ id: null })} style={{ background: '#10B981', color: 'white', padding: '12px 20px', borderRadius: '14px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserPlus size={18} /> {t('नया वोटर', 'New Voter')}
                    </button>
                    <button onClick={() => { setSelectedVoter(null); setPrForm({ personName: '', mobile: '', village: '', atmosphere: 'Neutral', description: '', imageUrl: '' }); setShowPRForm(true); }} style={{ background: '#2563EB', color: 'white', padding: '12px 24px', borderRadius: '14px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={20} /> {t('नई एंट्री', 'New Entry')}
                    </button>
                </div>
            </div>

            {/* Voter Search List */}
            <div style={{ position: 'relative', marginBottom: '30px' }}>
                <div style={{ position: 'absolute', left: '20px', top: '18px', color: '#94A3B8' }}><Search size={24} /></div>
                <input type="text" placeholder={t('वोटर खोजें...', 'Search voter...')} value={searchTerm} onChange={(e) => performSearch(e.target.value)} style={{ width: '100%', padding: '18px 20px 18px 60px', borderRadius: '20px', border: '1px solid #E2E8F0', fontSize: '16px' }} />
                {searching && <div style={{ position: 'absolute', right: '20px', top: '18px' }}><Loader2 className="animate-spin" size={24} color="#2563EB" /></div>}
            </div>

            {/* Search Results List */}
            {voters.length > 0 && (
                <div style={{ marginBottom: '40px', background: '#F1F5F9', padding: '24px', borderRadius: '28px' }}>
                    {voters.map(v => (
                        <div key={v.id} style={{ background: 'white', borderRadius: '20px', padding: '20px', border: `1px solid #E2E8F0`, marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: '900', fontSize: '17px' }}>{v.name}</div>
                                    <div style={{ fontSize: '13px', color: '#64748B' }}>{v.village} • H.No: {v.houseNumber}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => { setSelectedVoter(v); setPrForm({ personName: v.name, mobile: v.mobile || '', village: v.village || '', atmosphere: v.supportStatus || 'Neutral', description: '', imageUrl: '' }); setShowPRForm(true); }} style={{ background: '#EEF2FF', border: 'none', padding: '10px 16px', borderRadius: '12px', color: '#4F46E5', fontWeight: '800', cursor: 'pointer' }}>{t('एंट्री करें', 'Make Entry')}</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Past Entries Grid */}
            <div style={{ background: 'white', borderRadius: '28px', padding: '30px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                    {entries.map(e => (
                        <div key={e.id} style={{ border: '1px solid #F1F5F9', borderRadius: '28px', overflow: 'hidden', background: '#F8FAFC' }}>
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                    {e.imageUrl && <img src={e.imageUrl} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />}
                                    <div>
                                        <div style={{ fontWeight: '950', fontSize: '18px' }}>{e.personName}</div>
                                        <div style={{ fontSize: '12px', color: '#64748B' }}>{e.village} • {new Date(e.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US')}</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '10px', display: 'inline-block', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', background: e.atmosphere === 'Support' ? '#DCFCE7' : e.atmosphere === 'Oppose' ? '#FEE2E2' : '#E2E8F0', color: e.atmosphere === 'Support' ? '#166534' : e.atmosphere === 'Oppose' ? '#991B1B' : '#475569' }}>
                                    {e.atmosphere === 'Support' ? t('समर्थक', 'Supporter') : e.atmosphere === 'Oppose' ? t('विरोधी', 'Opponent') : t('न्यूट्रल', 'Neutral')}
                                </div>
                                {e.description && <div style={{ marginTop: '12px', fontSize: '14px', color: '#334155', background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>{e.description}</div>}
                            </div>
                        </div>
                    ))}
                    {entries.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>{t('कोई एंट्री नहीं मिली।', 'No entries found.')}</div>}
                </div>
            </div>

            {/* 🛡️ PR ENTRY MODAL (OVERHAULED) */}
            {showPRForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '32px', maxWidth: '540px', width: '90%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Save size={24} color="#4F46E5" />
                                </div>
                                <h3 style={{ fontWeight: '950', fontSize: '22px', color: '#1E293B' }}>{t('जनसंपर्क एंट्री', 'PR Entry')}</h3>
                            </div>
                            <button onClick={() => setShowPRForm(false)} style={{ background: '#F8FAFC', border: 'none', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} color="#64748B" /></button>
                        </div>

                        {/* Search Box / Name Input */}
                        <div style={{ marginBottom: '24px', position: 'relative' }}>
                            <label style={labelStyle}>{t('नाम या एपिक सर्च करें', 'Search Name or EPIC')}</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={20} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '16px' }} />
                                <input
                                    style={{ ...inputStyle, paddingLeft: '50px' }}
                                    placeholder={t('मतदाता का नाम या EPIC लिखें...', 'Type voter name or EPIC...')}
                                    value={selectedVoter ? selectedVoter.name : prSearchQuery}
                                    onChange={(e) => {
                                        if (selectedVoter) {
                                            setSelectedVoter(null);
                                            setPrForm({ ...prForm, personName: '', mobile: '', village: '', atmosphere: 'Neutral' });
                                        }
                                        handlePrSearch(e.target.value);
                                    }}
                                />
                                {isPrSearching && <div style={{ position: 'absolute', right: '16px', top: '16px' }}><Loader2 className="animate-spin" size={20} color="#2563EB" /></div>}
                                {selectedVoter && <button onClick={() => { setSelectedVoter(null); setPrSearchQuery(''); }} style={{ position: 'absolute', right: '10px', top: '10px', background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: '800', color: '#EF4444', cursor: 'pointer' }}>{t('साफ करें', 'Clear')}</button>}
                            </div>

                            {/* Search Results Overlay */}
                            {prSearchResults.length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, marginTop: '8px' }}>
                                    {prSearchResults.map(v => (
                                        <div key={v.id} onClick={() => selectVoterForPR(v)} style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.2s' }}>
                                            <div style={{ fontWeight: '800', fontSize: '14px' }}>{v.name}</div>
                                            <div style={{ fontSize: '11px', color: '#64748B' }}>{v.epic || 'No EPIC'} • {v.village} • H.No: {v.houseNumber}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {voterNotFound && (
                                <div style={{ marginTop: '12px', padding: '12px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B', fontSize: '13px', fontWeight: '700' }}>
                                    <AlertCircle size={16} /> {t('मतदाता नहीं मिला', 'Voter not found')}
                                    <button
                                        onClick={() => {
                                            setShowPRForm(false);
                                            setShowVoterModal(true);
                                            setVoterForm({ ...voterForm, name: prSearchQuery });
                                            setVoterNotFound(false);
                                            setPrSearchQuery('');
                                        }}
                                        style={{ marginLeft: 'auto', background: '#EF4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                        {t('नया मतदाता जोड़ें', 'Add New Voter')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Selected Voter Card */}
                        {selectedVoter && (
                            <div style={{ background: '#F0FDFA', border: '1px solid #CCFBF1', padding: '16px', borderRadius: '20px', marginBottom: '24px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                                <div style={{ width: '44px', height: '44px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserCheck size={22} color="#0D9488" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '900', color: '#134E4A', fontSize: '15px' }}>{selectedVoter.name}</div>
                                    <div style={{ fontSize: '12px', color: '#0F766E', fontWeight: '600' }}>{selectedVoter.village} • H.No: {selectedVoter.houseNumber}</div>
                                </div>
                                <div style={{ background: '#134E4A', color: 'white', fontSize: '10px', fontWeight: '900', padding: '4px 8px', borderRadius: '6px' }}>{t('पंजीकृत', 'REGISTERED')}</div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <span style={labelStyle}>{t('मोबाइल नंबर', 'Mobile Number')}</span>
                                    <input style={inputStyle} value={prForm.mobile} onChange={e => setPrForm({ ...prForm, mobile: e.target.value })} placeholder="9911..." />
                                </div>
                                <div>
                                    <span style={labelStyle}>{t('गांव/पत्ता', 'Village/Address')}</span>
                                    <input style={inputStyle} value={prForm.village} onChange={e => setPrForm({ ...prForm, village: e.target.value })} placeholder={t('लिखें...', 'Type...')} />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>{t('समर्थन स्थिति', 'Support Status')}</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {['Support', 'Neutral', 'Against'].map((status) => {
                                        const isSelected = prForm.atmosphere === (status === 'Against' ? 'Oppose' : status);
                                        const colorMap: any = {
                                            'Support': { bg: '#22C55E', border: '#16A34A', text: 'white' },
                                            'Neutral': { bg: '#475569', border: '#334155', text: 'white' },
                                            'Against': { bg: '#EF4444', border: '#B91C1C', text: 'white' }
                                        };
                                        const active = colorMap[status];

                                        return (
                                            <button
                                                key={status}
                                                onClick={() => setPrForm({ ...prForm, atmosphere: status === 'Against' ? 'Oppose' : status })}
                                                style={{
                                                    flex: 1,
                                                    padding: '16px 12px',
                                                    borderRadius: '16px',
                                                    border: '2px solid',
                                                    borderColor: isSelected ? active.border : '#E2E8F0',
                                                    background: isSelected ? active.bg : 'white',
                                                    color: isSelected ? active.text : '#64748B',
                                                    fontWeight: '900',
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {status === 'Support' ? t('समर्थक', 'Support') :
                                                    status === 'Against' ? t('विरोधी', 'Against') :
                                                        t('न्यूट्रल', 'Neutral')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Photo Upload */}
                            <div>
                                <label style={labelStyle}>{t('फोटो अपलोड', 'Photo Upload')}</label>
                                <div style={{ border: '2px dashed #E2E8F0', borderRadius: '20px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: prForm.imageUrl ? '#F0FDFA' : '#F8FAFC' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="pr-photo-upload"
                                        onChange={(e: any) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const url = URL.createObjectURL(file);
                                                setPrForm({ ...prForm, imageUrl: url });
                                            }
                                        }}
                                    />
                                    <label htmlFor="pr-photo-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        {prForm.imageUrl ? (
                                            <>
                                                <img src={prForm.imageUrl} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
                                                <span style={{ fontSize: '12px', color: '#059669', fontWeight: '800' }}>{t('फ़ोटो सेलेक्टेड ✅', 'Photo Selected ✅')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                                    <Camera size={24} color="#6366F1" />
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>{t('फोटो खींचें या अपलोड करें', 'Snap or Upload Photo')}</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div>
                                <span style={labelStyle}>{t('बातचीत का विवरण', 'Conversation Notes')}</span>
                                <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'none' }} value={prForm.description} onChange={e => setPrForm({ ...prForm, description: e.target.value })} placeholder={t('मुख्य बातें लिखें...', 'Write main points...')} />
                            </div>

                            <button onClick={handlePRSubmit} disabled={isSubmitting} style={{ background: '#2563EB', color: 'white', padding: '18px', borderRadius: '18px', fontWeight: '900', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '10px', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {t('सुरक्षित करें', 'Save Entry')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW VOTER MODAL */}
            {showVoterModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '32px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontWeight: '950', fontSize: '20px' }}>{t('नया मतदाता जोड़ें', 'Add New Voter')}</h3>
                            <button onClick={() => setShowVoterModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} color="#94A3B8" /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <span style={labelStyle}>{t('पूरा नाम', 'Full Name')}</span>
                                <input style={inputStyle} value={voterForm.name} onChange={e => setVoterForm({ ...voterForm, name: e.target.value })} placeholder={t('मतदाता का नाम', 'Type voter name')} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <span style={labelStyle}>{t('उम्र', 'Age')}</span>
                                    <input style={inputStyle} type="number" value={voterForm.age} onChange={e => setVoterForm({ ...voterForm, age: e.target.value })} placeholder="Eg. 25" />
                                </div>
                                <div>
                                    <span style={labelStyle}>{t('लिंग', 'Gender')}</span>
                                    <select style={inputStyle} value={voterForm.gender} onChange={e => setVoterForm({ ...voterForm, gender: e.target.value })}>
                                        <option value="M">{t('पुरुष', 'Male')}</option>
                                        <option value="F">{t('महिला', 'Female')}</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <span style={labelStyle}>{t('रिश्ता', 'Relation')}</span>
                                    <select style={inputStyle} value={voterForm.relationType} onChange={e => setVoterForm({ ...voterForm, relationType: e.target.value })}>
                                        <option value="">{t('--चुनें--', '--Select--')}</option>
                                        <option value="Father">{t('पिता', 'Father')}</option>
                                        <option value="Husband">{t('पति', 'Husband')}</option>
                                        <option value="Mother">{t('माता', 'Mother')}</option>
                                    </select>
                                </div>
                                <div>
                                    <span style={labelStyle}>{t('रिश्तेदार का नाम', 'Relative Name')}</span>
                                    <input style={inputStyle} value={voterForm.relativeName} onChange={e => setVoterForm({ ...voterForm, relativeName: e.target.value })} placeholder={t('नाम लिखें...', 'Type relative name')} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <span style={labelStyle}>{t('मोबाइल', 'Mobile')}</span>
                                    <input style={inputStyle} value={voterForm.mobile} onChange={e => setVoterForm({ ...voterForm, mobile: e.target.value })} placeholder="9911..." />
                                </div>
                                <div>
                                    <span style={labelStyle}>{t('वोटर आईडी (EPIC)', 'EPIC (Voter ID)')}</span>
                                    <input style={inputStyle} value={voterForm.epic} onChange={e => setVoterForm({ ...voterForm, epic: e.target.value })} placeholder="XYZ123..." />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <span style={labelStyle}>{t('गांव/वार्ड', 'Village/Ward')}</span>
                                    <input style={inputStyle} value={voterForm.village} onChange={e => setVoterForm({ ...voterForm, village: e.target.value })} placeholder={t('नाम लिखें...', 'Type village...')} />
                                </div>
                                <div>
                                    <span style={labelStyle}>{t('बूथ संख्या', 'Booth Number')}</span>
                                    <input style={inputStyle} type="number" value={voterForm.boothNumber} onChange={e => setVoterForm({ ...voterForm, boothNumber: e.target.value })} placeholder="Eg. 45" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <span style={labelStyle}>{t('मकान नंबर', 'House Number')}</span>
                                    <input style={inputStyle} value={voterForm.houseNumber} onChange={e => setVoterForm({ ...voterForm, houseNumber: e.target.value })} placeholder="Eg. 12/B" />
                                </div>
                                <div>
                                    <span style={labelStyle}>{t('पता', 'Address')}</span>
                                    <input style={inputStyle} value={voterForm.area} onChange={e => setVoterForm({ ...voterForm, area: e.target.value })} placeholder={t('गली/मोहल्ला', 'Full address')} />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>{t('समर्थन स्थिति', 'Support Status')}</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['Support', 'Neutral', 'Oppose'].map((status) => {
                                        const isSelected = voterForm.supportStatus === status;
                                        const colorMap: any = {
                                            'Support': { bg: '#22C55E', border: '#16A34A', text: 'white' },
                                            'Neutral': { bg: '#475569', border: '#334155', text: 'white' },
                                            'Oppose': { bg: '#EF4444', border: '#B91C1C', text: 'white' }
                                        };
                                        const active = colorMap[status];

                                        return (
                                            <button
                                                key={status}
                                                onClick={() => setVoterForm({ ...voterForm, supportStatus: status })}
                                                style={{
                                                    flex: 1,
                                                    padding: '16px 12px',
                                                    borderRadius: '16px',
                                                    border: '2px solid',
                                                    borderColor: isSelected ? active.border : '#E2E8F0',
                                                    background: isSelected ? active.bg : 'white',
                                                    color: isSelected ? active.text : '#64748B',
                                                    fontWeight: '900',
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {status === 'Support' ? t('समर्थक', 'Favor') :
                                                    status === 'Oppose' ? t('विरोधी', 'Anti') :
                                                        t('न्यूट्रल', 'Neutral')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button onClick={handleVoterSubmit} disabled={isSubmitting} style={{ background: '#059669', color: 'white', padding: '16px', borderRadius: '16px', fontWeight: '900', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <><UserPlus size={18} /> {t('वोटर सुरक्षित करें', 'Save Voter')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
