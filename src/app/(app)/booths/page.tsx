'use client';

import React, { useState, useEffect } from 'react';
import { getBooths } from '@/app/actions/booth';
import { getWorkersInAssembly } from '@/app/actions/worker';
import { LayoutGrid, List, MapPin, User, CheckCircle2, TrendingUp, Plus, Search, Users, AlertCircle, Edit2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function BoothsPage() {
    const { data: session }: any = useSession();
    const [booths, setBooths] = useState<any[]>([]);
    const [filteredBooths, setFilteredBooths] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('grid');
    const [showAdd, setShowAdd] = useState(false);
    const [editingBooth, setEditingBooth] = useState<any>(null);

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'All',
        caste: 'All',
        assignment: 'All'
    });

    const [formData, setFormData] = useState({
        number: '',
        name: '',
        area: '',
        inchargeName: '',
        inchargeMobile: ''
    });

    const assemblyId = session?.user?.assemblyId || 1;

    useEffect(() => {
        if (session) fetchBooths();
    }, [session]);

    async function fetchBooths() {
        setLoading(true);
        const [bData, wData] = await Promise.all([
            getBooths(assemblyId),
            getWorkersInAssembly(assemblyId)
        ]);
        setBooths(bData);
        setFilteredBooths(bData);
        setWorkers(wData);
        setLoading(false);
    }

    useEffect(() => {
        applyFilters();
    }, [searchTerm, filters, booths]);

    const applyFilters = () => {
        let result = [...booths];

        if (searchTerm) {
            result = result.filter(b =>
                b.number.toString().includes(searchTerm) ||
                (b.name && b.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (b.displayLocation && b.displayLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (b.boothManagerName && b.boothManagerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (b.area && b.area.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (filters.status !== 'All') {
            result = result.filter(b => b.status === filters.status);
        }

        if (filters.caste !== 'All') {
            result = result.filter(b => b.dominantCaste === filters.caste);
        }

        if (filters.assignment !== 'All') {
            const isAssigned = filters.assignment === 'Assigned';
            result = result.filter(b => b.isAssigned === isAssigned);
        }

        setFilteredBooths(result);
    };

    const uniqueCastes = Array.from(new Set(booths.map(b => b.dominantCaste).filter(c => c && c !== 'Unknown')));

    const handleOpenAdd = () => {
        setEditingBooth(null);
        setSelectedWorkerId('');
        setFormData({ number: '', name: '', area: '', inchargeName: '', inchargeMobile: '' });
        setShowAdd(true);
    };

    const handleEdit = (booth: any) => {
        setEditingBooth(booth);
        const inchargeName = booth.boothManagerName || booth.inchargeName || (booth.workers?.find((w: any) => w.type === 'BOOTH_MANAGER')?.name) || '';
        const inchargeMobile = booth.boothManagerMobile || booth.inchargeMobile || (booth.workers?.find((w: any) => w.type === 'BOOTH_MANAGER')?.mobile) || '';
        
        const matchedWorker = workers.find((w: any) =>
            (w.boothId === booth.id && (w.type === 'BOOTH_MANAGER' || w.type === 'BOOTH')) ||
            (inchargeMobile && (w.mobile === inchargeMobile || w.user?.mobile === inchargeMobile)) ||
            (inchargeName && w.name === inchargeName)
        );

        setSelectedWorkerId(matchedWorker ? String(matchedWorker.id) : '');
        setFormData({
            number: booth.number.toString(),
            name: booth.name || booth.nameHi || booth.nameEn || '',
            area: booth.area || booth.villageNameHi || booth.localityMohallaHi || '',
            inchargeName: matchedWorker ? matchedWorker.name : inchargeName,
            inchargeMobile: matchedWorker ? (matchedWorker.mobile || matchedWorker.user?.mobile || inchargeMobile) : inchargeMobile
        });
        setShowAdd(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            number: parseInt(formData.number),
            assemblyId,
            workerId: selectedWorkerId ? parseInt(selectedWorkerId) : undefined
        };

        if (editingBooth) {
            const { updateBooth } = await import('@/app/actions/booth');
            await updateBooth(editingBooth.id, payload);
        } else {
            const { createBooth } = await import('@/app/actions/booth');
            await createBooth(payload);
        }

        setShowAdd(false);
        fetchBooths();
    };

    const getStatusColor = (status: string) => {
        if (status === 'Strong') return '#10B981';
        if (status === 'Medium') return '#F59E0B';
        return '#EF4444';
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '100px', fontWeight: '700' }}>बूथ डेटा लोड हो रहा है...</div>;
    }

    return (
        <div className="overflow-x-hidden" style={{ paddingBottom: '60px' }}>
            {/* Header */}
            <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '900' }}>बूथ प्रबंधन (Booth Management)</h1>
                    <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>कुल {booths.length} में से {filteredBooths.length} बूथ दिखाई दे रहे हैं</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }} className="mobile-full-width">
                    <button
                        className="mobile-full-width"
                        onClick={handleOpenAdd}
                        style={{ padding: '10px 20px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <Plus size={18} /> नया बूथ जोड़ें
                    </button>
                    <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }} className="mobile-full-width">
                        <button onClick={() => setView('grid')} style={{ flex: 1, padding: '8px 12px', background: view === 'grid' ? 'white' : 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: view === 'grid' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <LayoutGrid size={18} />
                        </button>
                        <button onClick={() => setView('list')} style={{ flex: 1, padding: '8px 12px', background: view === 'list' ? 'white' : 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: view === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="card" style={{ padding: '20px', borderRadius: '20px', background: 'white', marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                <div className="mobile-full-width" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                        type="text"
                        placeholder="बूथ नंबर, नाम, लोकेशन या मैनेजर से खोजें..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px 12px 12px 46px', borderRadius: '14px', border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }} className="mobile-full-width">
                    <div className="mobile-full-width" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '10px 16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <TrendingUp size={16} color="#64748B" />
                        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '13px', fontWeight: '700', outline: 'none' }}>
                            <option value="All">सभी स्थिति</option>
                            <option value="Strong">मजबूत (Favor)</option>
                            <option value="Medium">औसत (Neutral)</option>
                            <option value="Weak">कमजोर (Anti)</option>
                        </select>
                    </div>

                    <div className="mobile-full-width" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '10px 16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <Users size={16} color="#64748B" />
                        <select value={filters.caste} onChange={e => setFilters({ ...filters, caste: e.target.value })} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '13px', fontWeight: '700', outline: 'none' }}>
                            <option value="All">सभी जातियां</option>
                            {uniqueCastes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="mobile-full-width" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '10px 16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <User size={16} color="#64748B" />
                        <select value={filters.assignment} onChange={e => setFilters({ ...filters, assignment: e.target.value })} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '13px', fontWeight: '700', outline: 'none' }}>
                            <option value="All">बूथ मैनेजर स्थिति</option>
                            <option value="Assigned">बूथ मैनेजर नियुक्त</option>
                            <option value="Unassigned">बिना बूथ मैनेजर</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content View */}
            {view === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {filteredBooths.map((booth) => (
                        <div key={booth.id} className="card" style={{
                            padding: '24px',
                            background: 'white',
                            borderRadius: '24px',
                            borderTop: `8px solid ${getStatusColor(booth.status)}`,
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#1E293B' }}>बूथ नं. {booth.number}</div>
                                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', marginTop: '2px', lineHeight: '1.3' }}>
                                            {booth.name || booth.nameHi || 'बेनामी बूथ'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            background: booth.isAssigned ? '#ECFDF5' : '#FEF2F2',
                                            color: booth.isAssigned ? '#059669' : '#DC2626',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            {booth.isAssigned ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                            {booth.isAssigned ? 'नियुक्त' : 'असाइन करें'}
                                        </span>
                                        <button onClick={() => handleEdit(booth)} title="सुधारें" style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: '#475569' }}>
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Team Assignment Status (Booth Manager + Panna Pramukhs) */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                                    {/* Booth Manager Box */}
                                    <div style={{
                                        background: booth.isAssigned ? '#F0FDF4' : '#FEF2F2',
                                        border: `1px solid ${booth.isAssigned ? '#BBF7D0' : '#FECACA'}`,
                                        padding: '10px 12px',
                                        borderRadius: '14px'
                                    }}>
                                        <div style={{ fontSize: '10px', color: booth.isAssigned ? '#166534' : '#991B1B', fontWeight: '800', textTransform: 'uppercase' }}>
                                            👤 बूथ मैनेजर
                                        </div>
                                        {booth.isAssigned ? (
                                            <>
                                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#14532D', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {booth.boothManagerName}
                                                </div>
                                                {booth.boothManagerMobile && (
                                                    <div style={{ fontSize: '11px', color: '#15803D', fontWeight: '700', marginTop: '1px' }}>
                                                        📞 {booth.boothManagerMobile}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>
                                                ⚠️ नियुक्त नहीं है
                                            </div>
                                        )}
                                    </div>

                                    {/* Panna Pramukhs Box */}
                                    <div style={{
                                        background: '#F8FAFC',
                                        border: '1px solid #E2E8F0',
                                        padding: '10px 12px',
                                        borderRadius: '14px'
                                    }}>
                                        <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>
                                            📄 पन्ना प्रमुख
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: '900', color: booth.pannaCount > 0 ? '#4338CA' : '#64748B', marginTop: '2px' }}>
                                            {booth.pannaCount || 0} नियुक्त
                                        </div>
                                        <div style={{ fontSize: '10px', color: booth.pannaCount > 0 ? '#6366F1' : '#94A3B8', fontWeight: '700', marginTop: '1px' }}>
                                            {booth.pannaCount > 0 ? 'सक्रिय पन्ना टीम' : 'कोई पन्ना प्रमुख नहीं'}
                                        </div>
                                    </div>
                                </div>

                                {/* Demographics (Caste & Total Voters) */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                                    <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' }}>प्रमुख जाति</div>
                                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>{booth.dominantCaste || '-'}</div>
                                    </div>
                                    <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' }}>कुल मतदाता</div>
                                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>{booth.totalVoters.toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Jan-Sampark Progress */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                                        <span style={{ color: '#64748B' }}>जनसंपर्क प्रगति ({booth.contactedCount || 0} संपर्कित)</span>
                                        <span style={{ color: '#1E293B', fontWeight: '800' }}>{booth.janSamparkPercent}%</span>
                                    </div>
                                    <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min(100, booth.janSamparkPercent || 0)}%`,
                                            height: '100%',
                                            background: booth.janSamparkPercent > 50 ? '#10B981' : booth.janSamparkPercent > 20 ? '#F59E0B' : '#0D9488'
                                        }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Location Footer */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B', fontWeight: '700', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                                <MapPin size={15} color="#0D9488" style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {booth.displayLocation || booth.area || booth.name || 'लोकेशन उपलब्ध नहीं'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card" style={{ background: 'white', borderRadius: '24px', overflow: 'hidden' }}>
                    <div className="responsive-table-wrapper">
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                                    <th style={{ padding: '16px', fontSize: '13px', fontWeight: '800', color: '#64748B' }}>बूथ नं.</th>
                                    <th style={{ padding: '16px', fontSize: '13px', fontWeight: '800', color: '#64748B' }}>बूथ का नाम / लोकेशन</th>
                                    <th style={{ padding: '16px', fontSize: '13px', fontWeight: '800', color: '#64748B' }}>बूथ मैनेजर</th>
                                    <th style={{ padding: '16px', fontSize: '13px', fontWeight: '800', color: '#64748B' }}>पन्ना प्रमुख</th>
                                    <th style={{ padding: '16px', fontSize: '13px', fontWeight: '800', color: '#64748B' }}>प्रमुख जाति</th>
                                    <th style={{ padding: '16px', fontSize: '13px', fontWeight: '800', color: '#64748B' }}>मतदाता</th>
                                    <th style={{ padding: '16px', fontSize: '13px', fontWeight: '800', color: '#64748B' }}>जनसंपर्क</th>
                                    <th style={{ padding: '16px', fontSize: '13px', fontWeight: '800', color: '#64748B', textAlign: 'right' }}>एक्शन</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBooths.map((booth) => (
                                    <tr key={booth.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '16px', fontWeight: '900', fontSize: '16px', color: '#1E293B' }}>{booth.number}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: '800', color: '#1E293B' }}>{booth.name || booth.nameHi || '-'}</div>
                                            <div style={{ fontSize: '12px', color: '#64748B' }}>{booth.displayLocation || booth.area || '-'}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {booth.isAssigned ? (
                                                <div>
                                                    <span style={{ color: '#059669', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <CheckCircle2 size={14} /> {booth.boothManagerName}
                                                    </span>
                                                    {booth.boothManagerMobile && <div style={{ fontSize: '11px', color: '#64748B' }}>📞 {booth.boothManagerMobile}</div>}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#DC2626', fontWeight: '800', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <AlertCircle size={14} /> नियुक्त नहीं
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: '800', color: booth.pannaCount > 0 ? '#4338CA' : '#94A3B8' }}>
                                            {booth.pannaCount || 0} प्रमुख
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: '700', color: '#475569' }}>{booth.dominantCaste}</td>
                                        <td style={{ padding: '16px', fontWeight: '800' }}>{booth.totalVoters.toLocaleString()}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: '800', fontSize: '13px', color: '#0D9488' }}>{booth.janSamparkPercent}%</div>
                                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{booth.contactedCount || 0} संपर्कित</div>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button onClick={() => handleEdit(booth)} title="सुधारें" style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#64748B' }}>
                                                <Edit2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {filteredBooths.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '100px', background: 'white', borderRadius: '32px', border: '2px dashed #E2E8F0' }}>
                    <AlertCircle size={64} color="#94A3B8" style={{ marginBottom: '24px' }} />
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>कोई बूथ नहीं मिला</h2>
                    <p style={{ color: '#64748B', marginTop: '8px' }}>कृपया सर्च कीवर्ड या फिल्टर बदलें।</p>
                </div>
            )}

            {/* Modal */}
            {showAdd && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
                    <div className="card" style={{ background: 'white', width: '100%', maxWidth: '520px', padding: '36px', borderRadius: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#1E293B', marginBottom: '24px' }}>
                            {editingBooth ? `बूथ #${editingBooth.number} विवरण सुधारें` : 'नया बूथ जोड़ें'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>बूथ नंबर (Polling Booth No.) <span style={{ color: '#DC2626' }}>*</span></label>
                                <input required type="number" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })}
                                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #CBD5E1', borderRadius: '14px', fontSize: '14px' }} placeholder="जैसे: 1" />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>बूथ का नाम (Optional)</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #CBD5E1', borderRadius: '14px', fontSize: '14px' }} placeholder="प्राथमिक विद्यालय..." />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>लोकेशन / क्षेत्र</label>
                                <input type="text" value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })}
                                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #CBD5E1', borderRadius: '14px', fontSize: '14px' }} placeholder="ग्राम / मोहल्ला..." />
                            </div>

                            {/* Incharge selection from Workers */}
                            <div style={{ marginBottom: '16px', background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1E293B', marginBottom: '6px' }}>
                                    बूथ मैनेजर चुनें (कार्यकर्ता सूची से)
                                </label>
                                <select
                                    value={selectedWorkerId}
                                    onChange={(e) => {
                                        const wid = e.target.value;
                                        setSelectedWorkerId(wid);
                                        if (wid) {
                                            const found = workers.find((w: any) => String(w.id) === wid);
                                            if (found) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    inchargeName: found.name,
                                                    inchargeMobile: found.mobile || found.user?.mobile || ''
                                                }));
                                            }
                                        } else {
                                            setFormData(prev => ({
                                                ...prev,
                                                inchargeName: '',
                                                inchargeMobile: ''
                                            }));
                                        }
                                    }}
                                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #CBD5E1', borderRadius: '12px', fontSize: '14px', background: 'white', fontWeight: '600' }}
                                >
                                    <option value="">-- कार्यकर्ता चुनें (या नीचे सीधा लिखें) --</option>
                                    {workers.map((w: any) => {
                                        const mob = w.mobile || w.user?.mobile;
                                        const roleLabel = w.type === 'BOOTH_MANAGER' || w.type === 'BOOTH' ? 'बूथ मैनेजर' : w.type === 'PANNA_PRAMUKH' || w.type === 'PANNA' ? 'पन्ना प्रमुख' : 'कार्यकर्ता';
                                        return (
                                            <option key={w.id} value={String(w.id)}>
                                                {w.name} ({roleLabel}){mob ? ` - ${mob}` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>इंचार्ज नाम</label>
                                    <input type="text" value={formData.inchargeName} onChange={e => setFormData({ ...formData, inchargeName: e.target.value })}
                                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #CBD5E1', borderRadius: '12px', fontSize: '14px' }} placeholder="इंचार्ज का नाम" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>इंचार्ज मोबाइल</label>
                                    <input type="text" value={formData.inchargeMobile} onChange={e => setFormData({ ...formData, inchargeMobile: e.target.value })}
                                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #CBD5E1', borderRadius: '12px', fontSize: '14px' }} placeholder="मोबाइल नंबर" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '14px' }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '14px', border: '1px solid #CBD5E1', borderRadius: '14px', background: '#F8FAFC', color: '#475569', fontWeight: '800', cursor: 'pointer' }}>कैंसिल</button>
                                <button type="submit" style={{ flex: 1, padding: '14px', border: 'none', borderRadius: '14px', background: 'var(--primary-bg)', color: 'white', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 10px rgba(13, 148, 136, 0.3)' }}>{editingBooth ? 'अपडेट करें' : 'सेव करें'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
