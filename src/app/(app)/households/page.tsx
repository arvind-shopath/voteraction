'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    getHouseholds, autoGenerateHouseholdsFromVoters, recordHouseholdVisit, 
    verifyHouseholdLocation, getHouseholdDetails 
} from '@/app/actions/households';
import { 
    Home, MapPin, Users, CheckCircle2, AlertTriangle, Search, Filter, 
    Plus, Navigation, Eye, Phone, ArrowUpRight, X, Loader2, Sparkles, 
    Compass, Check, Calendar, RefreshCw 
} from 'lucide-react';

export default function HouseholdsPage() {
    const [households, setHouseholds] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [boothFilter, setBoothFilter] = useState('ALL');
    const [locationFilter, setLocationFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modals
    const [selectedHousehold, setSelectedHousehold] = useState<any>(null);
    const [visitModalHousehold, setVisitModalHousehold] = useState<any>(null);
    const [submittingVisit, setSubmittingVisit] = useState(false);

    // Visit Form State
    const [visitStatus, setVisitStatus] = useState('Visited');
    const [visitNotes, setVisitNotes] = useState('');
    const [currentLat, setCurrentLat] = useState<number | null>(null);
    const [currentLng, setCurrentLng] = useState<number | null>(null);
    const [gettingGps, setGettingGps] = useState(false);

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
            const data = await getHouseholds({
                search,
                boothNumber: boothFilter,
                locationStatus: locationFilter,
                page,
                pageSize: 24
            });
            setHouseholds(data.households);
            setStats(data.stats);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHouseholds();
    }, [page, boothFilter, locationFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchHouseholds();
    };

    const handleAutoGenerate = async () => {
        if (!confirm('क्या आप मौजूदा वोटर लिस्ट डेटा से स्वतः सभी परिवारों / हाउसहोल्ड्स का निर्माण करना चाहते हैं?')) return;
        setGenerating(true);
        try {
            const res = await autoGenerateHouseholdsFromVoters(1);
            alert(res.message);
            fetchHouseholds();
        } catch (err) {
            alert('हाउसहोल्ड निर्माण में त्रुटि हुई');
        } finally {
            setGenerating(false);
        }
    };

    const handleCaptureGps = () => {
        if (!navigator.geolocation) {
            alert('आपके ब्राउज़र में जीपीएस सपोर्ट उपलब्ध नहीं है');
            return;
        }
        setGettingGps(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCurrentLat(pos.coords.latitude);
                setCurrentLng(pos.coords.longitude);
                setGettingGps(false);
            },
            (err) => {
                alert('जीपीएस लोकेशन प्राप्त नहीं हो सकी: ' + err.message);
                setGettingGps(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleRecordVisitSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visitModalHousehold) return;
        setSubmittingVisit(true);
        try {
            const res = await recordHouseholdVisit({
                householdId: visitModalHousehold.id,
                status: visitStatus,
                notes: visitNotes,
                latitude: currentLat || undefined,
                longitude: currentLng || undefined
            });
            if (res.success) {
                setVisitModalHousehold(null);
                setVisitNotes('');
                setCurrentLat(null);
                setCurrentLng(null);
                fetchHouseholds();
            }
        } catch (err) {
            alert('विजिट दर्ज करने में त्रुटि हुई');
        } finally {
            setSubmittingVisit(false);
        }
    };

    const statusBadge: Record<string, { label: string, color: string, bg: string }> = {
        'Field_Verified': { label: '🟢 फील्ड सत्यापित', color: '#166534', bg: '#DCFCE7' },
        'Geocoded': { label: '🔵 जियोकोडेड', color: '#1E40AF', bg: '#DBEAFE' },
        'Approximate': { label: '🟡 अनुमानित क्षेत्र', color: '#92400E', bg: '#FEF3C7' },
        'Unmapped': { label: '⚪ मैप बाकी', color: '#475569', bg: '#F1F5F9' }
    };

    return (
        <div style={{ padding: isMobile ? '12px 8px 40px 8px' : '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Home size={isMobile ? 22 : 28} color="#2563EB" /> हाउसहोल्ड मैपिंग व परिवार प्रबंधन
                    </h1>
                    <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                        मकान व परिवार आधारित फील्ड मैपिंग, डोर-टू-डोर विजिट और जीपीएस सत्यापन
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link
                        href="/households/map"
                        style={{
                            background: '#0F172A',
                            color: 'white',
                            padding: '10px 16px',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '13px',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
                        }}
                    >
                        <Compass size={16} color="#38BDF8" /> 🗺️ लाइव नक्शा (Map View)
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

            {/* Filters Bar */}
            <div style={{ background: 'white', padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '220px', display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px' }} />
                        <input
                            type="text"
                            placeholder="हाउसहोल्ड कोड, मकान नं, मुखिया नाम, मोबाइल..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '9px 12px 9px 36px',
                                borderRadius: '10px',
                                border: '1px solid #CBD5E1',
                                fontSize: '13px',
                                fontWeight: 600,
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button type="submit" style={{ background: '#0F172A', color: 'white', padding: '9px 14px', borderRadius: '10px', border: 'none', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                        खोजें
                    </button>
                </form>

                <select
                    value={locationFilter}
                    onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
                    style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, background: 'white', outline: 'none' }}
                >
                    <option value="ALL">सभी लोकेशन स्टेटस</option>
                    <option value="Field_Verified">🟢 फील्ड सत्यापित (Verified)</option>
                    <option value="Geocoded">🔵 जियोकोडेड (Geocoded)</option>
                    <option value="Approximate">🟡 अनुमानित (Approximate)</option>
                    <option value="Unmapped">⚪ अनमैप्ड (Unmapped)</option>
                </select>
            </div>

            {/* Households Grid */}
            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
                    <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 12px auto', color: '#2563EB' }} />
                    <p style={{ fontWeight: 800 }}>हाउसहोल्ड्स लोड हो रहे हैं...</p>
                </div>
            ) : households.length === 0 ? (
                <div style={{ background: 'white', padding: '40px 20px', borderRadius: '20px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <Home size={48} color="#94A3B8" style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>कोई हाउसहोल्ड नहीं मिला</h3>
                    <p style={{ fontSize: '13px', color: '#64748B' }}>कृपया सर्च कीवर्ड या बूथ फ़िल्टर बदलकर पुनः प्रयास करें।</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                    {households.map((h) => {
                        const statusObj = statusBadge[h.locationStatus] || statusBadge['Unmapped'];
                        const hasVisited = h.lastVisit !== null;

                        return (
                            <div
                                key={h.id}
                                style={{
                                    background: 'white',
                                    borderRadius: '20px',
                                    padding: '18px',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    position: 'relative'
                                }}
                            >
                                <div>
                                    {/* Top Row: Code & Status */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 950, color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: '8px' }}>
                                                {h.householdCode}
                                            </span>
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B' }}>
                                                बूथ #{h.boothNumber}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: statusObj.bg, color: statusObj.color }}>
                                            {statusObj.label}
                                        </span>
                                    </div>

                                    {/* Address & Village */}
                                    <h3 style={{ fontSize: '16px', fontWeight: 950, color: '#0F172A', marginBottom: '4px' }}>
                                        मकान नं. {h.houseNumber || '-'} • {h.village || 'ग्राम'}
                                    </h3>
                                    <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '12px', lineHeight: 1.4 }}>
                                        📍 {h.fullAddress || `${h.village}, मकान नं ${h.houseNumber}`}
                                    </p>

                                    {/* Family Head & Members Box */}
                                    <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '12px', border: '1px solid #F1F5F9', marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Users size={15} color="#2563EB" />
                                                <span style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A' }}>
                                                    {h.headVoter?.name ? `मुखिया: ${h.headVoter.name}` : 'परिवार'}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 950, color: '#2563EB', background: '#DBEAFE', padding: '2px 8px', borderRadius: '6px' }}>
                                                {h.voterCount} वोटर्स
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions & Visit Button */}
                                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                                    <button
                                        onClick={() => {
                                            setVisitModalHousehold(h);
                                            setVisitStatus(h.lastVisit?.status || 'Visited');
                                            setVisitNotes(h.lastVisit?.notes || '');
                                        }}
                                        style={{
                                            flex: 1,
                                            background: hasVisited ? '#F0FDF4' : '#EFF6FF',
                                            color: hasVisited ? '#16A34A' : '#2563EB',
                                            border: `1px solid ${hasVisited ? '#BBF7D0' : '#BFDBFE'}`,
                                            padding: '8px 12px',
                                            borderRadius: '10px',
                                            fontWeight: 800,
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <CheckCircle2 size={15} /> {hasVisited ? 'विजिट अपडेट करें' : 'डोर-टू-डोर विजिट दर्ज'}
                                    </button>

                                    <button
                                        onClick={() => setSelectedHousehold(h)}
                                        style={{
                                            background: '#F1F5F9',
                                            color: '#0F172A',
                                            border: '1px solid #E2E8F0',
                                            padding: '8px 12px',
                                            borderRadius: '10px',
                                            fontWeight: 800,
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <Eye size={15} /> सदस्य ({h.voterCount})
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', background: 'white', fontWeight: 800, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        पिछला
                    </button>
                    <span style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 800, color: '#475569' }}>
                        पेज {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', background: 'white', fontWeight: 800, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                        अगला
                    </button>
                </div>
            )}

            {/* Household Members Modal */}
            {selectedHousehold && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 950, color: '#0F172A', margin: 0 }}>
                                    {selectedHousehold.householdCode} • परिवार सदस्य
                                </h3>
                                <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, margin: '2px 0 0 0' }}>
                                    मकान नं. {selectedHousehold.houseNumber} • {selectedHousehold.village} (बूथ #{selectedHousehold.boothNumber})
                                </p>
                            </div>
                            <button onClick={() => setSelectedHousehold(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {selectedHousehold.voters.map((v: any) => (
                                <div key={v.id} style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 950, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {v.name}
                                            {v.isHead && <span style={{ fontSize: '10px', fontWeight: 900, background: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '6px' }}>मुखिया</span>}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, marginTop: '2px' }}>
                                            आयु: {v.age || '-'} • लिंग: {v.gender === 'M' ? 'पुरुष' : (v.gender === 'F' ? 'महिला' : 'अन्य')} • EPIC: {v.epic || '-'}
                                        </div>
                                    </div>
                                    {v.mobile && (
                                        <a href={`tel:${v.mobile}`} style={{ background: '#EFF6FF', color: '#2563EB', padding: '6px 10px', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Phone size={12} /> {v.mobile}
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Record Visit & Location Modal */}
            {visitModalHousehold && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 950, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle2 size={20} color="#2563EB" /> डोर-टू-डोर विजिट व लोकेशन दर्ज
                            </h3>
                            <button onClick={() => setVisitModalHousehold(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, marginBottom: '16px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px' }}>
                            हाउसहोल्ड: <strong style={{ color: '#0F172A' }}>{visitModalHousehold.householdCode} ({visitModalHousehold.village}, मकान {visitModalHousehold.houseNumber})</strong>
                        </div>

                        <form onSubmit={handleRecordVisitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>विजिट स्थिति (Visit Status)</label>
                                <select
                                    value={visitStatus}
                                    onChange={(e) => setVisitStatus(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, background: 'white' }}
                                >
                                    <option value="Visited">✅ संपर्क संपन्न (Visited)</option>
                                    <option value="Revisit_Required">🔄 दोबारा मिलना जरूरी (Revisit)</option>
                                    <option value="Unable_to_Contact">❌ संपर्क नहीं हो सका (Unable to Contact)</option>
                                    <option value="Scheduled_Followup">⏳ फॉलो-अप तय (Follow-up)</option>
                                </select>
                            </div>

                            {/* GPS Capture Button */}
                            <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 900, color: '#1E40AF' }}>📍 जीपीएस लोकेशन सत्यापन</div>
                                        <div style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 700, marginTop: '2px' }}>
                                            {currentLat ? `Lat: ${currentLat.toFixed(4)}, Lng: ${currentLng?.toFixed(4)}` : 'वर्तमान स्थिति कैप्चर करें'}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCaptureGps}
                                        disabled={gettingGps}
                                        style={{ background: '#2563EB', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        {gettingGps ? <Loader2 className="animate-spin" size={12} /> : <Compass size={12} />}
                                        {currentLat ? 'पुनः लें' : 'GPS कैप्चर'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>विजिट नोट्स / परिवार फीडबैक</label>
                                <textarea
                                    rows={3}
                                    placeholder="परिवार की प्रमुख मांग, स्थानीय समस्याएं, बातचीत का विवरण..."
                                    value={visitNotes}
                                    onChange={(e) => setVisitNotes(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 600 }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setVisitModalHousehold(null)}
                                    style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#F1F5F9', color: '#475569', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                                >
                                    रद्द करें
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingVisit}
                                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#2563EB', color: 'white', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}
                                >
                                    {submittingVisit ? 'सेव हो रहा है...' : 'विजिट सुरक्षित करें'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
