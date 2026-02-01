'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getAssemblies } from '@/app/actions/admin';
import { getAssemblySocialLinks, getSocialEngagementStats } from '@/app/actions/social';
import {
    LayoutDashboard, Users, Share2, Facebook, Instagram, Twitter,
    ExternalLink, Filter, TrendingUp, CheckCircle, Clock, Search
} from 'lucide-react';

export default function SocialTeamDashboard() {
    const { data: session }: any = useSession();
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | null>(null);
    const [socialLinks, setSocialLinks] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        const assemblyData = await getAssemblies();
        setAssemblies(assemblyData);
        if (session?.user?.assemblyId) {
            setSelectedAssemblyId(session.user.assemblyId);
        } else if (assemblyData.length > 0) {
            setSelectedAssemblyId(assemblyData[0].id);
        }
    };

    useEffect(() => {
        if (selectedAssemblyId) {
            fetchAssemblyData();
        }
    }, [selectedAssemblyId]);

    const fetchAssemblyData = async () => {
        if (!selectedAssemblyId) return;
        setLoading(true);
        const [links, engagement] = await Promise.all([
            getAssemblySocialLinks(selectedAssemblyId),
            getSocialEngagementStats(selectedAssemblyId)
        ]);
        setSocialLinks(links);
        setStats(engagement);
        setLoading(false);
    };

    const filteredWorkers = stats?.workers.filter((w: any) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (loading && !stats) return <div style={{ padding: '40px', textAlign: 'center' }}>लोड हो रहा है...</div>;

    return (
        <div style={{ paddingBottom: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>सोशल मीडिया डैशबोर्ड (Social Media)</h1>
                    <p style={{ color: '#64748B', marginTop: '4px' }}>डिजिटल प्रोग्रेस और कार्यकर्ता जुड़ाव</p>
                </div>

                {/* Assembly Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '10px 20px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <Filter size={18} color="#64748B" />
                    <select
                        value={selectedAssemblyId || ''}
                        onChange={(e) => setSelectedAssemblyId(Number(e.target.value))}
                        style={{ border: 'none', background: 'transparent', fontWeight: '700', fontSize: '15px', color: '#1E293B', outline: 'none', cursor: 'pointer' }}
                    >
                        {assemblies.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.number})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Candidate Social Links Card */}
            <div className="card" style={{ padding: '24px', borderRadius: '24px', background: 'white', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    प्रत्याशी के सोशल मीडिया लिंक
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {[
                        { platform: 'Facebook', url: socialLinks?.facebookUrl, icon: Facebook, color: '#1877F2' },
                        { platform: 'Instagram', url: socialLinks?.instagramUrl, icon: Instagram, color: '#E4405F' },
                        { platform: 'Twitter (X)', url: socialLinks?.twitterUrl, icon: Twitter, color: '#000000' }
                    ].map((link, i) => (
                        <div key={i} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #F1F5F9', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: link.color }}>
                                <link.icon size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>{link.platform}</div>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {link.url || 'Not Set'}
                                </div>
                            </div>
                            {link.url && (
                                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8' }}>
                                    <ExternalLink size={16} />
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Engagement Row */}
            <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                {/* Worker Engagement Table */}
                <div className="card" style={{ padding: '24px', borderRadius: '24px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>कार्यकर्ता जुड़ाव (Share Tracker)</h2>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                placeholder="नाम खोजें..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ padding: '8px 12px 8px 36px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', width: '200px' }}
                            />
                        </div>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>
                                    <th style={{ padding: '12px', fontSize: '12px', color: '#64748B', textTransform: 'uppercase' }}>कार्यकर्ता</th>
                                    <th style={{ padding: '12px', fontSize: '12px', color: '#64748B', textTransform: 'uppercase' }}>टाइप</th>
                                    <th style={{ padding: '12px', fontSize: '12px', color: '#64748B', textTransform: 'uppercase', textAlign: 'center' }}>शेयर किया?</th>
                                    <th style={{ padding: '12px', fontSize: '12px', color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>फॉलोअर?</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWorkers.map((w: any, i: number) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                        <td style={{ padding: '14px 12px', fontWeight: '700', color: '#1E293B' }}>{w.name}</td>
                                        <td style={{ padding: '14px 12px', fontSize: '13px', color: '#64748B' }}>
                                            <span style={{ padding: '2px 8px', background: '#F1F5F9', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>{w.type}</span>
                                        </td>
                                        <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                                            {w.sharedCount > 0 ? (
                                                <span style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                                                    <CheckCircle size={14} /> किया
                                                </span>
                                            ) : (
                                                <span style={{ color: '#F59E0B', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                                                    <Clock size={14} /> पेंडिंग
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                                            {/* For now, assuming follower status is based on share count */}
                                            {w.sharedCount > 0 ? (
                                                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', fontSize: '12px', fontWeight: '700' }}>
                                                    <CheckCircle size={14} /> है
                                                </span>
                                            ) : (
                                                <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', fontSize: '12px', fontWeight: '700' }}>
                                                    <Clock size={14} /> पेंडिंग
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Stats Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card" style={{ padding: '24px', borderRadius: '24px', background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)', color: 'white' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={20} /> शेयरिंग समरी
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase' }}>कुल शेयर (Total Shares)</div>
                                <div style={{ fontSize: '32px', fontWeight: '900' }}>{stats?.totalShares || 0}</div>
                            </div>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase' }}>सक्रिय कार्यकर्ता (Active Sharing)</div>
                                <div style={{ fontSize: '32px', fontWeight: '900' }}>{stats?.activeWorkers || 0} / {stats?.workers.length || 0}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '24px', borderRadius: '24px', background: 'white' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LayoutDashboard size={18} color="#64748B" /> प्लेटफॉर्म डिस्ट्रीब्यूशन
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { name: 'WhatsApp', percent: 85, color: '#25D366' },
                                { name: 'Facebook', percent: 10, color: '#1877F2' },
                                { name: 'Other', percent: 5, color: '#94A3B8' }
                            ].map((p, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                                        <span>{p.name}</span>
                                        <span>{p.percent}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{ width: `${p.percent}%`, height: '100%', background: p.color }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
