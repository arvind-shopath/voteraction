'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getHouseholdMapPoints, getHouseholdDetails } from '@/app/actions/households';
import { 
    MapPin, Home, ArrowLeft, Filter, Search, Users, 
    CheckCircle2, Compass, Layers, Phone, X, Loader2, RefreshCw 
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
            const data = await getHouseholdMapPoints();
            setPoints(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoints();
    }, []);

    // 2. Initialize Leaflet Map
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Dynamically load Leaflet CSS & JS
        const loadLeaflet = async () => {
            // Add Leaflet CSS if not already present
            if (!document.getElementById('leaflet-css')) {
                const link = document.createElement('link');
                link.id = 'leaflet-css';
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            // Import Leaflet
            const L = (await import('leaflet')).default;

            if (mapRef.current && !leafletMapInstance.current) {
                const map = L.map(mapRef.current, {
                    center: [25.58, 83.57], // Default UP center
                    zoom: 13,
                    zoomControl: true
                });

                // OpenStreetMap Tile Layer
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
        if (!leafletMapInstance.current || !markersLayerGroup.current || points.length === 0) return;

        const updateMarkers = async () => {
            const L = (await import('leaflet')).default;
            markersLayerGroup.current.clearLayers();

            const filtered = points.filter(p => {
                if (statusFilter !== 'ALL' && p.locationStatus !== statusFilter) return false;
                if (boothFilter !== 'ALL' && String(p.boothNumber) !== boothFilter) return false;
                if (search && !p.code.toLowerCase().includes(search.toLowerCase()) && !p.village.toLowerCase().includes(search.toLowerCase())) return false;
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
                    <div style="font-family: system-ui, sans-serif; min-width: 180px;">
                        <div style="font-weight: 900; font-size: 14px; color: #0F172A; margin-bottom: 2px;">
                            ${p.code} (मकान ${p.houseNumber})
                        </div>
                        <div style="font-size: 11px; color: #64748B; font-weight: 700; margin-bottom: 6px;">
                            📍 ${p.village} • बूथ #${p.boothNumber}
                        </div>
                        <div style="background: #F1F5F9; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; color: #1E293B; margin-bottom: 8px;">
                            👥 कुल वोटर्स: ${p.voterCount} | स्थिति: ${p.locationStatus}
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
    }, [points, statusFilter, boothFilter, search]);

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

    const uniqueBooths = Array.from(new Set(points.map(p => p.boothNumber))).sort((a, b) => a - b);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', background: '#F8FAFC' }}>
            {/* Top Bar Controls */}
            <div style={{ background: 'white', padding: isMobile ? '10px' : '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', zIndex: 10 }}>
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

                {/* Filters */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 800, background: 'white' }}
                    >
                        <option value="ALL">सभी स्थिति (All)</option>
                        <option value="Field_Verified">🟢 फील्ड सत्यापित</option>
                        <option value="Geocoded">🔵 जियोकोडेड</option>
                        <option value="Approximate">🟡 अनुमानित</option>
                    </select>

                    <select
                        value={boothFilter}
                        onChange={(e) => setBoothFilter(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 800, background: 'white' }}
                    >
                        <option value="ALL">सभी बूथ (All Booths)</option>
                        {uniqueBooths.map(b => (
                            <option key={b} value={String(b)}>बूथ #{b}</option>
                        ))}
                    </select>

                    <button
                        onClick={fetchPoints}
                        style={{ background: '#F1F5F9', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#475569' }}
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <div style={{ flex: 1, position: 'relative' }}>
                <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

                {/* Map Legend Floating Box */}
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(255, 255, 255, 0.95)', padding: '12px 16px', borderRadius: '14px', boxShadow: '0 4px 14px rgba(0,0,0,0.12)', zIndex: 999, backdropFilter: 'blur(4px)', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>मैप संकेतक (Legend)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontWeight: 800 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16A34A' }}></span> फील्ड सत्यापित (Verified)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563EB' }}></span> जियोकोडेड (Geocoded)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D97706' }}></span> अनुमानित क्षेत्र (Approximate)
                        </div>
                    </div>
                </div>
            </div>

            {/* Household Details Side Drawer / Modal */}
            {selectedHouseholdDetails && (
                <div style={{ position: 'fixed', top: 0, right: 0, width: isMobile ? '100vw' : '450px', height: '100vh', background: 'white', zIndex: 9999, boxShadow: '-10px 0 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 950, color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: '8px' }}>
                                {selectedHouseholdDetails.householdCode}
                            </span>
                            <h3 style={{ fontSize: '18px', fontWeight: 950, color: '#0F172A', margin: '6px 0 0 0' }}>
                                मकान {selectedHouseholdDetails.houseNumber} • {selectedHouseholdDetails.village}
                            </h3>
                        </div>
                        <button onClick={() => setSelectedHouseholdDetails(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                            <X size={18} />
                        </button>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, marginBottom: '16px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                        📍 पूरा पता: {selectedHouseholdDetails.fullAddress}
                    </div>

                    {/* Family Members */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Users size={16} color="#2563EB" /> परिवार सदस्य ({selectedHouseholdDetails.voters.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {selectedHouseholdDetails.voters.map((v: any) => (
                                <div key={v.id} style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A' }}>
                                            {v.name} {v.isHead && <span style={{ fontSize: '9px', fontWeight: 900, background: '#DCFCE7', color: '#166534', padding: '1px 5px', borderRadius: '4px' }}>मुखिया</span>}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
                                            आयु: {v.age || '-'} • लिंग: {v.gender} • EPIC: {v.epic || '-'}
                                        </div>
                                    </div>
                                    {v.mobile && (
                                        <a href={`tel:${v.mobile}`} style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 8px', borderRadius: '6px', textDecoration: 'none', fontSize: '11px', fontWeight: 800 }}>
                                            <Phone size={11} />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Visit History */}
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={16} color="#16A34A" /> फील्ड विजिट इतिहास
                        </div>
                        {selectedHouseholdDetails.visits.length === 0 ? (
                            <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>अभी तक कोई डोर-टू-डोर विजिट दर्ज नहीं हुई है।</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedHouseholdDetails.visits.map((vis: any) => (
                                    <div key={vis.id} style={{ background: '#F0FDF4', padding: '10px 12px', borderRadius: '12px', border: '1px solid #DCFCE7' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 900 }}>
                                            <span style={{ color: '#166534' }}>✅ {vis.status}</span>
                                            <span style={{ color: '#64748B' }}>{new Date(vis.visitDate).toLocaleDateString('hi-IN')}</span>
                                        </div>
                                        {vis.notes && (
                                            <p style={{ fontSize: '12px', color: '#334155', fontWeight: 600, margin: '4px 0 0 0' }}>
                                                {vis.notes}
                                            </p>
                                        )}
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
