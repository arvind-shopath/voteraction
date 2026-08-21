'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getHouseholds, getHouseholdDetails, recordHouseholdVisit } from '@/app/actions/households';
import { 
    Home, Users, MapPin, CheckCircle2, AlertCircle, Clock, 
    Search, Filter, Plus, ChevronRight, Phone, Calendar, 
    Compass, ArrowUpRight, Check, X, ShieldAlert, Loader2, Sparkles, SlidersHorizontal, ArrowUpDown
} from 'lucide-react';

export default function HouseholdsPage() {
    const [households, setHouseholds] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [options, setOptions] = useState<{ booths: number[]; villages: string[] }>({ booths: [], villages: [] });
    
    // Filters & Sorting State
    const [search, setSearch] = useState('');
    const [boothFilter, setBoothFilter] = useState('ALL');
    const [villageFilter, setVillageFilter] = useState('ALL');
    const [casteCategoryFilter, setCasteCategoryFilter] = useState('ALL');
    const [familySizeFilter, setFamilySizeFilter] = useState('ALL');
    const [youthFilter, setYouthFilter] = useState('ALL');
    const [locationFilter, setLocationFilter] = useState('ALL');
    const [visitFilter, setVisitFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('number_asc');

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Modal state for household details & visit logging
    const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(null);
    const [householdDetails, setHouseholdDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [visitStatus, setVisitStatus] = useState('Visited');
    const [visitNotes, setVisitNotes] = useState('');
    const [submittingVisit, setSubmittingVisit] = useState(false);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchHouseholds = async () => {
        setLoading(true);
        try {
            const res = await getHouseholds({
                search,
                boothNumber: boothFilter,
                village: villageFilter,
                casteCategory: casteCategoryFilter,
                familySize: familySizeFilter,
                hasYouth: youthFilter === 'youth' ? true : undefined,
                locationStatus: locationFilter,
                visitStatus: visitFilter,
                sortBy,
                page,
                pageSize: 24
            });

            setHouseholds(res.households);
            setTotalCount(res.totalCount);
            setTotalPages(res.totalPages);
            setStats(res.stats);
            if (res.options) {
                setOptions(res.options);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHouseholds();
    }, [page, boothFilter, villageFilter, casteCategoryFilter, familySizeFilter, youthFilter, locationFilter, visitFilter, sortBy]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchHouseholds();
    };

    const handleOpenDetails = async (id: number) => {
        setSelectedHouseholdId(id);
        setLoadingDetails(true);
        try {
            const details = await getHouseholdDetails(id);
            setHouseholdDetails(details);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleOpenVisitModal = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedHouseholdId(id);
        setShowVisitModal(true);
        setVisitStatus('Visited');
        setVisitNotes('');
    };

    const handleSubmitVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHouseholdId) return;
        setSubmittingVisit(true);
        try {
            await recordHouseholdVisit({
                householdId: selectedHouseholdId,
                status: visitStatus,
                notes: visitNotes
            });
            setShowVisitModal(false);
            fetchHouseholds();
            if (householdDetails && householdDetails.id === selectedHouseholdId) {
                handleOpenDetails(selectedHouseholdId);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmittingVisit(false);
        }
    };

    return (
        <div style={{ padding: isMobile ? '12px' : '24px', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Home size={26} color="#2563EB" /> हाउसहोल्ड मैपिंग व परिवार प्रबंधन
                    </h1>
                    <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                        मकान व परिवार आधारित फील्ड मैपिंग, डोर-टू-डोर विजिट और जीपीएस सत्यापन
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Link
                        href="/households/map"
                        style={{
                            background: '#0F172A',
                            color: 'white',
                            padding: '10px 18px',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            textDecoration: 'none',
                            boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
                        }}
                    >
                        <Compass size={18} /> लाइव नक्शा (Map View)
                    </Link>
                </div>
            </div>

            {/* Stats Cards Row */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: isMobile ? '10px' : '14px', marginBottom: '20px' }}>
                    <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>कुल हाउसहोल्ड</div>
                        <div style={{ fontSize: '24px', fontWeight: 950, color: '#0F172A', marginTop: '2px' }}>{stats.total}</div>
                        <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700, marginTop: '4px' }}>🏠 कुल परिवार</div>
                    </div>

                    <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>फील्ड सत्यापित</div>
                        <div style={{ fontSize: '24px', fontWeight: 950, color: '#16A34A', marginTop: '2px' }}>{stats.fieldVerified}</div>
                        <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700, marginTop: '4px' }}>🟢 GPS Verified</div>
                    </div>

                    <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>जियोकोडेड / क्षेत्र</div>
                        <div style={{ fontSize: '24px', fontWeight: 950, color: '#2563EB', marginTop: '2px' }}>{stats.geocoded + stats.approximate}</div>
                        <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700, marginTop: '4px' }}>🔵 Geocoded</div>
                    </div>

                    <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>डोर-टू-डोर विजिट</div>
                        <div style={{ fontSize: '24px', fontWeight: 950, color: '#059669', marginTop: '2px' }}>{stats.visited}</div>
                        <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginTop: '4px' }}>✅ संपर्कित परिवार</div>
                    </div>

                    <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>विजिट बाकी (Pending)</div>
                        <div style={{ fontSize: '24px', fontWeight: 950, color: '#EF4444', marginTop: '2px' }}>{stats.pending}</div>
                        <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 700, marginTop: '4px' }}>⏳ संपर्क शेष</div>
                    </div>
                </div>
            )}

            {/* Comprehensive Multi-Filter Bar */}
            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Search & Main Row */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px' }} />
                            <input
                                type="text"
                                placeholder="हाउसहोल्ड कोड, मकान नं, मुखिया नाम, मोबाइल..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 36px',
                                    borderRadius: '10px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <button type="submit" style={{ background: '#0F172A', color: 'white', padding: '10px 16px', borderRadius: '10px', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
                            खोजें
                        </button>
                    </form>

                    {/* Sorting Order */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowUpDown size={15} color="#64748B" />
                        <select
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #2563EB', fontSize: '13px', fontWeight: 800, background: '#EFF6FF', color: '#1E40AF', outline: 'none' }}
                        >
                            <option value="number_asc">🔢 मकान संख्या क्रम (1, 2, 3, 4...)</option>
                            <option value="size_desc">👨‍👩‍👧‍👦 बड़े परिवार पहले (Most Voters)</option>
                            <option value="size_asc">👥 छोटे परिवार पहले (Few Voters)</option>
                            <option value="youth_desc">⚡ युवा मतदाता वाले घर (Youth 18-35)</option>
                            <option value="recent_visit">🕒 हाल ही में विजिट किए गए</option>
                        </select>
                    </div>
                </div>

                {/* Dropdown Filters Row */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(6, 1fr)', gap: '10px' }}>
                    
                    {/* Booth Filter */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>बूथ (Booth)</label>
                        <select
                            value={boothFilter}
                            onChange={(e) => { setBoothFilter(e.target.value); setPage(1); }}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 700, background: 'white' }}
                        >
                            <option value="ALL">सभी बूथ ({options.booths.length || 10})</option>
                            {(options.booths.length > 0 ? options.booths : [1,2,3,4,5,6,7,8,9,10]).map(b => (
                                <option key={b} value={String(b)}>बूथ #{b}</option>
                            ))}
                        </select>
                    </div>

                    {/* Village / Mohalla Filter */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>गांव / मोहल्ला</label>
                        <select
                            value={villageFilter}
                            onChange={(e) => { setVillageFilter(e.target.value); setPage(1); }}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 700, background: 'white' }}
                        >
                            <option value="ALL">सभी गांव / मोहल्ले</option>
                            {options.villages.map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                    </div>

                    {/* Caste Category Filter */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>वर्ग (Category)</label>
                        <select
                            value={casteCategoryFilter}
                            onChange={(e) => { setCasteCategoryFilter(e.target.value); setPage(1); }}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 700, background: 'white' }}
                        >
                            <option value="ALL">सभी वर्ग</option>
                            <option value="सामान्य">सामान्य (General)</option>
                            <option value="ओबीसी">ओबीसी (OBC)</option>
                            <option value="एससी">एससी (SC)</option>
                            <option value="एसटी">एसटी (ST)</option>
                            <option value="मुस्लिम">मुस्लिम (Muslim)</option>
                        </select>
                    </div>

                    {/* Family Size Filter */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>परिवार का आकार</label>
                        <select
                            value={familySizeFilter}
                            onChange={(e) => { setFamilySizeFilter(e.target.value); setPage(1); }}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 700, background: 'white' }}
                        >
                            <option value="ALL">सभी परिवार</option>
                            <option value="large">🔥 बड़ा परिवार (7+ वोटर)</option>
                            <option value="medium">👨‍👩‍👧 मध्यम (4-6 वोटर)</option>
                            <option value="small">👤 छोटा (1-3 वोटर)</option>
                        </select>
                    </div>

                    {/* Youth Filter */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>युवा मतदाता (18-35)</label>
                        <select
                            value={youthFilter}
                            onChange={(e) => { setYouthFilter(e.target.value); setPage(1); }}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 700, background: 'white' }}
                        >
                            <option value="ALL">सभी घर</option>
                            <option value="youth">⚡ केवल युवा वोटर वाले घर</option>
                        </select>
                    </div>

                    {/* Visit Status Filter */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>विजिट स्थिति</label>
                        <select
                            value={visitFilter}
                            onChange={(e) => { setVisitFilter(e.target.value); setPage(1); }}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 700, background: 'white' }}
                        >
                            <option value="ALL">सभी स्थिति</option>
                            <option value="Visited">✅ संपर्कित (Visited)</option>
                            <option value="Pending">⏳ संपर्क बाकी (Pending)</option>
                        </select>
                    </div>

                </div>

            </div>

            {/* Households Grid */}
            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
                    <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 12px auto', color: '#2563EB' }} />
                    <p style={{ fontWeight: 800 }}>हाउसहोल्ड्स लोड हो रहे हैं...</p>
                </div>
            ) : households.length === 0 ? (
                <div style={{ background: 'white', padding: '60px 20px', borderRadius: '20px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <Home size={48} color="#94A3B8" style={{ margin: '0 auto 16px auto' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>कोई हाउसहोल्ड नहीं मिला</h3>
                    <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '400px', margin: '6px auto 0 auto', fontWeight: 600 }}>
                        दिए गए फ़िल्टर या खोज के अनुसार कोई मकान उपलब्ध नहीं है। कृपया फ़िल्टर बदलें।
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                        {households.map((h) => {
                            const isVerified = h.locationStatus === 'Field_Verified';
                            const hasVisit = !!h.lastVisit;

                            return (
                                <div
                                    key={h.id}
                                    onClick={() => handleOpenDetails(h.id)}
                                    style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        border: '1px solid #E2E8F0',
                                        padding: '16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        position: 'relative'
                                    }}
                                >
                                    <div>
                                        {/* Card Header: Code, Booth & Status */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: 900, padding: '3px 8px', borderRadius: '6px' }}>
                                                    {h.householdCode}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
                                                    बूथ #{h.boothNumber}
                                                </span>
                                            </div>

                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                padding: '3px 8px',
                                                borderRadius: '20px',
                                                background: isVerified ? '#DCFCE7' : '#FEF3C7',
                                                color: isVerified ? '#16A34A' : '#D97706',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                {isVerified ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                {isVerified ? 'फील्ड सत्यापित' : 'अनुमानित क्षेत्र'}
                                            </span>
                                        </div>

                                        {/* House Info */}
                                        <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>
                                            मकान नं. {h.houseNumber} • {h.village}
                                        </h3>
                                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                                            <MapPin size={13} color="#EF4444" /> {h.fullAddress || `${h.village}, मकान संख्या: ${h.houseNumber}`}
                                        </div>

                                        {/* Head & Voters Info */}
                                        <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>मुखिया</div>
                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Users size={14} color="#2563EB" /> {h.headVoter?.name || 'अज्ञात'}
                                                </div>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>कुल मतदाता</div>
                                                <div style={{ fontSize: '13px', fontWeight: 900, color: '#2563EB' }}>
                                                    {h.voterCount} वोटर्स {h.youthCount > 0 ? `(${h.youthCount} युवा)` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                        <button
                                            onClick={(e) => handleOpenVisitModal(h.id, e)}
                                            style={{
                                                flex: 1,
                                                background: hasVisit ? '#F0FDF4' : '#EFF6FF',
                                                color: hasVisit ? '#16A34A' : '#2563EB',
                                                border: `1px solid ${hasVisit ? '#BBF7D0' : '#BFDBFE'}`,
                                                padding: '8px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            {hasVisit ? <Check size={14} /> : <CheckCircle2 size={14} />}
                                            {hasVisit ? 'विजिट संपन्न' : 'डोर-टू-डोर विजिट दर्ज'}
                                        </button>

                                        <button
                                            onClick={() => handleOpenDetails(h.id)}
                                            style={{
                                                background: '#F1F5F9',
                                                color: '#334155',
                                                border: 'none',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <Users size={14} /> सदस्य ({h.voterCount})
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '24px' }}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    border: '1px solid #CBD5E1',
                                    background: page === 1 ? '#F1F5F9' : 'white',
                                    color: page === 1 ? '#94A3B8' : '#0F172A',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                पिछला
                            </button>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>
                                पेज {page} / {totalPages} (कुल {totalCount} परिवार)
                            </span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    border: '1px solid #CBD5E1',
                                    background: page === totalPages ? '#F1F5F9' : 'white',
                                    color: page === totalPages ? '#94A3B8' : '#0F172A',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: page === totalPages ? 'not-allowed' : 'pointer'
                                }}
                            >
                                अगला
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal: Household Details */}
            {selectedHouseholdId && !showVisitModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '650px', maxHeight: '90vh', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <div>
                                <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Home size={20} color="#2563EB" /> 
                                    {householdDetails?.householdCode || 'हाउसहोल्ड विवरण'} • मकान नं. {householdDetails?.houseNumber} ({householdDetails?.village})
                                </h2>
                                <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>बूथ #{householdDetails?.boothNumber} • कुल {householdDetails?.voters?.length || 0} मतदाता</p>
                            </div>
                            <button onClick={() => setSelectedHouseholdId(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={18} color="#64748B" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {loadingDetails ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 10px auto', color: '#2563EB' }} />
                                    <p style={{ fontWeight: 700, color: '#64748B' }}>विवरण लोड हो रहा है...</p>
                                </div>
                            ) : (
                                <div>
                                    {/* Family Members List */}
                                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>परिवार के सदस्य / मतदाता</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                        {householdDetails?.voters?.map((v: any) => (
                                            <div key={v.id} style={{ padding: '10px 14px', borderRadius: '10px', background: v.isHead ? '#EFF6FF' : '#F8FAFC', border: `1px solid ${v.isHead ? '#BFDBFE' : '#E2E8F0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        {v.name} {v.isHead && <span style={{ background: '#2563EB', color: 'white', fontSize: '10px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>मुखिया</span>}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                                                        {v.gender === 'M' ? 'पुरुष' : 'महिला'} • {v.age} वर्ष • EPIC: {v.epic || 'N/A'} {v.caste ? `• जाति: ${v.caste}` : ''}
                                                    </div>
                                                </div>
                                                {v.mobile && (
                                                    <a href={`tel:${v.mobile}`} style={{ color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800 }}>
                                                        <Phone size={13} /> {v.mobile}
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Visits History */}
                                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>डोर-टू-डोर विजिट हिस्ट्री</h4>
                                    {householdDetails?.visits?.length === 0 ? (
                                        <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>अभी तक कोई डोर-टू-डोर विजिट दर्ज नहीं की गई है।</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {householdDetails?.visits?.map((vis: any) => (
                                                <div key={vis.id} style={{ padding: '10px 12px', borderRadius: '8px', background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#16A34A', marginBottom: '4px' }}>
                                                        <span>✅ विजिट संपन्न ({vis.status})</span>
                                                        <span style={{ color: '#64748B', fontWeight: 600 }}>{new Date(vis.visitDate).toLocaleDateString('hi-IN')}</span>
                                                    </div>
                                                    {vis.notes && <p style={{ color: '#334155', margin: 0, fontWeight: 600 }}>{vis.notes}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#F8FAFC' }}>
                            <button
                                onClick={() => setShowVisitModal(true)}
                                style={{ background: '#2563EB', color: 'white', padding: '9px 18px', borderRadius: '10px', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <CheckCircle2 size={16} /> नई विजिट दर्ज करें
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Record Visit */}
            {showVisitModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '16px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '480px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>डोर-टू-डोर विजिट दर्ज करें</h3>
                            <button onClick={() => setShowVisitModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={16} color="#64748B" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitVisit} style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>विजिट स्थिति (Visit Status)</label>
                                <select
                                    value={visitStatus}
                                    onChange={(e) => setVisitStatus(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
                                >
                                    <option value="Visited">✅ परिवार से संपर्क हुआ (Visited)</option>
                                    <option value="Revisit_Required">🔄 दोबारा संपर्क की आवश्यकता (Follow-up)</option>
                                    <option value="Unable_to_Contact">❌ परिवार घर पर नहीं मिला (Locked/Absent)</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>फीडबैक / बातचीत का सारांश (Notes)</label>
                                <textarea
                                    rows={3}
                                    placeholder="परिवार का रुझान, मुख्य मुद्दे या जरूरी बातें यहाँ लिखें..."
                                    value={visitNotes}
                                    onChange={(e) => setVisitNotes(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 600, outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowVisitModal(false)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', background: 'white', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
                                    रद्द करें
                                </button>
                                <button type="submit" disabled={submittingVisit} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#2563EB', color: 'white', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {submittingVisit && <Loader2 className="animate-spin" size={16} />}
                                    सेव करें
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
