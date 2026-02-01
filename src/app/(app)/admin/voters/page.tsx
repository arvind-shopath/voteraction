'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, MapPin, Phone, MessageSquare, Save, X, ChevronDown, ChevronUp, Edit2, User, Home, Eye } from 'lucide-react';
import { getVoters, getFilterOptions, updateVoterFeedback, getVoterWithFamily, updateVoter } from '@/app/actions/voters';
import { getAssemblies } from '@/app/actions/admin';

export default function AdminVotersPage() {
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [selectedAssembly, setSelectedAssembly] = useState<number | null>(null);

    const [voters, setVoters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFilterExpanded, setIsFilterExpanded] = useState(true);
    const [editingVoter, setEditingVoter] = useState<number | null>(null);
    const [viewVoter, setViewVoter] = useState<any | null>(null); // For Modal
    const [isLoadingFamily, setIsLoadingFamily] = useState(false);

    const [editData, setEditData] = useState({
        mobile: '',
        notes: '',
        supportStatus: '',
        name: '',
        relativeName: '',
        age: 0,
        gender: '',
        area: '',
        relationType: ''
    });

    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 25
    });

    const [options, setOptions] = useState<{ castes: string[], subCastes: any[], surnames: any[], villages: string[], booths: any[] }>({
        castes: [],
        subCastes: [],
        surnames: [],
        villages: [],
        booths: []
    });

    const [filters, setFilters] = useState({
        search: '',
        booth: 'सभी बूथ',
        status: 'समर्थन स्थिति',
        gender: 'सभी',
        village: '',
        caste: 'सभी जाति',
        subCaste: 'सभी उपजाति',
        surname: 'सभी उपनाम',
        familySize: 'सभी परिवार',
        ageFilter: 'सभी आयु',
        page: 1,
        pageSize: 25
    });

    useEffect(() => {
        getAssemblies().then(setAssemblies);
    }, []);

    const fetchOptions = async () => {
        const data = await getFilterOptions(selectedAssembly || undefined);
        setOptions(data);
    };

    const fetchVoters = async () => {
        if (!selectedAssembly) return;
        setLoading(true);
        try {
            const result = await getVoters({ ...filters, assemblyId: selectedAssembly });
            setVoters(result.voters);
            setPagination({
                totalCount: result.totalCount,
                totalPages: result.totalPages,
                currentPage: result.page,
                pageSize: filters.pageSize
            });
        } catch (error) {
            console.error('Failed to fetch voters:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedAssembly) {
            fetchOptions();
            fetchVoters();
        } else {
            setVoters([]);
        }
    }, [selectedAssembly, filters]);

    const handleFilterChange = (e: any) => {
        const { name, value } = e.target;
        if (name === 'caste') {
            setFilters(prev => ({ ...prev, caste: value, subCaste: 'सभी उपजाति', surname: 'सभी उपनाम', page: 1 }));
        } else if (name === 'subCaste') {
            setFilters(prev => ({ ...prev, subCaste: value, surname: 'सभी उपनाम', page: 1 }));
        } else {
            setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    const startEditing = (voter: any) => {
        setEditingVoter(voter.id);
        setEditData({
            mobile: voter.mobile || '',
            notes: voter.notes || '',
            supportStatus: voter.supportStatus || 'Neutral',
            name: voter.name || '',
            relativeName: voter.relativeName || '',
            age: voter.age || 0,
            gender: voter.gender || 'M',
            area: voter.village || '',
            relationType: voter.relationType || 'Father'
        });
    };

    const saveEdit = async () => {
        if (!editingVoter) return;
        try {
            await updateVoterFeedback(editingVoter, editData);
            setEditingVoter(null);
            fetchVoters();
        } catch (error) {
            alert('सेव करने में त्रुटि हुई');
        }
    };

    const openVoterModal = async (voter: any) => {
        setViewVoter({ ...voter, family: [] });
        setIsLoadingFamily(true);
        try {
            const fullData = await getVoterWithFamily(voter.id);
            if (fullData) {
                setViewVoter(fullData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingFamily(false);
        }
    };

    const handleFullUpdate = async (id: number, data: any) => {
        try {
            await updateVoter(id, data);
            alert('Details Updated Successfully');
            const fullData = await getVoterWithFamily(id);
            setViewVoter(fullData);
            fetchVoters();
        } catch (e) {
            alert('Failed to update');
        }
    };

    const filteredSubCastes = filters.caste === 'सभी जाति'
        ? options.subCastes.map(s => s.value)
        : options.subCastes.filter(s => s.parent === filters.caste).map(s => s.value);

    if (!selectedAssembly) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', background: '#F8FAFC', minHeight: '80vh' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px', color: '#1E293B' }}>Assembly Selection</h1>
                <div style={{ maxWidth: '400px', margin: '0 auto', background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <label style={{ display: 'block', textAlign: 'left', fontWeight: '700', marginBottom: '8px', color: '#475569' }}>Select Assembly to View Voters</label>
                    <select
                        onChange={(e) => setSelectedAssembly(parseInt(e.target.value))}
                        value={selectedAssembly || ''}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '16px' }}
                    >
                        <option value="">-- Select Assembly --</option>
                        {assemblies.map(a => (
                            <option key={a.id} value={a.id}>{a.number} - {a.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Admin: Voter Management</h1>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', alignItems: 'center' }}>
                        <MapPin size={16} />
                        <select
                            onChange={(e) => setSelectedAssembly(parseInt(e.target.value))}
                            value={selectedAssembly || ''}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '14px', background: '#F1F5F9' }}
                        >
                            {assemblies.map(a => (
                                <option key={a.id} value={a.id}>{a.number} - {a.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ padding: '8px 16px', background: 'white', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
                        Export Data
                    </button>
                    <button style={{ padding: '8px 16px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '700' }}>
                        + Add Voter
                    </button>
                </div>
            </div>

            {/* Same Filters as Voters Page */}
            <div className="card" style={{ background: 'white', padding: '24px', marginBottom: '24px', border: '1px solid #E5E7EB' }}>
                <h3
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    style={{ fontSize: '16px', fontWeight: '700', marginBottom: isFilterExpanded ? '20px' : '0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#111827', cursor: 'pointer' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={18} color="var(--primary-bg)" /> स्मार्ट फ़िल्टर और परिवार सर्च
                    </div>
                    {isFilterExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </h3>

                {isFilterExpanded && (
                    <div className="filter-content">
                        <div className="filter-grid-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#4B5563' }}>मुख्य जाति</label>
                                <select name="caste" value={filters.caste} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}>
                                    <option>सभी जाति</option>
                                    {options.castes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#4B5563' }}>उपजाति</label>
                                <select name="subCaste" value={filters.subCaste} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}>
                                    <option>सभी उपजाति</option>
                                    {filteredSubCastes.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#4B5563' }}>परिवार का साइज़</label>
                                <select name="familySize" value={filters.familySize} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}>
                                    <option>सभी परिवार</option>
                                    <option value="1-3">छोटे परिवार (1-3)</option>
                                    <option value="4-6">मध्यम परिवार (4-6)</option>
                                    <option value="7+">बड़े परिवार (7+)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#4B5563' }}>समर्थन स्थिति</label>
                                <select name="status" value={filters.status} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}>
                                    <option>सभी स्थिति</option>
                                    <optgroup label="समर्थन स्थिति">
                                        <option value="Support">पक्ष में (Favor)</option>
                                        <option value="Neutral">न्यूट्रल (Neutral)</option>
                                        <option value="Oppose">विपक्ष (Anti)</option>
                                    </optgroup>
                                    <optgroup label="मतदाता स्थिति">
                                        <option value="Active">सक्रिय (Active)</option>
                                        <option value="In-active">नॉन-एक्टिव (In-active)</option>
                                        <option value="Dead">मृत्यु (Dead)</option>
                                        <option value="Shifted">चला गया (Shifted)</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#4B5563' }}>बूथ नंबर (सर्च करें)</label>
                                <input
                                    list="booth-list"
                                    name="booth"
                                    value={filters.booth}
                                    onChange={handleFilterChange}
                                    placeholder="बूथ नंबर सर्च करें..."
                                    style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
                                />
                                <datalist id="booth-list">
                                    <option value="सभी बूथ" />
                                    {options.booths.map((b: any) => (
                                        <option key={b.number} value={`${b.number}`} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#4B5563' }}>आयु (Age)</label>
                                <select name="ageFilter" value={filters.ageFilter} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}>
                                    <option>सभी आयु</option>
                                    <option value="18-24">पहली बार (18-24)</option>
                                    <option value="24-45">युवा (24-45)</option>
                                    <option value="45-60">मध्यम (45-60)</option>
                                    <option value="60+">वरिष्ठ (60+)</option>
                                </select>
                            </div>
                        </div>

                        <div className="filter-actions-row" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: '1 1 200px' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                <input name="search" type="text" placeholder="नाम, EPIC, पिता का नाम या मोबाइल..." value={filters.search} onChange={handleFilterChange} style={{ width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #D1D5DB', borderRadius: '8px' }} />
                            </div>
                            <div style={{ flex: '1 1 120px' }}>
                                <select name="gender" value={filters.gender} onChange={handleFilterChange} style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }}>
                                    <option>सभी लिंग</option>
                                    <option value="M">पुरुष</option>
                                    <option value="F">महिला</option>
                                </select>
                            </div>
                            <div style={{ flex: '1 1 150px' }}>
                                <select name="village" value={filters.village} onChange={handleFilterChange} style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }}>
                                    <option value="">सभी गांव</option>
                                    {options.villages.map((village, idx) => (
                                        <option key={idx} value={village}>{village}</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={fetchVoters} style={{ padding: '12px 24px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                डेटा दिखाएँ
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', border: '1px solid #E5E7EB' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#64748B' }}>
                        Total <b>{pagination.totalCount}</b> voters (Page {pagination.currentPage}/{pagination.totalPages})
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                            name="pageSize"
                            value={filters.pageSize}
                            onChange={(e) => setFilters({ ...filters, pageSize: parseInt(e.target.value), page: 1 })}
                            style={{ padding: '6px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', background: 'white' }}
                        >
                            <option value={25}>25 Per Page</option>
                            <option value={50}>50 Per Page</option>
                            <option value={100}>100 Per Page</option>
                        </select>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            style={{ padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', background: 'white', cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            style={{ padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', background: 'white', cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer', fontSize: '13px' }}
                        >
                            Next
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '80px', textAlign: 'center' }}>
                        <div style={{ fontWeight: '700', color: 'var(--primary-bg)' }}>Loading Voter Data...</div>
                    </div>
                ) : (
                    <div className="responsive-table-wrapper">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', textAlign: 'left', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>Nama</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>Relative</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>Age</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>Gender</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>Booth</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>Village</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>EPIC</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>Mobile</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>Status</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {voters.map((voter) => (
                                    <tr key={voter.id} style={{ borderBottom: '1px solid #F1F5F9', fontSize: '14px', background: editingVoter === voter.id ? '#F0F9FF' : 'transparent', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '15px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => openVoterModal(voter)}>
                                                {voter.name}
                                            </div>
                                            {voter.houseNumber && (
                                                <div style={{ display: 'inline-block', fontSize: '10px', background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>
                                                    House: {voter.houseNumber} • Family: {voter.familySize || '1'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                                                {voter.relativeName || '---'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                                                ({voter.relationType})
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: '500' }}>{voter.age || '-'}</td>
                                        <td style={{ padding: '16px', fontWeight: '500' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                background: voter.gender === 'M' ? '#E0F2FE' : '#FCE7F3',
                                                color: voter.gender === 'M' ? '#0369A1' : '#BE185D',
                                                fontSize: '12px',
                                                fontWeight: '700'
                                            }}>
                                                {voter.gender === 'M' ? 'Male' : 'Female'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: '700', color: '#1E40AF' }}>{voter.boothNumber}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748B' }}>{voter.village || '---'}</div>
                                        </td>
                                        <td style={{ padding: '16px', fontVariantNumeric: 'tabular-nums', fontWeight: '700', color: '#1E40AF' }}>{voter.epic}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                                <Phone size={14} color={voter.mobile ? '#10B981' : '#CBD5E1'} />
                                                {voter.mobile || '---'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '11px',
                                                    fontWeight: '800',
                                                    background: voter.supportStatus === 'Support' || voter.supportStatus === 'Favor' ? '#D1FAE5' : voter.supportStatus === 'Neutral' ? '#FEF3C7' : '#FEE2E2',
                                                    color: voter.supportStatus === 'Support' || voter.supportStatus === 'Favor' ? '#065F46' : voter.supportStatus === 'Neutral' ? '#92400E' : '#991B1B'
                                                }}>
                                                    {voter.supportStatus || 'Neutral'}
                                                </span>
                                                {voter.status && voter.status !== 'Active' && (
                                                    <span style={{ fontSize: '10px', color: '#991B1B', fontWeight: 'bold' }}>({voter.status})</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <button onClick={() => openVoterModal(voter)} style={{ background: 'white', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'var(--primary-bg)' }}>
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Voter Details Modal */}
            {viewVoter && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', width: '90%', maxWidth: '800px', maxHeight: '90vh', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#EFF6FF', color: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {viewVoter.gender === 'M' ? 'M' : 'F'}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{viewVoter.name}</h2>
                                    <div style={{ fontSize: '12px', color: '#64748B' }}>EPIC: {viewVoter.epic}</div>
                                </div>
                            </div>
                            <button onClick={() => setViewVoter(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '8px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Edit2 size={16} /> Edit Details
                                    </h3>

                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        const data: any = {};
                                        formData.forEach((value, key) => data[key] = value);

                                        if (data.status !== 'Active' && (!data.notes || data.notes.trim().length < 5)) {
                                            alert('In-active/Dead/Shifted करने के लिए नोट लिखना अनिवार्य है (कम से कम 5 अक्षर)');
                                            return;
                                        }

                                        handleFullUpdate(viewVoter.id, data);
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px', display: 'block' }}>Name</label>
                                                <input name="name" defaultValue={viewVoter.name} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px', display: 'block' }}>Relative Name</label>
                                                <input name="relativeName" defaultValue={viewVoter.relativeName} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px', display: 'block' }}>Booth Number</label>
                                                <input name="boothNumber" type="number" defaultValue={viewVoter.boothNumber} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px', display: 'block' }}>Village / Area</label>
                                                <input name="village" defaultValue={viewVoter.village} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1' }} />
                                            </div>
                                            <div style={{ gridColumn: '1 / -1', background: '#FEF3C7', padding: '12px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#92400E', marginBottom: '4px', display: 'block' }}>Support Status</label>
                                                        <select name="supportStatus" defaultValue={viewVoter.supportStatus} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #F59E0B' }}>
                                                            <option value="Support">Support (पक्ष में)</option>
                                                            <option value="Neutral">Neutral (तटस्थ)</option>
                                                            <option value="Oppose">Oppose (विपक्ष)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#92400E', marginBottom: '4px', display: 'block' }}>Voter Status</label>
                                                        <select name="status" defaultValue={viewVoter.status || 'Active'} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #F59E0B' }}>
                                                            <option value="Active">Active (सक्रिय)</option>
                                                            <option value="In-active">In-active (नॉन-एक्टिव)</option>
                                                            <option value="Dead">Dead (मृत्यु)</option>
                                                            <option value="Shifted">Shifted (चला गया)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px', display: 'block' }}>Notes (Required for Deactivation)</label>
                                                <textarea name="notes" defaultValue={viewVoter.notes} rows={2} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px', display: 'block' }}>Age</label>
                                                <input name="age" type="number" defaultValue={viewVoter.age} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px', display: 'block' }}>Mobile</label>
                                                <input name="mobile" defaultValue={viewVoter.mobile} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1' }} />
                                            </div>
                                        </div>

                                        {viewVoter.updatedByName && (
                                            <div style={{ marginTop: '12px', fontSize: '11px', color: '#2563EB', fontWeight: '600', padding: '6px', background: '#EFF6FF', borderRadius: '4px' }}>
                                                Last updated by: {viewVoter.updatedByName} at {new Date(viewVoter.updatedAt).toLocaleString()}
                                            </div>
                                        )}

                                        <button type="submit" style={{ marginTop: '16px', background: '#2563EB', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', width: '100%', fontWeight: '600', cursor: 'pointer' }}>
                                            Update Details
                                        </button>
                                    </form>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Home size={16} /> Family Members ({viewVoter.family?.length || 1})
                                    </h3>
                                    {isLoadingFamily ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading Family Data...</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {viewVoter.family?.map((member: any) => (
                                                <div key={member.id} style={{
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: member.id === viewVoter.id ? '2px solid #2563EB' : '1px solid #E2E8F0',
                                                    background: member.id === viewVoter.id ? '#EFF6FF' : '#fff',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: '#1E293B' }}>{member.name}</div>
                                                        <div style={{ fontSize: '12px', color: '#64748B' }}>{member.relationType}: {member.relativeName} • Age: {member.age}</div>
                                                    </div>
                                                    {member.id !== viewVoter.id && (
                                                        <button onClick={() => setViewVoter(member)} style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer' }}>
                                                            <Eye size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
