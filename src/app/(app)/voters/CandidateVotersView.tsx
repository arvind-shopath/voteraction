/**
 * 🛡️ [PROTECTED] CANDIDATE VIEW - VOTER LIST
 * ⚠️ DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER CONSENT.
 * This is a stable, premium component isolated for Candidate/Manager roles.
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Filter, Users, MapPin, Phone, Edit2, Eye, User, Home, ChevronDown, ChevronUp, X, Loader2, Share2, Crown, Activity, Star, Printer, UserPlus, CheckCircle } from 'lucide-react';
import { getVoters, getFilterOptions, updateVoterFeedback, updateVoter, getVoterWithFamily, createVoter, verifyVoter, deleteVoter, getVoterEditRequests, approveVoterEditRequest, rejectVoterEditRequest, addToFamily, removeFromFamily, searchVotersForFamily, requestEciDeletion } from '@/app/actions/voters';
import { useView } from '@/context/ViewContext';
import { getWorkerBooth } from '@/app/actions/worker';
import { Clock, Check, AlertCircle, CloudDownload, RefreshCw, WifiOff, Save, Trash2, UserMinus } from 'lucide-react';
import { saveVotersLocally, getLocalVoters, updateLocalVoter, searchLocalVoters } from '@/lib/voter-store';
import { SearchableSelect } from '@/components/SearchableSelect';

// --- STYLES & SUB-COMPONENTS (HOISTED) ---
// ... (omitting repeated styles for brevity if needed, but tool needs exact match or full block)

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

const CASTE_OPTIONS: any = {
    'सामान्य (General)': ['ब्राह्मण', 'ठाकुर (राजपूत)', 'बनिया', 'लाला (कायस्थ)', 'त्यागी', 'भूमिहार', 'अन्य'],
    'ओबीसी (OBC)': ['यादव', 'कुर्मी', 'कुशवाहा', 'मौर्य', 'लोध', 'जाट', 'गुज्जर', 'सैनी', 'विश्वकर्मा', 'प्रजापति', 'प्रजापति/कुम्हार', 'अन्य'],
    'एससी (SC)': ['जाटव', 'पासी', 'धोबी', 'कोरी', 'वाल्मीकि', 'अन्य'],
    'एसटी (ST)': ['गोंद', 'खरवार', 'सहारिया', 'अन्य'],
    'मुस्लिम (Muslim)': ['अंसारी', 'कुरैशी', 'शेख', 'पठान', 'सैय्यद', 'मंसूरी', 'अन्य']
};

export const getCategoryKey = (cat?: string | null, casteVal?: string | null) => {
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

export const formatVoterForEdit = (v: any) => {
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

const InfoBox = ({ label, value }: any) => (
    <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{value || 'N/A'}</div>
    </div>
);

/**
 * 🧡 CANDIDATE VIEW - VOTER LIST
 */
