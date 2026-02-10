'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Activity, Users, MapPin, ChevronRight, User } from 'lucide-react';
import { getAssemblies } from '@/app/actions/admin';

export default function CandidateSelector({ onSelect, lang }: { onSelect: (id: number) => void, lang: string }) {
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stateFilter, setStateFilter] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getAssemblies();
                if (Array.isArray(data)) {
                    setAssemblies(data);
                } else {
                    console.error("Invalid data format for assemblies", data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const allItems = assemblies.flatMap(asm => {
        const managers = (asm.users || []).filter((u: any) => u.role === 'CANDIDATE');

        if (managers.length === 0) {
            // Return a "Seat" item if no manager
            return [{
                type: 'seat',
                id: `seat-${asm.id}`,
                assemblyId: asm.id,
                name: asm.name,
                number: asm.number,
                state: asm.state,
                candidateName: 'खाली सीट',
                party: 'N/A',
                themeColor: asm.themeColor,
                voters: asm._count?.voters || 0,
                booths: asm._count?.booths || 0,
                image: null
            }];
        }

        return managers.map((m: any) => ({
            type: 'candidate',
            id: `cand-${m.id}`,
            assemblyId: asm.id,
            name: asm.name,
            number: asm.number,
            state: asm.state,
            candidateName: m.name,
            party: asm.party,
            themeColor: asm.themeColor,
            voters: asm._count?.voters || 0,
            booths: asm._count?.booths || 0,
            image: m.image || asm.candidateImageUrl
        }));
    });

    const filtered = allItems.filter(item => {
        const matchesSearch =
            (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.candidateName || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesState = !stateFilter || item.state === stateFilter;
        return matchesSearch && matchesState;
    });

    const states = Array.from(new Set(assemblies.map(a => a.state))).filter(Boolean);

    if (loading) {
        return (
            <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin" style={{ width: '32px', height: '32px', border: '4px solid #F1F5F9', borderTopColor: '#2563EB', borderRadius: '50%' }}></div>
            </div>
        );
    }

    // REPLACING STYLE JSX WITH INLINE STYLES FOR SAFETY
    const tileStyle = {
        background: 'white',
        borderRadius: '32px',
        padding: '24px',
        border: '1px solid #E2E8F0',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative' as const,
    };

    return (
        <div style={{ padding: '24px' }}>
            {/* Headers and Filters code omitted for brevity matching existing structure... */}
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '950', color: '#0F172A', marginBottom: '8px' }}>कैंडिडेट वार रूम चयन</h1>
                <p style={{ color: '#64748B', fontWeight: '700' }}>लाइव डेटा देखने के लिए विधानसभा या कैंडिडेट चुनें</p>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', maxWidth: '800px', margin: '0 auto 40px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={20} />
                    <input
                        type="text"
                        placeholder="कैंडिडेट या विधानसभा से खोजें..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '20px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '16px', fontWeight: '700' }}
                    />
                </div>
                <div style={{ position: 'relative' }}>
                    <Filter style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={20} />
                    <select
                        value={stateFilter}
                        onChange={(e) => setStateFilter(e.target.value)}
                        style={{ padding: '16px 24px 16px 48px', borderRadius: '20px', border: '1px solid #E2E8F0', outline: 'none', appearance: 'none', background: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}
                    >
                        <option value="">सभी राज्य</option>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {filtered.map(item => (
                    <div
                        key={item.id}
                        onClick={() => onSelect(item.assemblyId)}
                        className="candidate-tile"
                        style={{
                            ...tileStyle,
                            opacity: item.type === 'seat' ? 0.7 : 1
                        }}
                    >
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#F8FAFC', border: `2px solid ${item.themeColor || '#2563EB'}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.image ? (
                                    <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={32} color={item.themeColor || '#2563EB'} />
                                )}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: 0 }}>{item.candidateName}</h3>
                                <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '700', margin: '4px 0 0' }}>{item.party}</p>
                            </div>
                        </div>

                        <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>विधानसभा</div>
                                <div style={{ fontSize: '15px', fontWeight: '900', color: '#1E293B' }}>{item.number} - {item.name}</div>
                            </div>
                            <ChevronRight size={20} color="#CBD5E1" />
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                            <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '80px', background: '#ECFDF5', color: '#059669', fontWeight: '800' }}>
                                {item.voters.toLocaleString()} मतदाता
                            </span>
                            <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '80px', background: '#EFF6FF', color: '#2563EB', fontWeight: '800' }}>
                                {item.booths} बूथ
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <style jsx global>{`
                .candidate-tile:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    border-color: #3B82F6 !important;
                }
            `}</style>
        </div>
    );
}
