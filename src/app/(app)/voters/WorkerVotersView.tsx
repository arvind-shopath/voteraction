/**
 * 👷 WORKER VIEW - VOTER LIST
 * Matching Candidate/Booth Manager dark table design
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, Users, MapPin, Phone, Edit2, Eye, User, Home, ChevronDown, ChevronUp, X, Loader2, Share2, Crown, Activity, Star, Printer, UserPlus, ShieldCheck, UserMinus, AlertTriangle, RefreshCw, CloudDownload, Database, WifiOff, CheckCircle } from 'lucide-react';
import { getVoters, getFilterOptions, updateVoterFeedback, updateVoter, getVoterWithFamily, updateEciStatus, createVoter, addToFamily, removeFromFamily, searchVotersForFamily } from '@/app/actions/voters';
import { useView } from '@/context/ViewContext';
import { getWorkerBooth } from '@/app/actions/worker';
import { saveVotersLocally, getLocalVoters, updateLocalVoter, searchLocalVoters } from '@/lib/voter-store';
import { Save, Trash2 } from 'lucide-react';

// --- STYLES & SUB-COMPONENTS (HOISTED) ---

const glassButtonStyle = {
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    backdropFilter: 'blur(4px)'
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
    fontWeight: '700'
});

const CASTE_OPTIONS: any = {
    'सामान्य (General)': ['ब्राह्मण', 'ठाकुर (राजपूत)', 'बनिया', 'लाला (कायस्थ)', 'त्यागी', 'भूमिहार', 'अन्य'],
    'ओबीसी (OBC)': ['यादव', 'कुर्मी', 'कुशवाहा', 'मौर्य', 'लोध', 'जाट', 'गुज्जर', 'सैनी', 'विश्वकर्मा', 'प्रजापति', 'प्रजापति/कुम्हार', 'अन्य'],
    'एससी (SC)': ['जाटव', 'पासी', 'धोबी', 'कोरी', 'वाल्मीकि', 'अन्य'],
    'एसटी (ST)': ['गोंद', 'खरवार', 'सहारिया', 'अन्य'],
    'मुस्लिम (Muslim)': ['अंसारी', 'कुरैशी', 'शेख', 'पठान', 'सैय्यद', 'मंसूरी', 'अन्य']
};

const getCategoryKey = (cat?: string | null, casteVal?: string | null) => {
    if (cat) {
        const cUpper = String(cat).trim().toUpperCase();
        if (cUpper === 'OBC' || cat === 'ओबीसी' || cUpper.includes('OBC') || cat.includes('ओबीसी')) return 'ओबीसी (OBC)';
        if (cUpper === 'SC' || cat === 'एससी' || cUpper.includes('SC') || cat.includes('एससी')) return 'एससी (SC)';
        if (cUpper === 'ST' || cat === 'एसटी' || cUpper.includes('ST') || cat.includes('एसटी')) return 'एसटी (ST)';
        if (cUpper === 'GENERAL' || cUpper === 'GEN' || cat === 'सामान्य' || cUpper.includes('GEN') || cat.includes('सामान्य')) return 'सामान्य (General)';
        if (cUpper === 'MUSLIM' || cat === 'मुस्लिम' || cUpper.includes('MUSLIM') || cat.includes('मुस्लिम')) return 'मुस्लिम (Muslim)';
    }
    if (casteVal) {
        const cVal = String(casteVal).trim().toLowerCase();
        for (const [key, list] of Object.entries(CASTE_OPTIONS)) {
            if ((list as string[]).some(item => item.toLowerCase() === cVal || cVal.includes(item.toLowerCase()) || item.toLowerCase().includes(cVal))) {
                return key;
            }
        }
    }
    return '';
};

const formatVoterForEdit = (v: any) => {
    const catKey = getCategoryKey(v.casteCategory, v.caste);
    const dbCat = catKey.includes('OBC') ? 'OBC' : catKey.includes('SC') ? 'SC' : catKey.includes('ST') ? 'ST' : catKey.includes('Muslim') ? 'Muslim' : catKey.includes('General') ? 'General' : (v.casteCategory || '');
    return {
        ...v,
        casteCategoryKey: catKey,
        casteCategory: dbCat,
        caste: v.caste || '',
        subCaste: v.subCaste || ''
    };
};

const FilterChip = ({ label, color, icon }: any) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(4px)',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        border: '1px solid rgba(255,255,255,0.1)'
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

const InfoBox = ({ label, value }: any) => (
    <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{value || 'N/A'}</div>
    </div>
);

/**
 * 👷 WORKER VIEW - VOTER LIST (Dark Table Design)
 */