export default function CandidateVotersView() {
    const { data: session }: any = useSession();
    const assemblyId = session?.user?.assemblyId;
    const { effectiveRole, effectiveWorkerType } = useView();
    const role = effectiveRole || (session?.user as any)?.role;
    const workerType = effectiveWorkerType || (session?.user as any)?.workerType;
    const isBoothManager = workerType === 'BOOTH_MANAGER';
    const [assignedBooth, setAssignedBooth] = useState<any>(null);

    const [lang, setLang] = useState('hi');

    useEffect(() => {
        const savedLang = localStorage.getItem('app_lang');
        if (savedLang) setLang(savedLang);
    }, []);

    const t = {
        title: lang === 'hi' ? 'मतदाता सूची' : 'Voter List',
        totalVoters: lang === 'hi' ? 'कुल मतदाता' : 'Total Voters',
        searchPlaceholder: lang === 'hi' ? 'खोजें (नाम, फोन, EPIC)...' : 'Search (Name, Phone, EPIC)...',
        allBooths: lang === 'hi' ? 'सभी बूथ' : 'All Booths',
        allVillages: lang === 'hi' ? 'सभी गांव' : 'All Villages',
        allPanna: lang === 'hi' ? 'सभी पन्ना प्रमुख' : 'All Page Leads',
        allCaste: lang === 'hi' ? 'सभी जाति' : 'All Castes',
        allFamily: lang === 'hi' ? 'सभी परिवार' : 'All Families',
        allAge: lang === 'hi' ? 'सभी आयु' : 'All Ages',
        allGender: lang === 'hi' ? 'सभी लिंग' : 'All Genders',
        allStatus: lang === 'hi' ? 'सभी स्थिति' : 'All Status',
        filters: lang === 'hi' ? 'फिल्टर' : 'Filters',
        print: lang === 'hi' ? 'प्रिंट' : 'Print',
        addVoter: lang === 'hi' ? '+ वोटर' : '+ Voter',
        approvals: lang === 'hi' ? 'अनुमोदन' : 'Approvals',
        syncing: lang === 'hi' ? 'सिंक हो रहा है...' : 'Syncing...',
        male: lang === 'hi' ? 'पुरुष' : 'Male',
        female: lang === 'hi' ? 'महिला' : 'Female',
        other: lang === 'hi' ? 'अन्य' : 'Other',
        favor: lang === 'hi' ? 'पक्ष' : 'Favor',
        neutral: lang === 'hi' ? 'न्यूट्रल' : 'Neutral',
        anti: lang === 'hi' ? 'विपक्ष' : 'Against',
        head: lang === 'hi' ? 'मुखिया' : 'Head',
        pwd: lang === 'hi' ? 'दिव्यांग' : 'PwD',
        vip: lang === 'hi' ? 'वीआईपी' : 'VIP',
        voted: lang === 'hi' ? 'वोट दिया' : 'Voted',
        results: lang === 'hi' ? 'परिणाम' : 'Results',
        next: lang === 'hi' ? 'अगला' : 'Next',
        prev: lang === 'hi' ? 'पिछला' : 'Prev'
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

    // Add Voter State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addVoterCardType, setAddVoterCardType] = useState<'HAS_CARD' | 'MAKE_CARD'>('HAS_CARD');
    const [newVoter, setNewVoter] = useState<any>({
        name: '', age: '', gender: 'M', relativeName: '', relationshipType: '',
        mobile: '', epic: '', village: '', boothNumber: '', houseNumber: '', address: '',
        supportStatus: 'Neutral', caste: '', subCaste: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    // ECI Deletion Modal State
    const [deleteEciModalVoter, setDeleteEciModalVoter] = useState<any | null>(null);
    const [deleteReason, setDeleteReason] = useState('मृत्यु (Deceased)');
    const [deleteNotes, setDeleteNotes] = useState('');
    const [isSubmittingEciDelete, setIsSubmittingEciDelete] = useState(false);

    useEffect(() => {
        if (isBoothManager && session?.user?.boothNumber) {
            setNewVoter(prev => ({ ...prev, boothNumber: session.user.boothNumber.toString() }));
        }
    }, [isBoothManager, session]);

    // Approvals State
    const [isApprovalsModalOpen, setIsApprovalsModalOpen] = useState(false);
    const [approvalTab, setApprovalTab] = useState<'NEW' | 'EDIT'>('NEW');
    const [pendingNewVoters, setPendingNewVoters] = useState<any[]>([]);
    const [editRequests, setEditRequests] = useState<any[]>([]);
    const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);

    const fetchApprovals = async () => {
        setIsLoadingApprovals(true);
        try {
            if (assemblyId) {
                // 1. Pending New Voters
                const newVoters = await getVoters({ assemblyId, verificationStatus: 'PENDING', pageSize: 100 });
                setPendingNewVoters(newVoters.voters);

                // 2. Edit Requests
                const edits = await getVoterEditRequests(assemblyId);
                setEditRequests(edits);
            }
        } finally {
            setIsLoadingApprovals(false);
        }
    };

    const handleVerifyNewVoter = async (id: number) => {
        if (!confirm('क्या आप इस वोटर को Confirm करना चाहते हैं?')) return;
        await verifyVoter(id);
        fetchApprovals();
        fetchVoters(); // Update main list
        // Background Sync: Trigger offline data update
        handleFullDownload();
    };

    const handleRejectNewVoter = async (id: number) => {
        if (!confirm('क्या आप इस वोटर को Reject करना चाहते हैं?')) return;
        await deleteVoter(id);
        fetchApprovals();
    };

    const handleApproveEdit = async (id: number) => {
        if (!confirm('क्या आप इस बदलाव को Approve करना चाहते हैं?')) return;
        await approveVoterEditRequest(id);
        fetchApprovals();
        fetchVoters();
        // Background Sync: Trigger offline data update
        handleFullDownload();
    };

    const handleRejectEdit = async (reqId: number) => {
        if (!confirm('क्या आप इन बदलावों को Reject करना चाहते हैं?')) return;
        await rejectVoterEditRequest(reqId);
        fetchApprovals();
    };

    const handleSaveEdit = async () => {
        if (!viewVoter) return;
        setIsSaving(true);
        try {
            await updateVoter(viewVoter.id, editData);
            const userRole = (session?.user as any)?.role;
            const isWorker = userRole === 'WORKER' || effectiveRole === 'WORKER';

            // If worker, changes are pending. If admin/candidate, changes are direct.
            if (['ADMIN', 'SUPERADMIN', 'CANDIDATE'].includes(userRole || effectiveRole)) {
                alert('बदलाव सुरक्षित कर दिए गए हैं।');
                setViewVoter({ ...viewVoter, ...editData });
                fetchVoters();
            } else {
                alert('संपादन अनुरोध भेज दिया गया है (Pending Approval)।');
            }
            setIsEditing(false);
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
            // Refresh family
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
            // Refresh family
            const fullData = await getVoterWithFamily(viewVoter.id);
            if (fullData) setViewVoter(fullData);
        } catch (error) {
            alert('Error removing from family');
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
        castes: [], subCastes: [], surnames: [], villages: [], booths: [], parties: [], pannaPramukhs: []
    });

    const [filters, setFilters] = useState({
        search: '', booth: 'सभी बूथ', boothName: 'सभी बूथ नाम', status: 'सभी स्थिति', contactStatus: 'सभी', gender: 'सभी', village: 'सभी गांव',
        casteCategory: 'सभी वर्ग', caste: 'सभी जाति', subCaste: 'सभी उपजाति', surname: 'सभी उपनाम',
        familySize: 'सभी परिवार', ageFilter: 'सभी आयु', pannaId: 'सभी पन्ना प्रमुख',
        isHead: false, isPwD: false, isImportant: false, isVoted: 'All', votedPartyId: '',
        page: 1, pageSize: 50
    });


    useEffect(() => {
        if (assemblyId) {
            getFilterOptions(assemblyId).then((res) => {
                setOptions(res);
            });
        }
    }, [assemblyId]);

    // Booth Manager logic: Lock filter to assigned booth
    useEffect(() => {
        if (isBoothManager && session?.user?.id) {
            getWorkerBooth(parseInt(session.user.id), assemblyId).then(booth => {
                if (booth) {
                    setAssignedBooth(booth);
                    setFilters(prev => ({ ...prev, booth: booth.number.toString() }));
                    setNewVoter(prev => ({ ...prev, boothNumber: booth.number.toString() }));
                }
            });
        }
    }, [isBoothManager, session?.user?.id, assemblyId]);

    const selectedBoothNum = filters.booth !== 'सभी बूथ' ? parseInt(filters.booth) : null;
    const selectedVillageName = filters.village !== 'सभी गांव' ? filters.village : null;

    const availableVillages = useMemo(() => {
        let vList = options.villages || [];
        if (selectedBoothNum && Array.isArray(options.villageBooths)) {
            const matches = options.villageBooths
                .filter((vb: any) => vb.boothNumber === selectedBoothNum)
                .map((vb: any) => vb.village);
            if (matches.length > 0) {
                vList = vList.filter((vName: string) => matches.includes(vName));
            }
        }
        return vList;
    }, [options.villages, options.villageBooths, selectedBoothNum]);

    const availableBooths = useMemo(() => {
        let bList = options.booths || [];
        if (selectedVillageName && Array.isArray(options.villageBooths)) {
            const matchedBoothNums = options.villageBooths
                .filter((vb: any) => vb.village === selectedVillageName)
                .map((vb: any) => vb.boothNumber);
            if (matchedBoothNums.length > 0) {
                bList = bList.filter((b: any) => typeof b === 'object' ? matchedBoothNums.includes(b.number) : matchedBoothNums.includes(parseInt(b)));
            }
        }
        return bList;
    }, [options.booths, options.villageBooths, selectedVillageName]);

    // Fetch Voters
    const fetchOptions = async () => {
        if (assemblyId) {
            const res = await getFilterOptions(assemblyId);
            setOptions(res);
        }
    };

    const fetchVoters = async () => {
        if (!assemblyId) return;
        setLoading(true);
        const isOnline = navigator.onLine;
        setIsOfflineMode(!isOnline);

        try {
            const payload = {
                ...filters,
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

                // Background Sync: Save these to local store
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
            console.error("Candidate fetch failed:", error);
            const localData = await getLocalVoters(filters.booth !== 'सभी बूथ' ? filters.booth : undefined);
            if (localData.length > 0) {
                setVoters(localData);
                setIsOfflineMode(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFullDownload = async () => {
        if (!assemblyId || isDownloading) return;

        // AUTO-SYNC: Made silent (no confirm/alert) for a true "auto" experience
        setIsDownloading(true);
        try {
            const result = await getVoters({
                assemblyId,
                booth: filters.booth !== 'सभी बूथ' ? filters.booth : undefined,
                pageSize: 10000,
                page: 1
            });

            if (result.voters.length > 0) {
                await saveVotersLocally(result.voters);
                // Removed alert for seamless auto experience
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
            fetchOptions();
            const timeoutId = setTimeout(() => {
                fetchVoters();
                // AUTO-SYNC: Trigger silent background sync on mount
                handleFullDownload();
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [
        assemblyId, filters.page, filters.search, filters.booth, filters.status, filters.contactStatus, filters.gender, filters.village,
        filters.casteCategory, filters.caste, filters.subCaste, filters.surname, filters.familySize, filters.ageFilter, filters.pannaId,
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
        setIsSaving(true);
        try {
            await createVoter({ ...newVoter, assemblyId });
            setIsAddModalOpen(false);
            setNewVoter({
                name: '', age: '', gender: 'M', relativeName: '', relationshipType: '',
                mobile: '', epic: '', village: '', boothNumber: '', houseNumber: '', address: '',
                supportStatus: 'Neutral', caste: '', subCaste: ''
            });
            fetchVoters(); // Refresh list
        } catch (error) {
            console.error(error);
            alert('Error creating voter');
        } finally {
            setIsSaving(false);
        }
    };

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.search && filters.search.trim() !== '') count++;
        if (filters.booth && filters.booth !== 'सभी बूथ' && (!isBoothManager || (assignedBooth && filters.booth !== assignedBooth.number.toString()))) count++;
        if (filters.boothName && filters.boothName !== 'सभी बूथ नाम') count++;
        if (filters.status && filters.status !== 'सभी स्थिति') count++;
        if (filters.contactStatus && filters.contactStatus !== 'सभी') count++;
        if (filters.gender && filters.gender !== 'सभी') count++;
        if (filters.village && filters.village !== 'सभी गांव') count++;
        if (filters.casteCategory && filters.casteCategory !== 'सभी वर्ग') count++;
        if (filters.caste && filters.caste !== 'सभी जाति') count++;
        if (filters.subCaste && filters.subCaste !== 'सभी उपजाति') count++;
        if (filters.surname && filters.surname !== 'सभी उपनाम') count++;
        if (filters.familySize && filters.familySize !== 'सभी परिवार') count++;
        if (filters.ageFilter && filters.ageFilter !== 'सभी आयु') count++;
        if (filters.pannaId && filters.pannaId !== 'सभी पन्ना प्रमुख') count++;
        if (filters.isHead) count++;
        if (filters.isPwD) count++;
        if (filters.isImportant) count++;
        if (filters.isVoted && filters.isVoted !== 'All') count++;
        if (filters.votedPartyId && filters.votedPartyId !== '') count++;
        return count;
    }, [filters, isBoothManager, assignedBooth]);

    const handleClearFilters = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setFilters({
            search: '',
            booth: isBoothManager && assignedBooth ? assignedBooth.number.toString() : 'सभी बूथ',
            boothName: 'सभी बूथ नाम',
            status: 'सभी स्थिति',
            contactStatus: 'सभी',
            gender: 'सभी',
            village: 'सभी गांव',
            casteCategory: 'सभी वर्ग',
            caste: 'सभी जाति',
            subCaste: 'सभी उपजाति',
            surname: 'सभी उपनाम',
            familySize: 'सभी परिवार',
            ageFilter: 'सभी आयु',
            pannaId: 'सभी पन्ना प्रमुख',
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
        <div style={{ paddingBottom: '100px', fontFamily: 'var(--font-geist-sans)', background: '#F1F5F9', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>

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
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', gap: isMobile ? '24px' : '0' }}>
                    <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9, marginBottom: '8px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                            <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px', backdropFilter: 'blur(5px)' }}>
                                मतदाता सूची (VOTER LIST)
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#CCFBF1' }}>सिकटा विधानसभा</div>
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
                        <button style={{ ...glassButtonStyle, flexShrink: 0, padding: isMobile ? '8px 16px' : '10px 20px' }} onClick={() => window.print()}>
                            <Printer size={16} /> <span style={{ fontSize: isMobile ? '13px' : '13px' }}>प्रिंट</span>
                        </button>
                        <button style={{ ...glassButtonStyle, background: 'white', color: '#0F766E', flexShrink: 0, padding: isMobile ? '8px 16px' : '10px 20px' }} onClick={() => setIsAddModalOpen(true)}>
                            <UserPlus size={16} /> <span style={{ fontSize: isMobile ? '11px' : '13px' }}>+ वोटर</span>
                        </button>
                        <button
                            onClick={() => { setIsApprovalsModalOpen(true); fetchApprovals(); }}
                            style={{
                                ...glassButtonStyle,
                                background: '#F59E0B',
                                color: 'white',
                                border: 'none',
                                boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)',
                                flexShrink: 0,
                                padding: isMobile ? '8px 16px' : '10px 20px'
                            }}
                        >
                            <Clock size={16} /> <span style={{ fontSize: isMobile ? '11px' : '13px' }}>Approvals</span>
                        </button>
                    </div>
                </div>

                {/* Active Filter Chips (Hindi) */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: isMobile ? '16px' : '24px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                    {filters.village !== 'सभी गांव' && <FilterChip label={filters.village} />}
                    {filters.caste !== 'सभी जाति' && <FilterChip label={filters.caste} />}
                    {filters.gender !== 'सभी' && <FilterChip label={filters.gender === 'M' ? 'पुरुष' : 'महिला'} />}
                    {filters.status !== 'सभी स्थिति' && <FilterChip label={filters.status} color={filters.status === 'Support' ? '#22C55E' : '#EF4444'} />}
                    {filters.ageFilter !== 'सभी आयु' && <FilterChip label={filters.ageFilter} />}
                    {filters.isHead && <FilterChip label="मुखिया" icon={<Crown size={12} />} />}
                </div>
            </div>

            <div style={{ padding: isMobile ? '0 12px' : '0 24px' }}>
                {/* 2. FILTERS */}
                <div className="no-print" style={{
                    background: 'white',
                    borderRadius: isMobile ? '16px' : '24px',
                    padding: isMobile ? '16px' : '24px',
                    boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)',
                    marginBottom: '24px',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isFilterExpanded ? '16px' : 0 }}>
                        <div onClick={() => setIsFilterExpanded(!isFilterExpanded)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <div style={{ background: '#F0FDFA', padding: '6px', borderRadius: '10px' }}><Filter size={18} color="#0D9488" /></div>
                            <h3 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#0F172A', margin: 0 }}>
                                फिल्टर (Filters)
                                {activeFilterCount > 0 && <span style={{ background: '#0D9488', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px' }}>{activeFilterCount}</span>}
                                {isOfflineMode && <span style={{ color: '#B91C1C', fontSize: '10px' }}>(Offline)</span>}
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
                            <div onClick={() => setIsFilterExpanded(!isFilterExpanded)} style={{ padding: '6px', background: '#F8FAFC', borderRadius: '50%', cursor: 'pointer' }}>
                                {isFilterExpanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                            </div>
                        </div>
                    </div>

                    {isFilterExpanded && (
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', animation: 'fadeIn 0.3s ease' }}>
                            {/* Search */}
                            <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} size={16} />
                                    <input name="search" placeholder={t.searchPlaceholder} value={filters.search} onChange={handleFilterChange}
                                        style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            {!isBoothManager && (
                                <SearchableSelect
                                    options={['सभी बूथ', ...availableBooths.map((b: any) => {
                                        if (typeof b === 'object') {
                                            const num = b.number;
                                            let name = (b.name || '').replace(/^(?:भाग|बूथ|Booth)\s*\d+\s*[\-\:]\s*/i, '').trim();
                                            return {
                                                label: name ? `बूथ ${num} - ${name}` : `बूथ ${num}`,
                                                value: String(num)
                                            };
                                        }
                                        return { label: `बूथ ${b}`, value: String(b) };
                                    })]}
                                    value={filters.booth}
                                    onChange={(val) => {
                                        const selectedNum = parseInt(val);
                                        let matchedName = 'सभी बूथ नाम';
                                        let validVillage = filters.village;
                                        if (!isNaN(selectedNum)) {
                                            const bObj = options.booths.find((b: any) => typeof b === 'object' && b.number === selectedNum);
                                            if (bObj && bObj.name) matchedName = bObj.name.replace(/^(?:भाग|बूथ|Booth)\s*\d+\s*[\-\:]\s*/i, '').trim();

                                            if (Array.isArray(options.villageBooths)) {
                                                const matches = options.villageBooths.filter((vb: any) => vb.boothNumber === selectedNum).map((vb: any) => vb.village);
                                                if (matches.length > 0 && !matches.includes(filters.village)) {
                                                    validVillage = 'सभी गांव';
                                                }
                                            }
                                        }
                                        setFilters(prev => ({ ...prev, booth: val, boothName: matchedName, village: validVillage, page: 1 }));
                                    }}
                                    placeholder={t.allBooths}
                                    searchPlaceholder="बूथ संख्या या नाम खोजें..."
                                />
                            )}

                            <SearchableSelect
                                options={['सभी बूथ नाम', ...availableBooths.map((b: any) => {
                                    const rawName = typeof b === 'object' ? b.name : b;
                                    return (rawName || '').replace(/^(?:भाग|बूथ|Booth)\s*\d+\s*[\-\:]\s*/i, '').trim();
                                }).filter(Boolean)]}
                                value={filters.boothName}
                                onChange={(val) => {
                                    let matchedNum = 'सभी बूथ';
                                    let validVillage = filters.village;
                                    if (val !== 'सभी बूथ नाम') {
                                        const bObj = options.booths.find((b: any) => typeof b === 'object' && (b.name === val || b.name?.endsWith(val)));
                                        if (bObj && bObj.number) {
                                            matchedNum = String(bObj.number);
                                            const num = bObj.number;
                                            if (Array.isArray(options.villageBooths)) {
                                                const matches = options.villageBooths.filter((vb: any) => vb.boothNumber === num).map((vb: any) => vb.village);
                                                if (matches.length > 0 && !matches.includes(filters.village)) {
                                                    validVillage = 'सभी गांव';
                                                }
                                            }
                                        }
                                    }
                                    setFilters(prev => ({ ...prev, boothName: val, booth: matchedNum, village: validVillage, page: 1 }));
                                }}
                                placeholder="बूथ का नाम"
                                searchPlaceholder="बूथ नाम खोजें..."
                            />

                            <SearchableSelect
                                options={['सभी गांव', ...availableVillages]}
                                value={filters.village}
                                onChange={(val) => {
                                    let validBooth = filters.booth;
                                    let validBoothName = filters.boothName;
                                    if (val !== 'सभी गांव' && Array.isArray(options.villageBooths)) {
                                        const matchedBoothNums = options.villageBooths.filter((vb: any) => vb.village === val).map((vb: any) => vb.boothNumber);
                                        if (matchedBoothNums.length > 0 && selectedBoothNum && !matchedBoothNums.includes(selectedBoothNum)) {
                                            validBooth = 'सभी बूथ';
                                            validBoothName = 'सभी बूथ नाम';
                                        }
                                    }
                                    setFilters(prev => ({ ...prev, village: val, booth: validBooth, boothName: validBoothName, page: 1 }));
                                }}
                                placeholder={t.allVillages}
                                searchPlaceholder="गांव/वार्ड खोजें..."
                            />

                            <SearchableSelect
                                options={[
                                    { label: t.allPanna, value: 'सभी पन्ना प्रमुख' },
                                    ...(options.pannaPramukhs
                                        ?.filter((p: any) => filters.booth === 'सभी बूथ' || !filters.booth || p.boothNumber === parseInt(filters.booth))
                                        .map((p: any) => ({ label: `${p.name}${p.boothNumber ? ` (बूथ #${p.boothNumber})` : ''}`, value: String(p.id) })) || [])
                                ]}
                                value={filters.pannaId}
                                onChange={(val) => setFilters(prev => ({ ...prev, pannaId: val, page: 1 }))}
                                placeholder={t.allPanna}
                                searchPlaceholder="पन्ना प्रमुख खोजें..."
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
                                    { label: t.allFamily, value: 'सभी परिवार' },
                                    { label: lang === 'hi' ? 'छोटा (1-3 सदस्य)' : 'Small (1-3)', value: '1-3' },
                                    { label: lang === 'hi' ? 'मध्यम (4-6 सदस्य)' : 'Medium (4-6)', value: '4-6' },
                                    { label: lang === 'hi' ? 'बड़ा (7+ सदस्य)' : 'Large (7+)', value: '7+' }
                                ]}
                                value={filters.familySize}
                                onChange={(val) => setFilters(prev => ({ ...prev, familySize: val, page: 1 }))}
                                placeholder={t.allFamily}
                                searchPlaceholder="परिवार साइज़ खोजें..."
                            />

                            <SearchableSelect
                                options={[
                                    { label: t.allAge, value: 'सभी आयु' },
                                    { label: lang === 'hi' ? 'पहली बार (18-24)' : 'First Time (18-24)', value: '18-24' },
                                    { label: lang === 'hi' ? 'युवा (25-35)' : 'Youth (25-35)', value: '25-35' },
                                    { label: lang === 'hi' ? 'मध्यम (36-60)' : 'Middle Aged (36-60)', value: '36-60' },
                                    { label: lang === 'hi' ? 'वरिष्ठ (60+)' : 'Senior (60+)', value: '60+' }
                                ]}
                                value={filters.ageFilter}
                                onChange={(val) => setFilters(prev => ({ ...prev, ageFilter: val, page: 1 }))}
                                placeholder={t.allAge}
                                searchPlaceholder="आयु वर्ग खोजें..."
                            />

                            <SearchableSelect
                                options={[
                                    { label: t.allGender, value: 'सभी' },
                                    { label: t.male, value: 'M' },
                                    { label: t.female, value: 'F' }
                                ]}
                                value={filters.gender}
                                onChange={(val) => setFilters(prev => ({ ...prev, gender: val, page: 1 }))}
                                placeholder={t.allGender}
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
                                    { label: t.allStatus, value: 'सभी स्थिति' },
                                    { label: `✅ ${t.favor}`, value: 'Support' },
                                    { label: `⚪ ${t.neutral}`, value: 'Neutral' },
                                    { label: `❌ ${t.anti}`, value: 'Oppose' }
                                ]}
                                value={filters.status}
                                onChange={(val) => setFilters(prev => ({ ...prev, status: val, page: 1 }))}
                                placeholder={t.allStatus}
                                searchPlaceholder="स्थिति खोजें..."
                            />

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                                <ToggleCheck name="isHead" checked={filters.isHead} onChange={handleFilterChange} label="मुखिया" icon="👑" />
                                <ToggleCheck name="isPwD" checked={filters.isPwD} onChange={handleFilterChange} label="दिव्यांग" icon="♿" />
                                <ToggleCheck name="isImportant" checked={filters.isImportant} onChange={handleFilterChange} label="VIP" icon="⭐" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Booth Manager Banner (Shown when a booth is selected) */}
                {filters.booth && filters.booth !== 'सभी बूथ' && (() => {
                    const bm = options.boothManagers?.find((b: any) => b.boothNumber === parseInt(filters.booth));
                    return bm ? (
                        <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1px solid #BFDBFE', borderRadius: '18px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px', boxShadow: '0 4px 12px rgba(37,99,235,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#2563EB', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px' }}>
                                    🏢
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>बूथ {filters.booth} इंचार्ज / बूथ मैनेजर</div>
                                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>{bm.name}</div>
                                </div>
                            </div>
                            {bm.mobile && (
                                <a href={`tel:${bm.mobile}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #93C5FD', padding: '8px 18px', borderRadius: '12px', color: '#1D4ED8', fontWeight: '800', fontSize: '13px', textDecoration: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                                    <Phone size={15} /> {bm.mobile}
                                </a>
                            )}
                        </div>
                    ) : (
                        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '14px', padding: '12px 18px', marginBottom: '20px', fontSize: '13px', color: '#92400E', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>⚠️</span> बूथ {filters.booth} पर अभी कोई बूथ मैनेजर नियुक्त नहीं है।
                        </div>
                    );
                })()}

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
                                (v.notes && v.notes.trim().length > 0)
                            );

                            return (
                                <div key={v.id} style={{ background: '#1E293B', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #334155' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span>{lang === 'hi' ? (v.nameHi || v.name) : (v.nameEn || v.name)} {v.age ? ` (${v.age})` : ''}</span>
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
                                            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>{v.epic}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '16px', fontSize: '12px', color: '#94A3B8' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '4px' }}>
                                            <MapPin size={10} style={{ marginTop: '2px', flexShrink: 0 }} />
                                            <div>
                                                <div style={{ color: '#E2E8F0', fontWeight: '500' }}>
                                                    {v.houseNumber ? `Makan Number- ${v.houseNumber}, ` : ''}{v.village || ''}
                                                </div>
                                                <div style={{ fontSize: '11px', marginTop: '1px' }}>
                                                    {v.area && v.village && v.area.startsWith(v.village)
                                                        ? v.area.substring(v.village.length).replace(/^[\s,]+/, '')
                                                        : (v.area || v.address || '').replace(/Makan Number-\s*.*?,/, '').trim()}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                            {v.mobile && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={10} /> {v.mobile}</span>
                                            )}
                                            {v.isHead && (
                                                <span style={badgeStyle('#F59E0B')}>Mukhiya</span>
                                            )}
                                        </div>
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
                                            style={{ width: '44px', height: '44px', borderRadius: '12px', border: '1px solid #334155', background: '#0F172A', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* DESKTOP TABLE VIEW */
                    <div className="voter-table-container responsive-table-wrapper" style={{ background: '#1E293B', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="voter-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', color: 'white' }}>
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
                                            (v.notes && v.notes.trim().length > 0)
                                        );

                                        return (
                                            <tr key={v.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s', background: '#1E293B' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#2C3E50'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = '#1E293B'}>

                                                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#F8FAFC', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span>{lang === 'hi' ? (v.nameHi || v.name) : (v.nameEn || v.name)} {v.age ? ` (${v.age})` : ''}</span>
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
                                                        ({(v.relationType === 'Mother' || v.relationshipType === 'Mother') ? 'माता' : ((v.relationType === 'Husband' || v.relationshipType === 'Husband') ? 'पति' : 'पिता')}) - {lang === 'hi' ? (v.relativeNameHi || v.relativeName) : (v.relativeNameEn || v.relativeName)}
                                                    </div>
                                                    {v.updatedByName && (
                                                        <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', marginBottom: '2px' }}>
                                                            संपर्ककर्ता: {v.updatedByName}
                                                        </div>
                                                    )}
                                                {(v.area || v.address || v.village) && (
                                                    <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '2px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                                                        <MapPin size={10} style={{ marginTop: '2px', flexShrink: 0 }} />
                                                        <div>
                                                            <div style={{ color: '#F8FAFC' }}>
                                                                {v.houseNumber ? `Makan Number- ${v.houseNumber}, ` : ''}{lang === 'hi' ? (v.villageHi || v.village) : (v.villageEn || v.village)}
                                                            </div>
                                                            <div style={{ fontSize: '11px', marginTop: '1px' }}>
                                                                {v.area && v.village && v.area.startsWith(v.village)
                                                                    ? v.area.substring(v.village.length).replace(/^[\s,]+/, '')
                                                                    : (v.area || v.address || '').replace(/Makan Number-\s*.*?,/, '').trim()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                                                    परिवार- {v.familySize || 1} सदस्य
                                                    {v.isHead && <span style={{ ...badgeStyle('#F59E0B'), marginLeft: '6px' }}>Mukhiya</span>}
                                                    {v.isPwD && <span style={{ ...badgeStyle('#EF4444'), marginLeft: '6px' }}>PwD</span>}
                                                    {v.caste && <span style={{ ...badgeStyle('#3B82F6'), marginLeft: '6px' }}>{v.caste}</span>}
                                                    {v.religion && <span style={{ ...badgeStyle('#8B5CF6'), marginLeft: '6px' }}>{v.religion}</span>}
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
                                                    <option value="Support">✅ पक्ष (Favor)</option>
                                                    <option value="Neutral">⚪ न्यूट्रल</option>
                                                    <option value="Oppose">❌ विपक्ष (Anti)</option>
                                                </select>
                                            </td>

                                            <td className="no-print" style={{ padding: '16px', verticalAlign: 'top' }}>
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
            <div className="no-print" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px', marginBottom: '40px' }}>
                <button onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={pagination.currentPage === 1} style={{ padding: '10px 20px', borderRadius: '12px', background: 'white', border: '1px solid #E2E8F0', cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer', opacity: pagination.currentPage === 1 ? 0.5 : 1 }}>
                    Previous
                </button>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                    Page {pagination.currentPage} of {pagination.totalPages || 1}
                </div>
                <button onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))} disabled={pagination.currentPage >= pagination.totalPages} style={{ padding: '10px 20px', borderRadius: '12px', background: 'white', border: '1px solid #E2E8F0', cursor: pagination.currentPage >= pagination.totalPages ? 'not-allowed' : 'pointer', opacity: pagination.currentPage >= pagination.totalPages ? 0.5 : 1 }}>
                    Next
                </button>
            </div>

            {/* ADD VOTER MODAL */}
            {
                isAddModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
                        <div style={{ background: 'white', width: '90%', maxWidth: '600px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{lang === 'hi' ? 'नया वोटर जोड़ें' : 'Add New Voter'}</h2>
                                <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748B" /></button>
                            </div>
                            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                {/* Top Toggle: Has Card vs Make Card */}
                                <div style={{ display: 'flex', background: '#F1F5F9', padding: '6px', borderRadius: '16px', gap: '6px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setAddVoterCardType('HAS_CARD')}
                                        style={{
                                            flex: 1,
                                            padding: '12px 14px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            fontWeight: '800',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            background: addVoterCardType === 'HAS_CARD' ? '#0D9488' : 'transparent',
                                            color: addVoterCardType === 'HAS_CARD' ? 'white' : '#64748B',
                                            transition: 'all 0.2s ease',
                                            boxShadow: addVoterCardType === 'HAS_CARD' ? '0 4px 12px rgba(13, 148, 136, 0.25)' : 'none'
                                        }}
                                    >
                                        🪪 मतदाता कार्ड है
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAddVoterCardType('MAKE_CARD')}
                                        style={{
                                            flex: 1,
                                            padding: '12px 14px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            fontWeight: '800',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            background: addVoterCardType === 'MAKE_CARD' ? '#2563EB' : 'transparent',
                                            color: addVoterCardType === 'MAKE_CARD' ? 'white' : '#64748B',
                                            transition: 'all 0.2s ease',
                                            boxShadow: addVoterCardType === 'MAKE_CARD' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
                                        }}
                                    >
                                        ➕ मतदाता कार्ड बनवाना है
                                    </button>
                                </div>

                                {addVoterCardType === 'MAKE_CARD' && (
                                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', color: '#1E40AF', fontWeight: '700', lineHeight: '1.4' }}>
                                        ℹ️ यह रिकॉर्ड <b>निर्वाचन आयोग अपडेट (ECI में जुड़वाएं)</b> में भेजा जाएगा। जब वोटर आईडी कार्ड बन जाएगा, तो EPIC नंबर दर्ज करते ही यह सक्रिय मतदाता सूची में आ जाएगा।
                                    </div>
                                )}

                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'मतदाता का नाम' : 'Voter Name'} <span style={{ color: '#DC2626' }}>*</span></label>
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
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'रिश्ता' : 'Relation'} <span style={{ color: '#DC2626' }}>*</span></label>
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
                                    {addVoterCardType === 'HAS_CARD' ? (
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'EPIC (वोटर आईडी)' : 'EPIC (Voter ID)'}</label>
                                            <input style={inputStyle} placeholder="XYZ123..." value={newVoter.epic} onChange={(e) => setNewVoter({ ...newVoter, epic: e.target.value })} />
                                        </div>
                                    ) : (
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#94A3B8', marginBottom: '8px', display: 'block' }}>EPIC (वोटर आईडी)</label>
                                            <div style={{ padding: '10px 14px', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '12px', fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                                                कार्ड बनने के बाद ECI द्वारा जारी होगा
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'गांव/वार्ड' : 'Village/Ward'}</label>
                                        <input style={inputStyle} placeholder={lang === 'hi' ? 'गांव का नाम' : 'Village name'} value={newVoter.village} onChange={(e) => setNewVoter({ ...newVoter, village: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' }}>{lang === 'hi' ? 'बूथ संख्या' : 'Booth Number'}</label>
                                        <input style={inputStyle} disabled={isBoothManager} placeholder="Eg. 45" type="number" value={newVoter.boothNumber} onChange={(e) => setNewVoter({ ...newVoter, boothNumber: e.target.value })} />
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
                                    onClick={async () => {
                                        if (!newVoter.name || !newVoter.relationshipType) {
                                            alert(lang === 'hi' ? 'कृपया नाम और रिश्ता चुनें' : 'Please fill name and select relation');
                                            return;
                                        }
                                        setIsSaving(true);
                                        try {
                                            const eciStatusToUse = addVoterCardType === 'MAKE_CARD' ? 'NEW_REQUEST' : 'IN_LIST';
                                            await createVoter({ ...newVoter, eciStatus: eciStatusToUse, assemblyId });
                                            if (addVoterCardType === 'MAKE_CARD') {
                                                alert('मतदाता कार्ड बनवाने का अनुरोध दर्ज हो गया और निर्वाचन आयोग अपडेट (ECI में जुड़वाएं) में भेज दिया गया!');
                                            } else {
                                                alert(lang === 'hi' ? 'वोटर सफलतापूर्वक जोड़ा गया!' : 'Voter added successfully!');
                                            }
                                            setIsAddModalOpen(false);
                                            fetchVoters();
                                            setNewVoter({
                                                name: '', age: '', gender: 'M', relativeName: '', relationshipType: '',
                                                mobile: '', epic: '', village: '', boothNumber: isBoothManager ? newVoter.boothNumber : '', houseNumber: '', address: '',
                                                supportStatus: 'Neutral', caste: '', subCaste: ''
                                            });
                                        } catch (error: any) {
                                            console.error(error);
                                            alert(lang === 'hi' ? `वोटर बनाने में त्रुटि: ${error.message}` : `Error creating voter: ${error.message}`);
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    style={{ background: addVoterCardType === 'MAKE_CARD' ? '#2563EB' : '#0D9488', color: 'white', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: '800', cursor: 'pointer', marginTop: '12px' }}>
                                    {isSaving ? (lang === 'hi' ? 'प्रक्रिया जारी है...' : 'Processing...') : (addVoterCardType === 'MAKE_CARD' ? '➕ ECI जुड़वाने हेतु अनुरोध भेजें' : (lang === 'hi' ? 'वोटर सुरक्षित करें' : 'Save Voter'))}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ECI DELETION MODAL */}
            {
                deleteEciModalVoter && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '480px', borderRadius: '24px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Trash2 size={20} /> ECI से नाम हटवाएं
                                    </h3>
                                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                        {deleteEciModalVoter.name} (EPIC: {deleteEciModalVoter.epic || '-'})
                                    </p>
                                </div>
                                <button onClick={() => setDeleteEciModalVoter(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}><X size={18} /></button>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                                    विलोपन का कारण चुनें <span style={{ color: '#DC2626' }}>*</span>
                                </label>
                                <select
                                    value={deleteReason}
                                    onChange={e => setDeleteReason(e.target.value)}
                                    style={{ ...inputStyle, width: '100%', padding: '12px', fontWeight: '700' }}
                                >
                                    <option value="मृत्यु (Deceased)">💀 मृत्यु (Deceased)</option>
                                    <option value="स्थान परिवर्तन (Shifted / Moved)">🚚 स्थान परिवर्तन (Shifted / Moved)</option>
                                    <option value="दोहरा या फर्जी मतदाता (Duplicate / Fake)">👥 दोहरा या फर्जी मतदाता (Duplicate / Fake)</option>
                                    <option value="वास्तविक मतदाता नहीं (Not Real Voter)">❓ वास्तविक मतदाता नहीं (Not Real Voter)</option>
                                    <option value="अन्य (Other)">📝 अन्य (Other)</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                                    विवरण / टिप्पणी (वैकल्पिक)
                                </label>
                                <textarea
                                    placeholder="उदा. 2 वर्ष पूर्व निधन हो चुका है..."
                                    value={deleteNotes}
                                    onChange={e => setDeleteNotes(e.target.value)}
                                    style={{ ...inputStyle, width: '100%', padding: '12px', height: '70px', resize: 'none' }}
                                />
                            </div>

                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '12px', color: '#991B1B' }}>
                                ⚠️ यह अनुरोध सीधे <b>निर्वाचन आयोग अपडेट (ECI से हटवाएं)</b> सेक्शन में भेज दिया जाएगा।
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setDeleteEciModalVoter(null)}
                                    style={{ flex: 1, padding: '12px', border: '1px solid #CBD5E1', background: 'white', borderRadius: '12px', fontWeight: '700', color: '#64748B', cursor: 'pointer' }}
                                >
                                    कैंसिल
                                </button>
                                <button
                                    type="button"
                                    disabled={isSubmittingEciDelete}
                                    onClick={async () => {
                                        setIsSubmittingEciDelete(true);
                                        try {
                                            const res = await requestEciDeletion(deleteEciModalVoter.id, deleteReason, deleteNotes);
                                            alert(res.message || 'सफलतापूर्वक ECI से हटवाने हेतु दर्ज किया गया!');
                                            setDeleteEciModalVoter(null);
                                            setDeleteNotes('');
                                            fetchVoters();
                                        } catch (e: any) {
                                            alert(e.message || 'त्रुटि हुई।');
                                        } finally {
                                            setIsSubmittingEciDelete(false);
                                        }
                                    }}
                                    style={{ flex: 2, padding: '12px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    {isSubmittingEciDelete ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} ECI से हटाने का अनुरोध भेजें
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal (View Details) */}
            {
                viewVoter && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
                        <div style={{ background: 'white', width: '90%', maxWidth: '900px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #F8FAFC, white)' }}>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>{lang === 'hi' ? (viewVoter.nameHi || viewVoter.name) : (viewVoter.nameEn || viewVoter.name)}</h2>
                                    <div style={{ color: '#64748B', fontSize: '14px', fontWeight: '500' }}>EPIC: <span style={{ fontFamily: 'monospace', color: '#4338CA' }}>{viewVoter.epic}</span></div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => {
                                            setDeleteEciModalVoter(viewVoter);
                                            setViewVoter(null);
                                        }}
                                        style={{ ...glassButtonStyle, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <Trash2 size={16} /> ECI से हटाएं
                                    </button>
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
                                                    <InfoBox label={lang === 'hi' ? "सम्बन्धी का नाम" : "Relative Name"} value={lang === 'hi' ? (viewVoter.relativeNameHi || viewVoter.relativeName) : (viewVoter.relativeNameEn || viewVoter.relativeName)} />
                                                    <InfoBox label={lang === 'hi' ? "सम्बन्ध" : "Relation Type"} value={viewVoter.relationType} />
                                                    <InfoBox label={lang === 'hi' ? "उम्र" : "Age"} value={`${viewVoter.age} ${lang === 'hi' ? 'वर्ष' : 'Yrs'}`} />
                                                    <InfoBox label={lang === 'hi' ? "लिंग" : "Gender"} value={viewVoter.gender} />
                                                    <InfoBox label={lang === 'hi' ? "मोबाइल" : "Mobile"} value={viewVoter.mobile} />
                                                    <InfoBox label={lang === 'hi' ? "मकान संख्या" : "House Number"} value={viewVoter.houseNumber} />
                                                    <InfoBox label={lang === 'hi' ? "गांव/वार्ड" : "Village / Ward"} value={lang === 'hi' ? (viewVoter.villageHi || viewVoter.village) : (viewVoter.villageEn || viewVoter.village)} />
                                                    <InfoBox label="वर्ग / जाति (Category / Caste)" value={`${viewVoter.casteCategory || ''} ${viewVoter.caste ? `(${viewVoter.caste})` : ''}`.trim() || 'N/A'} />
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
                                                            onClick={() => {
                                                                const newVal = !editData.isVoted;
                                                                setEditData({ ...editData, isVoted: newVal });
                                                                if (!isEditing) updateVoter(viewVoter.id, { isVoted: newVal }).catch(e => alert(e.message));
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
                            </div>
                        </div>
                    </div>
                )
            }

            {/* APPROVALS MODAL */}
            {
                isApprovalsModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
                        <div style={{ background: '#F8FAFC', width: '90%', maxWidth: '900px', height: '85vh', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                            <div style={{ padding: '24px', background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Clock color="#F59E0B" /> Pending Approvals
                                    </h2>
                                    <p style={{ fontSize: '13px', color: '#64748B' }}>ECI और सिस्टम कन्फर्मेशन के लिए पेंडिंग रिक्वेस्ट</p>
                                </div>
                                <button onClick={() => setIsApprovalsModalOpen(false)} style={{ background: '#F1F5F9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}><X size={20} color="#64748B" /></button>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: 'white' }}>
                                <button onClick={() => setApprovalTab('NEW')} style={{ flex: 1, padding: '16px', border: 'none', background: approvalTab === 'NEW' ? '#F0FDF4' : 'white', color: approvalTab === 'NEW' ? '#166534' : '#64748B', fontWeight: '700', borderBottom: approvalTab === 'NEW' ? '2px solid #166534' : 'none', cursor: 'pointer' }}>
                                    New Voters ({pendingNewVoters.length})
                                </button>
                                <button onClick={() => setApprovalTab('EDIT')} style={{ flex: 1, padding: '16px', border: 'none', background: approvalTab === 'EDIT' ? '#FFFBEB' : 'white', color: approvalTab === 'EDIT' ? '#B45309' : '#64748B', fontWeight: '700', borderBottom: approvalTab === 'EDIT' ? '2px solid #B45309' : 'none', cursor: 'pointer' }}>
                                    Edit Requests ({editRequests.length})
                                </button>
                            </div>

                            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                                {isLoadingApprovals ? <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /> Loading...</div> : (
                                    <>
                                        {approvalTab === 'NEW' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {pendingNewVoters.length === 0 ? <div style={{ textAlign: 'center', color: '#94A3B8', padding: '40px' }}>No pending new voters</div> :
                                                    pendingNewVoters.map(v => (
                                                        <div key={v.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <div style={{ fontWeight: '700', fontSize: '15px' }}>{v.name} ({v.age}, {v.gender})</div>
                                                                <div style={{ fontSize: '13px', color: '#64748B' }}>{v.village}, Booth: {v.boothNumber}</div>
                                                                <div style={{ fontSize: '12px', color: '#94A3B8' }}>By: {v.updatedByName || 'Unknown'}</div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button onClick={() => handleVerifyNewVoter(v.id)} style={{ padding: '8px 16px', background: '#22C55E', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={16} /> Confirm</button>
                                                                <button onClick={() => handleRejectNewVoter(v.id)} style={{ padding: '8px 16px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={16} /> Reject</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}

                                        {approvalTab === 'EDIT' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {editRequests.length === 0 ? <div style={{ textAlign: 'center', color: '#94A3B8', padding: '40px' }}>No pending edit requests</div> :
                                                    editRequests.map(req => {
                                                        const changes = JSON.parse(req.changes);
                                                        return (
                                                            <div key={req.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' }}>
                                                                    <div>
                                                                        <div style={{ fontWeight: '700', fontSize: '15px' }}>Voter: {req.voter?.name} (ID: {req.voterId})</div>
                                                                        <div style={{ fontSize: '12px', color: '#94A3B8' }}>Requested by: {req.worker?.name}</div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                        <button onClick={() => handleApproveEdit(req.id)} style={{ padding: '8px 16px', background: '#22C55E', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={16} /> Approve</button>
                                                                        <button onClick={() => handleRejectEdit(req.id)} style={{ padding: '8px 16px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={16} /> Reject</button>
                                                                    </div>
                                                                </div>
                                                                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                                                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>Proposed Changes</div>
                                                                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155' }}>
                                                                        {Object.entries(changes).map(([key, val]) => (
                                                                            <li key={key}>
                                                                                <span style={{ fontWeight: '600' }}>{key}:</span> {String(val)}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
