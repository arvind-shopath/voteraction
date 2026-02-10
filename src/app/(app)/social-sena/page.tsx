/*
 * 🔒 LOCKED BY USER
 * -------------------------------------------------------------------------
 * This file is considered STABLE and LOCKED.
 * DO NOT MODIFY this file without explicit permission from the user.
 * -------------------------------------------------------------------------
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
    Smartphone,
    Link2,
    Video,
    Upload as UploadIcon,
    LayoutGrid,
    List,
    Loader2,
    X,
    AlertCircle,
    RefreshCw,
    Bell,
    Download
} from 'lucide-react';
import { useView } from '@/context/ViewContext';
import { getAssemblies, logAction, getUsers, updateCandidateProfile } from '@/app/actions/admin';
import { getVapidPublicKey, savePushSubscription } from '@/app/actions/notifications';
import { getCandidatePostRequests, getCampaignMaterials, getSocialMediaApprovals, createCandidatePostRequest, createSocialMediaApproval, acceptCandidatePostRequest, rejectCandidatePostRequest, publishCandidatePost } from '@/app/actions/social';
import { getJansamparkRoutes, markPosterMade, markPosterNotNeeded } from '@/app/actions/jansampark';
import { launchSocialWindow, getAppEnvironment } from "@/lib/app-utils";
import { lockSocialSession, unlockSocialSession, saveSocialSession } from '@/app/actions/app-sync';
import Link from 'next/link';
import CentralWorkflowView from './CentralWorkflowView';

// --- Localization Mapper ---
const translations: any = {
    hi: {
        socialSena: "सोशल सेना",
        subtitle: "प्रचार और सक्रियता की निगरानी",
        teamMembers: "एप्स टीम (SOCIAL SENA MEMBERS)",
        searchPlaceholder: "कैंडिडेट, विधानसभा, पार्टी या राज्य से खोजें...",
        allStates: "सभी राज्य",
        allParties: "सभी पार्टियां",
        details: "विवरण (Details)",
        launch: "लॉन्च (Launch)",
        platforms: "Platforms",
        pending: "Pending",
        today: "Today",
        noCandidate: "कोई कैंडिडेट नहीं मिला",
        changeFilter: "कृपया सर्च या फिल्टर बदलें।",
        loading: "लोड हो रहा है...",
        back: "वापस",
        centralMenu: "सेंट्रल मेन्यू",
        socialMedia: "सोशल मीडिया (Social)",
        content: "कंटेंट (Content)",
        campaignMaterial: "प्रचार सामग्री (Materials)",
        profile: "प्रोफ़ाइल (Profile)",
        analytics: "एनालिटिक्स (Analytics)",
        routes: "आगामी रूट प्लान (Upcoming Routes)",
        pastRoutes: "पुराना रूट इतिहास (Past History)",
        none: "कोई नहीं",
        selectPhotos: "फोटो चुनें",
        selectVideos: "वीडियो चुनें",
        uploadPhotos: "फोटो अपलोड करें",
        uploadVideos: "वीडियो अपलोड करें",
        postLink: "सोशल लिंक पोस्ट करें",
        urlLinked: "URL लिंक है",
        setupPending: "सेटअप अधूरा है (Link Missing)",
        save: "सेव करें",
        linkSaved: "लिंक सेव हो गया!",
        loginFirst: "कृपया पहले लॉगिन करें।",
        posterMade: "पोस्टर तैयार",
        notNeeded: "जरूरत नहीं",
        locations: "लोकेशन्स",
        comingSoon: "जल्द आ रहा है",
        analyticsSub: "यहाँ आप रीच, एंगेजमेंट और ग्रोथ देख पाएंगे।"
    },
    en: {
        socialSena: "Social Sena",
        subtitle: "Monitoring Campaign & Activity",
        teamMembers: "Apps Team (SOCIAL SENA MEMBERS)",
        searchPlaceholder: "Search by candidate, assembly, party or state...",
        allStates: "All States",
        allParties: "All Parties",
        details: "Details",
        launch: "Launch",
        platforms: "Platforms",
        pending: "Pending",
        today: "Today",
        noCandidate: "No candidate found",
        changeFilter: "Please change search or filters.",
        loading: "Loading...",
        back: "Back",
        centralMenu: "Central Menu",
        socialMedia: "Social Media",
        content: "Content",
        campaignMaterial: "Campaign Materials",
        profile: "Profile",
        analytics: "Analytics",
        routes: "Upcoming Routes",
        pastRoutes: "Past History",
        none: "None",
        selectPhotos: "Select Photos",
        selectVideos: "Select Videos",
        uploadPhotos: "Upload Photos",
        uploadVideos: "Upload Videos",
        postLink: "Post Social Links",
        urlLinked: "URL Linked",
        setupPending: "Setup Pending (Link Missing)",
        save: "Save",
        linkSaved: "Link Saved!",
        loginFirst: "Please login first.",
        posterMade: "Poster Made",
        notNeeded: "Not Needed",
        locations: "Locations",
        comingSoon: "Coming Soon",
        analyticsSub: "Here you can see reach, engagement and growth."
    }
};

// Hindi to English Phonetic sorting mapper (Simplified)
const hindiSortMap: any = {
    'अ': 'A', 'आ': 'A', 'इ': 'I', 'ई': 'I', 'उ': 'U', 'ऊ': 'U', 'ऋ': 'R', 'ए': 'E', 'ऐ': 'A', 'ओ': 'O', 'औ': 'O',
    'क': 'K', 'ख': 'K', 'ग': 'G', 'घ': 'G', 'च': 'C', 'छ': 'C', 'ज': 'J', 'झ': 'J', 'ट': 'T', 'ठ': 'T', 'ड': 'D', 'ढ': 'D',
    'त': 'T', 'थ': 'T', 'द': 'D', 'ध': 'D', 'न': 'N', 'प': 'P', 'फ': 'P', 'ब': 'B', 'भ': 'B', 'म': 'M', 'य': 'Y', 'र': 'R',
    'ल': 'L', 'व': 'V', 'श': 'S', 'ष': 'S', 'स': 'S', 'ह': 'H'
};

const getSortKey = (name: string) => {
    if (!name) return 'Z';
    const firstChar = name.trim().charAt(0);
    return hindiSortMap[firstChar] || firstChar.toUpperCase();
};

const partySynonyms: any = {
    'bjp': ['bjp', 'भाजपा', 'भारतीय जनता पार्टी', 'कमल'],
    'sp': ['sp', 'सपा', 'समाजवादी पार्टी', 'cycle', 'cycle'],
    'inc': ['inc', 'कांग्रेस', 'congress', 'पंजा'],
    'bsp': ['bsp', 'बसपा', 'हाथी', 'elephant'],
    'aap': ['aap', 'आप', 'आम आदमी पार्टी', 'झाडू'],
};

// --- Helper Component for History ---
function HistorySection({ requests, lang }: { requests: any[], lang: string }) {
    const [days, setDays] = useState(7);
    const t = translations[lang];

    const filtered = requests.filter(r => {
        if (r.status !== 'PUBLISHED') return false;
        const date = new Date(r.publishedAt || r.updatedAt);
        const diffTime = Math.abs(Date.now() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= days;
    });

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={20} color="#10B981" />
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>Recent History</h3>
                </div>
                <select
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: '700', outline: 'none' }}
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={365}>All Time</option>
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                        No history found for this period.
                    </div>
                ) : filtered.map(task => (
                    <div key={task.id} style={{ padding: '12px', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#166534' }}>{task.subject}</span>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803d', background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px' }}>Posted</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#15803d' }}>
                            {new Date(task.publishedAt || task.updatedAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Central Team Specific Components ---

function RoleSpecificActions({ role, candidate, lang, session }: any) {
    const [requests, setRequests] = useState<any[]>([]);
    const [approvals, setApprovals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [showContentUpload, setShowContentUpload] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null); // Lightbox State

    const [form, setForm] = useState({ subject: '', location: '', description: '', photos: [] as File[], videos: [] as File[] });
    const [contentForm, setContentForm] = useState({ title: '', notes: '', contentType: 'IMAGE', photos: [] as File[], videos: [] as File[] });
    const t = translations[lang];

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const targetId = candidate.managerId || candidate.id;
            const currentUserId = session?.user?.id ? parseInt(session.user.id) : targetId;
            const [reqData, appData] = await Promise.all([
                getCandidatePostRequests(targetId, undefined, true), // Fetch ALL status
                getSocialMediaApprovals(currentUserId, true) // Fetch approvals created by ME
            ]);
            setRequests(reqData);
            setApprovals(appData); // Store ALL approvals for history tracking
        } catch (e) {
            console.error('Fetch failed', e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Trigger Based: Listen for Service Worker messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'REFRESH') {
                    console.log("Trigger Received: Refreshing Data");
                    fetchData(true);
                }
            });
        }
    }, [candidate.id, candidate.managerId]);

    const handleEnableNotifications = async () => {
        if (!('serviceWorker' in navigator)) return alert('Browser not supported');

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return alert('Permission denied');

        try {
            const registration = await navigator.serviceWorker.ready;
            const vapidKey = await getVapidPublicKey();

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey
            });

            await savePushSubscription((session?.user as any)?.id, subscription);
            alert('Live Updates Enabled! (Trigger Activated)');
        } catch (e) {
            console.error(e);
            alert('Failed to enable notifications');
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.subject || !form.location) return alert('विषय और जगह भरें!');
        setUploading(true);
        try {
            const uploadFile = async (file: File) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('candidateName', candidate.name);
                const res = await fetch('/api/cloud/upload', { method: 'POST', body: formData });
                const data = await res.json();
                return data.url;
            };

            const [photoUrls, videoUrls] = await Promise.all([
                Promise.all(form.photos.map(uploadFile)),
                Promise.all(form.videos.map(uploadFile))
            ]);

            const { createCandidatePostRequest } = await import('@/app/actions/social');
            await createCandidatePostRequest({
                subject: form.subject,
                location: form.location,
                description: form.description,
                photoUrls: JSON.stringify(photoUrls),
                videoUrls: JSON.stringify(videoUrls),
                assemblyId: candidate.assemblyId,
                createdBy: candidate.managerId || candidate.id
            });

            alert('अनुरोध भेज दिया गया है!');
            setShowUpload(false);
            setForm({ subject: '', location: '', description: '', photos: [], videos: [] });
            fetchData();
        } catch (error) {
            console.error(error);
            alert('अपलोड विफल रहा।');
        } finally {
            setUploading(false);
        }
    };

    const handleContentUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contentForm.title) return alert('टाइटल भरें!');
        setUploading(true);
        try {
            // 1. Validate User & Assembly
            const sessionUserId = (session?.user as any)?.id;
            const targetAssemblyId = candidate.assemblyId;

            if (!sessionUserId || !targetAssemblyId) {
                throw new Error("User session invalid. Please reload.");
            }

            const uploadFile = async (file: File) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('candidateName', candidate.name);
                const res = await fetch('/api/cloud/upload', { method: 'POST', body: formData });
                const data = await res.json();
                return data.url;
            };

            const [photoUrls, videoUrls] = await Promise.all([
                Promise.all(contentForm.photos.map(uploadFile)),
                Promise.all(contentForm.videos.map(uploadFile))
            ]);

            const allUrls = [...photoUrls, ...videoUrls];

            const { createSocialMediaApproval } = await import('@/app/actions/social');
            await createSocialMediaApproval({
                title: contentForm.title,
                contentType: contentForm.contentType,
                mediaUrls: JSON.stringify(allUrls),
                notes: contentForm.notes,
                assemblyId: parseInt(targetAssemblyId.toString()),
                createdBy: parseInt(sessionUserId.toString())
            });

            alert('कंटेंट अप्रूवल के लिए भेज दिया गया है!');
            setShowContentUpload(false);
            setContentForm({ title: '', notes: '', contentType: 'IMAGE', photos: [], videos: [] });
            fetchData();
        } catch (error: any) {
            console.error(error);
            alert('कंटेंट भेजना विफल रहा: ' + (error.message || 'Unknown Error'));
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `voteraction_media_${Date.now()}.${url.split('.').pop()}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error(e);
            window.open(url, '_blank');
        }
    };

    const handleAction = async (id: number, action: 'ACCEPT' | 'REJECT' | 'POST') => {
        if (!confirm('Are you sure?')) return;
        setUploading(true);
        try {
            // Ensure userId is a number for the server action
            const sessionUserId = (session?.user as any)?.id;
            const targetId = sessionUserId ? parseInt(sessionUserId) : (candidate.managerId || 0);

            if (!targetId) throw new Error("User ID not found (Please re-login)");

            if (action === 'ACCEPT') await acceptCandidatePostRequest(id, targetId);
            if (action === 'REJECT') await rejectCandidatePostRequest(id, targetId);
            if (action === 'POST') await publishCandidatePost(id, {});

            alert('Status Updated!');
            fetchData(true);
        } catch (e: any) {
            console.error(e);
            alert('Action failed: ' + (e.message || 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    // Helper to safely parse photos
    const getPhotos = (jsonString: string) => {
        try {
            const parsed = JSON.parse(jsonString);
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '24px' }}>
            {/* Details Modal */}
            {/* Lightbox / Preview */}
            {previewImage && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.2s', flexDirection: 'column' }}>
                    <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '16px' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleDownload(previewImage); }} style={{ padding: '10px 16px', background: 'white', borderRadius: '30px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                            <Download size={20} /> Download
                        </button>
                        <button onClick={() => setPreviewImage(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <X size={24} />
                        </button>
                    </div>
                    <img src={previewImage} style={{ maxWidth: '90%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                </div>
            )}

            {/* Details Modal */}
            {selectedTask && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
                        <button onClick={() => setSelectedTask(null)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}>
                            <X size={24} />
                        </button>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: '#1E293B' }}>{selectedTask.subject}</h3>
                        <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', display: 'flex', gap: '8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {selectedTask.location}</span>
                            <span>•</span>
                            <span>{new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                        </div>
                        {selectedTask.description && (
                            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', color: '#334155' }}>
                                {selectedTask.description}
                            </div>
                        )}

                        <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px', color: '#0F172A' }}>Attached Photos/Videos</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                            {getPhotos(selectedTask.photoUrls).map((url: string, i: number) => (
                                <div key={i} style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', position: 'relative' }} >
                                    <img src={url} alt="Task Media" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setPreviewImage(url)} />
                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(url); }} style={{ position: 'absolute', bottom: '4px', right: '4px', padding: '6px', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title="Download">
                                        <Download size={14} color="#0F172A" />
                                    </button>
                                </div>
                            ))}
                            {getPhotos(selectedTask.videoUrls).map((url: string, i: number) => (
                                <div key={i} style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    <Video color="white" size={24} onClick={() => window.open(url, '_blank')} style={{ cursor: 'pointer' }} />
                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(url); }} style={{ position: 'absolute', bottom: '4px', right: '4px', padding: '6px', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', border: 'none', cursor: 'pointer' }} title="Download">
                                        <Download size={14} color="#0F172A" />
                                    </button>
                                </div>
                            ))}
                            {getPhotos(selectedTask.photoUrls).length === 0 && getPhotos(selectedTask.videoUrls).length === 0 && (
                                <div style={{ gridColumn: '1 / -1', fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '10px' }}>No media attached</div>
                            )}
                        </div>
                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedTask(null)} style={{ padding: '10px 20px', background: '#F1F5F9', border: 'none', borderRadius: '10px', fontWeight: '800', color: '#64748B', cursor: 'pointer' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Send size={20} color="#2563EB" /> {role === 'CANDIDATE' ? 'मेरे द्वारा भेजे गए अनुरोध' : 'कैंडिडेट की तरफ से आए पोस्ट रिक्वेस्ट'}</div>
                            <button onClick={() => fetchData(false)} title="Refresh Items" style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
                                <RefreshCw size={18} className={loading && requests.length > 0 ? "animate-spin" : ""} color="#64748B" />
                            </button>
                            <button onClick={handleEnableNotifications} title="Activate Trigger (Enable Notifications)" style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: '8px' }}>
                                <Bell size={18} color="#F59E0B" />
                            </button>
                        </h3>
                        {role === 'CANDIDATE' && (
                            <button onClick={() => setShowUpload(true)} style={{ padding: '8px 16px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Plus size={16} /> नया भेजें
                            </button>
                        )}
                    </div>

                    {showUpload && (
                        <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #2563EB', marginBottom: '20px', animation: 'slideDown 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h4 style={{ fontWeight: '800', fontSize: '15px' }}>नया कंटेंट अनुरोध भेजें</h4>
                                <button onClick={() => setShowUpload(false)} style={{ color: '#64748B' }}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleUpload} style={{ display: 'grid', gap: '12px' }}>
                                <input placeholder="विषय (उदा: जनसभा)" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                                <input placeholder="जगह (उदा: सिकटा चौक)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                                <textarea placeholder="विवरण (Description)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', minHeight: '80px' }} />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <label style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontSize: '13px', fontWeight: '700' }}>
                                        <ImageIcon size={16} style={{ margin: '0 auto 4px' }} /> फोटो ({form.photos.length})
                                        <input type="file" multiple accept="image/*" hidden onChange={e => setForm({ ...form, photos: Array.from(e.target.files || []) })} />
                                    </label>
                                    <label style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontSize: '13px', fontWeight: '700' }}>
                                        <Video size={16} style={{ margin: '0 auto 4px' }} /> वीडियो ({form.videos.length})
                                        <input type="file" multiple accept="video/*" hidden onChange={e => setForm({ ...form, videos: Array.from(e.target.files || []) })} />
                                    </label>
                                </div>
                                <button disabled={uploading} style={{ width: '100%', padding: '12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
                                    {uploading ? 'अपलोड हो रहा है...' : 'भेजें (Submit)'}
                                </button>
                            </form>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {loading ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>{t.loading}</div>
                        ) : requests.filter(r => ['PENDING', 'ACCEPTED'].includes(r.status)).length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>कोई पेंडिंग रिक्वेस्ट नहीं है।</div>
                        ) : requests.filter(r => ['PENDING', 'ACCEPTED'].includes(r.status)).map((task) => {
                            const photos = getPhotos(task.photoUrls);
                            return (
                                <div key={task.id} style={{ padding: '16px', background: task.status === 'ACCEPTED' ? '#DCFCE7' : '#F8FAFC', borderRadius: '16px', border: task.status === 'ACCEPTED' ? '1px solid #22c55e' : '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        {photos.length > 0 ? (
                                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                                <img src={photos[0]} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ) : (
                                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <ImageIcon size={20} color="#94A3B8" />
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{task.subject}</div>
                                            <div style={{ fontSize: '12px', color: '#64748B' }}>{task.location} • {new Date(task.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US')}</div>
                                            {task.status === 'ACCEPTED' && <div style={{ fontSize: '11px', fontWeight: '700', color: '#15803d', marginTop: '2px' }}>Accepted - Ready to Post</div>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => setSelectedTask(task)} style={{ padding: '8px 16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                                            {t.details}
                                        </button>
                                        {(task.status === 'PENDING' || task.status === 'REJECTED') && (
                                            <>
                                                <button onClick={() => handleAction(task.id, 'ACCEPT')} style={{ padding: '8px 16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Accept</button>
                                                <button onClick={() => handleAction(task.id, 'REJECT')} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Reject</button>
                                            </>
                                        )}
                                        {task.status === 'ACCEPTED' && (
                                            <button onClick={() => handleAction(task.id, 'POST')} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Mark Posted</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recently Posted History - Left Column */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '24px' }}>
                    <HistorySection requests={requests} lang={lang} />
                </div>
            </div>

            {/* Right Column Wrapper */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Content Approval Form */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <CheckCircle2 size={24} color="#8B5CF6" />
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>कंटेंट अप्रूवल (Upload for Candidate)</h3>
                    </div>

                    <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>नया कंटेंट भेजें</h4>
                        <form onSubmit={handleContentUpload} style={{ display: 'grid', gap: '16px' }}>
                            <input
                                placeholder="कंटेंट का नाम (उदा: जनसभा पोस्टर)"
                                value={contentForm.title}
                                onChange={e => setContentForm({ ...contentForm, title: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px' }}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Edit Poster (फोटो/वीडियो)</label>
                                <label style={{
                                    width: '100%', padding: '30px', background: 'white', border: '2px dashed #E2E8F0', borderRadius: '12px',
                                    cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                                }}>
                                    <div style={{ width: '40px', height: '40px', background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <UploadIcon size={20} color="#3B82F6" />
                                    </div>
                                    <span style={{ fontSize: '14px', color: '#64748B' }}>
                                        {contentForm.photos.length + contentForm.videos.length > 0
                                            ? `${contentForm.photos.length + contentForm.videos.length} फाइल चुनी गई`
                                            : 'फाइल चुनें (Click to Upload)'}
                                    </span>
                                    <input type="file" multiple accept="image/*,video/*" hidden onChange={e => {
                                        const files = Array.from(e.target.files || []);
                                        const imgs = files.filter(f => f.type.startsWith('image/'));
                                        const vids = files.filter(f => f.type.startsWith('video/'));
                                        setContentForm({ ...contentForm, photos: imgs, videos: vids });
                                    }} />
                                </label>
                            </div>

                            <button disabled={uploading} style={{
                                width: '100%', padding: '14px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '12px',
                                fontWeight: '800', fontSize: '15px', cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.7 : 1,
                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
                            }}>
                                {uploading ? 'अपलोड हो रहा है...' : 'अप्रूवल के लिए भेजें (Send Approval)'}
                            </button>
                        </form>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#64748B', marginBottom: '10px' }}>Sent History & Status (भेजा गया कंटेंट)</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {approvals.map((app) => (
                                <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: app.status === 'APPROVED' ? '#F0FDF4' : app.status === 'REJECTED' ? '#FEF2F2' : 'white', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: '#1E293B' }}>{app.title}</span>
                                        <span style={{ fontSize: '11px', color: '#64748B' }}>{new Date(app.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <span style={{
                                        color: app.status === 'APPROVED' ? '#16A34A' : app.status === 'REJECTED' ? '#EF4444' : '#F59E0B',
                                        fontWeight: '800', fontSize: '11px',
                                        background: app.status === 'APPROVED' ? '#DCFCE7' : app.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                                        padding: '4px 8px', borderRadius: '6px'
                                    }}>
                                        {app.status}
                                    </span>
                                </div>
                            ))}
                            {approvals.length === 0 && <div style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>कोई अप्रूवल बकाया नहीं है।</div>}
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                <RoutesTab assemblyId={candidate.assemblyId} lang={lang} />
            </div>
        </div >
    );
}

function MaterialsTab({ candidateId, lang }: any) {
    const t = translations[lang];
    const [socialPlatform, setSocialPlatform] = useState('FACEBOOK');
    const [socialLink, setSocialLink] = useState('');
    const [photoTitle, setPhotoTitle] = useState('');
    const [videoTitle, setVideoTitle] = useState('');
    const [uploading, setUploading] = useState<string | null>(null);

    const handleFileUpload = async (type: 'PHOTO' | 'VIDEO') => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = type === 'PHOTO' ? 'image/*' : 'video/*';
        input.multiple = true;

        input.onchange = async (e: any) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const title = type === 'PHOTO' ? photoTitle : videoTitle;
            if (!title) {
                alert(lang === 'hi' ? "कृपया पहले टाइटल लिखें!" : "Please enter a title first!");
                return;
            }

            setUploading(type);
            try {
                const uploadedUrls: string[] = [];
                for (let i = 0; i < files.length; i++) {
                    const fd = new FormData();
                    fd.append('file', files[i]);
                    const res = await fetch('/api/cloud/upload', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (data.success) uploadedUrls.push(data.url);
                }

                if (uploadedUrls.length > 0) {
                    await fetch('/api/actions/social/createMaterial', {
                        method: 'POST',
                        body: JSON.stringify({
                            candidateId,
                            title,
                            materialType: type === 'PHOTO' ? 'Poster' : 'Video',
                            fileUrls: JSON.stringify(uploadedUrls)
                        })
                    });
                    alert(lang === 'hi' ? "सफलतापूर्वक अपलोड किया गया!" : "Uploaded successfully!");
                    if (type === 'PHOTO') setPhotoTitle(''); else setVideoTitle('');
                }
            } catch (err) {
                alert("Upload failed");
            } finally {
                setUploading(null);
            }
        };
        input.click();
    };

    const cardStyle = {
        background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px', padding: '16px', background: '#FEF2F2', borderRadius: '16px', border: '1px solid #FECACA' }}>
                <p style={{ color: '#DC2626', fontSize: '13px', fontWeight: '800' }}>
                    📢 {lang === 'hi'
                        ? "ये जगह फाइल स्टोर करने के लिए नहीं हैं.. यहां से आप फोटो और वीडियो सिर्फ भेज सकते हैं.. ये फाइलें 7 दिन में डिलीट हो जाएंगी.. प्लीज अपने पास बैकअप रखे.."
                        : "This is not for file storage. You can only send photos and videos from here. These files will be deleted in 7 days. Please keep your own backup."}
                </p>
            </div>

            <div style={cardStyle}>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#EFF6FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Link2 size={20} color="#2563EB" />
                    </div>
                    {t.postLink}
                </h3>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#F8FAFC', padding: '6px', borderRadius: '16px' }}>
                    {['FACEBOOK', 'TWITTER', 'INSTAGRAM'].map(p => (
                        <button key={p} onClick={() => setSocialPlatform(p)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: socialPlatform === p ? 'white' : 'transparent', color: socialPlatform === p ? '#2563EB' : '#64748B', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>
                            {p}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <input style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', background: '#F8FAFC' }} placeholder="Paste your post URL here..." value={socialLink} onChange={(e) => setSocialLink(e.target.value)} />
                    <button style={{ padding: '14px 28px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'white', background: '#2563EB' }}>
                        <Send size={18} /> Post
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ImageIcon size={20} color="#10B981" /> {t.uploadPhotos}
                    </h3>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <input style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', background: '#F8FAFC' }} placeholder="Title (e.g. Rally Photos)" value={photoTitle} onChange={(e) => setPhotoTitle(e.target.value)} />
                        <div
                            onClick={() => !uploading && handleFileUpload('PHOTO')}
                            style={{ border: '2px dashed #E2E8F0', borderRadius: '16px', padding: '48px', textAlign: 'center', background: '#F8FAFC', cursor: uploading ? 'default' : 'pointer', opacity: uploading === 'PHOTO' ? 0.6 : 1 }}
                        >
                            {uploading === 'PHOTO' ? <Loader2 className="animate-spin" size={32} color="#2563EB" style={{ margin: '0 auto 12px' }} /> : <UploadIcon size={32} color="#94A3B8" style={{ marginBottom: '12px' }} />}
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#64748B' }}>{uploading === 'PHOTO' ? 'Uploading...' : t.selectPhotos}</div>
                        </div>
                        <button
                            onClick={() => !uploading && handleFileUpload('PHOTO')}
                            disabled={!!uploading}
                            style={{ padding: '14px 28px', borderRadius: '12px', border: 'none', background: '#10B981', color: 'white', fontWeight: '800', cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.7 : 1 }}
                        >
                            {uploading === 'PHOTO' ? 'Processing...' : t.uploadPhotos}
                        </button>
                    </div>
                </div>

                <div style={cardStyle}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Video size={20} color="#F59E0B" /> {t.uploadVideos}
                    </h3>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <input style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', background: '#F8FAFC' }} placeholder="Title (e.g. Candidate Speech)" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} />
                        <div
                            onClick={() => !uploading && handleFileUpload('VIDEO')}
                            style={{ border: '2px dashed #E2E8F0', borderRadius: '16px', padding: '48px', textAlign: 'center', background: '#F8FAFC', cursor: uploading ? 'default' : 'pointer', opacity: uploading === 'VIDEO' ? 0.6 : 1 }}
                        >
                            {uploading === 'VIDEO' ? <Loader2 className="animate-spin" size={32} color="#2563EB" style={{ margin: '0 auto 12px' }} /> : <UploadIcon size={32} color="#94A3B8" style={{ marginBottom: '12px' }} />}
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#64748B' }}>{uploading === 'VIDEO' ? 'Uploading...' : t.selectVideos}</div>
                        </div>
                        <button
                            onClick={() => !uploading && handleFileUpload('VIDEO')}
                            disabled={!!uploading}
                            style={{ padding: '14px 28px', borderRadius: '12px', border: 'none', background: '#F59E0B', color: 'white', fontWeight: '800', cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.7 : 1 }}
                        >
                            {uploading === 'VIDEO' ? 'Processing...' : t.uploadVideos}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RoutesTab({ assemblyId, lang }: any) {
    const t = translations[lang];
    const { data: session } = useSession();
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const data = await getJansamparkRoutes(assemblyId);
            setRoutes(data);
        } catch (e) { }
        setLoading(false);
    };

    useEffect(() => { load(); }, [assemblyId]);

    const handleMark = async (id: number, status: 'MADE' | 'NOT_NEEDED') => {
        const userId = (session?.user as any)?.id;
        if (!userId) {
            alert(t.loginFirst);
            return;
        }
        try {
            if (status === 'MADE') await markPosterMade(id, userId);
            else await markPosterNotNeeded(id, userId);
            load();
        } catch (e) { alert("Error updating details."); }
    };

    const upcoming = routes.filter(r => new Date(r.date) >= new Date(new Date().setHours(0, 0, 0, 0))).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const past = routes.filter(r => new Date(r.date) < new Date(new Date().setHours(0, 0, 0, 0)));

    const renderRouteCard = (r: any) => (
        <div key={r.id} style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px' }}>
                        <Calendar size={18} color="#2563EB" />
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B' }}>{new Date(r.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>{r.visits.length} {t.locations}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {r.posterStatus ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', background: r.posterStatus === 'MADE' ? '#ECFDF5' : '#F8FAFC', border: `1px solid ${r.posterStatus === 'MADE' ? '#10B981' : '#E2E8F0'}`, color: r.posterStatus === 'MADE' ? '#059669' : '#64748B' }}>
                            <CheckCircle2 size={14} />
                            <span style={{ fontSize: '12px', fontWeight: '800' }}>{r.posterStatus === 'MADE' ? t.posterMade : t.notNeeded}</span>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => handleMark(r.id, 'MADE')} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #10B981', color: '#10B981', background: 'white', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                                <Plus size={14} /> {t.posterMade}
                            </button>
                            <button onClick={() => handleMark(r.id, 'NOT_NEEDED')} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #94A3B8', color: '#64748B', background: 'white', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                                {t.notNeeded}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '16px', borderTop: '1px dashed #E2E8F0' }}>
                {r.visits.map((v: any, idx: number) => (
                    <div key={v.id} style={{ padding: '10px 14px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #F1F5F9', fontSize: '13px', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: '#2563EB', color: 'white', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                        {v.village} {v.time && <span style={{ color: '#94A3B8', fontWeight: '600', fontSize: '12px' }}>({v.time})</span>}
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>{t.loading}</div>;

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '24px', background: '#2563EB', borderRadius: '4px' }}></div> {t.routes}
                </h3>
                {upcoming.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '32px', border: '1px dashed #E2E8F0' }}>
                        <MapPin size={40} color="#CBD5E1" style={{ marginBottom: '16px' }} />
                        <p style={{ color: '#94A3B8', fontWeight: '700' }}>{t.none}</p>
                    </div>
                ) : upcoming.map(renderRouteCard)}
            </div>

            <div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '24px', background: '#94A3B8', borderRadius: '4px' }}></div> {t.pastRoutes}
                </h3>
                {past.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>{t.none}</div>
                ) : past.map(renderRouteCard)}
            </div>
        </div>
    );
}

function CandidateDashboardView({ candidate, isCentral, onBack, initialTab, lang, onTabChange }: any) {
    const t = translations[lang];
    const { data: session } = useSession();
    const { effectiveRole, effectiveWorkerType } = useView();
    const [activeTab, setActiveTab] = useState(initialTab || 'SOCIAL');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [lockedPlatform, setLockedPlatform] = useState<string | null>(null);
    const [launching, setLaunching] = useState<string | null>(null);

    const menuItems = [
        { id: 'SOCIAL', label: t.socialMedia, icon: Share2 },
        { id: 'CONTENT', label: t.content, icon: FileText },
        { id: 'MATERIALS', label: t.campaignMaterial, icon: Share2 },
        { id: 'PROFILE', label: t.profile, icon: LayoutDashboard },
        { id: 'ANALYTICS', label: t.analytics, icon: BarChart3 },
    ];

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const handleTabChange = (id: string) => {
        setActiveTab(id);
        if (onTabChange) onTabChange(id);
    };

    const handleBackWithUnlock = async () => {
        const user = session?.user as any;
        if (lockedPlatform && user) {
            const rawId = candidate.managerId || candidate.id;
            const targetId = (rawId && rawId.toString().startsWith('manager-'))
                ? parseInt(rawId.toString().split('-')[1])
                : parseInt(rawId?.toString() || '0');

            if (targetId && !isNaN(targetId)) {
                await unlockSocialSession(lockedPlatform, targetId, user.id);
            }
        }
        onBack();
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'PROFILE':
                return (
                    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '32px' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', padding: '4px', border: '2px solid #E2E8F0', overflow: 'hidden' }}>
                                <img src={candidate?.image || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt={candidate?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                            const Icon = platform.icon;
                            return (
                                <div key={platform.id} style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, height: '6px', width: '100%', background: platform.color }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', marginBottom: '4px' }}>{platform.label}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSet ? '#10B981' : '#F59E0B' }}></div>
                                                <span style={{ fontSize: '12px', fontWeight: '800', color: isSet ? '#059669' : '#D97706' }}>
                                                    {isSet ? t.urlLinked : t.setupPending}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${platform.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: platform.color }}>
                                            <Icon size={28} />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '24px', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #E2E8F0', fontSize: '11px', color: '#64748B', fontWeight: '600', wordBreak: 'break-all' }}>
                                        {isSet ? `Current: ${platform.url}` : `Provide profile URL below:`}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <button
                                            disabled={launching === platform.id}
                                            onClick={async () => {
                                                console.log(`Launching ${platform.id}...`);
                                                const user = session?.user as any;
                                                if (!user?.id) { alert(t.loginFirst); return; }

                                                setLaunching(platform.id);
                                                try {
                                                    const rawId = candidate.managerId || candidate.id;
                                                    const targetId = (rawId && rawId.toString().startsWith('manager-'))
                                                        ? parseInt(rawId.toString().split('-')[1])
                                                        : parseInt(rawId?.toString() || '0');

                                                    if (!targetId || isNaN(targetId)) {
                                                        alert(lang === 'hi' ? "इस असेंबली के लिए कोई वैलिड कैंडिडेट/कैंडिडेट आईडी नहीं मिली।" : "No valid candidate/manager ID found for this assembly.");
                                                        return;
                                                    }
                                                    console.log(`Locking session for platform ${platform.id}, targetId ${targetId}`);

                                                    const res = await lockSocialSession(platform.id, targetId, user.id);
                                                    if (!res.success) {
                                                        alert(res.message);
                                                        return;
                                                    }
                                                    setLockedPlatform(platform.id);

                                                    // AUTO-LOGIN: If in Electron, apply session cookies before launching
                                                    const env = getAppEnvironment();
                                                    if (env === 'ELECTRON' && res.sessionData && res.sessionData !== "{}") {
                                                        try {
                                                            const electron = (window as any).require('electron');
                                                            await electron.ipcRenderer.invoke('apply-session', {
                                                                candidateId: targetId,
                                                                cookiesJSON: res.sessionData
                                                            });
                                                            console.log("Session applied successfully");
                                                        } catch (e) {
                                                            console.error("IPC Sync failed", e);
                                                        }
                                                    }

                                                    launchSocialWindow(platform.url || platform.fallback, `CreatiAV_${targetId}_${platform.id}`);
                                                } catch (err: any) {
                                                    console.error("Launch failed:", err);
                                                    const env = getAppEnvironment();
                                                    if (env === 'WEB') {
                                                        alert("ऑटो-लॉगिन सिर्फ डेस्कटॉप एप्प में काम करता है। वेब पर आपको मैन्युअली लॉगिन करना होगा।");
                                                    } else {
                                                        alert(`लॉन्च विफल रहा। कृपया पुनः प्रयास करें। (${err?.message || 'कनेक्शन एरर'})`);
                                                    }
                                                } finally {
                                                    setLaunching(null);
                                                }
                                            }}
                                            style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: launching === platform.id ? '#94A3B8' : platform.color, color: 'white', fontWeight: '900', cursor: launching === platform.id ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                            {launching === platform.id ? 'Wait...' : <><Play size={18} fill="currentColor" /> {t.launch}</>}
                                        </button>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <input id={`input-${platform.id}`} type="text" defaultValue={platform.url || ''} placeholder="https://..." style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none' }} />
                                            <button onClick={async (e) => {
                                                const btn = e.currentTarget;
                                                btn.disabled = true;
                                                const val = (document.getElementById(`input-${platform.id}`) as HTMLInputElement).value;
                                                try {
                                                    await updateCandidateProfile(candidate.managerId || candidate.id, { [`${platform.id}Url`]: val.trim() });
                                                    alert(t.linkSaved);
                                                    window.location.reload();
                                                } catch (err) {
                                                    alert("सेव करने में त्रुटि हुई।");
                                                } finally {
                                                    btn.disabled = false;
                                                }
                                            }} style={{ padding: '10px 16px', borderRadius: '10px', background: '#F1F5F9', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>{t.save}</button>
                                        </div>

                                        {/* SYNC SESSION (Electron Only) */}
                                        {getAppEnvironment() === 'ELECTRON' && (
                                            <button
                                                onClick={async () => {
                                                    const rawId = candidate.managerId || candidate.id;
                                                    const targetId = (rawId && rawId.toString().startsWith('manager-'))
                                                        ? parseInt(rawId.toString().split('-')[1])
                                                        : parseInt(rawId?.toString() || '0');

                                                    if (!targetId || isNaN(targetId) || !session?.user) return;

                                                    const platformUpper = platform.id.toUpperCase();
                                                    try {
                                                        const electron = (window as any).require('electron');
                                                        console.log("Capturing cookies for sync...");
                                                        const cookies = await electron.ipcRenderer.invoke('get-cookies', platform.url || platform.fallback);

                                                        await saveSocialSession({
                                                            platform: platformUpper,
                                                            candidateId: targetId,
                                                            sessionData: JSON.stringify(cookies),
                                                            userId: (session.user as any).id
                                                        });
                                                        alert("सिंक सफल! अब दूसरे एडमिन इस अकाउंट को ऑटो-लॉगिन कर सकेंगे।");
                                                    } catch (e) {
                                                        alert("सिंक विफल रहा।");
                                                    }
                                                }}
                                                style={{ marginTop: '12px', padding: '12px', borderRadius: '10px', background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <RefreshCw size={14} /> सिंक सेशन (Sync to Cloud for others)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                        }
                    </div >
                );
            case 'CONTENT':
                return <RoleSpecificActions role={effectiveRole} candidate={candidate} lang={lang} session={session} />;
            case 'MATERIALS':
                return <MaterialsTab candidateId={candidate.managerId || candidate.id} lang={lang} />;
            case 'ANALYTICS':
                return (
                    <div style={{ background: 'white', borderRadius: '24px', padding: '40px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                        <TrendingUp size={40} color="#0369A1" style={{ marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '20px', fontWeight: '900' }}>{t.comingSoon}</h3>
                        <p style={{ color: '#64748B' }}>{t.analyticsSub}</p>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <button onClick={handleBackWithUnlock} style={{ background: 'white', border: '1px solid #E2E8F0', width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ArrowLeft size={24} /></button>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A' }}>{candidate?.name}</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isCollapsed ? '80px 1fr' : '280px 1fr', gap: '32px', transition: 'all 0.3s' }}>
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', height: 'fit-content', position: 'sticky', top: '24px', zIndex: 10 }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {!isCollapsed && <div style={{ fontSize: '12px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>{t.centralMenu}</div>}
                        <button onClick={() => setIsCollapsed(!isCollapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>{isCollapsed ? <ChevronRight size={18} /> : <ArrowLeft size={18} />}</button>
                    </div>
                    <div style={{ padding: '12px' }}>
                        {menuItems.map(item => {
                            const IconComp = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabChange(item.id)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '16px', border: 'none',
                                        background: activeTab === item.id ? '#EFF6FF' : 'transparent',
                                        color: activeTab === item.id ? '#2563EB' : '#64748B',
                                        fontWeight: '800', cursor: 'pointer', marginBottom: '4px',
                                        transition: 'all 0.2s'
                                    }}>
                                    <IconComp size={20} /> {!isCollapsed && <span>{item.label}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="content-area" style={{ flex: 1 }}>{renderContent()}</div>
            </div>
        </div>
    );
}

function CandidateListView({ candidates, teamMembers, onSelect, onOpenCentralWorkflow, onOpenEditor, searchTerm, setSearchTerm, stateFilter, setStateFilter, partyFilter, setPartyFilter, lang }: any) {
    const t = translations[lang];
    const { effectiveRole, effectiveWorkerType } = useView();
    const isCentralTeam = (effectiveRole === 'SOCIAL_MEDIA' && ['CENTRAL_MANAGER', 'CENTRAL_DESIGNER', 'CENTRAL_EDITOR', 'CENTRAL_MONITOR', 'SOCIAL_CENTRAL'].includes(effectiveWorkerType || '')) ||
        ['ADMIN', 'SUPERADMIN'].includes(effectiveRole || '');
    const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

    const states = useMemo(() => Array.from(new Set(candidates.map((c: any) => c.state).filter(Boolean))), [candidates]) as string[];
    const parties = useMemo(() => Array.from(new Set(candidates.map((c: any) => c.party).filter(Boolean))), [candidates]) as string[];

    const filtered = useMemo(() => {
        return candidates.filter((c: any) => {
            const query = searchTerm.toLowerCase();
            if (!query) return true;

            let partyMatch = false;
            for (const key in partySynonyms) {
                if (query.includes(key) || partySynonyms[key].some((syn: string) => query.includes(syn))) {
                    if (c.party && (c.party.toLowerCase().includes(key) || partySynonyms[key].some((s: string) => c.party.toLowerCase().includes(s)))) {
                        partyMatch = true;
                        break;
                    }
                }
            }

            const matchesSearch = partyMatch ||
                c.name.toLowerCase().includes(query) ||
                c.assembly.toLowerCase().includes(query) ||
                (c.state && c.state.toLowerCase().includes(query));

            const matchesState = !stateFilter || c.state === stateFilter;
            const matchesParty = !partyFilter || c.party === partyFilter;

            return matchesSearch && matchesState && matchesParty;
        }).sort((a: any, b: any) => getSortKey(a.name).localeCompare(getSortKey(b.name)));
    }, [candidates, searchTerm, stateFilter, partyFilter]);

    return (
        <div style={{ padding: '24px', width: '100%' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                    .sidebar { display: none !important; }
                    .main-container { margin-left: 0 !important; width: 100% !important; }
                `
            }} />

            {isCentralTeam && (
                <div
                    onClick={onOpenCentralWorkflow}
                    style={{
                        background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
                        borderRadius: '24px',
                        padding: '24px',
                        marginBottom: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        boxShadow: '0 10px 15px -3px rgba(37,99,235,0.2)',
                        transition: 'transform 0.2s',
                        color: 'white'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={28} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>डिजाइनर / वीडियो एडिटर वर्कस्पेस</h3>
                            <p style={{ opacity: 0.8, fontSize: '14px', margin: '4px 0 0', fontWeight: '600' }}>सेंट्रल सोशल सेना के लिए कंटेंट क्रिएशन और मैनेजमेंट</p>
                        </div>
                    </div>
                    <div style={{ background: 'white', color: '#2563EB', padding: '10px 20px', borderRadius: '14px', fontWeight: '900', fontSize: '13px' }}>
                        ओपेन करें <ChevronRight size={16} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                    </div>
                </div>
            )}



            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ background: 'white', borderRadius: '24px', padding: '16px 24px', border: '1px solid #E2E8F0', display: 'flex', gap: '16px', flex: 1, alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <Search size={18} color="#94A3B8" />
                    <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={{ border: 'none', background: '#F8FAFC', padding: '10px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', outline: 'none', color: '#1E293B' }}>
                            <option value="">{t.allStates}</option>
                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)} style={{ border: 'none', background: '#F8FAFC', padding: '10px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', outline: 'none', color: '#1E293B' }}>
                            <option value="">{t.allParties}</option>
                            {parties.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', background: 'white', padding: '8px', borderRadius: '16px', border: '1px solid #E2E8F0', gap: '8px' }}>
                    <button onClick={() => setViewType('grid')} style={{ padding: '10px', borderRadius: '12px', border: 'none', background: viewType === 'grid' ? '#EFF6FF' : 'transparent', color: viewType === 'grid' ? '#2563EB' : '#94A3B8', cursor: 'pointer', transition: 'all 0.2s' }}><LayoutGrid size={20} /></button>
                    <button onClick={() => setViewType('list')} style={{ padding: '10px', borderRadius: '12px', border: 'none', background: viewType === 'list' ? '#EFF6FF' : 'transparent', color: viewType === 'list' ? '#2563EB' : '#94A3B8', cursor: 'pointer', transition: 'all 0.2s' }}><List size={20} /></button>
                </div>
            </div>

            <div style={{ display: viewType === 'grid' ? 'grid' : 'flex', flexDirection: viewType === 'list' ? 'column' : 'initial', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {filtered.map((c: any) => (
                    <div key={c.id} style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px', transition: 'all 0.3s ease', display: viewType === 'list' ? 'flex' : 'block', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', overflow: 'hidden', border: '3px solid #F1F5F9', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {c.image ? <img src={c.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={32} color="#94A3B8" />}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', marginBottom: '4px' }}>{c.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {c.partyLogo && <img src={c.partyLogo} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
                                    <span style={{ fontSize: '12px', fontWeight: '800', background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '8px' }}>{c.party}</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8' }}>{c.assembly} • {c.state}</span>
                                </div>
                            </div>
                        </div>

                        {viewType === 'grid' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '24px 0' }}>
                                <div style={{ textAlign: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#2563EB' }}>{c.socialCount || 0}</div>
                                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8' }}>{t.platforms}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#10B981' }}>{c.pendingApprovals || 0}</div>
                                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8' }}>{t.pending}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#F59E0B' }}>{c.todayPosts || 0}</div>
                                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8' }}>{t.today}</div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', width: viewType === 'list' ? 'auto' : '100%' }}>
                            <button onClick={() => {
                                console.log("Selecting CONTENT for", c.name);
                                onSelect(c, 'CONTENT');
                            }} style={{ padding: '12px 20px', borderRadius: '14px', background: '#F1F5F9', border: 'none', fontWeight: '900', fontSize: '13px', cursor: 'pointer', color: '#475569' }}>{t.details}</button>
                            <button onClick={() => {
                                console.log("Selecting SOCIAL for", c.name);
                                onSelect(c, 'SOCIAL');
                            }} style={{ padding: '12px 24px', borderRadius: '14px', background: '#2563EB', border: 'none', color: 'white', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>{t.launch} <Play size={14} fill="white" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function SocialSenaPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const { effectiveRole, effectiveWorkerType } = useView();

    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [initialTab, setInitialTab] = useState(searchParams.get('tab') || 'SOCIAL');
    const [candidates, setCandidates] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState('hi');

    const [searchTerm, setSearchTerm] = useState('');

    const [stateFilter, setStateFilter] = useState('');
    const [partyFilter, setPartyFilter] = useState('');
    const [showCentralWorkflow, setShowCentralWorkflow] = useState(false);

    // Sync state to/from URL
    useEffect(() => {
        const cid = searchParams.get('cid');
        const workflow = searchParams.get('workflow');
        const tab = searchParams.get('tab');

        if (tab) setInitialTab(tab);

        if (workflow === 'central') {
            setShowCentralWorkflow(true);
            setSelectedCandidate(null);
        } else if (cid && candidates.length > 0) {
            const found = candidates.find(c => c.id === cid || c.managerId?.toString() === cid);
            if (found) {
                setSelectedCandidate(found);
                setShowCentralWorkflow(false);
            }
        } else if (!cid && !workflow) {
            setSelectedCandidate(null);
            setShowCentralWorkflow(false);
        }
    }, [searchParams, candidates]);

    const updateUrl = (cid: string | null, workflow: string | null, tab?: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (cid) {
            params.set('cid', cid);
            params.delete('workflow');
        } else if (workflow) {
            params.set('workflow', workflow);
            params.delete('cid');
            params.delete('tab');
        } else {
            params.delete('cid');
            params.delete('workflow');
            params.delete('tab');
        }

        if (tab) {
            params.set('tab', tab);
        } else if (tab === null) {
            params.delete('tab');
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    useEffect(() => {
        const stored = localStorage.getItem('app_lang');
        if (stored) setLang(stored);

        // Redirect specialized roles to their specific URLs
        if (effectiveWorkerType === 'CENTRAL_DESIGNER' || (session?.user as any)?.role === 'DESIGNER') {
            router.replace('/social-sena/designer');
        } else if (effectiveWorkerType === 'CENTRAL_EDITOR' || (session?.user as any)?.role === 'EDITOR') {
            router.replace('/social-sena/video-editor');
        }
    }, [effectiveWorkerType, router]);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [asms, users] = await Promise.all([getAssemblies(), getUsers()]);
                const currentUser = session?.user as any;
                const isAdmin = currentUser?.role === 'SUPERADMIN';
                // Include Super Admin in managers list if they are acting as a candidate for testing
                const managers = users.filter((u: any) => u.role === 'CANDIDATE');
                const emptySeats = asms.filter((a: any) => !users.some((u: any) => u.role === 'CANDIDATE' && u.assemblyId === a.id));

                const items = [
                    ...managers.map((m: any) => {
                        const a = asms.find((as: any) => as.id === m.assemblyId);
                        return {
                            id: `manager-${m.id}`, managerId: m.id, assemblyId: m.assemblyId,
                            name: m.name || 'Unnamed Candidate', image: m.image,
                            party: a?.party || m.party || 'Independent',
                            partyLogo: a?.partyLogoUrl,
                            assembly: a?.name || 'No Assembly', state: a?.state || 'N/A',
                            facebookUrl: m.facebookUrl, instagramUrl: m.instagramUrl, twitterUrl: m.twitterUrl,
                            socialCount: (m.facebookUrl ? 1 : 0) + (m.instagramUrl ? 1 : 0) + (m.twitterUrl ? 1 : 0),
                            assignedUsers: users.filter((u: any) => ['SOCIAL_MEDIA', 'SM_MANAGER', 'DESIGNER', 'EDITOR'].includes(u.role) && (u.assemblyId === m.assemblyId || u.sharedAssignments?.some((sa: any) => sa.assemblyId === m.assemblyId)))
                        };
                    }),
                    ...emptySeats.map((a: any) => ({
                        id: `assembly-${a.id}`, managerId: null, assemblyId: a.id,
                        name: a.candidateName || 'Unnamed Candidate', image: a.candidateImageUrl,
                        party: a.party, partyLogo: a.partyLogoUrl, assembly: a.name, state: a.state,
                        facebookUrl: a.facebookUrl, instagramUrl: a.instagramUrl, twitterUrl: a.twitterUrl,
                        socialCount: (a.facebookUrl ? 1 : 0) + (a.instagramUrl ? 1 : 0) + (a.twitterUrl ? 1 : 0),
                        assignedUsers: users.filter((u: any) => ['SOCIAL_MEDIA', 'SM_MANAGER', 'DESIGNER', 'EDITOR'].includes(u.role) && (u.assemblyId === a.id || u.sharedAssignments?.some((sa: any) => sa.assemblyId === a.id)))
                    }))
                ];

                const currentId = currentUser?.id ? parseInt(currentUser.id.toString()) : NaN;
                const finalItems = items.filter(item =>
                    isAdmin ||
                    (item.managerId && item.managerId === currentId) ||
                    item.assignedUsers.some((u: any) => u.id === currentId)
                );
                setCandidates(finalItems);

                // Auto-select for Manager role (Candidate)
                if (currentUser?.role === 'CANDIDATE' && !isNaN(currentId)) {
                    const myInfo = finalItems.find(i => i.managerId === currentId);
                    if (myInfo) setSelectedCandidate(myInfo);
                }

                setTeamMembers(users.filter((u: any) => ['SOCIAL_TEAM', 'SM_MANAGER', 'DESIGNER', 'EDITOR'].includes(u.role)).slice(0, 10));
            } catch (e: any) {
                console.error("Load error", e);
                alert("Error loading data: " + (e?.message || "Internal Error"));
            } finally {
                setLoading(false);
            }
        }

        if (status === 'unauthenticated') {
            setLoading(false);
            return;
        }

        if (status === 'authenticated' && session) {
            const timeout = setTimeout(() => setLoading(false), 5000); // Fail-safe
            load().finally(() => {
                setLoading(false);
                clearTimeout(timeout);
            });
        }
    }, [session, status]);

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#94A3B8' }}>{translations[lang]?.loading || 'Loading...'}</div>;

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', width: '100%' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideDown { 
                    from { opacity: 0; transform: translateY(-10px); } 
                    to { opacity: 1; transform: translateY(0); }
                    }
                    `}} />
            {showCentralWorkflow ? (
                <CentralWorkflowView lang={lang} onBack={() => updateUrl(null, null)} />
            ) : selectedCandidate ? (
                <CandidateDashboardView
                    candidate={selectedCandidate}
                    onBack={() => updateUrl(null, null)}
                    onTabChange={(tab: string) => updateUrl(selectedCandidate.id, null, tab)}
                    initialTab={initialTab}
                    lang={lang}
                />
            ) : (
                <CandidateListView
                    candidates={candidates}
                    teamMembers={teamMembers}
                    onSelect={(c: any, tab: string) => {
                        setInitialTab(tab);
                        updateUrl(c.id, null, tab);
                    }}
                    onOpenCentralWorkflow={() => updateUrl(null, 'central')}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    stateFilter={stateFilter}
                    setStateFilter={setStateFilter}
                    partyFilter={partyFilter}
                    setPartyFilter={setPartyFilter}

                    lang={lang}
                />
            )}

        </div>
    );
}
