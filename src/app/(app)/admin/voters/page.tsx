'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Search, Filter, Users, MapPin, Phone, Edit2, Eye, User, Home,
    ChevronDown, ChevronUp, X, Loader2, Crown, Printer, UserPlus,
    RefreshCw, CheckCircle
} from 'lucide-react';
import {
    getVoters, getFilterOptions, updateVoterFeedback, getVoterWithFamily,
    createVoter, verifyVoter, deleteVoter, getVoterEditRequests,
    approveVoterEditRequest, rejectVoterEditRequest, updateVoter, getAllVotersForExport
} from '@/app/actions/voters';
import { getAssemblies } from '@/app/actions/admin';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';

// --- STYLES & SUB-COMPONENTS (From CandidateView) ---

const glassButtonStyle = {
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    fontWeight: '700' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    backdropFilter: 'blur(4px)',
    color: 'white'
};

const inputStyle = {
    width: '100%',
    padding: '14px 34px 14px 16px',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    fontSize: '14px',
    fontWeight: '500',
    color: '#334155',
    appearance: 'none' as const,
    background: '#F8FAFC',
    cursor: 'pointer'
};

const pillStyle = {
    padding: '8px 16px',
    borderRadius: '50px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s'
};

const badgeStyle = (color: string) => ({
    fontSize: '10px',
    background: color,
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '6px',
    fontWeight: '700' as const
});

const FilterChip = ({ label, color, icon }: any) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(4px)',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'white'
    }}>
        {icon && <span>{icon}</span>}
        {color && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}></div>}
        {label}
    </div>
);

const StyledSelect = ({ children, ...props }: any) => (
    <div style={{ position: 'relative' }}>
        <select {...props} style={inputStyle}>
            {children}
        </select>
        <ChevronDown size={14} style={{ position: 'absolute', right: '14px', top: '18px', pointerEvents: 'none', color: '#64748B' }} />
    </div>
);

const ToggleCheck = ({ label, checked, onChange, name, icon }: any) => (
    <label style={{
        ...pillStyle,
        background: checked ? '#EEF2FF' : 'white',
        border: checked ? '1px solid #4338CA' : '1px solid #E2E8F0',
        color: checked ? '#4338CA' : '#64748B',
        cursor: 'pointer'
    }}>
        <input type="checkbox" name={name} checked={checked} onChange={onChange} style={{ display: 'none' }} />
        <span style={{ marginRight: '6px' }}>{icon}</span> {label}
    </label>
);

