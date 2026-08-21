'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getHouseholdMapPoints, getHouseholdDetails } from '@/app/actions/households';
import { 
    MapPin, Home, ArrowLeft, Filter, Search, Users, 
    CheckCircle2, Compass, Layers, Phone, X, Loader2, RefreshCw, Sparkles 
} from 'lucide-react';

export default function HouseholdMapPage() {
    const [points, setPoints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPoint, setSelectedPoint] = useState<any>(null);
    const [selectedHouseholdDetails, setSelectedHouseholdDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [boothFilter, setBoothFilter] = useState('ALL');
    const [villageFilter, setVillageFilter] = useState('ALL');
    const [casteCategoryFilter, setCasteCategoryFilter] = useState('ALL');
    const [familySizeFilter, setFamilySizeFilter] = useState('ALL');
    const [youthFilter, setYouthFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    const mapRef = useRef<any>(null);
    const leafletMapInstance = useRef<any>(null);
    const markersLayerGroup = useRef<any>(null);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 1. Fetch map points
    const fetchPoints = async () => {
        setLoading(true);
        try {
            const data = await getHouseholdMapPoints({
                boothNumber: boothFilter !== 'ALL' ? parseInt(boothFilter) : undefined,
                village: villageFilter !== 'ALL' ? villageFilter : undefined,
                casteCategory: casteCategoryFilter !== 'ALL' ? casteCategoryFilter : undefined,
                familySize: familySizeFilter !== 'ALL' ? familySizeFilter : undefined,
                hasYouth: youthFilter === 'youth' ? true : undefined,
                locationStatus: statusFilter !== 'ALL' ? statusFilter : undefined
            });
            setPoints(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoints();
    }, [boothFilter, villageFilter, casteCategoryFilter, familySizeFilter, youthFilter, statusFilter]);

    // 2. Initialize Leaflet Map
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const loadLeaflet = async () => {
            if (!document.getElementById('leaflet-css')) {
                const link = document.createElement('link');
                link.id = 'leaflet-css';
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            const L = (await import('leaflet')).default;

            if (mapRef.current && !leafletMapInstance.current) {
                const map = L.map(mapRef.current, {
                    center: [25.58, 83.57],
                    zoom: 13,
                    zoomControl: true
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                markersLayerGroup.current = L.layerGroup().addTo(map);
                leafletMapInstance.current = map;
            }
        };

        loadLeaflet();

        return () => {
            if (leafletMapInstance.current) {
                leafletMapInstance.current.remove();
                leafletMapInstance.current = null;
            }
        };
    }, []);

    // 3. Render and filter markers
    useEffect(() => {
        if (!leafletMapInstance.current || !markersLayerGroup.current) return;

        const updateMarkers = async () => {
            const L = (await import('leaflet')).default;
            markersLayerGroup.current.clearLayers();

            const filtered = points.filter(p => {
                if (search && !p.code.toLowerCase().includes(search.toLowerCase()) && !p.village.toLowerCase().includes(search.toLowerCase()) && !p.headName.toLowerCase().includes(search.toLowerCase())) return false;
                return true;
            });

            const bounds = L.latLngBounds([]);

            filtered.forEach(p => {
                if (!p.lat || !p.lng) return;

                const color = p.locationStatus === 'Field_Verified' ? '#16A34A' :
                    (p.locationStatus === 'Geocoded' ? '#2563EB' :
                    (p.locationStatus === 'Approximate' ? '#D97706' : '#64748B'));

                const customIcon = L.divIcon({
                    className: 'custom-household-marker',
                    html: `
                        <div style="
                            background: ${color};
                            width: 28px;
                            height: 28px;
                            border-radius: 50%;
                            border: 3px solid white;
                            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 11px;
                            font-weight: 900;
                        ">
                            ${p.voterCount || 1}
                        </div>
                    `,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                });

                const marker = L.marker([p.lat, p.lng], { icon: customIcon });

                const popupContent = `
                    <div style="font-family: system-ui, sans-serif; min-width: 200px;">
                        <div style="font-weight: 900; font-size: 14px; color: #0F172A; margin-bottom: 2px;">
                            ${p.code} • मकान ${p.houseNumber}
                        </div>
                        <div style="font-size: 11px; color: #64748B; font-weight: 700; margin-bottom: 4px;">
                            📍 ${p.village} • बूथ #${p.boothNumber}
                        </div>
                        <div style="font-size: 12px; color: #1E293B; font-weight: 800; margin-bottom: 6px;">
                            👤 मुखिया: ${p.headName} (${p.caste})
                        </div>
                        <div style="background: #F1F5F9; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; color: #1E293B; margin-bottom: 8px;">
                            👥 वोटर्स: ${p.voterCount} ${p.youthCount > 0 ? `(${p.youthCount} युवा)` : ''}
                        </div>
                        <button id="view-hh-${p.id}" style="
                            width: 100%;
                            background: #2563EB;
                            color: white;
                            border: none;
                            padding: 6px 10px;
                            border-radius: 6px;
                            font-weight: 800;
                            font-size: 11px;
                            cursor: pointer;
                        ">
                            पूरा विवरण देखें
                        </button>
                    </div>
                `;

                marker.bindPopup(popupContent);
                marker.on('popupopen', () => {
                    const btn = document.getElementById(`view-hh-${p.id}`);
                    if (btn) {
                        btn.onclick = () => handleOpenDetails(p.id);
                    }
                });

                markersLayerGroup.current.addLayer(marker);
                bounds.extend([p.lat, p.lng]);
            });

            if (filtered.length > 0 && bounds.isValid()) {
                leafletMapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
            }
        };

        updateMarkers();
    }, [points, search]);

    const handleOpenDetails = async (id: number) => {
        setLoadingDetails(true);
        try {
            const data = await getHouseholdDetails(id);
            setSelectedHouseholdDetails(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDetails(false);
        }
    };

    const uniqueVillages = Array.from(new Set(points.map(p => p.village))).filter(Boolean).sort();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', background: '#F8FAFC' }}>
            
            {/* Top Bar Controls & Filters */}
            <div style={{ background: 'white', padding: isMobile ? '10px' : '12px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 10 }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Link
                            href="/households"
                            style={{
                                background: '#F1F5F9',
                                color: '#0F172A',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontWeight: 800,
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            <ArrowLeft size={14} /> लिस्ट दृश्य
                        </Link>
                        <div>
                            <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 950, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Compass size={18} color="#2563EB" /> लाइव हाउसहोल्ड नक्शा (Map View)
                            </h2>
                            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
                                {points.length} हाउसहोल्ड्स मैप पर उपलब्ध
                            </span>
                        </div>
                    </div>

                    {/* Quick Search */}
                    <div style={{ position: 'relative', width: isMobile ? '100%' : '240px' }}>
                        <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                        <input
                            type="text"
                            placeholder="नक्शे में खोजें (कोड, नाम, गांव/वार्ड)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '7px 10px 7px 30px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                fontSize: '12px',
                                fontWeight: 600,
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Dropdowns Row */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(6, 1fr)', gap: '8px' }}>
                    
                    {/* Booth Filter */}
                    <select
                        value={boothFilter}
                        onChange={(e) => setBoothFilter(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 800, background: 'white' }}
                    >
                        <option value="ALL">सभी बूथ</option>
                        {[1,2,3,4,5,6,7,8,9,10].map(b => (
                            <option key={b} value={String(b)}>बूथ #{b}</option>
                        ))}
                    </select>

                    {/* Village Filter */}
                    <select
                        value={villageFilter}
                        onChange={(e) => setVillageFilter(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 800, background: 'white' }}
                    >
                        <option value="ALL">सभी गांव / वार्ड</option>
                        {uniqueVillages.map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                    </select>

                    {/* Category Filter */}
                    <select
                        value={casteCategoryFilter}
                        onChange={(e) => setCasteCategoryFilter(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 800, background: 'white' }}
                    >
                        <option value="ALL">सभी वर्ग</option>
                        <option value="सामान्य">सामान्य (General)</option>
                        <option value="ओबीसी">ओबीसी (OBC)</option>
                        <option value="एससी">एससी (SC)</option>
                        <option value="एसटी">एसटी (ST)</option>
                        <option value="मुस्लिम">मुस्लिम (Muslim)</option>
                    </select>

                    {/* Family Size Filter */}
                    <select
                        value={familySizeFilter}
                        onChange={(e) => setFamilySizeFilter(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 800, background: 'white' }}
                    >
                        <option value="ALL">सभी परिवार आकार</option>
                        <option value="large">🔥 बड़ा परिवार (7+ वोटर)</option>
                        <option value="medium">👨‍👩‍👧 मध्यम (4-6 वोटर)</option>
                        <option value="small">👤 छोटा (1-3 वोटर)</option>
                    </select>

                    {/* Youth Filter */}
                    <select
                        value={youthFilter}
                        onChange={(e) => setYouthFilter(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 800, background: 'white' }}
                    >
                        <option value="ALL">सभी आयु वर्ग</option>
                        <option value="youth">⚡ केवल युवा वोटर वाले घर</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 800, background: 'white' }}
                    >
                        <option value="ALL">सभी स्थिति</option>
                        <option value="Field_Verified">🟢 फील्ड सत्यापित</option>
                        <option value="Geocoded">🔵 जियोकोडेड</option>
                        <option value="Approximate">🟡 अनुमानित</option>
                    </select>

                </div>

            </div>

            {/* Map Container */}
            <div style={{ flex: 1, position: 'relative' }}>
                <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

                {/* Map Legend */}
                <div style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '24px',
                    background: 'white',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    border: '1px solid #E2E8F0',
                    zIndex: 1000,
                    fontSize: '11px',
                    fontWeight: 700
                }}>
                    <div style={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', fontSize: '10px' }}>
                        मैप संकेतक (Legend)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16A34A' }} />
                            <span>फील्ड सत्यापित (Verified)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563EB' }} />
                            <span>जियोकोडेड (Geocoded)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D97706' }} />
                            <span>अनुमानित क्षेत्र (Approximate)</span>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(15,23,42,0.8)',
                        color: 'white',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 800,
                        fontSize: '13px'
                    }}>
                        <Loader2 className="animate-spin" size={18} />
                        मैप डेटा लोड हो रहा है...
                    </div>
                )}
            </div>

            {/* Sidebar Details Drawer */}
            {selectedHouseholdDetails && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: isMobile ? '100%' : '400px',
                    background: 'white',
                    boxShadow: '-10px 0 25px -5px rgba(0,0,0,0.1)',
                    zIndex: 2000,
                    display: 'flex',
                    flexDirection: 'column',
                    borderLeft: '1px solid #E2E8F0'
                }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#0F172A' }}>
                                {selectedHouseholdDetails.householdCode}
                            </h3>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
                                मकान संख्या: {selectedHouseholdDetails.houseNumber} • {selectedHouseholdDetails.village}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedHouseholdDetails(null)}
                            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <X size={16} color="#64748B" />
                        </button>
                    </div>

                    <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                        <div style={{ marginBottom: '16px', background: '#EFF6FF', padding: '12px', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                            <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 800, textTransform: 'uppercase' }}>स्थान स्थिति</div>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#1E40AF', marginTop: '2px' }}>
                                {selectedHouseholdDetails.locationStatus === 'Field_Verified' ? '🟢 फील्ड सत्यापित (GPS Verified)' : '🟡 अनुमानित क्षेत्र (Approximate)'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', fontWeight: 600 }}>
                                {selectedHouseholdDetails.fullAddress}
                            </div>
                        </div>

                        <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                            परिवार के सदस्य ({selectedHouseholdDetails.voters?.length || 0})
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                            {selectedHouseholdDetails.voters?.map((v: any) => (
                                <div key={v.id} style={{ padding: '10px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                                            {v.name} {v.isHead && <span style={{ background: '#2563EB', color: 'white', fontSize: '9px', fontWeight: 900, padding: '2px 5px', borderRadius: '4px' }}>मुखिया</span>}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                                            {v.gender === 'M' ? 'पुरुष' : 'महिला'} • {v.age} वर्ष {v.caste ? `• ${v.caste}` : ''}
                                        </div>
                                    </div>
                                    {v.mobile && (
                                        <a href={`tel:${v.mobile}`} style={{ color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800 }}>
                                            <Phone size={12} /> {v.mobile}
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>

                        <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                            डोर-टू-डोर विजिट हिस्ट्री
                        </h4>
                        {selectedHouseholdDetails.visits?.length === 0 ? (
                            <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>अभी तक कोई विजिट दर्ज नहीं हुई है।</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedHouseholdDetails.visits?.map((vis: any) => (
                                    <div key={vis.id} style={{ padding: '10px', borderRadius: '8px', background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: '11px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#16A34A', marginBottom: '2px' }}>
                                            <span>✅ विजिट ({vis.status})</span>
                                            <span style={{ color: '#64748B' }}>{new Date(vis.visitDate).toLocaleDateString('hi-IN')}</span>
                                        </div>
                                        {vis.notes && <p style={{ color: '#334155', margin: 0, fontWeight: 600 }}>{vis.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
