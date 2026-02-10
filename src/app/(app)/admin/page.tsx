import React from 'react';
import { getAdminStats, getAssemblies } from '@/app/actions/admin';
import { getDeveloperMode } from '@/app/actions/system';
import {
    Tent, Users, Globe, ArrowRight, AlertTriangle,
    ListTodo, Clock, ShieldCheck, Flag, Star,
    Vote, Zap, Settings, Database, Activity,
    ShieldAlert, HardDrive, RefreshCw, Terminal,
    MapPin, Server, Cpu, HeartPulse
} from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import SyncAppsButton from '@/components/SyncAppsButton';
import CleanCacheButton from '@/components/CleanCacheButton';
import DeveloperModeToggle from '@/components/DeveloperModeToggle';

export default async function AdminDashboard() {
    const session = await auth();
    const cookieStore = await cookies();
    const effectiveRole = cookieStore.get('effectiveRole')?.value || (session?.user as any)?.role;

    const isSuperAdmin = effectiveRole === 'SUPERADMIN';
    const stats = await getAdminStats();
    const assemblies = await getAssemblies();
    const developerMode = await getDeveloperMode();

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' }}>सुपर एडमिन <span style={{ color: '#2563EB' }}>कंट्रोल पैनल</span></h1>
                    <p style={{ color: '#64748B', marginTop: '4px', fontSize: '16px' }}>केंद्रीय एप्लीकेशन डैशबोर्ड और सिस्टम ओवरव्यू</p>
                </div>
            </div>

            {/* UPGRADED KPI STATS - FOCUSED DATA */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                {[
                    { label: 'कुल विधानसभाएँ', value: stats.totalAssemblies, icon: Tent, color: '#3B82F6', bg: '#EFF6FF', desc: 'Active Constituencies' },
                    { label: 'सक्रिय कैंडिडेट्स', value: (stats as any).totalCandidates || 0, icon: Star, color: '#EC4899', bg: '#FDF2F8', desc: 'Campaign Leads' },
                    { label: 'सर्वर स्टेटस', value: 'Online', icon: Server, color: '#10B981', bg: '#ECFDF5', desc: 'Main API Cluster' },
                    { label: 'डेटाबेस हेल्थ', value: 'Healthy', icon: HeartPulse, color: '#8B5CF6', bg: '#F5F3FF', desc: 'Backup Auto-Sync' }
                ].map((kpi, i) => (
                    <div key={i} style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: '24px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        border: '1px solid #F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            background: kpi.bg,
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: kpi.color
                        }}>
                            <kpi.icon size={28} />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</div>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: '#1E293B', marginTop: '2px' }}>{kpi.value}</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{kpi.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* INFORMATION SECTION: ASSEMBLY OVERVIEW */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '4px', height: '24px', background: '#2563EB', borderRadius: '4px' }}></div>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B' }}>विधानसभाओं का सारांश (Constituency Overview)</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                    {assemblies.map((assembly, i) => {
                        // Correct Candidate detection (Both Direct and Shared)
                        const directCandidates = assembly.users.filter((u: any) => u.role === 'CANDIDATE');
                        const sharedCandidates = assembly.sharedAssignments?.map((sa: any) => sa.user).filter((u: any) => u.role === 'CANDIDATE') || [];

                        const allCandidates = Array.from(new Map([...directCandidates, ...sharedCandidates].map(c => [c.id, c])).values());

                        return (
                            <div key={i} style={{
                                background: 'white',
                                borderRadius: '24px',
                                padding: '24px',
                                border: '1px solid #F1F5F9',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', textTransform: 'uppercase' }}>AC No. {assembly.number}</div>
                                        <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>{assembly.name}</h3>
                                        <div style={{ fontSize: '13px', color: '#64748B' }}>{assembly.district}, {assembly.state}</div>
                                    </div>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: assembly.themeColor || '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <Tent size={24} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>नियुक्त किए गए कैंडिडेट्स</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                        {allCandidates.length > 0 ? allCandidates.map((candidate: any) => (
                                            <div key={candidate.id} style={{
                                                background: '#F8FAFC',
                                                borderRadius: '16px',
                                                padding: '12px 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                border: '1px solid #F1F5F9',
                                                flex: '1 1 calc(50% - 12px)',
                                                minWidth: '150px'
                                            }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E2E8F0', overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                    {candidate?.image ? <img src={candidate.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={16} color="#94A3B8" /></div>}
                                                </div>
                                                <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{candidate?.name || 'Unknown'}</div>
                                            </div>
                                        )) : (
                                            <div style={{ color: '#94A3B8', fontSize: '13px', fontStyle: 'italic' }}>कोई कैंडिडेट असाइन नहीं है</div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ padding: '12px', background: 'white', border: '1px solid #F1F5F9', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '800' }}>कुल मतदाता</div>
                                        <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>{assembly._count.voters.toLocaleString()}</div>
                                    </div>
                                    <div style={{ padding: '12px', background: 'white', border: '1px solid #F1F5F9', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '800' }}>कुल बूथ संख्या</div>
                                        <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>{assembly._count.booths}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SYSTEM MAINTENANCE SECTION */}
            {isSuperAdmin && (
                <div style={{
                    background: '#F8FAFC',
                    borderRadius: '28px',
                    padding: '32px',
                    border: '1px solid #E2E8F0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ padding: '8px', background: '#0F172A', borderRadius: '10px', color: 'white' }}>
                            <Settings size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B' }}>सिस्टम मेंटेनेंस & यूटिलिटीज</h2>
                            <p style={{ fontSize: '13px', color: '#64748B' }}>एडवांस सर्वर ऑपरेशंस और डेवलपर टूल्स</p>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '20px'
                    }}>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <Terminal size={18} color="#2563EB" />
                                <span style={{ fontWeight: '800', fontSize: '14px', color: '#1E293B' }}>डेवलपर मोड (Developer Mode)</span>
                            </div>
                            <DeveloperModeToggle initialState={developerMode} />
                        </div>

                        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <RefreshCw size={18} color="#10B981" />
                                <span style={{ fontWeight: '800', fontSize: '14px', color: '#1E293B' }}>एप्लीकेशन सिंक (Platform Sync)</span>
                            </div>
                            <SyncAppsButton />
                        </div>

                        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <HardDrive size={18} color="#EF4444" />
                                <span style={{ fontWeight: '800', fontSize: '14px', color: '#1E293B' }}>कैश क्लीनर (Clean Cache)</span>
                            </div>
                            <CleanCacheButton />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