export default function AdminVotersPage() {
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedAssembly, setSelectedAssembly] = useState<number | null>(null);
    const [lang, setLang] = useState('hi');

    useEffect(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('app_lang') : null;
        if (saved) setLang(saved);
    }, []);

    const [voters, setVoters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [viewVoter, setViewVoter] = useState<any | null>(null);
    const [isLoadingFamily, setIsLoadingFamily] = useState(false);

    // Add Voter State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newVoter, setNewVoter] = useState({
        name: '', age: '', gender: 'M', relativeName: '', relationshipType: '',
        mobile: '', epic: '', village: '', boothNumber: '', houseNumber: '', address: '',
        supportStatus: 'Neutral'
    });
    const [isSaving, setIsSaving] = useState(false);

    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 50
    });

    const [options, setOptions] = useState<any>({
        casteCategories: [], castes: [], subCastes: [], surnames: [], villages: [], booths: [], parties: []
    });

    const [filters, setFilters] = useState({
        search: '', booth: 'सभी बूथ', boothName: 'सभी बूथ नाम', status: 'सभी स्थिति', contactStatus: 'सभी', gender: 'सभी', village: 'सभी गांव',
        casteCategory: 'सभी वर्ग', caste: 'सभी जाति', subCaste: 'सभी उपजाति', surname: 'सभी उपनाम',
        familySize: 'सभी परिवार', ageFilter: 'सभी आयु',
        isHead: false, isPwD: false, isImportant: false, isVoted: 'All', votedPartyId: '',
        page: 1, pageSize: 50
    });

    useEffect(() => {
        getAssemblies().then(setAssemblies);
    }, []);

    useEffect(() => {
        if (selectedAssembly) {
            getFilterOptions(selectedAssembly).then(setOptions);
        }
    }, [selectedAssembly]);

    const fetchVoters = async () => {
        if (!selectedAssembly) return;
        setLoading(true);
        try {
            const payload = {
                ...filters,
                isHead: filters.isHead ? 'true' : undefined,
                isPwD: filters.isPwD ? 'true' : undefined,
                isImportant: filters.isImportant ? 'true' : undefined,
                assemblyId: selectedAssembly
            };

            const result = await getVoters(payload);
            setVoters(result.voters);
            setPagination({
                totalCount: result.totalCount,
                totalPages: result.totalPages,
                currentPage: result.page,
                pageSize: filters.pageSize
            });
        } catch (error) {
            console.error("Admin fetch failed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedAssembly) {
            const timeoutId = setTimeout(() => {
                fetchVoters();
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [
        selectedAssembly, filters.page, filters.search, filters.booth, filters.boothName, filters.status, filters.contactStatus, filters.gender, filters.village,
        filters.casteCategory, filters.caste, filters.subCaste, filters.familySize, filters.ageFilter,
        filters.isHead, filters.isPwD, filters.isImportant, filters.isVoted, filters.votedPartyId
    ]);


    const handleFilterChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            page: 1
        }));
    };

    const handleAddVoterSubmit = async () => {
        if (!selectedAssembly) return;
        setIsSaving(true);
        try {
            await createVoter({ ...newVoter, assemblyId: selectedAssembly });
            setIsAddModalOpen(false);
            setNewVoter({
                name: '', age: '', gender: 'M', relativeName: '', relationshipType: '',
                mobile: '', epic: '', village: '', boothNumber: '', houseNumber: '', address: '',
                supportStatus: 'Neutral'
            });
            fetchVoters();
        } catch (error) {
            console.error(error);
            alert('Error creating voter');
        } finally {
            setIsSaving(false);
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

    const activeFilterCount = Object.values(filters).filter(v => v !== 'All' && v !== false && v !== '' && !String(v).includes('सभी')).length;

    const handleExportToExcel = async () => {
        if (!selectedAssembly) return;
        setLoading(true);
        try {
            const allVoters = await getAllVotersForExport(selectedAssembly);

            const dataToExport = allVoters.map((v: any) => ({
                'Name (नाम)': v.name,
                'Age (आयु)': v.age,
                'Gender (लिंग)': v.gender === 'M' ? 'पुरुष' : 'महिला',
                'EPIC (पहचान पत्र)': v.epic,
                'Mobile (मोबाइल)': v.mobile,
                'Relative Name (रिश्तेदार)': v.relativeName,
                'Relation (रिश्ता)': v.relationshipType,
                'Village (गांव)': v.village,
                'Booth # (बूथ)': v.boothNumber,
                'House # (मकान)': v.houseNumber,
                'Support Status (समर्थन)': v.supportStatus,
                'Notes (नोट्स)': v.notes
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Voters");

            const fileName = `Voter_List_${assembly?.name || 'Assembly'}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);

        } catch (error) {
            console.error("Export failed:", error);
            alert("डेटा डाउनलोड करने में समस्या आई।");
        } finally {
            setLoading(false);
        }
    };

    const uniqueStates = Array.from(new Set(assemblies.map(a => a.state).filter(Boolean)));
    const filteredAssemblies = selectedState ? assemblies.filter(a => a.state === selectedState) : [];

    if (!selectedAssembly) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: '#F8FAFC', minHeight: '80vh' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '32px', color: '#1E293B' }}>विधानसभा का चयन करें (Select Assembly)</h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '450px', margin: '0 auto' }}>
                    {/* State Selection */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'left' }}>
                        <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px', color: '#475569', fontSize: '14px' }}>1. अपना राज्य चुनें (Select State)</label>
                        <select
                            onChange={(e) => {
                                setSelectedState(e.target.value);
                                setSelectedAssembly(null);
                            }}
                            value={selectedState || ''}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '16px', background: '#F8FAFC', fontWeight: '600' }}
                        >
                            <option value="">-- राज्य चुनें --</option>
                            {uniqueStates.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>

                    {/* Assembly Selection (Enabled only after state is selected) */}
                    <div style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        textAlign: 'left',
                        opacity: selectedState ? 1 : 0.5,
                        pointerEvents: selectedState ? 'auto' : 'none',
                        transition: 'all 0.3s'
                    }}>
                        <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px', color: '#475569', fontSize: '14px' }}>2. विधानसभा चुनें (Select Assembly)</label>
                        <select
                            onChange={(e) => setSelectedAssembly(parseInt(e.target.value))}
                            value={selectedAssembly || ''}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '16px', background: '#F8FAFC', fontWeight: '600' }}
                        >
                            <option value="">-- विधानसभा चुनें --</option>
                            {filteredAssemblies.map(a => (
                                <option key={a.id} value={a.id}>{a.number} - {a.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        );
    }

    const assembly = assemblies.find(a => a.id === selectedAssembly);

    return (
        <div style={{ paddingBottom: '100px', background: '#F1F5F9', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
            {/* Header section (Teal Gradient) */}
            <div style={{
                background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 50%, #115E59 100%)',
                color: 'white',
                borderRadius: '0 0 40px 40px',
                padding: '40px 32px 80px 32px',
                marginBottom: '-40px',
                position: 'relative',
                boxShadow: '0 20px 40px -10px rgba(13, 148, 136, 0.4)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9, marginBottom: '8px' }}>
                            <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px', backdropFilter: 'blur(5px)' }}>
                                एडमिन: मतदाता डेटा मास्टर
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#CCFBF1' }}>
                                {assembly?.number} - {assembly?.name}
                                <select
                                    onChange={(e) => setSelectedAssembly(parseInt(e.target.value))}
                                    value={selectedAssembly}
                                    style={{ marginLeft: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '12px' }}
                                >
                                    {assemblies.map(a => <option key={a.id} value={a.id} style={{ color: 'black' }}>{a.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ fontSize: '56px', fontWeight: '900', lineHeight: 1, letterSpacing: '-1px', textShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                            {loading ? <Loader2 className="animate-spin" size={48} /> : pagination.totalCount.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '500', color: '#99F6E4', marginTop: '8px' }}>कुल मतदाता</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={glassButtonStyle} onClick={handleExportToExcel} disabled={loading}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            डाउनलोड
                        </button>
                        <button style={glassButtonStyle} onClick={() => window.print()}>
                            <Printer size={16} /> प्रिंट
                        </button>
                        <button style={{ ...glassButtonStyle, background: 'white', color: '#0F766E' }} onClick={() => setIsAddModalOpen(true)}>
                            <UserPlus size={16} /> + वोटर
                        </button>
                    </div>
                </div>

                {/* Active Filter Chips */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '24px' }}>
                    {filters.village !== 'सभी गांव' && <FilterChip label={filters.village} />}
                    {filters.caste !== 'सभी जाति' && <FilterChip label={filters.caste} />}
                    {filters.gender !== 'सभी' && <FilterChip label={filters.gender === 'M' ? 'पुरुष' : 'महिला'} />}
                    {filters.status !== 'सभी स्थिति' && <FilterChip label={filters.status} color={filters.status === 'Support' ? '#22C55E' : '#EF4444'} />}
                    {filters.ageFilter !== 'सभी आयु' && <FilterChip label={filters.ageFilter} />}
                    {filters.isHead && <FilterChip label="मुखिया" icon={<Crown size={12} />} />}
                </div>
            </div>

            <div style={{ padding: '0 24px' }}>
                {/* 2. FILTERS (Glass UI) */}
                <div style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '24px',
                    boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)',
                    marginBottom: '24px',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <div onClick={() => setIsFilterExpanded(!isFilterExpanded)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: isFilterExpanded ? '16px' : 0 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#0F172A' }}>
                            <div style={{ background: '#F0FDFA', padding: '6px', borderRadius: '10px' }}><Filter size={18} color="#0D9488" /></div>
                            स्मार्ट फ़िल्टर और परिवार सर्च
                            {activeFilterCount > 0 && <span style={{ background: '#0D9488', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px' }}>{activeFilterCount}</span>}
                        </h3>
                        <div style={{ padding: '6px', background: '#F8FAFC', borderRadius: '50%' }}>
                            {isFilterExpanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                        </div>
                    </div>

                    {isFilterExpanded && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} size={16} />
                                    <input name="search" placeholder="खोजें (नाम, फोन, EPIC)..." value={filters.search} onChange={handleFilterChange}
                                        style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <SearchableSelect
                                options={['सभी बूथ', ...options.booths.map((b: any) => ({
                                    label: typeof b === 'object' ? (b.name ? `भाग ${b.number} - ${b.name}` : `भाग ${b.number}`) : `भाग ${b}`,
                                    value: String(typeof b === 'object' ? b.number : b)
                                }))]}
                                value={filters.booth}
                                onChange={(val) => {
                                    const selectedNum = parseInt(val);
                                    let matchedName = 'सभी बूथ नाम';
                                    if (!isNaN(selectedNum)) {
                                        const bObj = options.booths.find((b: any) => typeof b === 'object' && b.number === selectedNum);
                                        if (bObj && bObj.name) matchedName = bObj.name;
                                    }
                                    setFilters(prev => ({ ...prev, booth: val, boothName: matchedName, page: 1 }));
                                }}
                                placeholder="बूथ संख्या / नाम"
                                searchPlaceholder="बूथ संख्या या नाम खोजें..."
                            />

                            <SearchableSelect
                                options={['सभी बूथ नाम', ...options.booths.map((b: any) => typeof b === 'object' ? b.name : b).filter(Boolean)]}
                                value={filters.boothName}
                                onChange={(val) => {
                                    let matchedNum = 'सभी बूथ';
                                    if (val !== 'सभी बूथ नाम') {
                                        const bObj = options.booths.find((b: any) => typeof b === 'object' && b.name === val);
                                        if (bObj && bObj.number) matchedNum = String(bObj.number);
                                    }
                                    setFilters(prev => ({ ...prev, boothName: val, booth: matchedNum, page: 1 }));
                                }}
                                placeholder="बूथ का नाम"
                                searchPlaceholder="बूथ नाम खोजें..."
                            />

                            <SearchableSelect
                                options={['सभी गांव', ...options.villages]}
                                value={filters.village}
                                onChange={(val) => setFilters(prev => ({ ...prev, village: val, page: 1 }))}
                                placeholder="गांव/वार्ड"
                                searchPlaceholder="गांव/वार्ड खोजें..."
                            />

                            <SearchableSelect
                                options={['सभी वर्ग', 'सामान्य', 'ओबीसी', 'एससी', 'एसटी', 'मुस्लिम', 'अज्ञात']}
                                value={filters.casteCategory}
                                onChange={(val) => setFilters(prev => ({ ...prev, casteCategory: val, caste: 'सभी जाति', subCaste: 'सभी उपजाति', page: 1 }))}
                                placeholder="1. वर्ग (Category)"
                                searchPlaceholder="वर्ग खोजें (सामान्य/ओबीसी/एससी/एसटी/मुस्लिम/अज्ञात)..."
                            />

                            <SearchableSelect
                                options={[
                                    'सभी जाति',
                                    ...(Array.isArray(options.castes) ? options.castes
                                        .filter((c: any) => typeof c === 'object' ? (!filters.casteCategory || filters.casteCategory === 'सभी वर्ग' || c.category === filters.casteCategory) : true)
                                        .map((c: any) => typeof c === 'object' ? c.caste : c) : [])
                                ]}
                                value={filters.caste}
                                onChange={(val) => setFilters(prev => ({ ...prev, caste: val, subCaste: 'सभी उपजाति', page: 1 }))}
                                placeholder="2. जाति (Caste)"
                                searchPlaceholder="जाति का नाम खोजें (ब्राह्मण/कायस्थ/राजपूत/यादव आदि)..."
                            />

                            <SearchableSelect
                                options={[
                                    'सभी उपजाति',
                                    ...(Array.isArray(options.subCastes) ? options.subCastes
                                        .filter((s: any) => typeof s === 'object' ? (!filters.caste || filters.caste === 'सभी जाति' || s.parent === filters.caste) : true)
                                        .map((s: any) => typeof s === 'object' ? s.value : s) : [])
                                ]}
                                value={filters.subCaste}
                                onChange={(val) => setFilters(prev => ({ ...prev, subCaste: val, page: 1 }))}
                                placeholder="3. उपजाति / उपनाम (Surname)"
                                searchPlaceholder="उपजाति/उपनाम खोजें (शुक्ला/सक्सेना/श्रीवास्तव आदि)..."
                            />



                            <SearchableSelect
                                options={[
                                    { label: 'सभी परिवार', value: 'सभी परिवार' },
                                    { label: 'छोटा (1-3 सदस्य)', value: '1-3' },
                                    { label: 'मध्यम (4-6 सदस्य)', value: '4-6' },
                                    { label: 'बड़ा (7+ सदस्य)', value: '7+' }
                                ]}
                                value={filters.familySize}
                                onChange={(val) => setFilters(prev => ({ ...prev, familySize: val, page: 1 }))}
                                placeholder="परिवार संख्या"
                                searchPlaceholder="परिवार साइज़ खोजें..."
                            />

                            <SearchableSelect
                                options={[
                                    { label: 'सभी आयु', value: 'सभी आयु' },
                                    { label: 'पहली बार (18-24)', value: '18-24' },
                                    { label: 'युवा (25-35)', value: '25-35' },
                                    { label: 'मध्यम (36-60)', value: '36-60' },
                                    { label: 'वरिष्ठ (60+)', value: '60+' }
                                ]}
                                value={filters.ageFilter}
                                onChange={(val) => setFilters(prev => ({ ...prev, ageFilter: val, page: 1 }))}
                                placeholder="आयु वर्ग"
                                searchPlaceholder="आयु खोजें..."
                            />

                            <SearchableSelect
                                options={[
                                    { label: 'लिंग (सभी)', value: 'सभी' },
                                    { label: 'पुरुष (Male)', value: 'M' },
                                    { label: 'महिला (Female)', value: 'F' }
                                ]}
                                value={filters.gender}
                                onChange={(val) => setFilters(prev => ({ ...prev, gender: val, page: 1 }))}
                                placeholder="लिंग"
                                searchPlaceholder="लिंग खोजें..."
                            />

                            <SearchableSelect
                                options={[
                                    { label: 'संपर्क स्थिति (सभी)', value: 'सभी' },
                                    { label: '✅ संपर्कित (Contacted)', value: 'Contacted' },
                                    { label: '⏳ संपर्क बाकी (Pending)', value: 'Pending' }
                                ]}
                                value={filters.contactStatus || 'सभी'}
                                onChange={(val) => setFilters(prev => ({ ...prev, contactStatus: val, page: 1 }))}
                                placeholder="संपर्क स्थिति"
                                searchPlaceholder="संपर्कित या बाकी खोजें..."
                            />

                            <SearchableSelect
                                options={[
                                    { label: 'समर्थन (सभी)', value: 'सभी स्थिति' },
                                    { label: '✅ पक्ष (Favor)', value: 'Support' },
                                    { label: '⚪ न्यूट्रल', value: 'Neutral' },
                                    { label: '❌ विपक्ष (Anti)', value: 'Oppose' }
                                ]}
                                value={filters.status}
                                onChange={(val) => setFilters(prev => ({ ...prev, status: val, page: 1 }))}
                                placeholder="समर्थन स्थिति"
                                searchPlaceholder="स्थिति खोजें..."
                            />
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', gridColumn: 'span 2' }}>
                                <ToggleCheck name="isHead" checked={filters.isHead} onChange={handleFilterChange} label="मुखिया" icon="👑" />
                                <ToggleCheck name="isPwD" checked={filters.isPwD} onChange={handleFilterChange} label="दिव्यांग" icon="♿" />
                                <ToggleCheck name="isImportant" checked={filters.isImportant} onChange={handleFilterChange} label="VIP" icon="⭐" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Voter Table (Dark Mode Table as per Candidate View Request) */}
                <div style={{ background: '#1E293B', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    {loading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
                            <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto 16px', display: 'block' }} />
                            डेटा लोड हो रहा है...
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                                <thead>
                                    <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', textAlign: 'left', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94A3B8' }}>
                                        <th style={{ padding: '16px' }}>नाम (NAME)</th>
                                        <th style={{ padding: '16px' }}>आयु</th>
                                        <th style={{ padding: '16px' }}>गांव/वार्ड</th>
                                        <th style={{ padding: '16px' }}>जाति / धर्म</th>
                                        <th style={{ padding: '16px' }}>बूथ (भाग नाम)</th>
                                        <th style={{ padding: '16px' }}>EPIC</th>
                                        <th style={{ padding: '16px' }}>मोबाइल</th>
                                        <th style={{ padding: '16px' }}>समर्थन (STATUS)</th>
                                        <th style={{ padding: '16px' }}>एक्शन</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {voters.map((v) => {
                                        const isContacted = Boolean(
                                            (v.supportStatus && v.supportStatus !== 'Neutral') ||
                                            v.updatedByName ||
                                            (v.notes && v.notes.trim().length > 0)
                                        );
                                        const relLabel = (v.relationType === 'Mother' || v.relationshipType === 'Mother') ? 'माता' : ((v.relationType === 'Husband' || v.relationshipType === 'Husband') ? 'पति' : 'पिता');

                                        return (
                                            <tr key={v.id} style={{ borderBottom: '1px solid #334155', background: '#1E293B' }}>
                                                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#F8FAFC', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span>{lang === 'hi' ? (v.nameHi || v.name) : (v.nameEn || v.name)}</span>
                                                        {isContacted && (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#059669', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', boxShadow: '0 2px 4px rgba(5,150,105,0.3)' }}>
                                                                <CheckCircle size={12} fill="white" color="#059669" /> संपर्कित
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '2px' }}>
                                                        ({relLabel}) - {lang === 'hi' ? (v.relativeNameHi || v.relativeName) : (v.relativeNameEn || v.relativeName)}
                                                    </div>
                                                    {v.updatedByName && (
                                                        <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', marginBottom: '2px' }}>
                                                            संपर्ककर्ता: {v.updatedByName}
                                                        </div>
                                                    )}
                                                <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>पारिवारिक सदस्य: {v.familySize || 1}</div>
                                                <div style={{ fontSize: '12px', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={12} style={{ flexShrink: 0 }} />
                                                    <span>{v.fullAddressHi || v.fullAddressEn || (v.houseNumber ? `मकान नं: ${v.houseNumber}, ${v.villageHi || v.village || ''}` : (v.villageHi || v.village || 'N/A'))}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', verticalAlign: 'top', color: '#E2E8F0' }}>{v.age || '-'}</td>
                                            <td style={{ padding: '16px', verticalAlign: 'top', color: '#E2E8F0' }}>{lang === 'hi' ? (v.villageHi || (v.village === 'Sauri' ? 'सौरी' : v.village)) : (v.villageEn || v.village)}</td>
                                            <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>{v.caste || '-'}</div>
                                                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                                                    {v.religion || 'हिंदू'} {v.casteCategory ? `(${v.casteCategory})` : ''}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', verticalAlign: 'top', fontWeight: '700' }}>#{v.boothNumber}</td>
                                            <td style={{ padding: '16px', verticalAlign: 'top', fontFamily: 'monospace', color: '#CBD5E1' }}>{v.epic}</td>
                                            <td style={{ padding: '16px', verticalAlign: 'top' }}>{v.mobile || '-'}</td>
                                            <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                                <div style={{
                                                    padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', textAlign: 'center',
                                                    background: v.supportStatus === 'Support' ? 'rgba(34, 197, 94, 0.2)' : v.supportStatus === 'Oppose' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                                                    color: v.supportStatus === 'Support' ? '#4ADE80' : v.supportStatus === 'Oppose' ? '#F87171' : '#94A3B8'
                                                }}>
                                                    {v.supportStatus || 'Neutral'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                                <button onClick={() => {
                                                    setViewVoter({ ...v, family: [] });
                                                    setIsLoadingFamily(true);
                                                    getVoterWithFamily(v.id).then(res => { setViewVoter(res); setIsLoadingFamily(false); });
                                                }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155', background: 'transparent', color: '#94A3B8', fontSize: '12px', cursor: 'pointer' }}>
                                                    <Eye size={14} /> देखें
                                                </button>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
                    <button onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={pagination.currentPage === 1} style={{ padding: '10px 20px', borderRadius: '12px', background: 'white', border: '1px solid #E2E8F0', cursor: 'pointer' }}>Previous</button>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Page {pagination.currentPage} of {pagination.totalPages}</span>
                    <button onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))} disabled={pagination.currentPage >= pagination.totalPages} style={{ padding: '10px 20px', borderRadius: '12px', background: 'white', border: '1px solid #E2E8F0', cursor: 'pointer' }}>Next</button>
                </div>
            </div>

            {/* Voter Edit & Detail Modal */}
            {viewVoter && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', width: '90%', maxWidth: '850px', maxHeight: '92vh', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>
                                    {lang === 'hi' ? (viewVoter.nameHi || viewVoter.name) : (viewVoter.nameEn || viewVoter.name)}
                                </h2>
                                <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', gap: '12px', marginTop: '2px' }}>
                                    <span>EPIC: <strong style={{ fontFamily: 'monospace', color: '#0D9488' }}>{viewVoter.epic}</strong></span>
                                    <span>भाग (बूथ) #: <strong>{viewVoter.boothNumber}</strong></span>
                                    <span>परिवार साइज़: <strong>{viewVoter.familySize || 1}</strong></span>
                                </div>
                            </div>
                            <button onClick={() => setViewVoter(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><X size={20} color="#475569" /></button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const f = new FormData(e.currentTarget);
                                handleFullUpdate(viewVoter.id, Object.fromEntries(f));
                            }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F766E', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    📋 14 प्रकार का निष्कर्षित मतदाता विवरण (Voter Attributes)
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>1. नाम (Name)</label><input name="name" defaultValue={viewVoter.nameHi || viewVoter.name} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>2. रिश्तेदार का नाम</label><input name="relativeName" defaultValue={viewVoter.relativeNameHi || viewVoter.relativeName} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>3. रिश्ता (Relation)</label>
                                        <select name="relationType" defaultValue={viewVoter.relationType || 'Father'} style={inputStyle}>
                                            <option value="Father">पिता (Father)</option>
                                            <option value="Husband">पति (Husband)</option>
                                            <option value="Mother">माता (Mother)</option>
                                            <option value="Other">अन्य (Other)</option>
                                        </select>
                                    </div>

                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>4. EPIC नंबर</label><input name="epic" defaultValue={viewVoter.epic} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>5. आयु (Age)</label><input name="age" defaultValue={viewVoter.age || ''} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>6. लिंग (Gender)</label>
                                        <select name="gender" defaultValue={viewVoter.gender || 'M'} style={inputStyle}>
                                            <option value="M">पुरुष (Male)</option>
                                            <option value="F">महिला (Female)</option>
                                        </select>
                                    </div>

                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>7. धर्म (Religion)</label><input name="religion" defaultValue={viewVoter.religion || 'हिंदू'} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>8. जाति (Caste)</label><input name="caste" defaultValue={viewVoter.caste || ''} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>9. उपजाति / श्रेणी (Category)</label><input name="subCaste" defaultValue={viewVoter.subCaste || viewVoter.casteCategory || ''} style={inputStyle} /></div>

                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>10. गांव / वार्ड (Village)</label><input name="village" defaultValue={viewVoter.villageHi || (viewVoter.village === 'Sauri' ? 'सौरी' : viewVoter.village)} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>11. मकान संख्या (House #)</label><input name="houseNumber" defaultValue={viewVoter.houseNumber || ''} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>12. बूथ संख्या (Booth #)</label><input name="boothNumber" defaultValue={viewVoter.boothNumber || ''} style={inputStyle} /></div>

                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>13. मोबाइल (Mobile)</label><input name="mobile" defaultValue={viewVoter.mobile || ''} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>14. समर्थन स्थिति (Support)</label>
                                        <select name="supportStatus" defaultValue={viewVoter.supportStatus || 'Neutral'} style={inputStyle}>
                                            <option value="Support">✅ पक्ष (Favor)</option>
                                            <option value="Neutral">⚪ न्यूट्रल</option>
                                            <option value="Oppose">❌ विपक्ष (Anti)</option>
                                        </select>
                                    </div>
                                    <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>नोट्स (Notes)</label><input name="notes" defaultValue={viewVoter.notes || ''} style={inputStyle} /></div>
                                </div>

                                <button type="submit" style={{ width: '100%', background: '#0D9488', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>सुरक्षित / अपडेट करें</button>
                            </form>

                            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
                                <h3 style={{ fontWeight: '800', marginBottom: '14px', fontSize: '16px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Users size={18} color="#0D9488" />
                                    पारिवारिक सदस्य ({viewVoter.family?.length || 0})
                                </h3>
                                {isLoadingFamily ? <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="animate-spin" size={24} /></div> : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {viewVoter.family?.map((f: any) => {
                                            const fRelLabel = (f.relationType === 'Mother' || f.relationshipType === 'Mother') ? 'माता' : ((f.relationType === 'Husband' || f.relationshipType === 'Husband') ? 'पति' : 'पिता');
                                            const fName = lang === 'hi' ? (f.nameHi || f.name) : (f.nameEn || f.name);
                                            const fRelName = lang === 'hi' ? (f.relativeNameHi || f.relativeName) : (f.relativeNameEn || f.relativeName);
                                            return (
                                                <div key={f.id} style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>{fName}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>({fRelLabel}): {fRelName}</div>
                                                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'flex', gap: '10px' }}>
                                                        <span>उम्र: {f.age || '-'}</span>
                                                        <span>लिंग: {f.gender === 'F' ? 'महिला' : 'पुरुष'}</span>
                                                        <span style={{ fontFamily: 'monospace' }}>{f.epic}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Voter Modal (Simpified version) */}
            {isAddModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', width: '90%', maxWidth: '500px', borderRadius: '24px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontWeight: '900' }}>नया वोटर जोड़ें</h2>
                            <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none' }}><X /></button>
                        </div>
                        <input placeholder="वोटर का नाम" style={{ ...inputStyle, marginBottom: '12px' }} onChange={e => setNewVoter({ ...newVoter, name: e.target.value })} />
                        <input placeholder="EPIC नंबर" style={{ ...inputStyle, marginBottom: '12px' }} onChange={e => setNewVoter({ ...newVoter, epic: e.target.value })} />
                        <button onClick={handleAddVoterSubmit} style={{ width: '100%', background: '#0D9488', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '800' }}>
                            {isSaving ? 'सेव हो रहा है...' : 'सुरक्षित करें'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
