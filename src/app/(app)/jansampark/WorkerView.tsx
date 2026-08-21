'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, Navigation, UserPlus, Clock, Loader2, X, Target, MapPin, Save, User, Camera, Check, UserCheck, AlertCircle } from 'lucide-react';
import { getJansamparkRoutes, getWorkerJanSamparks, getVillageCoverageData, createWorkerJanSampark } from '@/app/actions/jansampark';
import { getVoters, createVoter } from '@/app/actions/voters';
import { getWorkerBooth } from '@/app/actions/worker';

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

const CASTE_OPTIONS: any = {
    'सामान्य (General)': ['ब्राह्मण', 'ठाकुर (राजपूत)', 'बनिया', 'लाला (कायस्थ)', 'त्यागी', 'भूमिहार', 'अन्य'],
    'ओबीसी (OBC)': ['यादव', 'कुर्मी', 'कुशवाहा', 'मौर्य', 'लोध', 'जाट', 'गुज्जर', 'सैनी', 'विश्वकर्मा', 'प्रजापति', 'अन्य'],
    'एससी (SC)': ['जाटव', 'पासी', 'धोबी', 'कोरी', 'वाल्मीकि', 'अन्य'],
    'एसटी (ST)': ['गोंद', 'खरवार', 'सहारिया', 'अन्य'],
    'मुस्लिम (Muslim)': ['अंसारी', 'कुरैशी', 'शेख', 'पठान', 'सैय्यद', 'मंसूरी', 'अन्य']
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
        supportStatus: 'Neutral', caste: '', subCaste: ''
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

        async function loadCoverage() {
            if (session?.user?.id) {
                const booth = await getWorkerBooth(parseInt(session.user.id), assemblyId);
                const coverage = await getVillageCoverageData(assemblyId, booth?.number);
                setVillageCoverage(coverage);
            } else {
                const coverage = await getVillageCoverageData(assemblyId);
                setVillageCoverage(coverage);
            }
        }
        loadCoverage();
    }, [assemblyId, session]);

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
                supportStatus: 'Neutral', caste: '', subCaste: ''
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

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const t = (hi: string, en: string) => lang === 'hi' ? hi : en;

    return (
        <div>
            {/* 1. My Report Header & Actions (Moved to TOP) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', marginBottom: '20px', gap: '12px' }}>
                <h2 style={{ fontSize: isMobile ? '20px' : '22px', fontWeight: '950', color: '#1E293B' }}>{t('मेरी जनसंपर्क रिपोर्ट', 'My PR Report')}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowVoterModal({ id: null })} style={{ flex: 1, background: '#10B981', color: 'white', padding: '10px 16px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: isMobile ? '13px' : '14px' }}>
                        <UserPlus size={16} /> {t('नया वोटर', 'New Voter')}
                    </button>
                    <button onClick={() => { setSelectedVoter(null); setPrForm({ personName: '', mobile: '', village: '', atmosphere: 'Neutral', description: '', imageUrl: '' }); setShowPRForm(true); }} style={{ flex: 1, background: '#2563EB', color: 'white', padding: '10px 18px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: isMobile ? '13px' : '14px' }}>
                        <Plus size={18} /> {t('नई एंट्री', 'New Entry')}
                    </button>
                </div>
            </div>

            {/* 2. Voter Search List */}
            <div style={{ position: 'relative', marginBottom: isMobile ? '20px' : '30px' }}>
                <div style={{ position: 'absolute', left: '16px', top: '16px', color: '#94A3B8' }}><Search size={20} /></div>
                <input type="text" placeholder={t('वोटर खोजें...', 'Search voter...')} value={searchTerm} onChange={(e) => performSearch(e.target.value)} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '15px' }} />
                {searching && <div style={{ position: 'absolute', right: '16px', top: '16px' }}><Loader2 className="animate-spin" size={20} color="#2563EB" /></div>}
            </div>

            {/* Search Results List */}
            {voters.length > 0 && (
                <div style={{ marginBottom: '30px', background: '#F1F5F9', padding: isMobile ? '14px' : '24px', borderRadius: isMobile ? '18px' : '28px' }}>
                    {voters.map(v => (
                        <div key={v.id} style={{ background: 'white', borderRadius: '16px', padding: '14px', border: `1px solid #E2E8F0`, marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: '900', fontSize: '15px' }}>{v.name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748B' }}>{v.village} • H.No: {v.houseNumber}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    <button onClick={() => { setSelectedVoter(v); setPrForm({ personName: v.name, mobile: v.mobile || '', village: v.village || '', atmosphere: v.supportStatus || 'Neutral', description: '', imageUrl: '' }); setShowPRForm(true); }} style={{ background: '#EEF2FF', border: 'none', padding: '8px 12px', borderRadius: '10px', color: '#4F46E5', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}>{t('एंट्री करें', 'Make Entry')}</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 3. Candidate Upcoming Schedule */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '950', color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#2563EB15', padding: '6px', borderRadius: '10px', display: 'flex' }}><Navigation size={20} color="#2563EB" /></div>
                    {t('कैंडिडेट का आगामी कार्यक्रम', 'Upcoming Schedule')}
                </h2>
                <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
                    {routes.filter(r => new Date(r.date) >= new Date(new Date().setHours(0, 0, 0, 0))).map((r: any) => (
                        <div key={r.id} style={{ flex: isMobile ? '0 0 260px' : '0 0 300px', background: 'white', padding: isMobile ? '16px' : '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '11px', fontWeight: '900', color: '#2563EB', textTransform: 'uppercase', marginBottom: '4px' }}>
                                {new Date(r.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long' })}
                            </div>
                            <div style={{ fontSize: '17px', fontWeight: '950', color: '#1E293B', marginBottom: '12px' }}>
                                {new Date(r.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'long' })}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {r.visits?.map((v: any, idx: number) => (
                                    <div key={v.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#475569', padding: '6px 10px', background: '#F8FAFC', borderRadius: '10px' }}>
                                        <span style={{ fontWeight: '800' }}>{idx + 1}. {v.village}</span>
                                        <span style={{ fontSize: '11px', opacity: 0.7 }}><Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />{v.time || 'N/A'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {routes.filter(r => new Date(r.date) >= new Date()).length === 0 && (
                        <div style={{ padding: '24px', background: 'white', borderRadius: '20px', border: '1px dashed #CBD5E1', color: '#94A3B8', textAlign: 'center', width: '100%' }}>
                            {t('कोई आगामी कार्यक्रम निर्धारित नहीं है।', 'No upcoming schedule set.')}
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Village Coverage Status (Now Filtered by Booth for Managers) */}
            <div style={{ background: 'white', borderRadius: isMobile ? '20px' : '28px', padding: isMobile ? '20px 16px' : '32px', marginBottom: '28px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '950', color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Target size={22} color="#7C3AED" /> {t('गांव-वार जनसंपर्क स्थिति', 'Village Coverage Status')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '14px' }}>
                    {villageCoverage.map((vc: any) => {
                        const supportTotal = vc.support.positive + vc.support.neutral + vc.support.negative;
                        const supportPercent = supportTotal > 0 ? Math.round((vc.support.positive / supportTotal) * 100) : 0;

                        return (
                            <div key={vc.village} style={{
                                background: vc.jansamparkDone ? '#F0FDF4' : '#FEF9F3',
                                border: `2px solid ${vc.jansamparkDone ? '#BBF7D0' : '#FED7AA'}`,
                                borderRadius: '18px',
                                padding: '16px'
                            }}>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    background: vc.jansamparkDone ? '#16A34A' : '#EA580C',
                                    color: 'white',
                                    marginBottom: '10px',
                                    textTransform: 'uppercase'
                                }}>
                                    {vc.jansamparkDone ? t('✓ किया', '✓ Done') : t('⏳ बाकी', '⏳ Pending')}
                                </div>
                                <div style={{ fontSize: '17px', fontWeight: '950', color: '#0F172A', marginBottom: '4px' }}>{vc.village}</div>
                                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
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

            {/* 5. Past Entries Grid */}
            <div style={{ background: 'white', borderRadius: isMobile ? '20px' : '28px', padding: isMobile ? '20px 16px' : '30px', border: '1px solid #E2E8F0' }}>
                <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '950', color: '#1E293B', marginBottom: '18px' }}>{t('पिछली एंट्रियां (History)', 'Recent History')}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
                    {entries.map(e => (
                        <div key={e.id} style={{ border: '1px solid #F1F5F9', borderRadius: '20px', overflow: 'hidden', background: '#F8FAFC' }}>
                            <div style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                    {e.imageUrl && <img src={e.imageUrl} style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />}
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: '950', fontSize: '16px' }}>{e.personName}</div>
                                        <div style={{ fontSize: '11px', color: '#64748B' }}>{e.village} • {new Date(e.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US')}</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '8px', display: 'inline-block', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', background: e.atmosphere === 'Support' ? '#DCFCE7' : e.atmosphere === 'Oppose' ? '#FEE2E2' : '#E2E8F0', color: e.atmosphere === 'Support' ? '#166534' : e.atmosphere === 'Oppose' ? '#991B1B' : '#475569' }}>
                                    {e.atmosphere === 'Support' ? t('समर्थक', 'Supporter') : e.atmosphere === 'Oppose' ? t('विरोधी', 'Opponent') : t('न्यूट्रल', 'Neutral')}
                                </div>
                                {e.description && <div style={{ marginTop: '10px', fontSize: '13px', color: '#334155', background: 'white', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', wordBreak: 'break-word' }}>{e.description}</div>}
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
                                    <span style={labelStyle}>{t('वर्ग', 'Category')}</span>
                                    <select style={inputStyle} value={voterForm.caste} onChange={e => setVoterForm({ ...voterForm, caste: e.target.value, subCaste: '' })}>
                                        <option value="">{t('--चुनें--', '--Select--')}</option>
                                        {Object.keys(CASTE_OPTIONS).map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <span style={labelStyle}>{t('जाति', 'Caste')}</span>
                                    <select style={inputStyle} value={voterForm.subCaste} disabled={!voterForm.caste} onChange={e => setVoterForm({ ...voterForm, subCaste: e.target.value })}>
                                        <option value="">{t('--चुनें--', '--Select--')}</option>
                                        {voterForm.caste && CASTE_OPTIONS[voterForm.caste]?.map((c: string) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
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