export default function WorkerVotersView() {
    const { data: session }: any = useSession();
    const assemblyId = session?.user?.assemblyId;
    const searchParams = useSearchParams();
    const filterParam = searchParams.get('filter');
    const { effectiveRole, effectiveWorkerType } = useView();
    const role = effectiveRole || (session?.user as any)?.role;
    const workerType = effectiveWorkerType || (session?.user as any)?.workerType;
    const isPannaPramukh = workerType === 'PANNA_PRAMUKH';
    const isPannaView = filterParam === 'my-panna';

    const [lang, setLang] = useState('hi');

    useEffect(() => {
        const savedLang = localStorage.getItem('app_lang');
        if (savedLang) setLang(savedLang);
    }, []);

    const t = {
        title: lang === 'hi' ? 'मतदाता सूची' : 'Voter List',
        totalVoters: lang === 'hi' ? 'कुल मतदाता' : 'Total Voters',
        searchPlaceholder: lang === 'hi' ? 'खोजें (नाम, फोन, EPIC)...' : 'Search (Name, Phone, EPIC)...',
        filters: lang === 'hi' ? 'फिल्टर' : 'Filters',
        print: lang === 'hi' ? 'प्रिंट' : 'Print',
        addVoter: lang === 'hi' ? '+ नया नाम' : '+ New Name',
        syncing: lang === 'hi' ? 'सिंक हो रहा है...' : 'Syncing...',
        male: lang === 'hi' ? 'पुरुष' : 'Male',
        female: lang === 'hi' ? 'महिला' : 'Female',
        favor: lang === 'hi' ? 'पक्ष' : 'Favor',
        neutral: lang === 'hi' ? 'न्यूट्रल' : 'Neutral',
        anti: lang === 'hi' ? 'विपक्ष' : 'Against',
        head: lang === 'hi' ? 'मुखिया' : 'Head',
        pwd: lang === 'hi' ? 'दिव्यांग' : 'PwD',
        vip: lang === 'hi' ? 'वीआईपी' : 'VIP',
        voted: lang === 'hi' ? 'वोट दिया' : 'Voted',
        results: lang === 'hi' ? 'परिणाम' : 'Results',
        next: lang === 'hi' ? 'अगला' : 'Next',
        prev: lang === 'hi' ? 'पिछला' : 'Prev',
        allBooths: lang === 'hi' ? 'सभी बूथ' : 'All Booths',
        myBooth: lang === 'hi' ? 'मेरा बूथ' : 'My Booth'
    };

    const [voters, setVoters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [viewVoter, setViewVoter] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [familySearch, setFamilySearch] = useState('');
    const [familyResults, setFamilyResults] = useState<any[]>([]);
    const [isLoadingFamily, setIsLoadingFamily] = useState(false);
    const [assignedBooth, setAssignedBooth] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    // Add Voter State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newVoter, setNewVoter] = useState<any>({
        name: '', age: '', gender: 'M', relativeName: '', relationshipType: '',
        mobile: '', epic: '', village: '', boothNumber: '', houseNumber: '', address: '',
        supportStatus: 'Neutral', caste: '', subCaste: ''
    });

    const handleUpdateEciStatus = async (voterId: number, status: string) => {
        setIsSaving(true);
        try {
            await updateEciStatus(voterId, status);
            alert('अनुरोध भेज दिया गया है। (Request sent)');
            setViewVoter(null);
            fetchVoters();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!viewVoter) return;
        setIsSaving(true);
        try {
            await updateVoter(viewVoter.id, editData);
            const userRole = (session?.user as any)?.role;
            const isWorker = userRole === 'WORKER' || effectiveRole === 'WORKER';

            // For workers, some fields trigger requests
            alert('जानकारी अपडेट कर दी गई है। मूल जानकारी में बदलाव के लिए अनुमति (Request Approval) की आवश्यकता हो सकती है।');
            setIsEditing(false);
            if (!isWorker) {
                setViewVoter({ ...viewVoter, ...editData });
                fetchVoters();
            }
        } catch (error: any) {
            alert(error.message || 'Error saving changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFamilySearch = async (query: string) => {
        setFamilySearch(query);
        if (query.length > 2 && assemblyId) {
            const results = await searchVotersForFamily(query, assemblyId);
            setFamilyResults(results);
        } else {
            setFamilyResults([]);
        }
    };

    const handleAddToFamilyAction = async (voterId: number) => {
        if (!viewVoter) return;
        try {
            await addToFamily(voterId, viewVoter.houseNumber, viewVoter.village, viewVoter.area);
            alert('परिवार में जोड़ा गया।');
            setFamilyResults([]);
            setFamilySearch('');
            const fullData = await getVoterWithFamily(viewVoter.id);
            if (fullData) setViewVoter(fullData);
        } catch (error) {
            alert('Error adding to family');
        }
    };

    const handleRemoveFromFamilyAction = async (voterId: number) => {
        if (!confirm('क्या आप इस सदस्य को परिवार से हटाना चाहते हैं?')) return;
        try {
            await removeFromFamily(voterId);
            alert('सदस्य को परिवार से हटा दिया गया है।');
            const fullData = await getVoterWithFamily(viewVoter.id);
            if (fullData) setViewVoter(fullData);
        } catch (error) {
            alert('Error removing from family');
        }
    };

    const handleAddVoterSubmit = async () => {
        setIsSaving(true);
        try {
            // Workers always add with eciStatus: NOT_IN_LIST as per requirement
            await createVoter({
                ...newVoter,
                assemblyId,
                eciStatus: 'NOT_IN_LIST',
                boothNumber: newVoter.boothNumber || assignedBooth?.number || session?.user?.boothNumber
            });
            setIsAddModalOpen(false);
            setNewVoter({
                name: '', age: '', gender: 'M', relativeName: '', relationshipType: '',
                mobile: '', epic: '', village: '', boothNumber: '', houseNumber: '', address: '',
                supportStatus: 'Neutral', caste: '', subCaste: ''
            });
            alert(lang === 'hi' ? 'नाम जुड़वाने का अनुरोध भेज दिया गया है' : 'Enrolment request sent');
            fetchVoters();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Error');
        } finally {
            setIsSaving(false);
        }
    };

    // Filter Logic
    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 50
    });

    const [options, setOptions] = useState<any>({
        castes: [], subCastes: [], surnames: [], villages: [], booths: [], parties: []
    });

    const [filters, setFilters] = useState({
        search: '', status: 'सभी स्थिति', gender: 'सभी', village: 'सभी गांव',
        caste: 'सभी जाति', subCaste: 'सभी उपजाति', surname: 'सभी उपनाम',
        familySize: 'सभी परिवार', ageFilter: 'सभी आयु',
        isHead: false, isPwD: false, isImportant: false, isVoted: 'All', votedPartyId: '',
        page: 1, pageSize: 50
    });

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch assigned booth for Worker
    useEffect(() => {
        const isWorker = role === 'WORKER';
        if (isWorker && session?.user?.id) {
            getWorkerBooth(parseInt(session.user.id), assemblyId).then(booth => {
                if (booth) {
                    setAssignedBooth(booth);
                }
            });
        }
    }, [role, session?.user?.id, assemblyId]);

    useEffect(() => {
        if (assemblyId) {
            getFilterOptions(assemblyId).then((res) => {
                setOptions(res);
            });
        }
    }, [assemblyId]);

    // Fetch Voters
    const fetchVoters = async () => {
        if (!assemblyId) return;
        setLoading(true);
        const isOnline = navigator.onLine;
        setIsOfflineMode(!isOnline);

        try {
            const boothNumber = assignedBooth?.number || session?.user?.boothNumber || '';
            const payload = {
                ...filters,
                booth: boothNumber,
                pannaOnly: isPannaView,
                isHead: filters.isHead ? 'true' : undefined,
                isPwD: filters.isPwD ? 'true' : undefined,
                isImportant: filters.isImportant ? 'true' : undefined,
                assemblyId
            };

            if (isOnline) {
                // ONLINE: Fetch from server
                const result = await getVoters(payload);
                setVoters(result.voters);
                setPagination({
                    totalCount: result.totalCount,
                    totalPages: result.totalPages,
                    currentPage: result.page,
                    pageSize: filters.pageSize
                });

                // Background Sync: Save these to local store for offline use
                if (result.voters.length > 0) {
                    saveVotersLocally(result.voters);
                }
            } else {
                // OFFLINE: Read from IndexedDB
                const localData = await searchLocalVoters(payload);
                setVoters(localData);
                setPagination({
                    totalCount: localData.length,
                    totalPages: 1,
                    currentPage: 1,
                    pageSize: localData.length
                });
            }
        } catch (error) {
            console.error("Fetch failed:", error);
            // Fallback to local if server fails
            const boothNumber = assignedBooth?.number || session?.user?.boothNumber || '';
            const localData = await getLocalVoters(boothNumber);
            if (localData.length > 0) {
                setVoters(localData);
                setIsOfflineMode(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFullBoothDownload = async () => {
        if (!assemblyId || isDownloading) return;
        const boothNumber = assignedBooth?.number || session?.user?.boothNumber || '';
        if (!boothNumber) return;

        setIsDownloading(true);
        try {
            // Fetch all voters for this booth (large page size)
            const result = await getVoters({
                assemblyId,
                booth: boothNumber,
                pageSize: 5000, // Large enough to cover most booths
                page: 1
            });

            if (result.voters.length > 0) {
                await saveVotersLocally(result.voters);
            }
        } catch (error) {
            console.error("Auto-sync failed:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('app_lang');
            if (stored) setLang(stored);
        }
        if (assemblyId) {
            const timeoutId = setTimeout(() => {
                fetchVoters();
                // AUTO-SYNC: After initial fetch, trigger full booth download once in background
                handleFullBoothDownload();
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [
        assemblyId, filters.page, filters.search, filters.status, filters.gender, filters.village,
        filters.caste, filters.familySize, filters.ageFilter,
        filters.isHead, filters.isPwD, filters.isImportant, filters.isVoted, filters.votedPartyId, isPannaView
    ]);

    const handleFilterChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            page: 1
        }));
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== 'All' && v !== false && v !== '' && !String(v).includes('सभी')).length;

    const handleClearFilters = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setFilters({
            search: '',
            status: 'सभी स्थिति',
            gender: 'सभी',
            village: 'सभी गांव',
            casteCategory: 'सभी वर्ग',
            caste: 'सभी जाति',
            subCaste: 'सभी उपजाति',
            surname: 'सभी उपनाम',
            familySize: 'सभी परिवार',
            ageFilter: 'सभी आयु',
            isHead: false,
            isPwD: false,
            isImportant: false,
            isVoted: 'All',
            votedPartyId: '',
            page: 1,
            pageSize: 50
        });
    };

    return (
        <div style={{ paddingBottom: '100px', fontFamily: 'var(--font-geist-sans)', background: '#F1F5F9', minHeight: '100vh' }}>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; -webkit-print-color-adjust: exact; }
                    .voter-table-container { background: white !important; box-shadow: none !important; overflow: visible !important; }
                    .voter-table { color: black !important; }
                    .voter-table th { background: #f3f4f6 !important; color: black !important; border: 1px solid #ccc !important; }
                    .voter-table tr { background: white !important; border-bottom: 1px solid #ddd !important; break-inside: avoid; }
                    .voter-table td { color: black !important; border: 1px solid #ddd !important; }
                }
            `}</style>

            {/* 1. HEADER */}
            <div className="no-print" style={{
                background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 50%, #115E59 100%)',
                color: 'white',
                borderRadius: isMobile ? '0 0 24px 24px' : '0 0 40px 40px',
                padding: isMobile ? '24px 16px 60px 16px' : '40px 32px 80px 32px',
                marginBottom: '-40px',
                position: 'relative',
                boxShadow: '0 20px 40px -10px rgba(13, 148, 136, 0.4)'
            }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', gap: isMobile ? '20px' : '0' }}>
                    <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.9, marginBottom: '8px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                            <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: isMobile ? '10px' : '12px', fontWeight: '700', letterSpacing: '0.5px', backdropFilter: 'blur(5px)' }}>
                                {isPannaView ? 'मेरे पन्ने (MY PANNA)' : 'मतदाता सूची (VOTER LIST)'}
                            </div>
                            <div style={{ fontSize: isMobile ? '11px' : '13px', fontWeight: '600', color: '#CCFBF1' }}>
                                सिकटा विधानसभा • बूथ #{assignedBooth?.number || session?.user?.boothNumber || ''}
                            </div>
                        </div>
                        <div style={{ fontSize: isMobile ? '40px' : '56px', fontWeight: '900', lineHeight: 1, letterSpacing: '-1px', textShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                            {loading ? <Loader2 className="animate-spin" size={isMobile ? 32 : 48} /> : pagination.totalCount.toLocaleString()}
                        </div>
                        <div style={{ fontSize: isMobile ? '13px' : '16px', fontWeight: '500', color: '#99F6E4', marginTop: '8px' }}>
                            कुल मतदाता
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: isMobile ? 'nowrap' : 'wrap',
                        justifyContent: isMobile ? 'flex-start' : 'flex-end',
                        overflowX: isMobile ? 'auto' : 'visible',
                        paddingBottom: isMobile ? '8px' : '0',
                        width: '100%',
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                        WebkitOverflowScrolling: 'touch'
                    }}>
                        {isDownloading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                                <RefreshCw className="animate-spin" size={12} /> सिंक हो रहा है...
                            </div>
                        )}
                        <button style={{ ...glassButtonStyle, padding: isMobile ? '8px 16px' : '10px 20px', flexShrink: 0 }} onClick={() => window.print()}>
                            <Printer size={16} /> <span style={{ fontSize: isMobile ? '13px' : '13px' }}>प्रिंट</span>
                        </button>
                        <button style={{ ...glassButtonStyle, background: '#F59E0B', color: 'white', border: 'none', padding: isMobile ? '8px 16px' : '10px 20px', flexShrink: 0 }} onClick={() => setIsAddModalOpen(true)}>
                            <UserPlus size={16} /> <span style={{ fontSize: isMobile ? '13px' : '13px' }}>+ नया नाम</span>
                        </button>
                    </div>
                </div>

                {/* Active Filter Chips (Hindi) */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '24px' }}>
                    {filters.village !== 'सभी गांव' && <FilterChip label={filters.village} />}
                    {filters.caste !== 'सभी जाति' && <FilterChip label={filters.caste} />}
                    {filters.gender !== 'सभी' && <FilterChip label={filters.gender === 'M' ? 'पुरुष' : 'महिला'} />}
                    {filters.status !== 'सभी स्थिति' && <FilterChip label={filters.status} color={filters.status === 'Support' ? '#22C55E' : '#EF4444'} />}
                    {filters.ageFilter !== 'सभी आयु' && <FilterChip label={filters.ageFilter} />}
                    {filters.isHead && <FilterChip label="मुखिया" icon={<Crown size={12} />} />}
                    {filters.isPwD && <FilterChip label="दिव्यांग" icon={<Activity size={12} />} />}
                    {filters.isImportant && <FilterChip label="महत्वपूर्ण" icon={<Star size={12} />} />}
                </div>
            </div>

            <div style={{ padding: isMobile ? '0 12px' : '0 24px' }}>
                {/* 2. FILTERS */}
                <div className="no-print" style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '24px',
                    boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.01)',
                    marginBottom: '24px',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isFilterExpanded ? '20px' : 0 }}>
                        <div onClick={() => setIsFilterExpanded(!isFilterExpanded)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <div style={{ background: '#F0FDFA', padding: '8px', borderRadius: '10px' }}><Filter size={isMobile ? 16 : 20} color="#0D9488" /></div>
                            <h3 style={{ fontSize: isMobile ? '14px' : '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: '#0F172A', margin: 0 }}>
                                फिल्टर (Filters)
                                {activeFilterCount > 0 && <span style={{ background: '#0D9488', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px' }}>{activeFilterCount}</span>}
                                {isOfflineMode && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FEF2F2', color: '#B91C1C', padding: '4px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '800' }}>
                                        <WifiOff size={10} /> Offline
                                    </span>
                                )}
                            </h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={handleClearFilters}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '6px 12px',
                                        borderRadius: '12px',
                                        border: '1px solid #FECACA',
                                        background: '#FEF2F2',
                                        color: '#DC2626',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={14} /> फ़िल्टर साफ़ करें (Clear)
                                </button>
                            )}
                            <div onClick={() => setIsFilterExpanded(!isFilterExpanded)} style={{ padding: '8px', background: '#F8FAFC', borderRadius: '50%', cursor: 'pointer' }}>
                                {isFilterExpanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                            </div>
                        </div>
                    </div>

                    {isFilterExpanded && (
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', animation: 'fadeIn 0.3s ease' }}>
                            {/* Search */}
                            <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} size={16} />
                                    <input name="search" placeholder="खोजें (नाम, फोन, EPIC)..." value={filters.search} onChange={handleFilterChange}
                                        style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <StyledSelect name="village" value={filters.village} onChange={handleFilterChange}>
                                <option value="सभी गांव">{lang === 'hi' ? 'सभी गांव' : 'All Villages'}</option>
                                {options.villages.map((v: any) => <option key={v} value={v}>{v}</option>)}
                            </StyledSelect>

                            <StyledSelect name="caste" value={filters.caste} onChange={handleFilterChange}>
                                <option value="सभी जाति">{lang === 'hi' ? 'सभी जाति' : 'All Castes'}</option>
                                {options.castes.map((c: any) => <option key={c} value={c}>{c}</option>)}
                            </StyledSelect>

                            <StyledSelect name="ageFilter" value={filters.ageFilter} onChange={handleFilterChange}>
                                <option value="सभी आयु">{lang === 'hi' ? 'सभी आयु' : 'All Ages'}</option>
                                <option value="18-24">{lang === 'hi' ? 'पहली बार (18-24)' : 'First Time (18-24)'}</option>
                                <option value="25-35">{lang === 'hi' ? 'युवा (25-35)' : 'Youth (25-35)'}</option>
                                <option value="36-60">{lang === 'hi' ? 'मध्यम (36-60)' : 'Middle Aged (36-60)'}</option>
                                <option value="60+">{lang === 'hi' ? 'वरिष्ठ (60+)' : 'Senior (60+)'}</option>
                            </StyledSelect>

                            <StyledSelect name="gender" value={filters.gender} onChange={handleFilterChange}>
                                <option value="सभी">{lang === 'hi' ? 'लिंग' : 'Gender'}</option>
                                <option value="M">{t.male}</option>
                                <option value="F">{t.female}</option>
                            </StyledSelect>

                            <StyledSelect name="familySize" value={filters.familySize} onChange={handleFilterChange}>
                                <option value="सभी परिवार">{lang === 'hi' ? 'परिवार साइज' : 'Family Size'}</option>
                                <option value="1-3">{lang === 'hi' ? 'छोटा (1-3)' : 'Small (1-3)'}</option>
                                <option value="4-6">{lang === 'hi' ? 'मध्यम (4-6)' : 'Medium (4-6)'}</option>
                                <option value="7+">{lang === 'hi' ? 'बड़ा (7+)' : 'Large (7+)'}</option>
                            </StyledSelect>

                            <StyledSelect name="status" value={filters.status} onChange={handleFilterChange}>
                                <option value="सभी स्थिति">{lang === 'hi' ? 'समर्थन स्थिति' : 'Support Status'}</option>
                                <option value="Support">✅ {t.favor}</option>
                                <option value="Neutral">⚪ {t.neutral}</option>
                                <option value="Oppose">❌ {t.anti}</option>
                            </StyledSelect>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                                <ToggleCheck name="isHead" checked={filters.isHead} onChange={handleFilterChange} label={t.head} icon="👑" />
                                <ToggleCheck name="isPwD" checked={filters.isPwD} onChange={handleFilterChange} label={t.pwd} icon="♿" />
                                <ToggleCheck name="isImportant" checked={filters.isImportant} onChange={handleFilterChange} label={t.vip} icon="⭐" />
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. TABLE/CARDS */}
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
                        <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto 16px', display: 'block' }} />
                        डेटा लोड हो रहा है...
                    </div>
                ) : isMobile ? (
                    /* MOBILE CARD VIEW */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {voters.map((v) => {
                            const isContacted = Boolean(
                                (v.supportStatus && v.supportStatus !== 'Neutral') ||
                                v.updatedByName ||
                                v.notes ||
                                v.verificationStatus === 'VERIFIED'
                            );

                            return (
                                <div key={v.id} style={{ background: '#1E293B', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #334155' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span>{lang === 'hi' ? (v.nameHi || v.name) : (v.nameEn || v.name)} {v.age && <span style={{ fontSize: '13px', fontWeight: '400', color: '#94A3B8' }}>({v.age})</span>}</span>
                                                {isContacted ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#059669', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', boxShadow: '0 2px 4px rgba(5,150,105,0.3)' }}>
                                                        <CheckCircle size={12} fill="white" color="#059669" /> संपर्कित
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#334155', color: '#CBD5E1', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                                                        ⏳ संपर्क बाकी
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '2px' }}>
                                                ({(v.relationType === 'Mother' || v.relationshipType === 'Mother') ? 'माता' : ((v.relationType === 'Husband' || v.relationshipType === 'Husband') ? 'पति' : 'पिता')}) - {lang === 'hi' ? (v.relativeNameHi || v.relativeName) : (v.relativeNameEn || v.relativeName)}
                                            </div>
                                            {v.updatedByName && (
                                                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', marginTop: '2px' }}>
                                                    संपर्ककर्ता: {v.updatedByName}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800' }}>बूथ #{v.boothNumber}</div>
                                            {v.boothName && <div style={{ fontSize: '10px', color: '#94A3B8' }}>{v.boothName}</div>}
                                            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>{v.epic}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '12px', color: '#38BDF8', flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={12} /> {v.fullAddressHi || v.fullAddressEn || (v.houseNumber ? `मकान नं: ${v.houseNumber}, ${v.village || v.area || ''}` : (v.village || v.area || 'N/A'))}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', fontSize: '12px', color: '#94A3B8', flexWrap: 'wrap' }}>
                                        {v.mobile && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={10} /> {v.mobile}</span>
                                        )}
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={10} /> परिवार: {v.familySize || 1}</span>
                                        {v.isHead && (
                                            <span style={badgeStyle('#F59E0B')}>Mukhiya</span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select
                                            value={v.supportStatus || 'Neutral'}
                                            onChange={async (e) => {
                                                const newStatus = e.target.value;
                                                await updateLocalVoter(v.id, { supportStatus: newStatus });
                                                setVoters(prev => prev.map(p => p.id === v.id ? { ...p, supportStatus: newStatus } : p));
                                                await updateVoterFeedback(v.id, { supportStatus: newStatus });
                                            }}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: '800',
                                                border: 'none', background: v.supportStatus === 'Support' ? '#064E3B' : v.supportStatus === 'Oppose' ? '#450A0A' : '#334155',
                                                color: v.supportStatus === 'Support' ? '#10B981' : v.supportStatus === 'Oppose' ? '#F87171' : '#94A3B8'
                                            }}
                                        >
                                            <option value="Support">✅ पक्ष (Favor)</option>
                                            <option value="Neutral">⚪ न्यूट्रल</option>
                                            <option value="Oppose">❌ विपक्ष (Anti)</option>
                                        </select>
                                        <button
                                            onClick={() => {
                                                setViewVoter({ ...v, family: [] });
                                                setIsEditing(false);
                                                setEditData(formatVoterForEdit(v));
                                                setIsLoadingFamily(true);
                                                getVoterWithFamily(v.id).then(fullData => {
                                                    if (fullData) {
                                                        setViewVoter(fullData);
                                                        setEditData(formatVoterForEdit(fullData));
                                                    }
                                                    setIsLoadingFamily(false);
                                                });
                                            }}
                                            style={{ width: '44px', height: '44px', borderRadius: '12px', border: '1px solid #334155', background: '#0F172A', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {voters.length === 0 && (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                                कोई डेटा नहीं मिला
                            </div>
                        )}
                    </div>
                ) : (
                    /* DESKTOP TABLE VIEW */
                    <div className="voter-table-container" style={{ background: '#1E293B', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="voter-table" style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                                <thead>
                                    <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', textAlign: 'left', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94A3B8' }}>
                                        <th style={{ padding: '16px' }}>नाम (NAME)</th>
                                        <th style={{ padding: '16px' }}>गांव/वार्ड</th>
                                        <th style={{ padding: '16px' }}>बूथ</th>
                                        <th style={{ padding: '16px' }}>EPIC</th>
                                        <th style={{ padding: '16px' }}>मोबाइल</th>
                                        <th style={{ padding: '16px' }}>समर्थन (STATUS)</th>
                                        <th className="no-print" style={{ padding: '16px' }}>एक्शन</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {voters.map((v) => {
                                        const isContacted = Boolean(
                                            (v.supportStatus && v.supportStatus !== 'Neutral') ||
                                            v.updatedByName ||
                                            v.notes ||
                                            v.verificationStatus === 'VERIFIED'
                                        );

                                        return (
                                            <tr key={v.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s', background: '#1E293B' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#2C3E50'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = '#1E293B'}>

                                                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#F8FAFC', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span>{v.name} {v.age && <span style={{ fontSize: '12px', fontWeight: '400', color: '#94A3B8' }}>({v.age} वर्ष)</span>}</span>
                                                        {isContacted ? (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#059669', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', boxShadow: '0 2px 4px rgba(5,150,105,0.3)' }}>
                                                                <CheckCircle size={12} fill="white" color="#059669" /> संपर्कित
                                                            </span>
                                                        ) : (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#334155', color: '#CBD5E1', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                                                                ⏳ संपर्क बाकी
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '2px' }}>
                                                        ({(v.relationType === 'Mother' || v.relationshipType === 'Mother') ? 'माता' : ((v.relationType === 'Husband' || v.relationshipType === 'Husband') ? 'पति' : 'पिता')}) - {v.relativeName || 'N/A'}
                                                    </div>
                                                    {v.updatedByName && (
                                                        <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', marginBottom: '2px' }}>
                                                            संपर्ककर्ता: {v.updatedByName}
                                                        </div>
                                                    )}
                                                <div style={{ fontSize: '12px', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                                    <MapPin size={12} style={{ flexShrink: 0 }} />
                                                    <span>{v.fullAddressHi || v.fullAddressEn || (v.houseNumber ? `मकान नं: ${v.houseNumber}, ${v.village || v.area || ''}` : (v.village || v.area || 'N/A'))}</span>
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                                                    परिवार- {v.familySize || 1} सदस्य
                                                    {v.isHead && <span style={{ ...badgeStyle('#F59E0B'), marginLeft: '6px' }}>Mukhiya</span>}
                                                    {v.isPwD && <span style={{ ...badgeStyle('#EF4444'), marginLeft: '6px' }}>PwD</span>}
                                                </div>
                                            </td>

                                            <td style={{ padding: '16px', verticalAlign: 'top', fontSize: '14px', color: '#E2E8F0' }}>{v.village}</td>
                                            <td style={{ padding: '16px', verticalAlign: 'top', fontSize: '14px', fontWeight: '700', color: '#F8FAFC' }}>{v.boothNumber}</td>
                                            <td style={{ padding: '16px', verticalAlign: 'top', fontSize: '13px', fontFamily: 'monospace', color: '#CBD5E1' }}>{v.epic}</td>
                                            <td style={{ padding: '16px', verticalAlign: 'top', fontSize: '13px', color: '#F8FAFC' }}>{v.mobile || '-'}</td>

                                            <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                                <select
                                                    value={v.supportStatus || 'Neutral'}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value;
                                                        await updateLocalVoter(v.id, { supportStatus: newStatus });
                                                        setVoters(prev => prev.map(p => p.id === v.id ? { ...p, supportStatus: newStatus } : p));
                                                        await updateVoterFeedback(v.id, { supportStatus: newStatus });
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: '700',
                                                        border: 'none',
                                                        outline: 'none',
                                                        cursor: 'pointer',
                                                        background: v.supportStatus === 'Support' ? 'rgba(34, 197, 94, 0.2)' : v.supportStatus === 'Oppose' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                                                        color: v.supportStatus === 'Support' ? '#4ADE80' : v.supportStatus === 'Oppose' ? '#F87171' : '#94A3B8',
                                                        width: '100%'
                                                    }}
                                                >
                                                    <option value="Support">ग्रीन- फेवर</option>
                                                    <option value="Neutral">ग्रे- न्यूट्रल</option>
                                                    <option value="Oppose">रेड- एंटी</option>
                                                </select>
                                            </td>

                                            <td className="no-print" style={{ padding: '16px', verticalAlign: 'top' }}>
                                                <button
                                                    onClick={() => {
                                                        setViewVoter({ ...v, family: [] });
                                                        setIsEditing(false);
                                                        setEditData(v);
                                                        setIsLoadingFamily(true);
                                                        getVoterWithFamily(v.id).then(fullData => {
                                                            if (fullData) {
                                                                setViewVoter(fullData);
                                                                setEditData(fullData);
                                                            }
                                                            setIsLoadingFamily(false);
                                                        });
                                                    }}
                                                    style={{
                                                        padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155',
                                                        background: 'transparent', color: '#94A3B8', fontSize: '12px', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '4px'
                                                    }}>
                                                    <Eye size={14} /> ऑप्शन और एडिट
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                            {voters.length === 0 && (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                                    कोई डेटा नहीं मिला
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            < div className="no-print" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px', marginBottom: '40px' }}>
                <button onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={pagination.currentPage === 1} style={{ padding: '10px 20px', borderRadius: '12px', background: 'white', border: '1px solid #E2E8F0', cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer', opacity: pagination.currentPage === 1 ? 0.5 : 1 }}>
                    Previous
                </button>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                    Page {pagination.currentPage} of {pagination.totalPages || 1}
                </div>
                <button onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))} disabled={pagination.currentPage >= pagination.totalPages} style={{ padding: '10px 20px', borderRadius: '12px', background: 'white', border: '1px solid #E2E8F0', cursor: pagination.currentPage >= pagination.totalPages ? 'not-allowed' : 'pointer', opacity: pagination.currentPage >= pagination.totalPages ? 0.5 : 1 }}>
                    Next
                </button>
            </div >

            {/* Modal (View Details) */}
            {
                viewVoter && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
                        <div style={{ background: 'white', width: '90%', maxWidth: '900px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #F8FAFC, white)' }}>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>{viewVoter.name}</h2>
                                    <div style={{ color: '#64748B', fontSize: '14px', fontWeight: '500' }}>EPIC: <span style={{ fontFamily: 'monospace', color: '#4338CA' }}>{viewVoter.epic}</span></div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {!isEditing ? (
                                        <button onClick={() => setIsEditing(true)} style={{ ...glassButtonStyle, background: '#4338CA', color: 'white', border: 'none' }}>
                                            <Edit2 size={16} /> एडिट (Edit)
                                        </button>
                                    ) : (
                                        <button onClick={handleSaveEdit} disabled={isSaving} style={{ ...glassButtonStyle, background: '#059669', color: 'white', border: 'none' }}>
                                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} सुरक्षित करें (Save)
                                        </button>
                                    )}
                                    <button onClick={() => { setViewVoter(null); setIsEditing(false); }} style={{ background: '#F1F5F9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}><X size={20} color="#64748B" /></button>
                                </div>
                            </div>
                            <div style={{ padding: '32px', overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                                    {/* Column 1: Personal Info */}
                                    <div>
                                        <h4 style={{ fontWeight: '800', marginBottom: '16px', color: '#334155', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <User size={14} /> Personal Information
                                            {isEditing && <span style={{ color: '#4338CA', fontSize: '10px' }}>(Editing Mode)</span>}
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                            {!isEditing ? (
                                                <>
                                                    <InfoBox label="Father/Husband" value={viewVoter.relativeName} />
                                                    <InfoBox label="Age / Gender" value={`${viewVoter.age} Yrs, ${viewVoter.gender}`} />
                                                    <InfoBox label="Mobile" value={viewVoter.mobile || '---'} />
                                                    <InfoBox label="वर्ग / जाति (Category / Caste)" value={`${viewVoter.casteCategory || ''} ${viewVoter.caste ? `(${viewVoter.caste})` : ''}`.trim() || 'N/A'} />
                                                    <InfoBox label="Village" value={viewVoter.village} />
                                                    <InfoBox label="Booth Number" value={viewVoter.boothNumber} />
                                                </>
                                            ) : (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>FULL NAME</label>
                                                        <input style={{ ...inputStyle, padding: '10px' }} value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>RELATIVE NAME</label>
                                                        <input style={{ ...inputStyle, padding: '10px' }} value={editData.relativeName || ''} onChange={(e) => setEditData({ ...editData, relativeName: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>EPIC NUMBER</label>
                                                        <input style={{ ...inputStyle, padding: '10px' }} value={editData.epic || ''} onChange={(e) => setEditData({ ...editData, epic: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>RELATION</label>
                                                        <select style={{ ...inputStyle, padding: '10px' }} value={editData.relationType || 'Father'} onChange={(e) => setEditData({ ...editData, relationType: e.target.value })}>
                                                            <option value="Father">Father</option>
                                                            <option value="Husband">Husband</option>
                                                            <option value="Mother">Mother</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>AGE</label>
                                                        <input style={{ ...inputStyle, padding: '10px' }} type="number" value={editData.age || ''} onChange={(e) => setEditData({ ...editData, age: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>GENDER</label>
                                                        <select style={{ ...inputStyle, padding: '10px' }} value={editData.gender || 'M'} onChange={(e) => setEditData({ ...editData, gender: e.target.value })}>
                                                            <option value="M">Male</option>
                                                            <option value="F">Female</option>
                                                            <option value="O">Other</option>
                                                        </select>
                                                    </div>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>MOBILE NUMBER</label>
                                                        <input style={{ ...inputStyle, padding: '10px' }} value={editData.mobile || ''} onChange={(e) => setEditData({ ...editData, mobile: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>HOUSE NO</label>
                                                        <input style={{ ...inputStyle, padding: '10px' }} value={editData.houseNumber || ''} onChange={(e) => setEditData({ ...editData, houseNumber: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>VILLAGE/WARD</label>
                                                        <input style={{ ...inputStyle, padding: '10px' }} value={editData.village || ''} onChange={(e) => setEditData({ ...editData, village: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>वर्ग (CATEGORY)</label>
                                                        <select
                                                            style={{ ...inputStyle, padding: '10px' }}
                                                            value={editData.casteCategoryKey || ''}
                                                            onChange={(e) => {
                                                                const selectedKey = e.target.value;
                                                                const dbCat = selectedKey.includes('OBC') ? 'OBC' : selectedKey.includes('SC') ? 'SC' : selectedKey.includes('ST') ? 'ST' : selectedKey.includes('Muslim') ? 'Muslim' : selectedKey.includes('General') ? 'General' : '';
                                                                setEditData({ ...editData, casteCategoryKey: selectedKey, casteCategory: dbCat, caste: '' });
                                                            }}
                                                        >
                                                            <option value="">--चुनें--</option>
                                                            {Object.keys(CASTE_OPTIONS).map(k => <option key={k} value={k}>{k}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>जाति (CASTE)</label>
                                                        <select
                                                            style={{ ...inputStyle, padding: '10px' }}
                                                            value={editData.caste || ''}
                                                            disabled={!editData.casteCategoryKey}
                                                            onChange={(e) => setEditData({ ...editData, caste: e.target.value })}
                                                        >
                                                            <option value="">--चुनें--</option>
                                                            {editData.casteCategoryKey && CASTE_OPTIONS[editData.casteCategoryKey]?.map((c: string) => (
                                                                <option key={c} value={c}>{c}</option>
                                                            ))}
                                                            {editData.caste && editData.casteCategoryKey && !CASTE_OPTIONS[editData.casteCategoryKey]?.includes(editData.caste) && (
                                                                <option value={editData.caste}>{editData.caste}</option>
                                                            )}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 2: Operational Data & Family */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                                            <h4 style={{ fontWeight: '800', marginBottom: '16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Users size={16} /> Family ({viewVoter.family?.length || 0})
                                            </h4>

                                            {/* Family Add Search */}
                                            <div style={{ position: 'relative', marginBottom: '16px' }}>
                                                <Search size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
                                                <input
                                                    placeholder="परिवार में सदस्य जोड़ें (नाम/EPIC)..."
                                                    value={familySearch}
                                                    onChange={(e) => handleFamilySearch(e.target.value)}
                                                    style={{ ...inputStyle, padding: '10px 10px 10px 34px', fontSize: '12px' }}
                                                />
                                                {familyResults.length > 0 && (
                                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '12px', zIndex: 10, marginTop: '4px', border: '1px solid #E2E8F0', maxHeight: '200px', overflowY: 'auto' }}>
                                                        {familyResults.map(r => (
                                                            <div key={r.id} onClick={() => handleAddToFamilyAction(r.id)} style={{ padding: '10px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', fontSize: '13px' }}>
                                                                <div style={{ fontWeight: '700' }}>{r.name}</div>
                                                                <div style={{ fontSize: '11px', color: '#64748B' }}>{r.relativeName} | Booth {r.boothNumber}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {isLoadingFamily ? <Loader2 className="animate-spin" /> : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {viewVoter.family?.map((f: any) => (
                                                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', opacity: f.id === viewVoter.id ? 0.7 : 1 }}>
                                                            <div>
                                                                <span style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>{f.name}</span>
                                                                <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>{f.age} Yrs, {f.relationType}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.supportStatus === 'Support' ? '#22C55E' : f.supportStatus === 'Oppose' ? '#EF4444' : '#CBD5E1' }}></div>
                                                                {f.id !== viewVoter.id && (
                                                                    <button onClick={() => handleRemoveFromFamilyAction(f.id)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}>
                                                                        <UserMinus size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                                            <h4 style={{ fontWeight: '800', marginBottom: '16px', color: '#334155' }}>Operational Data</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div>
                                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>POLL DAY STATUS</label>
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                        <button
                                                            onClick={async () => {
                                                                const newVal = !editData.isVoted;
                                                                setEditData({ ...editData, isVoted: newVal });
                                                                if (!isEditing) {
                                                                    try {
                                                                        await updateVoter(viewVoter.id, { isVoted: newVal });
                                                                    } catch (e: any) {
                                                                        alert(e.message);
                                                                    }
                                                                }
                                                            }}
                                                            style={{
                                                                flex: 1, padding: '10px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '13px',
                                                                background: editData.isVoted ? '#DCFCE7' : '#F1F5F9',
                                                                color: editData.isVoted ? '#166534' : '#64748B',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {editData.isVoted ? '✅ VOTED' : '❌ NOT VOTED'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {!isEditing ? (
                                                    <>
                                                        <InfoBox label="Support Status" value={viewVoter.supportStatus} />
                                                        <InfoBox label="Verification" value={viewVoter.verificationStatus} />
                                                        <InfoBox label="Notes" value={viewVoter.notes} />
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>SUPPORT STATUS</label>
                                                            <select style={{ ...inputStyle, padding: '10px' }} value={editData.supportStatus} onChange={(e) => setEditData({ ...editData, supportStatus: e.target.value })}>
                                                                <option value="Support">Favor</option>
                                                                <option value="Neutral">Neutral</option>
                                                                <option value="Oppose">Anti</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>NOTES</label>
                                                            <textarea style={{ ...inputStyle, padding: '10px', height: '80px', resize: 'none' }} value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                                        <button onClick={handleSaveEdit} disabled={isSaving} style={{ flex: 1, background: '#4338CA', color: 'white', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            {isSaving && <Loader2 className="animate-spin" size={20} />} सुरक्षित करें (Save Changes)
                                        </button>
                                        <button onClick={() => setIsEditing(false)} style={{ flex: 1, background: '#F1F5F9', color: '#64748B', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: '800', cursor: 'pointer' }}>
                                            कैंसिल (Cancel)
                                        </button>
                                    </div>
                                )}

                                <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #E2E8F0' }}>
                                    <h4 style={{ fontWeight: '800', marginBottom: '16px', color: '#0F172A', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ background: '#FEE2E2', padding: '6px', borderRadius: '8px' }}><ShieldCheck size={18} color="#E11D48" /></div>
                                        ECI समन्वय (Voter List Cleanup)
                                    </h4>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            disabled={isSaving}
                                            onClick={() => handleUpdateEciStatus(viewVoter.id, 'CORRECTION_REQUIRED')}
                                            style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #FFE4E6', background: '#FFF1F2', color: '#E11D48', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            <UserMinus size={18} /> ECI से हटवाएं (Fake / Dead / Moved)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* ADD VOTER MODAL (ECI MISSING) */}
            {
                isAddModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
                        <div style={{ background: 'white', width: '90%', maxWidth: '600px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{lang === 'hi' ? 'ECI में नाम जुड़वाएं (Missing)' : 'Add to ECI List'}</h2>
                                <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748B" /></button>
                            </div>
                            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ background: '#FFF1F2', padding: '12px', borderRadius: '12px', fontSize: '12px', color: '#E11D48', fontWeight: '600', display: 'flex', gap: '8px' }}>
                                    <AlertTriangle size={16} /> {lang === 'hi' ? 'सूचना: यह व्यक्ति जो वास्तव में है पर मतदाता सूची में नहीं है' : 'Note: This person is really present but missing in voter list'}
                                </div>

                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'मतदाता का नाम' : 'Voter Name'}</label>
                                    <input style={inputStyle} placeholder={lang === 'hi' ? 'नाम लिखें...' : 'Type name...'} value={newVoter.name} onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'उम्र' : 'Age'}</label>
                                        <input style={inputStyle} placeholder="Eg. 25" type="number" value={newVoter.age} onChange={(e) => setNewVoter({ ...newVoter, age: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'लिंग' : 'Gender'}</label>
                                        <select style={inputStyle} value={newVoter.gender} onChange={(e) => setNewVoter({ ...newVoter, gender: e.target.value })}>
                                            <option value="M">{lang === 'hi' ? 'पुरुष (Male)' : 'Male'}</option>
                                            <option value="F">{lang === 'hi' ? 'महिला (Female)' : 'Female'}</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'रिश्ता' : 'Relation'}</label>
                                        <select style={inputStyle} value={newVoter.relationshipType} onChange={(e) => setNewVoter({ ...newVoter, relationshipType: e.target.value })}>
                                            <option value="">{lang === 'hi' ? '--चुनें--' : '--Select--'}</option>
                                            <option value="Father">{lang === 'hi' ? 'पिता (Father)' : 'Father'}</option>
                                            <option value="Husband">{lang === 'hi' ? 'पति (Husband)' : 'Husband'}</option>
                                            <option value="Mother">{lang === 'hi' ? 'माता (Mother)' : 'Mother'}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'रिश्तेदार का नाम' : 'Relative Name'}</label>
                                        <input style={inputStyle} placeholder={lang === 'hi' ? 'नाम लिखें...' : 'Type relative name...'} value={newVoter.relativeName} onChange={(e) => setNewVoter({ ...newVoter, relativeName: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}</label>
                                        <input style={inputStyle} placeholder="9911..." value={newVoter.mobile} onChange={(e) => setNewVoter({ ...newVoter, mobile: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'EPIC (वोटर आईडी)' : 'EPIC (Voter ID)'}</label>
                                        <input style={inputStyle} placeholder="---N/A---" value={newVoter.epic} onChange={(e) => setNewVoter({ ...newVoter, epic: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'गांव/वार्ड' : 'Village/Ward'}</label>
                                        <input style={inputStyle} placeholder={lang === 'hi' ? 'गांव का नाम' : 'Village name'} value={newVoter.village} onChange={(e) => setNewVoter({ ...newVoter, village: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'बूथ संख्या' : 'Booth Number'}</label>
                                        <input style={inputStyle} disabled={effectiveWorkerType === 'BOOTH_MANAGER'} placeholder="Eg. 45" type="number" value={newVoter.boothNumber} onChange={(e) => setNewVoter({ ...newVoter, boothNumber: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'मकान नंबर' : 'House Number'}</label>
                                        <input style={inputStyle} placeholder="Eg. 12/B" value={newVoter.houseNumber} onChange={(e) => setNewVoter({ ...newVoter, houseNumber: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'पता (Address)' : 'Address'}</label>
                                        <input style={inputStyle} placeholder={lang === 'hi' ? 'गली/मोहल्ला' : 'Full address'} value={newVoter.address} onChange={(e) => setNewVoter({ ...newVoter, address: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>वर्ग (Category)</label>
                                        <select
                                            style={inputStyle}
                                            value={newVoter.casteCategoryKey || ''}
                                            onChange={(e) => {
                                                const selectedKey = e.target.value;
                                                const dbCat = selectedKey.includes('OBC') ? 'OBC' : selectedKey.includes('SC') ? 'SC' : selectedKey.includes('ST') ? 'ST' : selectedKey.includes('Muslim') ? 'Muslim' : selectedKey.includes('General') ? 'General' : '';
                                                setNewVoter({ ...newVoter, casteCategoryKey: selectedKey, casteCategory: dbCat, caste: '' });
                                            }}
                                        >
                                            <option value="">--चुनें--</option>
                                            {Object.keys(CASTE_OPTIONS).map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>जाति (Caste)</label>
                                        <select
                                            style={inputStyle}
                                            value={newVoter.caste || ''}
                                            disabled={!newVoter.casteCategoryKey}
                                            onChange={(e) => setNewVoter({ ...newVoter, caste: e.target.value })}
                                        >
                                            <option value="">--चुनें--</option>
                                            {newVoter.casteCategoryKey && CASTE_OPTIONS[newVoter.casteCategoryKey]?.map((c: string) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '12px', display: 'block' }}>{lang === 'hi' ? 'वोटर का मूड (नजरिया)' : 'Voter Mood (Feedback)'}</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {['Support', 'Neutral', 'Oppose'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setNewVoter({ ...newVoter, supportStatus: status })}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    border: '2px solid',
                                                    borderColor: newVoter.supportStatus === status
                                                        ? (status === 'Support' ? '#22C55E' : status === 'Oppose' ? '#EF4444' : '#64748B')
                                                        : '#E2E8F0',
                                                    background: newVoter.supportStatus === status
                                                        ? (status === 'Support' ? '#DCFCE7' : status === 'Oppose' ? '#FEE2E2' : '#F1F5F9')
                                                        : 'white',
                                                    color: newVoter.supportStatus === status
                                                        ? (status === 'Support' ? '#166534' : status === 'Oppose' ? '#991B1B' : '#334155')
                                                        : '#64748B',
                                                    fontWeight: '700',
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {status === 'Support' ? (lang === 'hi' ? '✅ पक्ष (Favor)' : '✅ Favor') :
                                                    status === 'Oppose' ? (lang === 'hi' ? '❌ विपक्ष (Anti)' : '❌ Anti') :
                                                        (lang === 'hi' ? '⚪ न्यूट्रल' : '⚪ Neutral')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    disabled={isSaving}
                                    onClick={handleAddVoterSubmit}
                                    style={{ background: '#0D9488', color: 'white', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: '800', cursor: 'pointer', marginTop: '12px' }}>
                                    {isSaving ? (lang === 'hi' ? 'प्रक्रिया जारी है...' : 'Processing...') : (lang === 'hi' ? 'जुड़वाने के लिए भेजें (Send for Enrollment)' : 'Send for Enrollment')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
