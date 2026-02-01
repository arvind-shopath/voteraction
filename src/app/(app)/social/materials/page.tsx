/* 🔒 LOCKED BY USER (FINAL CLEAN VERSION - WORKER TASK VIEW) */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import { getCampaignMaterials, trackMaterialInteraction, getWorkerMaterialStats, getAssemblySocialLinks } from '@/app/actions/social';
import {
    Loader2, Link as LinkIcon, Image as ImageIcon, Video,
    ExternalLink, Download, ThumbsUp, MessageCircle, Share2, ArrowRight,
    Facebook, Twitter, Instagram, CheckCircle2, CheckSquare, Square, Calendar, Lock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SocialMaterialsPage() {
    const { data: session }: any = useSession();
    const { effectiveRole } = useView();
    const router = useRouter();
    const assemblyId = session?.user?.assemblyId || 1;
    const userId = session?.user?.id;

    // 1. SOCIAL MEDIA TEAM / ADMIN REDIRECT
    useEffect(() => {
        const roleStr = effectiveRole as string;
        if (roleStr === 'SOCIAL_MEDIA' || roleStr === 'ADMIN') {
            router.replace('/social/update-materials');
        }
    }, [effectiveRole, router]);

    // If redirecting, show loader
    const roleStr = effectiveRole as string;
    if (roleStr === 'SOCIAL_MEDIA' || roleStr === 'ADMIN') {
        return <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" color="#2563EB" /></div>;
    }

    // 2. WORKER VIEW logic
    const [materials, setMaterials] = useState<any[]>([]);
    const [userStats, setUserStats] = useState<any>({});
    const [candidateName, setCandidateName] = useState('प्रत्याशी');
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Track if user has opened the link
    const [openedLinks, setOpenedLinks] = useState<Record<number, boolean>>({});

    // Stabilize fetching
    const lastFetchRef = useRef<string>('');

    useEffect(() => {
        if (session?.user && effectiveRole === 'WORKER') {
            const fetchKey = `${userId}-${selectedDate}`;
            if (lastFetchRef.current !== fetchKey) {
                fetchData();
                lastFetchRef.current = fetchKey;
            }
        }
    }, [userId, effectiveRole, selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mRes, sRes, aRes] = await Promise.all([
                getCampaignMaterials(assemblyId),
                getWorkerMaterialStats(Number(userId)),
                getAssemblySocialLinks(assemblyId)
            ]);

            setMaterials(mRes || []);
            setUserStats(sRes || {});
            if (aRes?.candidateName) setCandidateName(aRes.candidateName);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLinkClick = (url: string, id: number) => {
        if (url) {
            window.open(url, '_blank');
            setOpenedLinks(prev => ({ ...prev, [id]: true }));
        }
    };

    const handleAction = async (materialId: number, actionType: 'LIKE' | 'SHARE' | 'COMMENT') => {
        // Optimistic UI Update
        const keyMap: Record<string, string> = {
            'LIKE': 'liked',
            'SHARE': 'shared',
            'COMMENT': 'commented'
        };
        const key = keyMap[actionType];

        const currentVal = userStats[materialId]?.[key];
        const newState = !currentVal;

        // Perform UI update
        setUserStats((prev: any) => ({
            ...prev,
            [materialId]: {
                ...prev[materialId] || { liked: false, shared: false, commented: false },
                [key]: newState
            }
        }));

        // Track in background
        try {
            await trackMaterialInteraction(materialId, Number(userId), actionType);
        } catch (e) {
            console.error('Tracking failed', e);
        }
    };

    // Toggle Status Wrapper
    const toggleStatus = (id: number, type: 'LIKE' | 'SHARE' | 'COMMENT', url: string, isLink: boolean) => {
        // Enforce Link Click
        if (isLink && !openedLinks[id] && !userStats[id]?.liked && !userStats[id]?.shared && !userStats[id]?.commented) {
            alert('⚠️ कृपया कार्य मार्क करने से पहले लिंक पर क्लिक करके पोस्ट देखें।\n(Please open the link first)');
            return;
        }
        handleAction(id, type);
    };

    const isFullyDone = (id: number) => {
        const s = userStats[id];
        return s?.liked && s?.commented && s?.shared;
    };

    if (loading && effectiveRole === 'WORKER' && materials.length === 0) return <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" color="#2563EB" /></div>;

    // 2. ACCESS CONTROL (Fallback)
    const isWorker = effectiveRole === 'WORKER';
    const roleStrCheck = effectiveRole as string;
    if (!isWorker && roleStrCheck !== 'SOCIAL_MEDIA' && roleStrCheck !== 'ADMIN') {
        if (!effectiveRole) return <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" color="#2563EB" /></div>;

        return (
            <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#64748B' }}>
                <h2>Restricted Access</h2>
                <p>This page is only for Ground Workers & Booth Managers.</p>
            </div>
        );
    }

    const getPlatformIcon = (platform: string, size = 24) => {
        if (platform === 'Facebook') return <Facebook size={size} color="#1877F2" />;
        if (platform === 'Twitter') return <Twitter size={size} color="#000000" />;
        if (platform === 'Instagram') return <Instagram size={size} color="#E4405F" />;
        return <LinkIcon size={size} color="#6B7280" />;
    };

    // Filter Logic
    const filteredMaterials = materials.filter(m => {
        const mDate = new Date(m.createdAt).toISOString().split('T')[0];
        return mDate === selectedDate;
    });

    const pendingTasks = filteredMaterials.filter(m => !isFullyDone(m.id));
    const completedTasks = filteredMaterials.filter(m => isFullyDone(m.id));

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px', fontFamily: 'system-ui, sans-serif' }}>

            {/* Header */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#111827', marginBottom: '8px', lineHeight: '1.3' }}>
                    <span style={{ color: '#F97316' }}>{candidateName}</span> को सोशल मीडिया पर समर्थन दें...
                </h1>
                <p style={{ color: '#64748B', fontSize: '16px' }}>
                    उनकी पोस्ट पर Like, Share और Comment करें।
                </p>
            </div>

            {/* Date Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', width: 'fit-content', margin: '0 auto 24px auto' }}>
                <Calendar size={20} color="#64748B" />
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ border: 'none', fontSize: '16px', color: '#1F2937', outline: 'none', fontWeight: '600' }}
                />
            </div>

            {/* PENDING TASKS (Cards) */}
            <div style={{ display: 'grid', gap: '24px' }}>
                {pendingTasks.length === 0 && completedTasks.length === 0 && !loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#F8FAFC', borderRadius: '16px', color: '#94A3B8' }}>
                        No tasks available for this date.
                    </div>
                ) : (
                    pendingTasks.map(mat => {
                        const url = JSON.parse(mat.fileUrls || '[]')[0];
                        const isLink = mat.materialType === 'Link';
                        const isVideo = mat.materialType === 'Video';
                        const platform = mat.platform || 'General';
                        const stats = userStats[mat.id] || { liked: false, shared: false, commented: false };

                        const isLocked = isLink && !openedLinks[mat.id] && !stats.liked && !stats.shared && !stats.commented;

                        return (
                            <div key={mat.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <div style={{ padding: '20px' }}>
                                    <h3 style={{ fontWeight: '800', fontSize: '18px', color: '#1F2937', marginBottom: '12px' }}>{mat.title}</h3>

                                    {/* Content Preview */}
                                    {isLink ? (
                                        <div onClick={() => handleLinkClick(url, mat.id)} style={{ background: '#F9FAFB', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ background: 'white', padding: '10px', borderRadius: '10px' }}>{getPlatformIcon(platform)}</div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{ fontSize: '14px', fontWeight: '700' }}>{platform} Link</div>
                                                <div style={{ fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
                                                {!openedLinks[mat.id] && <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: '700', marginTop: '4px' }}>Click to Open & Unlock Tasks</div>}
                                            </div>
                                            <ExternalLink size={16} color="#94A3B8" />
                                        </div>
                                    ) : (
                                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                                            {isVideo ? <video src={url} controls style={{ width: '100%', maxHeight: '400px' }} /> : <img src={url} alt={mat.title} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />}
                                        </div>
                                    )}
                                </div>

                                {/* ACTION CHECKLIST (Locked state) */}
                                <div style={{ background: isLocked ? '#F1F5F9' : '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '16px 20px', position: 'relative' }}>
                                    {isLocked && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.6)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: '700', fontSize: '14px', background: 'white', padding: '8px 16px', borderRadius: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                <Lock size={14} /> Open Link First
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase' }}>MARK YOUR ACTIVITY:</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        {['LIKE', 'COMMENT', 'SHARE'].map((action) => {
                                            const keyMap: Record<string, string> = { 'LIKE': 'liked', 'SHARE': 'shared', 'COMMENT': 'commented' };
                                            const key = keyMap[action];
                                            const isDone = stats[key];
                                            return (
                                                <div key={action} onClick={() => toggleStatus(mat.id, action as any, url, isLink)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px' }}>
                                                    {isDone ? <CheckSquare size={24} color="#16A34A" fill="#DCFCE7" /> : <Square size={24} color="#94A3B8" />}
                                                    <span style={{ fontSize: '14px', fontWeight: '600', color: isDone ? '#166534' : '#475569' }}>
                                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* COMPLETED HISTORY (List Style) */}
            {completedTasks.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 color="#16A34A" /> Completed Tasks (History)
                    </h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {completedTasks.map(mat => {
                            const platform = mat.platform || 'General';
                            return (
                                <div key={mat.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', opacity: 0.8 }}>
                                    <div style={{ flexShrink: 0 }}>{getPlatformIcon(platform, 20)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#374151', textDecoration: 'line-through' }}>{mat.title}</div>
                                        <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: '600' }}>Completed ✓</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {loading && materials.length > 0 && (
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'white', padding: '8px 16px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 100 }}>
                    <Loader2 size={16} className="animate-spin" color="#2563EB" />
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Syncing...</span>
                </div>
            )}
        </div>
    );
}
