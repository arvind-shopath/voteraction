'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldCheck, UserPlus, UserMinus, CheckCircle2, Search, Filter, Loader2, Check, X, MapPin, Phone, MessageSquare, Plus, CheckCircle, AlertTriangle, Key } from 'lucide-react';
import { getVoters, resolveEciAddition, resolveEciDeletion, rejectEciRequest } from '@/app/actions/voters';

export default function ECIUpdatesPage() {
    const { data: session }: any = useSession();
    const [lang, setLang] = useState('hi');
    const [tab, setTab] = useState<'ADD' | 'REMOVE' | 'RESOLVED'>('ADD');
    const [loading, setLoading] = useState(true);
    const [voters, setVoters] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [counts, setCounts] = useState({ add: 0, remove: 0, resolved: 0 });

    // Resolve Addition Modal (EPIC Entry)
    const [resolveAddVoter, setResolveAddVoter] = useState<any | null>(null);
    const [epicInput, setEpicInput] = useState('');
    const [boothInput, setBoothInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const assemblyId = session?.user?.assemblyId;

    useEffect(() => {
        const stored = localStorage.getItem('app_lang');
        if (stored) setLang(stored);
        fetchData();
        fetchCounts();
    }, [tab, assemblyId]);

    const fetchCounts = async () => {
        if (!assemblyId) return;
        try {
            const [addRes, removeRes, resolvedRes] = await Promise.all([
                getVoters({ assemblyId, eciStatus: 'NEW_REQUEST', pageSize: 1 }),
                getVoters({ assemblyId, eciStatus: 'DELETE_REQUESTED', pageSize: 1 }),
                getVoters({ assemblyId, eciStatus: 'RESOLVED', pageSize: 1 })
            ]);
            setCounts({
                add: addRes.totalCount || 0,
                remove: removeRes.totalCount || 0,
                resolved: resolvedRes.totalCount || 0
            });
        } catch (e) {
            console.error(e);
        }
    };

    const fetchData = async () => {
        if (!assemblyId) return;
        setLoading(true);
        try {
            let eciStatus = 'NEW_REQUEST';
            if (tab === 'REMOVE') eciStatus = 'DELETE_REQUESTED';
            if (tab === 'RESOLVED') eciStatus = 'RESOLVED';

            const res = await getVoters({
                assemblyId,
                eciStatus,
                pageSize: 300
            });
            setVoters(res.voters || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenResolveAdd = (voter: any) => {
        setResolveAddVoter(voter);
        setEpicInput(voter.epic || '');
        setBoothInput(voter.boothNumber?.toString() || '');
    };

    const handleSubmitResolveAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resolveAddVoter) return;
        if (!epicInput.trim()) {
            alert('कृपया वोटर का EPIC (वोटर आईडी) नंबर दर्ज करें।');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await resolveEciAddition(
                resolveAddVoter.id,
                epicInput.trim(),
                boothInput ? parseInt(boothInput) : undefined
            );
            alert(res.message || 'सफलतापूर्वक मतदाता सूची में जोड़ दिया गया!');
            setResolveAddVoter(null);
            fetchData();
            fetchCounts();
        } catch (err: any) {
            alert(err.message || 'त्रुटि हुई। कृपया पुनः प्रयास करें।');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolveDelete = async (voter: any) => {
        const confirmMsg = `क्या आप पुष्टि करते हैं कि "${voter.name}" (EPIC: ${voter.epic || '-'}) का नाम ECI मतदाता सूची से कट चुका है?`;
        if (!confirm(confirmMsg)) return;

        setIsSubmitting(true);
        try {
            const res = await resolveEciDeletion(voter.id);
            alert(res.message || 'सफलतापूर्वक हटा दिया गया!');
            fetchData();
            fetchCounts();
        } catch (err: any) {
            alert(err.message || 'त्रुटि हुई।');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async (voter: any) => {
        const confirmMsg = `क्या आप इस अनुरोध को निरस्त करना चाहते हैं?`;
        if (!confirm(confirmMsg)) return;

        setIsSubmitting(true);
        try {
            const res = await rejectEciRequest(voter.id);
            alert(res.message || 'अनुरोध निरस्त कर दिया गया।');
            fetchData();
            fetchCounts();
        } catch (err: any) {
            alert(err.message || 'त्रुटि हुई।');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredVoters = voters.filter(v =>
        v.name?.toLowerCase().includes(search.toLowerCase()) ||
        v.epic?.toLowerCase().includes(search.toLowerCase()) ||
        v.village?.toLowerCase().includes(search.toLowerCase()) ||
        v.mobile?.includes(search)
    );

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const glassCardStyle: React.CSSProperties = {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        borderRadius: isMobile ? '18px' : '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
    };

    const tabStyle = (active: boolean, color: string): React.CSSProperties => ({
        flex: isMobile ? '1 1 auto' : 1,
        padding: isMobile ? '12px 14px' : '18px 24px',
        border: 'none',
        background: active ? color : 'transparent',
        color: active ? 'white' : '#64748B',
        fontWeight: '800',
        fontSize: isMobile ? '13px' : '15px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minWidth: isMobile ? '140px' : 'auto'
    });

    return (
        <div style={{ padding: isMobile ? '12px 8px' : '24px 32px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-geist-sans)' }}>
            {/* Header Area */}
            <div style={{ marginBottom: isMobile ? '16px' : '28px', display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#0F172A', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)', padding: '8px', borderRadius: '12px', color: 'white', display: 'flex' }}>
                            <ShieldCheck size={isMobile ? 22 : 26} />
                        </div>
                        {lang === 'hi' ? 'निर्वाचन आयोग (ECI) समन्वय' : 'ECI Coordination'}
                    </h1>
                    <p style={{ color: '#64748B', fontSize: isMobile ? '12px' : '14px', fontWeight: '600', lineHeight: 1.4 }}>
                        {lang === 'hi' ? 'मतदाता सूची में नए नाम जुड़वाने (Form 6) और मृतक/फर्जी नाम हटवाने (Form 7) की ट्रैकिंग' : 'Manage additions & deletions of voter rolls with ECI'}
                    </p>
                </div>

                <div style={{ position: 'relative', width: '100%', maxWidth: isMobile ? '100%' : '320px' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} size={18} />
                    <input
                        placeholder={lang === 'hi' ? 'नाम, फोन, EPIC, गांव से खोजें...' : 'Search by name, phone, village...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px 12px 46px', borderRadius: '14px', border: '1px solid #CBD5E1', background: 'white', fontSize: '14px', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                    />
                </div>
            </div>

            {/* Main Tabs Card */}
            <div style={glassCardStyle}>
                <div style={{ display: 'flex', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', scrollbarWidth: 'none' }}>
                    <button
                        onClick={() => setTab('ADD')}
                        style={tabStyle(tab === 'ADD', '#0D9488')}
                    >
                        <UserPlus size={isMobile ? 16 : 18} />
                        {lang === 'hi' ? 'ECI में जुड़वाएं' : 'Add to ECI'}
                        <span style={{ background: tab === 'ADD' ? 'rgba(255,255,255,0.25)' : '#E2E8F0', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
                            {counts.add}
                        </span>
                    </button>
                    <button
                        onClick={() => setTab('REMOVE')}
                        style={tabStyle(tab === 'REMOVE', '#DC2626')}
                    >
                        <UserMinus size={isMobile ? 16 : 18} />
                        {lang === 'hi' ? 'ECI से हटवाएं' : 'Remove from ECI'}
                        <span style={{ background: tab === 'REMOVE' ? 'rgba(255,255,255,0.25)' : '#E2E8F0', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
                            {counts.remove}
                        </span>
                    </button>
                    <button
                        onClick={() => setTab('RESOLVED')}
                        style={tabStyle(tab === 'RESOLVED', '#2563EB')}
                    >
                        <CheckCircle2 size={isMobile ? 16 : 18} />
                        {lang === 'hi' ? 'निस्तारित' : 'Resolved'}
                        <span style={{ background: tab === 'RESOLVED' ? 'rgba(255,255,255,0.25)' : '#E2E8F0', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
                            {counts.resolved}
                        </span>
                    </button>
                </div>

                <div style={{ padding: isMobile ? '16px 12px' : '28px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <Loader2 className="animate-spin" size={36} color="#0D9488" style={{ margin: '0 auto 12px' }} />
                            <p style={{ fontWeight: '700', color: '#64748B', fontSize: '14px' }}>डेटा लोड हो रहा है...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: isMobile ? '14px' : '20px' }}>
                            {filteredVoters.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #E2E8F0' }}>
                                    <ShieldCheck size={40} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                                    <p style={{ fontWeight: '800', color: '#64748B', fontSize: '15px' }}>इस सेक्शन में कोई लंबित रिकॉर्ड नहीं है</p>
                                </div>
                            ) : filteredVoters.map((v: any) => (
                                <div key={v.id} style={{ background: 'white', padding: isMobile ? '16px' : '20px', borderRadius: '16px', border: '1px solid #E2E8F0', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                                    <div>
                                        {/* Card Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                            <div>
                                                <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0F172A', marginBottom: '4px' }}>{v.name}</h3>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', color: '#475569' }}>
                                                        {v.gender === 'M' ? 'पुरुष' : 'महिला'}, {v.age} वर्ष
                                                    </span>
                                                    {v.village && (
                                                        <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                                            📍 {v.village}
                                                        </span>
                                                    )}
                                                    {v.houseNumber && (
                                                        <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: '#64748B' }}>
                                                            🏠 मकान: {v.houseNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>बूथ</div>
                                                <div style={{ fontWeight: '900', color: '#0F172A', fontSize: '16px' }}>#{v.boothNumber || '-'}</div>
                                            </div>
                                        </div>

                                        {/* Relative Info */}
                                        {v.relativeName && (
                                            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                                                रिश्तेदार: <b>{v.relativeName}</b> ({v.relationType || v.relationshipType || 'पिता'})
                                            </div>
                                        )}

                                        {/* Key Details Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                                            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderRadius: '10px', fontSize: '12px' }}>
                                                <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>EPIC / वोटर आईडी</div>
                                                <div style={{ color: '#0F172A', fontWeight: '800', fontFamily: 'monospace' }}>{v.epic || 'पेंडिंग (नया कार्ड)'}</div>
                                            </div>
                                            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderRadius: '10px', fontSize: '12px' }}>
                                                <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>मोबाइल</div>
                                                <div style={{ color: '#0F172A', fontWeight: '800' }}>{v.mobile || '---'}</div>
                                            </div>
                                        </div>

                                        {/* Notes or Reason */}
                                        {v.notes && (
                                            <div style={{ background: tab === 'REMOVE' ? '#FEF2F2' : '#FFFBEB', padding: '10px 12px', borderRadius: '10px', marginBottom: '14px', fontSize: '12px', color: tab === 'REMOVE' ? '#991B1B' : '#92400E', fontWeight: '600', display: 'flex', gap: '8px', borderLeft: tab === 'REMOVE' ? '3px solid #DC2626' : '3px solid #F59E0B' }}>
                                                <MessageSquare size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                <div>{v.notes}</div>
                                            </div>
                                        )}

                                        {/* Status badge for Resolved */}
                                        {tab === 'RESOLVED' && (
                                            <div style={{ marginBottom: '14px' }}>
                                                {v.eciStatus === 'RESOLVED_ADDED' ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#DCFCE7', color: '#15803D', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' }}>
                                                        <CheckCircle size={14} /> वोटर कार्ड जारी हो गया (EPIC: {v.epic})
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEE2E2', color: '#DC2626', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' }}>
                                                        <X size={14} /> ECI से नाम कट गया (विलोपित)
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div>
                                        {tab === 'ADD' && (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                <button
                                                    onClick={() => handleOpenResolveAdd(v)}
                                                    disabled={isSubmitting}
                                                    style={{ flex: 2, padding: '10px 14px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                >
                                                    <Check size={16} /> मार्क डन (EPIC दर्ज करें)
                                                </button>
                                                <button
                                                    onClick={() => handleReject(v)}
                                                    disabled={isSubmitting}
                                                    title="अनुरोध निरस्त करें"
                                                    style={{ flex: 1, padding: '10px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                                                >
                                                    रद्द करें
                                                </button>
                                            </div>
                                        )}

                                        {tab === 'REMOVE' && (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                <button
                                                    onClick={() => handleResolveDelete(v)}
                                                    disabled={isSubmitting}
                                                    style={{ flex: 2, padding: '10px 14px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                >
                                                    <Check size={16} /> मार्क डन (नाम कट गया)
                                                </button>
                                                <button
                                                    onClick={() => handleReject(v)}
                                                    disabled={isSubmitting}
                                                    title="वापस सक्रिय करें"
                                                    style={{ flex: 1, padding: '10px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                                                >
                                                    रद्द करें
                                                </button>
                                            </div>
                                        )}

                                        <div style={{ marginTop: '10px', fontSize: '11px', color: '#94A3B8', textAlign: 'center' }}>
                                            दर्जकर्ता: <b>{v.updatedByName || 'Unknown'}</b>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Resolve Addition Modal (EPIC Entry) */}
            {resolveAddVoter && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '480px', borderRadius: '24px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>नया वोटर कार्ड (EPIC) दर्ज करें</h3>
                                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{resolveAddVoter.name} ({resolveAddVoter.village || 'गांव'})</p>
                            </div>
                            <button onClick={() => setResolveAddVoter(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmitResolveAdd}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                                    नया EPIC / वोटर आईडी नंबर <span style={{ color: '#DC2626' }}>*</span>
                                </label>
                                <input
                                    required
                                    autoFocus
                                    type="text"
                                    placeholder="जैसे: SQH1234567"
                                    value={epicInput}
                                    onChange={e => setEpicInput(e.target.value.toUpperCase())}
                                    style={{ width: '100%', padding: '14px', border: '1px solid #CBD5E1', borderRadius: '12px', fontSize: '15px', fontWeight: '700', fontFamily: 'monospace' }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                                    बूथ संख्या
                                </label>
                                <input
                                    type="number"
                                    placeholder="बूथ संख्या"
                                    value={boothInput}
                                    onChange={e => setBoothInput(e.target.value)}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}
                                />
                            </div>

                            <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '12px', color: '#1E40AF', lineHeight: '1.5' }}>
                                💡 EPIC नंबर दर्ज होते ही यह व्यक्ति मुख्य <b>मतदाता सूची (/voters)</b> में आधिकारिक वोटर के रूप में जुड़ जाएगा।
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setResolveAddVoter(null)}
                                    style={{ flex: 1, padding: '12px', border: '1px solid #CBD5E1', background: 'white', borderRadius: '12px', fontWeight: '700', color: '#64748B', cursor: 'pointer' }}
                                >
                                    कैंसिल
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{ flex: 2, padding: '12px', background: '#0D9488', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} पुष्टि करें एवं सूची में जोड़ें
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
