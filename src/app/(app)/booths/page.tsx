'use client';

import React, { useState, useEffect } from 'react';
import { getBooths } from '@/app/actions/booth';
import { LayoutGrid, List, MapPin, User, CheckCircle2, TrendingUp, Plus, Search, Filter, Users, Shield, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function BoothsPage() {
    const { data: session }: any = useSession();
    const [booths, setBooths] = useState<any[]>([]);
    const [filteredBooths, setFilteredBooths] = useState<any[]>([]);
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
        const data = await getBooths(assemblyId);
        setBooths(data);
        setFilteredBooths(data);
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
        setFormData({ number: '', name: '', area: '', inchargeName: '', inchargeMobile: '' });
        setShowAdd(true);
    };

    const handleEdit = (booth: any) => {
        setEditingBooth(booth);
        setFormData({
            number: booth.number.toString(),
            name: booth.name || '',
            area: booth.area || '',
            inchargeName: booth.inchargeName || '',
            inchargeMobile: booth.inchargeMobile || ''
        });
        setShowAdd(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            number: parseInt(formData.number),
            assemblyId
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
                        placeholder="बूथ नंबर या नाम से खोजें..."
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
                            <option value="All">कैंडिडेट स्थिति</option>
                            <option value="Assigned">कैंडिडेट नियुक्त</option>
                            <option value="Unassigned">बिना कैंडिडेट</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content View */}
            {view === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {filteredBooths.map((booth) => (
                        <div key={booth.id} className="card" style={{
                            padding: '24px',
                            background: 'white',
                            borderRadius: '24px',
                            borderTop: `8px solid ${getStatusColor(booth.status)}`,
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#1E293B' }}>बूथ नं. {booth.number}</div>
                                    <div style={{ fontSize: '14px', color: '#64748B', fontWeight: '600', marginTop: '4px' }}>{booth.name || 'बेनामी बूथ'}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '10px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        background: booth.isAssigned ? '#ECFDF5' : '#FEF2F2',
                                        color: booth.isAssigned ? '#10B981' : '#EF4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        {booth.isAssigned ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                        {booth.isAssigned ? 'नियुक्त' : 'असाइन करें'}
                                    </span>
                                    <button onClick={() => handleEdit(booth)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748B' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' }}>प्रमुख जाति</div>
                                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#334155' }}>{booth.dominantCaste}</div>
                                </div>
                                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' }}>कुल मतदाता</div>
                                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#334155' }}>{booth.totalVoters}</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
                                    <span style={{ color: '#64748B' }}>कवरेज (डेटा भरा हुआ)</span>
                                    <span style={{ color: '#1E293B' }}>{booth.coveragePercent}%</span>
                                </div>
                                <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${booth.coveragePercent}%`,
                                        height: '100%',
                                        background: booth.coveragePercent > 70 ? '#10B981' : booth.coveragePercent > 40 ? '#F59E0B' : '#EF4444'
                                    }}></div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                                <MapPin size={16} /> {booth.area || 'लोकेशन स्पष्ट नहीं'}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card" style={{ background: 'white', borderRadius: '24px', overflow: 'hidden' }}>
                    <div className="responsive-table-wrapper">
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                                    <th style={{ padding: '20px', fontSize: '13px', fontWeight: '800', color: '#64748B' }}>बूथ नं.</th>
                                    <th style={{ padding: '20px', fontSize: '13px', fontWeight: '800', color: '#64748B' }}>बूथ का नाम / क्षेत्र</th>
                                    <th style={{ padding: '20px', fontSize: '13px', fontWeight: '800', color: '#64748B' }}>स्थिति (Support)</th>
                                    <th style={{ padding: '20px', fontSize: '13px', fontWeight: '800', color: '#64748B' }}>प्रमुख जाति</th>
                                    <th style={{ padding: '20px', fontSize: '13px', fontWeight: '800', color: '#64748B' }}>मतदाता</th>
                                    <th style={{ padding: '20px', fontSize: '13px', fontWeight: '800', color: '#64748B' }}>कैंडिडेट</th>
                                    <th style={{ padding: '20px', fontSize: '13px', fontWeight: '800', color: '#64748B', textAlign: 'right' }}>एक्शन</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBooths.map((booth) => (
                                    <tr key={booth.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '20px', fontWeight: '900', fontSize: '16px', color: '#1E293B' }}>{booth.number}</td>
                                        <td style={{ padding: '20px' }}>
                                            <div style={{ fontWeight: '800', color: '#1E293B' }}>{booth.name || '-'}</div>
                                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{booth.area || '-'}</div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: '800',
                                                background: booth.status === 'Strong' ? '#D1FAE5' : booth.status === 'Medium' ? '#FEF3C7' : '#FEE2E2',
                                                color: booth.status === 'Strong' ? '#065F46' : booth.status === 'Medium' ? '#92400E' : '#B91C1C'
                                            }}>
                                                {booth.status === 'Strong' ? 'मजबूत' : booth.status === 'Medium' ? 'औसत' : 'कमजोर'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px', fontWeight: '700', color: '#475569' }}>{booth.dominantCaste}</td>
                                        <td style={{ padding: '20px', fontWeight: '700' }}>{booth.totalVoters}</td>
                                        <td style={{ padding: '20px' }}>
                                            {booth.isAssigned ? (
                                                <span style={{ color: '#10B981', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <CheckCircle2 size={16} /> नियुक्त
                                                </span>
                                            ) : (
                                                <span style={{ color: '#EF4444', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <AlertCircle size={16} /> पेंडिंग
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '20px', textAlign: 'right' }}>
                                            <button onClick={() => handleEdit(booth)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#64748B' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
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
                    <div className="card" style={{ background: 'white', width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1E293B', marginBottom: '32px' }}>{editingBooth ? 'बूथ विवरण सुधारें' : 'नया बूथ जोड़ें'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#475569', marginBottom: '10px' }}>बूथ नंबर (Poling Booth No.)</label>
                                <input required type="number" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })}
                                    style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '16px', fontSize: '15px' }} placeholder="जैसे: 145" />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#475569', marginBottom: '10px' }}>बूथ का नाम (Optional)</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '16px', fontSize: '15px' }} />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#475569', marginBottom: '10px' }}>लोकेशन / क्षेत्र</label>
                                <input type="text" value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })}
                                    style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '16px', fontSize: '15px' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#475569', marginBottom: '10px' }}>इंचार्ज नाम</label>
                                    <input type="text" value={formData.inchargeName} onChange={e => setFormData({ ...formData, inchargeName: e.target.value })}
                                        style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '16px', fontSize: '15px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#475569', marginBottom: '10px' }}>इंचार्ज मोबाइल</label>
                                    <input type="text" value={formData.inchargeMobile} onChange={e => setFormData({ ...formData, inchargeMobile: e.target.value })}
                                        style={{ width: '100%', padding: '14px', border: '1px solid #E2E8F0', borderRadius: '16px', fontSize: '15px' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '16px', border: 'none', borderRadius: '16px', background: '#F1F5F9', color: '#475569', fontWeight: '800', cursor: 'pointer' }}>कैंसिल</button>
                                <button type="submit" style={{ flex: 1, padding: '16px', border: 'none', borderRadius: '16px', background: 'var(--primary-bg)', color: 'white', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 6px rgba(30,58,138,0.2)' }}>{editingBooth ? 'अपडेट करें' : 'सेव करें'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
