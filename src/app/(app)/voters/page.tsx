/* 🔒 LOCKED BY USER */
'use client';

import React, { useState, useEffect } from 'react';
import { useView } from '@/context/ViewContext';
import { getVoters, getFilterOptions, updateVoterFeedback, getVoterWithFamily, updateVoter, createVoter, deleteVoter, exportVotersToCSV, searchVotersForFamily, moveVoterToFamily } from '@/app/actions/voters';
import { Search, Filter, Users, MapPin, Phone, MessageSquare, Save, X, ChevronDown, ChevronUp, Edit2, User, Home, Eye, UserPlus, Trash, UserMinus, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function VotersPage() {
    const { data: session }: any = useSession();
    const [voters, setVoters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [editingVoter, setEditingVoter] = useState<number | null>(null);
    const [viewVoter, setViewVoter] = useState<any | null>(null); // For Modal
    const [isLoadingFamily, setIsLoadingFamily] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [editData, setEditData] = useState({
        mobile: '',
        notes: '',
        supportStatus: '',
        name: '',
        relativeName: '',
        age: 0,
        gender: '',
        area: '',
        houseNumber: '', // Added
        village: '', // Added
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

    const searchParams = useSearchParams();
    const isMyPannaDefault = searchParams?.get('filter') === 'my-panna';

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
        pannaOnly: isMyPannaDefault,
        assemblyId: undefined as number | undefined,
        page: 1,
        pageSize: 25
    });

    const [boothManagerBooth, setBoothManagerBooth] = useState<number | null>(null);

    const { effectiveRole, effectiveWorkerType } = useView();
    const isBoothManager = effectiveRole === 'WORKER' && effectiveWorkerType === 'BOOTH_MANAGER';
    const isPannaPramukh = effectiveRole === 'WORKER' && effectiveWorkerType === 'PANNA_PRAMUKH';

    const fetchOptions = async () => {
        const data = await getFilterOptions();
        setOptions(data);
    };

    const fetchVoters = async () => {
        setLoading(true);
        try {
            const result = await getVoters(filters);
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
        fetchOptions();
        if (isBoothManager || isPannaPramukh) {
            import('@/app/actions/dashboard').then(m => m.getBoothDashboardStats((session?.user as any).id)).then(res => {
                if (res?.booth?.number) {
                    setBoothManagerBooth(res.booth.number);
                    setFilters(prev => ({ ...prev, booth: res.booth.number.toString() }));
                }
            });
        }
    }, [isBoothManager, isPannaPramukh]);

    useEffect(() => {
        fetchVoters();
    }, [filters]);

    // Update pannaOnly filter if URL changes (for sidebar links)
    useEffect(() => {
        const pannaParam = searchParams?.get('filter') === 'my-panna';
        if (pannaParam !== filters.pannaOnly) {
            setFilters(prev => ({ ...prev, pannaOnly: pannaParam, page: 1 }));
        }
    }, [searchParams]);

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
            houseNumber: voter.houseNumber || '',
            village: voter.village || '',
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
        setSearchQuery('');
        setSearchResults([]);
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
            alert('विवरण सफलतापूर्वक अपडेट किया गया');
            // Refresh modal data
            const fullData = await getVoterWithFamily(id);
            setViewVoter(fullData);
            fetchVoters(); // Refresh background list
        } catch (e) {
            alert('अपडेट करने में विफल');
        }
    };

    const handleExport = async () => {
        try {
            const csv = await exportVotersToCSV(filters);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `voter_data_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            alert('Export failed');
        }
    };

    const handleFamilyRemove = async (member: any) => {
        const choice = confirm(`क्या आप ${member.name} को इस परिवार से अलग (Detach) करना चाहते हैं?\nOK - अलग करें (Detach)\nCancel - कुछ न करें`);
        if (!choice) return;

        try {
            // Set houseNumber to empty/new to detach
            await moveVoterToFamily(member.id, "N/A", member.village, member.area);
            alert('सदस्य परिवार से अलग कर दिया गया');
            const fullData = await getVoterWithFamily(viewVoter.id);
            setViewVoter(fullData);
        } catch (e) {
            alert('Action failed');
        }
    };

    const handleSearchVoters = async (val: string) => {
        setSearchQuery(val);
        if (val.length < 3) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await searchVotersForFamily(val, viewVoter.assemblyId);
            setSearchResults(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    const handleMoveToCurrentFamily = async (voterId: number) => {
        if (!viewVoter) return;
        try {
            await moveVoterToFamily(voterId, viewVoter.houseNumber, viewVoter.village, viewVoter.area);
            alert('मतदाता परिवार में जोड़ दिया गया');
            setSearchQuery('');
            setSearchResults([]);
            const fullData = await getVoterWithFamily(viewVoter.id);
            setViewVoter(fullData);
        } catch (e) {
            alert('Failed to move');
        }
    };

    const handleDeleteVoter = async (id: number) => {
        if (confirm('क्या आप इस मतदाता को हटाना चाहते हैं? यह प्रक्रिया वापस नहीं ली जा सकती।')) {
            try {
                await deleteVoter(id);
                alert('मतदाता हटा दिया गया');
                setViewVoter(null);
                fetchVoters();
            } catch (e) {
                alert('हटाने में विफल');
            }
        }
    };

    const handleAddFamilyMember = async () => {
        if (!viewVoter) return;
        const name = prompt('नए सदस्य का नाम दर्ज करें:');
        if (!name) return;

        try {
            await createVoter({
                name,
                houseNumber: viewVoter.houseNumber,
                village: viewVoter.village,
                area: viewVoter.area,
                boothNumber: viewVoter.boothNumber,
                relationType: 'Other',
                relativeName: viewVoter.relativeName // Optional hint
            });
            alert('सदस्य जोड़ा गया');
            // Refresh family
            const fullData = await getVoterWithFamily(viewVoter.id);
            setViewVoter(fullData);
        } catch (e) {
            alert('जोड़ने में विफल');
        }
    };

    const filteredSubCastes = filters.caste === 'सभी जाति'
        ? options.subCastes.map(s => s.value)
        : options.subCastes.filter(s => s.parent === filters.caste).map(s => s.value);

    const isFieldWorker = effectiveRole === 'WORKER' && effectiveWorkerType === 'FIELD';
    const isGroundWorker = ['WORKER', 'BOOTH_MANAGER', 'PANNA_PRAMUKH', 'FIELD'].includes(effectiveRole || '');

    return (
        <div className="overflow-x-hidden" style={{ paddingBottom: '40px' }}>
            <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800' }}>
                        {isPannaPramukh ? (filters.pannaOnly ? 'आपका पन्ना (Assigned Voters)' : 'मेरे बूथ के मतदाता') : isFieldWorker ? 'पूरी विधानसभा की मतदाता सूची' : isGroundWorker ? 'बूथ की मतदाता सूची' : 'मतदाता सूची और परिवार प्रबंधन'}
                    </h1>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <MapPin size={16} /> विधानसभा: 148 - लहरपुर
                        {(isBoothManager || isPannaPramukh) && boothManagerBooth && (
                            <span style={{ marginLeft: '12px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                                BOOTH NO: {boothManagerBooth}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mobile-full-width" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {isPannaPramukh && (
                        <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '10px', height: 'fit-content' }}>
                            <button
                                onClick={() => setFilters({ ...filters, pannaOnly: false })}
                                style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: !filters.pannaOnly ? 'white' : 'transparent', fontWeight: '700', fontSize: '12px', cursor: 'pointer', boxShadow: !filters.pannaOnly ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
                                पूरा बूथ
                            </button>
                            <button
                                onClick={() => setFilters({ ...filters, pannaOnly: true })}
                                style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: filters.pannaOnly ? 'white' : 'transparent', fontWeight: '700', fontSize: '12px', cursor: 'pointer', boxShadow: filters.pannaOnly ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
                                आपका पन्ना
                            </button>
                        </div>
                    )}
                    <button className="mobile-full-width" onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                        डाटा एक्सपोर्ट (Excel)
                    </button>
                    <button className="mobile-full-width" onClick={() => setViewVoter({ id: 0, name: '', epic: '', assemblyId: filters.assemblyId || 0, family: [] })} style={{ padding: '8px 16px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                        + नया मतदाता
                    </button>
                </div>
            </div>

            {/* Hierarchical Filters */}
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
                        {/* Responsive Grid for Filters */}
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
                            {!isBoothManager && !isPannaPramukh && (
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#4B5563' }}>बूथ नंबर (सर्च करें)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            list="booth-list"
                                            name="booth"
                                            value={filters.booth}
                                            onChange={handleFilterChange}
                                            placeholder="बूथ नंबर सर्च करें..."
                                            style={{ width: '100%', padding: '10px 30px 10px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}
                                        />
                                        <ChevronDown size={20} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
                                        <datalist id="booth-list">
                                            <option value="सभी बूथ" />
                                            {options.booths.map((b: any) => (
                                                <option key={b.number} value={`${b.number}`} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                            )}
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

                        {/* Bottom Row Filters - Stack on Mobile */}
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
                                    <option value="O">अन्य</option>
                                </select>
                            </div>
                            <div style={{ flex: '1 1 120px', position: 'relative' }}>
                                <select name="village" value={filters.village} onChange={handleFilterChange} style={{ width: '100%', padding: '12px 30px 12px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', appearance: 'none', background: 'white' }}>
                                    <option value="">सभी गांव</option>
                                    {options.villages.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                                <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
                            </div>
                            <div className="mobile-full-width" style={{ flex: '0 0 auto' }}>
                                <button className="mobile-full-width" onClick={fetchVoters} style={{ padding: '12px 24px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                                    डेटा दिखाएँ
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', border: '1px solid #E5E7EB' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#64748B' }}>
                        कुल <b>{pagination.totalCount}</b> मतदाता (Page {pagination.currentPage}/{pagination.totalPages})
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
                            <span className="hidden-mobile">पिछला</span><span className="visible-mobile">&lt;</span>
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            style={{ padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', background: 'white', cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer', fontSize: '13px' }}
                        >
                            <span className="hidden-mobile">अगला</span><span className="visible-mobile">&gt;</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '80px', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                        <div style={{ fontWeight: '700', color: 'var(--primary-bg)' }}>डेटा लोड हो रहा है...</div>
                    </div>
                ) : (
                    <div className="responsive-table-wrapper">
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', textAlign: 'left', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>मतदाता</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>पिता/पति का नाम</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>आयु</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>लिंग</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>बूथ नं.</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>गांव</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>EPIC नंबर</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>मोबाइल</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>जाति/उपनाम</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>फीडबैक / स्थिति</th>
                                    <th style={{ padding: '16px', fontWeight: '800' }}>एक्शन</th>
                                </tr>
                            </thead>
                            <tbody>
                                {voters.map((voter) => (
                                    <tr key={voter.id} style={{ borderBottom: '1px solid #F1F5F9', fontSize: '14px', background: editingVoter === voter.id ? '#F0F9FF' : 'transparent', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px' }}>
                                            {editingVoter === voter.id ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <input
                                                        type="text"
                                                        value={editData.name}
                                                        onChange={e => setEditData({ ...editData, name: e.target.value })}
                                                        style={{ fontWeight: '700', padding: '6px', border: '1px solid var(--primary-bg)', borderRadius: '4px', width: '100%' }}
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '15px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => openVoterModal(voter)}>
                                                        {voter.name}
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                                        {voter.houseNumber && (
                                                            <div style={{ display: 'inline-block', fontSize: '10px', background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                                                                मकान नं: {voter.houseNumber} • परिवार: {voter.familySize || '1'}
                                                            </div>
                                                        )}
                                                        {voter.area && (
                                                            <div style={{ display: 'inline-block', fontSize: '10px', background: '#FFF7ED', color: '#9A3412', padding: '2px 6px', borderRadius: '4px' }}>
                                                                {voter.area}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {editingVoter === voter.id ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <input
                                                        type="text"
                                                        value={editData.relativeName}
                                                        onChange={e => setEditData({ ...editData, relativeName: e.target.value })}
                                                        style={{ padding: '6px', border: '1px solid var(--primary-bg)', borderRadius: '4px', width: '100%', fontSize: '12px' }}
                                                    />
                                                    <select
                                                        value={editData.relationType}
                                                        onChange={e => setEditData({ ...editData, relationType: e.target.value })}
                                                        style={{ fontSize: '11px', padding: '2px' }}
                                                    >
                                                        <option value="Father">पिता</option>
                                                        <option value="Husband">पति</option>
                                                        <option value="Mother">माता</option>
                                                    </select>
                                                </div>
                                            ) : (
                                                <>
                                                    <div style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                                                        {voter.relativeName || '---'}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                                                        ({voter.relationType === 'Father' ? 'पिता' : voter.relationType === 'Husband' ? 'पति' : voter.relationType === 'Mother' ? 'माता' : 'अभिभावक'})
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: '500' }}>
                                            {editingVoter === voter.id ? (
                                                <input
                                                    type="number"
                                                    value={editData.age}
                                                    onChange={e => setEditData({ ...editData, age: parseInt(e.target.value) || 0 })}
                                                    style={{ width: '50px', padding: '6px', border: '1px solid var(--primary-bg)', borderRadius: '4px' }}
                                                />
                                            ) : (
                                                voter.age || '-'
                                            )}
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: '500' }}>
                                            {editingVoter === voter.id ? (
                                                <select
                                                    value={editData.gender}
                                                    onChange={e => setEditData({ ...editData, gender: e.target.value })}
                                                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--primary-bg)' }}
                                                >
                                                    <option value="M">M</option>
                                                    <option value="F">F</option>
                                                    <option value="O">O</option>
                                                </select>
                                            ) : (
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    background: voter.gender === 'M' ? '#E0F2FE' : '#FCE7F3',
                                                    color: voter.gender === 'M' ? '#0369A1' : '#BE185D',
                                                    fontSize: '12px',
                                                    fontWeight: '700'
                                                }}>
                                                    {voter.gender === 'M' ? 'पुरुष' : voter.gender === 'F' ? 'महिला' : 'अन्य'}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: '700', color: '#1E40AF' }}>
                                                Booth {voter.boothNumber}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {editingVoter === voter.id ? (
                                                <input
                                                    type="text"
                                                    value={editData.area}
                                                    onChange={e => setEditData({ ...editData, area: e.target.value })}
                                                    style={{ padding: '6px', width: '100%', border: '1px solid var(--primary-bg)', borderRadius: '4px' }}
                                                />
                                            ) : (
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748B' }}>
                                                    {voter.village || '---'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px', fontVariantNumeric: 'tabular-nums', fontWeight: '700', color: '#1E40AF' }}>{voter.epic}</td>
                                        <td style={{ padding: '16px' }}>
                                            {editingVoter === voter.id ? (
                                                <input
                                                    type="text"
                                                    value={editData.mobile}
                                                    onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                                                    style={{ width: '100px', padding: '8px', border: '1px solid var(--primary-bg)', borderRadius: '6px' }}
                                                    placeholder="मोबाइल"
                                                />
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                                    <Phone size={14} color={voter.mobile ? '#10B981' : '#CBD5E1'} />
                                                    {voter.mobile || '---'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '11px', background: '#EFF6FF', color: '#1E40AF', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', width: 'fit-content' }}>{voter.caste}</span>
                                                <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: '600', width: 'fit-content' }}>{voter.surname || '---'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {editingVoter === voter.id ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <input
                                                        type="text"
                                                        value={editData.notes}
                                                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                                        style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-bg)', borderRadius: '6px' }}
                                                        placeholder="कार्यकर्ता रिमार्क..."
                                                    />
                                                    <select
                                                        value={editData.supportStatus}
                                                        onChange={(e) => setEditData({ ...editData, supportStatus: e.target.value })}
                                                        style={{
                                                            padding: '10px',
                                                            borderRadius: '8px',
                                                            fontSize: '13px',
                                                            width: '100%',
                                                            fontWeight: '700',
                                                            border: '1px solid #E2E8F0',
                                                            background: editData.supportStatus === 'Support' ? '#DCFCE7' : editData.supportStatus === 'Oppose' ? '#FEE2E2' : '#FEF3C7',
                                                            color: editData.supportStatus === 'Support' ? '#166534' : editData.supportStatus === 'Oppose' ? '#991B1B' : '#92400E'
                                                        }}
                                                    >
                                                        <option value="Support" style={{ background: 'white', color: '#166534' }}>सकारात्मक (Support)</option>
                                                        <option value="Neutral" style={{ background: 'white', color: '#92400E' }}>सामान्य (Neutral)</option>
                                                        <option value="Oppose" style={{ background: 'white', color: '#991B1B' }}>नकारात्मक (Oppose)</option>
                                                    </select>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', lineHeight: '1.4' }}>{voter.notes || '---'}</div>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        fontSize: '11px',
                                                        fontWeight: '900',
                                                        background: voter.supportStatus === 'Support' ? '#DCFCE7' : voter.supportStatus === 'Neutral' ? '#FEF3C7' : '#FEE2E2',
                                                        color: voter.supportStatus === 'Support' ? '#166534' : voter.supportStatus === 'Neutral' ? '#92400E' : '#991B1B',
                                                        border: `1px solid ${voter.supportStatus === 'Support' ? '#BBF7D0' : voter.supportStatus === 'Neutral' ? '#FDE68A' : '#FECACA'}`
                                                    }}>
                                                        {voter.supportStatus === 'Support' ? 'सकारात्मक' : voter.supportStatus === 'Neutral' ? 'सामान्य' : 'नकारात्मक'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {editingVoter === voter.id ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={saveEdit} style={{ background: '#10B981', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                        <Save size={18} />
                                                    </button>
                                                    <button onClick={() => setEditingVoter(null)} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startEditing(voter)} style={{ background: 'white', border: '1px solid #E2E8F0', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: 'var(--primary-bg)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <MessageSquare size={16} /> अपडेट
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ padding: '16px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                    <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '600' }}
                    >
                        पिछला
                    </button>

                    <div style={{ display: 'flex', gap: '4px' }}>
                        {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                            let pageNum = pagination.currentPage;
                            if (pagination.currentPage > 3) pageNum = pagination.currentPage - 2 + i;
                            else pageNum = i + 1;

                            if (pageNum > pagination.totalPages) return null;

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    style={{
                                        padding: '8px 14px',
                                        border: '1px solid',
                                        borderColor: pagination.currentPage === pageNum ? 'var(--primary-bg)' : '#E2E8F0',
                                        borderRadius: '8px',
                                        background: pagination.currentPage === pageNum ? 'var(--primary-bg)' : 'white',
                                        color: pagination.currentPage === pageNum ? 'white' : 'inherit',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        {pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2 && (
                            <span style={{ padding: '8px' }}>...</span>
                        )}
                    </div>

                    <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer', fontWeight: '600' }}
                    >
                        अगला
                    </button>
                </div>

                {!loading && voters.length === 0 && (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#64748B' }}>कोई परिणाम नहीं मिला।</div>
                        <p style={{ color: '#94A3B8' }}>फ़िल्टर बदलकर दोबारा प्रयास करें।</p>
                    </div>
                )}
            </div>

            {viewVoter && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', width: '90%', maxWidth: '800px', maxHeight: '90vh', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                        {/* Header */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#EFF6FF', color: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {viewVoter.gender === 'M' ? 'पु' : 'म'}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#1E293B' }}>{viewVoter.name}</h2>
                                    <div style={{ fontSize: '12px', color: '#64748B' }}>EPIC: {viewVoter.epic}</div>
                                </div>
                            </div>
                            <button onClick={() => setViewVoter(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #E2E8F0' }}>
                                <div style={{ padding: '8px 16px', borderBottom: '2px solid #2563EB', color: '#2563EB', fontWeight: '600', cursor: 'pointer' }}>विवरण (Details)</div>
                                <div style={{ padding: '8px 16px', color: '#64748B', fontWeight: '500', cursor: 'pointer' }}>परिवार और संबंधित (Family)</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                                {/* Edit Form */}
                                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '8px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Edit2 size={16} /> Edit Details
                                    </h3>

                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        const data: any = {};
                                        formData.forEach((value, key) => data[key] = value);

                                        // Mandatory notes check for deactivation
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
                                                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#92400E', marginBottom: '4px', display: 'block' }}>समर्थन स्थिति (Support Status)</label>
                                                        <select name="supportStatus" defaultValue={viewVoter.supportStatus} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #F59E0B' }}>
                                                            <option value="Support">Support (पक्ष में)</option>
                                                            <option value="Neutral">Neutral (तटस्थ)</option>
                                                            <option value="Oppose">Oppose (विपक्ष)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#92400E', marginBottom: '4px', display: 'block' }}>मतदाता स्थिति (Voter Status)</label>
                                                        <select name="status" defaultValue={viewVoter.status || 'Active'} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #F59E0B' }}>
                                                            <option value="Active">Active (सक्रिय)</option>
                                                            <option value="In-active">In-active (नॉन-एक्टिव)</option>
                                                            <option value="Dead">Dead (मृत्यु)</option>
                                                            <option value="Shifted">Shifted (चला गया है)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px', display: 'block' }}>Notes (Required for Deactivation)</label>
                                                <textarea name="notes" defaultValue={viewVoter.notes} rows={3} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1' }} placeholder="लिखें क्यों नॉन एक्टिव किया गया..." />
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

                                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                            <button type="submit" style={{ flex: 2, background: '#2563EB', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                                                विवरण अपडेट करें (Update)
                                            </button>
                                            <button type="button" onClick={() => handleDeleteVoter(viewVoter.id)} style={{ flex: 1, background: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '6px', border: '1px solid #FECACA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <Trash size={16} /> हटाएँ
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Family Tree */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Home size={16} /> Family Members ({viewVoter.family?.length || 1})
                                        </h3>
                                        <button onClick={handleAddFamilyMember} style={{ padding: '6px 12px', background: '#ECFDF5', border: '1px solid #10B981', color: '#059669', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <UserPlus size={14} /> नया सदस्य जोड़ें
                                        </button>
                                    </div>

                                    {isLoadingFamily ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading Family Data...</div>
                                    ) : (
                                        <>
                                            <div style={{ marginBottom: '20px', background: '#F0F9FF', padding: '16px', borderRadius: '12px', border: '1px solid #BAE6FD' }}>
                                                <label style={{ fontSize: '13px', fontWeight: '700', color: '#0369A1', marginBottom: '8px', display: 'block' }}>मौजूदा मतदाता को परिवार में जोड़ें (Search & Add)</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="नाम या EPIC नंबर से खोजें..."
                                                        value={searchQuery}
                                                        onChange={(e) => handleSearchVoters(e.target.value)}
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                                                    />
                                                    {isSearching && <div style={{ position: 'absolute', right: '10px', top: '10px' }}><Loader2 size={16} className="spinner" /></div>}
                                                    {searchResults.length > 0 && (
                                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, marginTop: '4px', overflow: 'hidden' }}>
                                                            {searchResults.map(r => (
                                                                <div key={r.id} onClick={() => handleMoveToCurrentFamily(r.id)} style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="search-result-item">
                                                                    <div>
                                                                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{r.name}</div>
                                                                        <div style={{ fontSize: '12px', color: '#64748B' }}>{r.relativeName} • {r.epic}</div>
                                                                    </div>
                                                                    <UserPlus size={16} color="#2563EB" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

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
                                                            <div style={{ fontSize: '12px', color: '#64748B' }}>
                                                                {member.relationType}: {member.relativeName} • Age: {member.age}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            {member.id !== viewVoter.id && (
                                                                <button onClick={() => setViewVoter(member)} style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', padding: '4px' }}>
                                                                    <Eye size={18} />
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleFamilyRemove(member)} title="परिवार से अलग करें" style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}>
                                                                <UserMinus size={18} />
                                                            </button>
                                                            <button onClick={() => handleDeleteVoter(member.id)} title="स्थायी रूप से हटाएँ" style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}>
                                                                <Trash size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!viewVoter.family || viewVoter.family.length === 0) && (
                                                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px' }}>
                                                        No other family members found linked to House No: {viewVoter.houseNumber}
                                                    </div>
                                                )}
                                            </div>
                                        </>
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
