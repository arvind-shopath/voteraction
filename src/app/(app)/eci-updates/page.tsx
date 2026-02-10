'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldCheck, UserPlus, UserMinus, Search, Filter, Loader2, Check, X, MapPin, Phone, MessageSquare } from 'lucide-react';
import { getVoters, updateEciStatus } from '@/app/actions/voters';

export default function ECIUpdatesPage() {
    const { data: session }: any = useSession();
    const [lang, setLang] = useState('hi');
    const [tab, setTab] = useState<'ADD' | 'REMOVE'>('ADD');
    const [loading, setLoading] = useState(true);
    const [voters, setVoters] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const assemblyId = session?.user?.assemblyId;

    useEffect(() => {
        const stored = localStorage.getItem('app_lang');
        if (stored) setLang(stored);
        fetchData();
    }, [tab, assemblyId]);

    const fetchData = async () => {
        if (!assemblyId) return;
        setLoading(true);
        try {
            // Filter mapping
            const eciStatus = tab === 'ADD' ? 'NOT_IN_LIST' : 'CORRECTION_REQUIRED';
            const res = await getVoters({
                assemblyId,
                eciStatus,
                pageSize: 200
            });
            setVoters(res.voters);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (voterId: number, newStatus: string) => {
        const msg = lang === 'hi' ? 'क्या आप इस स्थिति को बदलना चाहते हैं?' : 'Are you sure you want to change this status?';
        if (!confirm(msg)) return;

        await updateEciStatus(voterId, newStatus);
        fetchData();
    };

    const filteredVoters = voters.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.epic?.toLowerCase().includes(search.toLowerCase())
    );

    const glassCardStyle: React.CSSProperties = {
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
    };

    const tabStyle = (active: boolean, color: string): React.CSSProperties => ({
        flex: 1,
        padding: '20px',
        border: 'none',
        background: active ? color : 'transparent',
        color: active ? 'white' : '#64748B',
        fontWeight: '800',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
    });

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header Area */}
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(15, 23, 42, 0.2)' }}>
                            <ShieldCheck color="white" size={32} />
                        </div>
                        {lang === 'hi' ? 'ECI समन्वय (Update)' : 'ECI Coordination'}
                    </h1>
                    <p style={{ color: '#64748B', fontSize: '15px', fontWeight: '500' }}>
                        {lang === 'hi' ? 'मतदाता सूची में नाम जुड़वाने और हटवाने की प्रक्रियाओं का प्रबंधन' : 'Management of adding and removing names from the voter list'}
                    </p>
                </div>

                <div style={{ position: 'relative', width: '350px' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} size={18} />
                    <input
                        placeholder={lang === 'hi' ? 'नाम या EPIC से खोजें...' : 'Search by name or EPIC...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', fontSize: '14px', fontWeight: '500', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                    />
                </div>
            </div>

            {/* Main Tabs Card */}
            <div style={glassCardStyle}>
                <div style={{ display: 'flex', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <button
                        onClick={() => setTab('ADD')}
                        style={tabStyle(tab === 'ADD', '#0D9488')}
                    >
                        <UserPlus size={20} />
                        {lang === 'hi' ? 'ECI में जुड़वाएं (Missing)' : 'Add to ECI'}
                        <span style={{ background: tab === 'ADD' ? 'rgba(255,255,255,0.2)' : '#E2E8F0', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' }}>
                            {voters.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setTab('REMOVE')}
                        style={tabStyle(tab === 'REMOVE', '#E11D48')}
                    >
                        <UserMinus size={20} />
                        {lang === 'hi' ? 'ECI से हटवाएं (Fake/Moved)' : 'Remove from ECI'}
                        <span style={{ background: tab === 'REMOVE' ? 'rgba(255,255,255,0.2)' : '#E2E8F0', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' }}>
                            {voters.length}
                        </span>
                    </button>
                </div>

                <div style={{ padding: '32px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '100px 0' }}>
                            <Loader2 className="animate-spin" size={48} color="#0D9488" style={{ margin: '0 auto 24px' }} />
                            <p style={{ fontWeight: '600', color: '#64748B' }}>डेटा लोड हो रहा है...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                            {filteredVoters.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', background: '#F8FAFC', borderRadius: '24px', border: '2px dashed #E2E8F0' }}>
                                    <ShieldCheck size={48} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
                                    <p style={{ fontWeight: '600', color: '#94A3B8' }}>कोई अनुरोध लंबित नहीं है</p>
                                </div>
                            ) : filteredVoters.map((v: any) => (
                                <div key={v.id} style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>{v.name}</h3>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <span style={{ background: '#F1F5F9', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                                                    {v.age} Y, {v.gender}
                                                </span>
                                                <span style={{ background: tab === 'ADD' ? '#F0FDF4' : '#FFF1F2', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', color: tab === 'ADD' ? '#166534' : '#9F1239' }}>
                                                    {v.village}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Booth</div>
                                            <div style={{ fontWeight: '900', color: '#0F172A', fontSize: '18px' }}>{v.boothNumber}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                        <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', fontSize: '13px' }}>
                                            <div style={{ color: '#64748B', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>EPIC</div>
                                            <div style={{ color: '#0F172A', fontWeight: '600' }}>{v.epic || '---'}</div>
                                        </div>
                                        <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', fontSize: '13px' }}>
                                            <div style={{ color: '#64748B', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Mobile</div>
                                            <div style={{ color: '#0F172A', fontWeight: '600' }}>{v.mobile || '---'}</div>
                                        </div>
                                    </div>

                                    {v.notes && (
                                        <div style={{ background: '#FFFBEB', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', color: '#92400E', fontWeight: '500', display: 'flex', gap: '8px' }}>
                                            <MessageSquare size={16} style={{ flexShrink: 0 }} />
                                            {v.notes}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleAction(v.id, 'IN_LIST')}
                                            style={{ flex: 2, padding: '12px', background: '#0F172A', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            <Check size={18} />
                                            {lang === 'hi' ? 'कार्यवाही पूर्ण (Mark Resolved)' : 'Action Completed'}
                                        </button>
                                        <button
                                            style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div style={{ marginTop: '12px', fontSize: '11px', color: '#CBD5E1', textAlign: 'center' }}>
                                        Reported by: {v.updatedByName || 'Unknown'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
