/*
 * 🔒 LOCKED BY USER
 * -------------------------------------------------------------------------
 * This file is considered STABLE and LOCKED.
 * DO NOT MODIFY this file without explicit permission from the user.
 * -------------------------------------------------------------------------
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Users,
    MessageSquare,
    TrendingUp,
    Calendar,
    FileText,
    Share2,
    BarChart3,
    CheckCircle2,
    Clock,
    ArrowLeft,
    Search,
    Filter,
    Plus,
    LayoutDashboard,
    Image as ImageIcon,
    Send,
    MapPin,
    ShieldCheck,
    ChevronRight,
    Play,
    Facebook,
    Instagram,
    Twitter,
    Smartphone
} from 'lucide-react';
import { useView } from '@/context/ViewContext';
import { getAssemblies, logAction } from '@/app/actions/admin';
import { getCandidatePostRequests, getCampaignMaterials, getSocialMediaApprovals } from '@/app/actions/social';
import { launchSocialWindow, getAppEnvironment } from "@/lib/app-utils";
import Link from 'next/link';

// --- Central Team Specific Components ---

function RoleSpecificActions({ role, candidate }: any) {
    const [requests, setRequests] = useState<any[]>([]);
    const [approvals, setApprovals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [reqData, appData] = await Promise.all([
                    getCandidatePostRequests(candidate.id, 'PENDING'),
                    getSocialMediaApprovals(candidate.id)
                ]);
                setRequests(reqData);
                setApprovals(appData.filter((a: any) => a.status === 'PENDING'));
            } catch (e) {
                console.error('Fetch failed', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [candidate.id]);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Requests from Candidate */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Send size={20} color="#2563EB" /> कैंडिडेट की तरफ से आए पोस्ट रिक्वेस्ट
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {loading ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>लोड हो रहा है...</div>
                        ) : requests.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>कोई पेंडिंग रिक्वेस्ट नहीं है।</div>
                        ) : requests.map((task) => (
                            <div key={task.id} style={{ padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{task.subject}</div>
                                    <div style={{ fontSize: '12px', color: '#64748B' }}>{task.location} • {new Date(task.createdAt).toLocaleDateString('hi-IN')}</div>
                                </div>
                                <button style={{ padding: '8px 16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                                    विवरण देखें
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Approvals for Central Team (Team -> Candidate) */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle2 size={20} color="#10B981" /> आपके द्वारा भेजी गई सामग्री (Pending Approval)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {loading ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>लोड हो रहा है...</div>
                        ) : approvals.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>कोई पेंडिंग अप्रूवल नहीं है।</div>
                        ) : approvals.map((app) => (
                            <div key={app.id} style={{ padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{app.title}</div>
                                    <div style={{ fontSize: '12px', color: '#64748B' }}>{app.contentType} • {new Date(app.createdAt).toLocaleDateString('hi-IN')}</div>
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: '800', background: '#FFF7ED', color: '#C2410C', padding: '4px 10px', borderRadius: '6px' }}>
                                    PENDING
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>क्विक अपडेट</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ padding: '12px', background: '#EFF6FF', borderRadius: '12px', color: '#2563EB', fontSize: '13px', fontWeight: '700' }}>
                        नई गाइडलाइन: चुनाव प्रचार के दौरान भाषा का ध्यान रखें।
                    </div>
                </div>
            </div>
        </div>
    );
}

function MaterialsTab({ candidateId }: { candidateId: number }) {
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await getCampaignMaterials(candidateId);
                setMaterials(data);
            } catch (e) { }
            setLoading(false);
        }
        load();
    }, [candidateId]);

    return (
        <div style={{ padding: '24px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '24px' }}>प्रचार सामग्री लाइब्रेरी</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94A3B8' }}>लोड हो रहा है...</div>
                ) : materials.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94A3B8' }}>कोई सामग्री उपलब्ध नहीं है।</div>
                ) : materials.map((m: any) => (
                    <div key={m.id} style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
                        <div style={{ height: '140px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={40} color="#CBD5E1" />
                        </div>
                        <div style={{ padding: '12px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' }}>{m.title}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>{m.materialType}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CandidateDashboardView({ candidate, isCentral, onBack }: any) {
    const { effectiveWorkerType } = useView();
    const [activeTab, setActiveTab] = useState('PROFILE');

    const menuItems = [
        { id: 'PROFILE', label: 'प्रोफ़ाइल (Profile)', icon: LayoutDashboard },
        { id: 'SOCIAL', label: 'सोशल मीडिया (Social)', icon: Share2 },
        { id: 'CONTENT', label: 'कंटेंट (Content)', icon: FileText },
        { id: 'MATERIALS', label: 'प्रचार सामग्री (Materials)', icon: Share2 },
        { id: 'ANALYTICS', label: 'एनालिटिक्स (Analytics)', icon: BarChart3 },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'PROFILE':
                return (
                    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '32px' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', padding: '4px', border: '2px solid #E2E8F0' }}>
                                <img src={candidate?.image || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt={candidate?.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', marginBottom: '8px' }}>{candidate?.name}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '800', background: '#F1F5F9', color: '#475569', padding: '6px 12px', borderRadius: '8px' }}>
                                        {candidate?.assembly} ({candidate?.state})
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Placeholder for other profile info */}
                    </div>
                );
            case 'SOCIAL':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                        {[
                            { id: 'facebook', label: 'Facebook', url: candidate?.facebookUrl, fallback: 'https://www.facebook.com/login.php', icon: Facebook, color: '#1877F2' },
                            { id: 'instagram', label: 'Instagram', url: candidate?.instagramUrl, fallback: 'https://www.instagram.com/accounts/login/', icon: Instagram, color: '#E4405F' },
                            { id: 'twitter', label: 'Twitter / X', url: candidate?.twitterUrl, fallback: 'https://x.com/login?force_login=true', icon: Twitter, color: '#0F1419' },
                        ].map(platform => {
                            const isSet = !!(candidate?.[`${platform.id}Url`]);
                            return (
                                <div key={platform.id} style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, height: '6px', width: '100%', background: platform.color }}></div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', marginBottom: '4px' }}>{platform.label}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSet ? '#10B981' : '#F59E0B' }}></div>
                                                <span style={{ fontSize: '12px', fontWeight: '800', color: isSet ? '#059669' : '#D97706' }}>
                                                    {isSet ? 'URL लिंक है' : 'सेटअप अधूरा है (Link Missing)'}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${platform.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: platform.color }}>
                                            <platform.icon size={28} />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '24px', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #E2E8F0', fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                                        {isSet
                                            ? `लिंक: ${platform.url?.substring(0, 40)}...`
                                            : `पैनल को एक्टिव करने के लिए पहली बार लॉगिन और यूआरएल सेट करना ज़रूरी है।`}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <button
                                            onClick={async () => {
                                                const targetUrl = platform.url || platform.fallback;
                                                const winName = `CreatiAV_${candidate.id}_${platform.id}`;

                                                launchSocialWindow(targetUrl, winName);

                                                await logAction({
                                                    action: 'SOCIAL_MEDIA_LAUNCH',
                                                    details: `App Launch ${platform.label} for ${candidate.name} (Env: ${getAppEnvironment()})`,
                                                    assemblyId: candidate.id
                                                });
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '16px',
                                                borderRadius: '14px',
                                                border: 'none',
                                                background: platform.color,
                                                color: 'white',
                                                fontWeight: '900',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                transition: 'all 0.2s',
                                                boxShadow: `0 6px 20px ${platform.color}40`,
                                                fontSize: '15px'
                                            }}
                                        >
                                            <Play size={18} fill="currentColor" /> {isSet ? 'लॉन्च पैनल (Launch)' : 'पहली बार लॉगिन करें (Login & Connect)'}
                                        </button>

                                        {!isSet && (
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px' }}>
                                                    नोट: लॉगिन के बाद यूआरएल सेटिंग्स में सेव करें।
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'CONTENT':
                return (
                    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                        <RoleSpecificActions role={effectiveWorkerType} candidate={candidate} />
                    </div>
                );
            case 'MATERIALS':
                return <MaterialsTab candidateId={candidate.id} />;
            case 'ANALYTICS':
                return (
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '40px', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                            <TrendingUp size={40} color="#0369A1" />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', marginBottom: '8px' }}>एनालिटिक्स डेटा (Coming Soon)</h3>
                        <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto' }}>यहाँ आप इस कैंडिडेट के सोशल मीडिया प्लेटफॉर्म्स की रीच, एंगेजमेंट और ग्रोथ देख पाएंगे।</p>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <button onClick={onBack} style={{ background: 'white', border: '1px solid #E2E8F0', width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A' }}>{candidate?.name} <span style={{ color: '#2563EB' }}>पैनल</span></h1>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Central Menu</div>
                    </div>
                    <div style={{ padding: '12px' }}>
                        {menuItems.map(item => (
                            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '16px', border: 'none', background: activeTab === item.id ? '#EFF6FF' : 'transparent', color: activeTab === item.id ? '#2563EB' : '#64748B', fontWeight: '800', cursor: 'pointer', marginBottom: '4px', textAlign: 'left' }}>
                                <item.icon size={20} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>{renderContent()}</div>
            </div>
        </div>
    );
}

function CandidateListView({ candidates, onSelect }: any) {
    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A' }}>CreatiAV सोशल मीडिया <span style={{ color: '#2563EB' }}>टीम पैनल</span></h1>
                <p style={{ color: '#64748B' }}>अपनी टीम के सभी असाइन किए गए कैंडिडेट्स की निगरानी करें</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                {candidates.map((candidate: any) => (
                    <div key={candidate.id} onClick={() => onSelect(candidate)} style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '24px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <img src={candidate.image} alt={candidate.name} style={{ width: '64px', height: '64px', borderRadius: '16px' }} />
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{candidate.name}</h3>
                                <div style={{ fontSize: '13px', color: '#64748B' }}>{candidate.assembly}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function SocialTeamNewDashboard() {
    const router = useRouter();
    const { effectiveRole, effectiveWorkerType } = useView();
    const [viewMode, setViewMode] = useState('LIST');
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [candidates, setCandidates] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const data = await getAssemblies();
            setCandidates(data.map((a: any) => ({
                id: a.id,
                name: a.candidateName || 'Candidate Name',
                assembly: a.name,
                state: a.state,
                party: a.party || 'BJP',
                image: a.candidateImageUrl || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                facebookUrl: a.facebookUrl,
                instagramUrl: a.instagramUrl,
                twitterUrl: a.twitterUrl
            })));
        };
        load();

        // Redirect if not central team
        if (effectiveRole === 'SOCIAL_MEDIA') {
            const isCentral = effectiveWorkerType === 'SOCIAL_CENTRAL' || effectiveWorkerType?.startsWith('CENTRAL_');
            if (!isCentral) {
                router.push('/social/local-team');
            }
        }
    }, [effectiveRole, effectiveWorkerType, router]);

    // Force central view for this page
    const isCentralTeam = true;

    if (viewMode === 'DASHBOARD') {
        return <CandidateDashboardView
            candidate={selectedCandidate}
            isCentral={isCentralTeam}
            onBack={() => setViewMode('LIST')}
        />;
    }

    return <CandidateListView candidates={candidates} onSelect={(c: any) => { setSelectedCandidate(c); setViewMode('DASHBOARD'); }} />;
}
