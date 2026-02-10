/* 🔒 LOCKED BY USER */
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import { getSocialEngagementStats } from '@/app/actions/social';
import {
    Loader2, TrendingUp, Users, Share2, BarChart3, Medal, ArrowUpRight
} from 'lucide-react';

export default function SocialAnalyticsPage() {
    const { data: session }: any = useSession();
    const { effectiveRole, simulationPersona } = useView();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const assemblyId = (simulationPersona as any)?.assemblyId || (session?.user as any)?.assemblyId || 13;

    const role = effectiveRole || session?.user?.role;
    const isTeam = role === 'SOCIAL_MEDIA' || ['ADMIN', 'SUPERADMIN'].includes(role);

    useEffect(() => {
        if (session?.user) fetchStats();
    }, [session]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await getSocialEngagementStats(assemblyId);
            setStats(res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isTeam) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>आपको इस पेज को देखने की अनुमति नहीं है।</div>;
    }

    if (loading) return <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" /></div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <TrendingUp size={32} color="#2563EB" /> सोशल मीडिया एनालिटिक्स
            </h1>

            {/* Top Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div className="card" style={{ padding: '32px', borderRadius: '24px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                        <div style={{ background: 'white', padding: '10px', borderRadius: '12px', color: '#2563EB' }}>
                            <Share2 size={24} />
                        </div>
                        <span style={{ color: '#1E40AF', fontSize: '12px', fontWeight: '800', background: 'rgba(255,255,255,0.5)', padding: '4px 10px', borderRadius: '20px' }}>
                            <ArrowUpRight size={12} /> +12%
                        </span>
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: '900', color: '#1E3A8A', lineHeight: '1.1' }}>{stats?.totalShares || 0}</div>
                    <div style={{ color: '#1E40AF', fontWeight: '800', marginTop: '8px', fontSize: '14px' }}>कुल शेयर (Total Shares)</div>
                </div>

                <div className="card" style={{ padding: '32px', borderRadius: '24px', background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', border: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                        <div style={{ background: 'white', padding: '10px', borderRadius: '12px', color: '#10B981' }}>
                            <Users size={24} />
                        </div>
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: '900', color: '#064E3B', lineHeight: '1.1' }}>{stats?.activeWorkers || 0}</div>
                    <div style={{ color: '#065F46', fontWeight: '800', marginTop: '8px', fontSize: '14px' }}>सक्रिय कार्यकर्ता (Active Workers)</div>
                </div>
            </div>

            {/* Performance Ranking */}
            <div className="card" style={{ padding: '32px', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Medal size={24} color="#F59E0B" /> कार्यकर्ता प्रदर्शन रैंकिंग
                    </h3>
                    <button style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Download Report</button>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                    {stats?.workers?.map((w: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: i < 3 ? '#F8FAFC' : 'white', borderRadius: '16px', border: '1px solid #F1F5F9', transition: 'all 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#B45309' : '#F1F5F9',
                                    color: i < 3 ? 'white' : '#64748B',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900'
                                }}>{i + 1}</div>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '15px' }}>{w.name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Type: {w.type}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#2563EB' }}>{w.likeCount || 0}</div>
                                        <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Likes</div>
                                    </div>
                                    <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#10B981' }}>{w.commentCount || 0}</div>
                                        <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Comments</div>
                                    </div>
                                    <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#F59E0B' }}>{w.shareCount || 0}</div>
                                        <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Shares</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!stats?.workers || stats.workers.length === 0) && (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>कोई डेटा उपलब्ध नहीं है।</div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .card { background: white; border: 1px solid #E2E8F0; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
