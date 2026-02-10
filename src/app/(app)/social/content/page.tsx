/*
 * 🔒 LOCKED BY USER
 * -------------------------------------------------------------------------
 * This file is considered STABLE and LOCKED.
 * DO NOT MODIFY this file without explicit permission from the user.
 * -------------------------------------------------------------------------
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import {
    getCandidatePostRequests,
    acceptCandidatePostRequest,
    publishCandidatePost,
    createSocialMediaApproval,
    getSocialMediaApprovals
} from '@/app/actions/social';
import { getJansamparkRoutes, markPosterMade, markPosterNotNeeded } from '@/app/actions/jansampark';
import {
    Clock, CheckCircle, Send, MapPin, User, Facebook, Twitter, Instagram,
    Loader2, Download, Image as ImageIcon, Film, X, Upload, Check, AlertCircle, Eye, Zap, TrendingUp
} from 'lucide-react';

export default function SocialContentPage() {
    const { data: session }: any = useSession();
    const { effectiveRole, simulationPersona } = useView();
    const [requests, setRequests] = useState<any[]>([]);
    const [approvals, setApprovals] = useState<any[]>([]);
    const [jansamparkRoutes, setJansamparkRoutes] = useState<any[]>([]);
    const [jansamparkHistory, setJansamparkHistory] = useState<any[]>([]);
    const [jansamparkTab, setJansamparkTab] = useState<'upcoming' | 'history'>('upcoming');
    const [viewingApproval, setViewingApproval] = useState<any>(null);
    const [candidateName, setCandidateName] = useState('Candidate');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form states for approval upload
    const [approvalForm, setApprovalForm] = useState({ title: '', contentType: 'Poster', files: [] as File[] });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const assemblyId = (simulationPersona as any)?.assemblyId || (session?.user as any)?.assemblyId || 13;
    const role = effectiveRole || session?.user?.role;
    const isSocialMediaTeam = role === 'SOCIAL_MEDIA' || ['ADMIN', 'SUPERADMIN'].includes(role);

    useEffect(() => {
        if (session?.user) fetchData();
    }, [session]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { getAssemblySocialLinks } = await import('@/app/actions/social');
            const [reqRes, appRes, routesRes, historyRes, linksRes] = await Promise.all([
                getCandidatePostRequests(assemblyId),
                getSocialMediaApprovals(assemblyId),
                getJansamparkRoutes(assemblyId, true),  // Only unmarked (poster not made)
                getJansamparkRoutes(assemblyId, false), // Only marked (poster made)
                getAssemblySocialLinks(assemblyId)
            ]);
            setRequests(reqRes || []);
            setApprovals(appRes || []);
            setJansamparkRoutes(routesRes || []);
            setJansamparkHistory(historyRes || []);
            if (linksRes?.candidateName) setCandidateName(linksRes.candidateName);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleAccept = async (id: number) => {
        try {
            await acceptCandidatePostRequest(id, session.user.id);
            alert('अनुरोध स्वीकार कर लिया गया!');
            fetchData();
        } catch (error) { console.error(error); }
    };

    const handlePublish = async (id: number) => {
        if (!confirm('क्या आपने यह पोस्ट सोशल मीडिया पर डाल दी है? (Confirm Posted)')) return;
        try {
            await publishCandidatePost(id, { facebookUrl: '', twitterUrl: '', instagramUrl: '' });
            alert('✓ पोस्ट का स्टेटस अपडेट कर दिया गया!');
            setRequests(prev => prev.filter(r => r.id !== id));
            // fetchData(); // No need to refetch full list immediately if we update local state
        } catch (error) { console.error(error); }
    };

    const handleApprovalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!approvalForm.title || approvalForm.files.length === 0) return alert('शीर्षक और फाइल आवश्यक है!');
        setUploading(true);
        try {
            // Upload files to local server
            const uploadedUrls = [];
            for (const file of approvalForm.files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('candidateName', candidateName);

                const res = await fetch('/api/cloud/upload', { method: 'POST', body: formData });
                const data = await res.json();

                if (data.success) uploadedUrls.push(data.url);
                else throw new Error('Upload failed');
            }

            await createSocialMediaApproval({
                title: approvalForm.title,
                contentType: approvalForm.contentType,
                mediaUrls: JSON.stringify(uploadedUrls),
                assemblyId,
                createdBy: session.user.id
            });
            alert('✓ अप्रूवल के लिए भेज दिया गया! (Real Upload)');
            setApprovalForm({ title: '', contentType: 'Poster', files: [] });
            fetchData();
        } catch (error) { console.error(error); alert('फाइल अपलोड में समस्या आई।'); } finally { setUploading(false); }
    };

    const handleMarkPosterMade = async (routeId: number) => {
        try {
            await markPosterMade(routeId, session.user.id);
            alert('✓ पोस्टर बनाना मार्क कर दिया गया!');
            fetchData();
        } catch (error) {
            console.error(error);
            alert('एरर: कृपया फिर से कोशिश करें');
        }
    };

    const handleMarkPosterNotNeeded = async (routeId: number) => {
        try {
            await markPosterNotNeeded(routeId, session.user.id);
            alert('✓ पोस्टर की जरूरत नहीं - मार्क कर दिया गया!');
            fetchData();
        } catch (error) {
            console.error(error);
            alert('एरर: कृपया फिर से कोशिश करें');
        }
    };

    if (!isSocialMediaTeam) return <div style={{ padding: '40px', textAlign: 'center' }}>आपको अनुमति नहीं है।</div>;
    if (loading) return <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" color="#2563EB" /></div>;

    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const acceptedRequests = requests.filter(r => r.status === 'ACCEPTED');

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px', padding: '16px', background: '#FEF2F2', borderRadius: '16px', border: '1px solid #FECACA' }}>
                <p style={{ color: '#DC2626', fontSize: '13px', fontWeight: '800' }}>
                    📢 ये जगह फाइल स्टोर करने के लिए नहीं हैं.. यहां से आप फोटो और वीडियो सिर्फ भेज सकते हैं.. ये फाइलें 7 दिन में डिलीट हो जाएंगी.. प्लीज अपने पास बैकअप रखे..
                </p>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '40px' }}>कंटेंट मैनेजमेंट (Content Management)</h1>

            <div style={{ display: 'grid', gap: '60px' }}>

                {/* SECTION 1: नई पोस्ट अनुरोध (Candidate to Team) */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Zap size={22} color="#F59E0B" /> नई पोस्ट अनुरोध (Candidate Requests)
                        </h2>
                        <span style={{ background: '#FEF3C7', color: '#B45309', padding: '6px 16px', borderRadius: '50px', fontSize: '12px', fontWeight: '900' }}>{pendingRequests.length} पेंडिंग</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                        {pendingRequests.map(req => {
                            const photos = JSON.parse(req.photoUrls || '[]');
                            const videos = JSON.parse(req.videoUrls || '[]');
                            return (
                                <div key={req.id} className="card" style={{ padding: '24px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: '900', color: '#2563EB', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                👤 {req.creator?.name || 'Unknown Candidate'}
                                            </div>
                                            <div style={{ fontWeight: '800', fontSize: '17px' }}>{req.subject}</div>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>{new Date(req.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', lineHeight: '1.6' }}>{req.description}</p>

                                    {/* Media Viewing / Downloading */}
                                    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><ImageIcon size={14} /> कच्चा मीडिया (Raw Media)</div>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {photos.map((url: string, i: number) => (
                                                <div key={i} className="media-chip" style={{ background: '#EFF6FF', color: '#2563EB', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Download size={12} /> Photo {i + 1}
                                                </div>
                                            ))}
                                            {videos.map((url: string, i: number) => (
                                                <div key={i} className="media-chip" style={{ background: '#F0FDF4', color: '#16A34A', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Film size={12} /> Video {i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {req.location}</div>
                                        <button onClick={() => handleAccept(req.id)} style={{ padding: '10px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}>काम शुरू करें (Accept)</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* SECTION 2: पोस्ट स्टेटस ट्रैकिंग (Accepted to Posted) */}
                <section>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Send size={22} color="#2563EB" /> पोस्ट स्टेटस ट्रैकिंग (Track & Live)
                    </h2>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {acceptedRequests.map(req => (
                            <div key={req.id} className="card" style={{ padding: '24px', borderLeft: '4px solid #2563EB' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr 1fr', gap: '32px', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#2563EB', textTransform: 'uppercase', marginBottom: '4px' }}>
                                            👤 {req.creator?.name || 'Candidate'}
                                        </div>
                                        <div style={{ fontWeight: '800', fontSize: '15px' }}>{req.subject}</div>
                                        <div style={{ fontSize: '12px', color: '#64748B' }}>स्वीकृत: {new Date(req.acceptedAt).toLocaleDateString()}</div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
                                        <button onClick={() => handlePublish(req.id)} style={{ padding: '12px 24px', background: '#059669', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.4)' }}>
                                            <Check size={18} strokeWidth={3} /> Posted (हो गया)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {acceptedRequests.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #F1F5F9', borderRadius: '24px' }}>कोई स्वीकृत अनुरोध नहीं है।</div>}
                    </div>
                </section>

                {/* SECTION 3: कंटेंट अप्रूवल (Team uploads for Candidate approval) */}
                <section>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle size={22} color="#8B5CF6" /> कंटेंट अप्रूवल (Upload for Candidate)
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: '40px' }}>
                        {/* Upload Form */}
                        <div className="card" style={{ padding: '32px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>नया कंटेंट भेजें</h3>
                            <form onSubmit={handleApprovalSubmit}>
                                <div style={{ marginBottom: '20px' }}>
                                    <input type="text" placeholder="कंटेंट का नाम (उदा: जनसभा पोस्टर)" value={approvalForm.title} onChange={e => setApprovalForm({ ...approvalForm, title: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <select value={approvalForm.contentType} onChange={e => setApprovalForm({ ...approvalForm, contentType: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', fontWeight: '700' }}>
                                        <option value="Poster">Edit Poster (फोटो)</option>
                                        <option value="Video">Edit Video (वीडियो)</option>
                                    </select>
                                </div>
                                <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #E2E8F0', padding: '30px', borderRadius: '16px', textAlign: 'center', background: '#F8FAFC', cursor: 'pointer', marginBottom: '20px' }}>
                                    <Upload size={24} color="#94A3B8" style={{ marginBottom: '8px' }} />
                                    <div style={{ fontSize: '13px', fontWeight: '800' }}>फाइल चुनें</div>
                                    <input type="file" multiple hidden ref={fileInputRef} onChange={e => e.target.files && setApprovalForm({ ...approvalForm, files: [...approvalForm.files, ...Array.from(e.target.files)] })} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                                    {approvalForm.files.map((f, i) => (
                                        <div key={i} style={{ background: '#F1F5F9', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {f.name} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setApprovalForm({ ...approvalForm, files: approvalForm.files.filter((_, idx) => i !== idx) })} />
                                        </div>
                                    ))}
                                </div>
                                <button type="submit" disabled={uploading} style={{ width: '100%', padding: '14px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
                                    {uploading ? <Loader2 className="animate-spin" /> : 'अप्रूवल के लिए भेजें'}
                                </button>
                            </form>
                        </div>

                        {/* Approvals Status List */}
                        <div style={{ display: 'grid', gap: '16px', height: 'fit-content' }}>
                            {approvals.map(app => (
                                <div key={app.id} className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: app.contentType === 'Poster' ? '#EFF6FF' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {app.contentType === 'Poster' ? <ImageIcon size={20} color="#2563EB" /> : <Film size={20} color="#16A34A" />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '15px' }}>{app.title}</div>
                                            <div style={{ fontSize: '12px', color: '#64748B' }}>{new Date(app.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {app.status === 'APPROVED' && <span style={{ padding: '6px 16px', borderRadius: '50px', background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} /> APPROVED</span>}
                                        {app.status === 'REJECTED' && <span style={{ padding: '6px 16px', borderRadius: '50px', background: '#FEE2E2', color: '#B91C1C', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} /> REJECTED</span>}
                                        {app.status === 'PENDING' && <span style={{ padding: '6px 16px', borderRadius: '50px', background: '#FEF3C7', color: '#B45309', fontSize: '11px', fontWeight: '900' }}>PENDING</span>}
                                        <button onClick={() => setViewingApproval(app)} className="media-chip" style={{ padding: '8px', border: 'none', background: '#F1F5F9', borderRadius: '8px', cursor: 'pointer' }}><Eye size={18} color="#64748B" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SECTION 4: जनसंपर्क पोस्टर (Jansampark Poster Tracking) */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MapPin size={22} color="#10B981" /> जनसंपर्क पोस्टर (Candidate's Jansampark)
                        </h2>
                        <div style={{ display: 'flex', gap: '8px', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
                            <button
                                onClick={() => setJansamparkTab('upcoming')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: jansamparkTab === 'upcoming' ? 'white' : 'transparent',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    color: jansamparkTab === 'upcoming' ? '#10B981' : '#64748B',
                                    cursor: 'pointer',
                                    boxShadow: jansamparkTab === 'upcoming' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Upcoming ({jansamparkRoutes.length})
                            </button>
                            <button
                                onClick={() => setJansamparkTab('history')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: jansamparkTab === 'history' ? 'white' : 'transparent',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    color: jansamparkTab === 'history' ? '#10B981' : '#64748B',
                                    cursor: 'pointer',
                                    boxShadow: jansamparkTab === 'history' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                History ({jansamparkHistory.length})
                            </button>
                        </div>
                    </div>

                    {jansamparkTab === 'upcoming' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                            {jansamparkRoutes.map(route => (
                                <div key={route.id} className="card" style={{ padding: '24px', border: '2px solid #D1FAE5', background: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{ fontWeight: '800', fontSize: '17px', color: '#059669' }}>
                                            📅 {new Date(route.date).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>
                                            {route.visits?.length || 0} Villages
                                        </div>
                                    </div>

                                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', marginBottom: '12px' }}>📍 गांव / Villages:</div>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {route.visits?.map((visit: any, idx: number) => (
                                                <div key={idx} style={{ background: '#EFF6FF', color: '#2563EB', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                                                    {visit.village} {visit.time && `(${visit.time})`}
                                                </div>
                                            ))}
                                        </div>
                                        {route.visits?.[0]?.notes && (
                                            <div style={{ marginTop: '12px', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                                                📝 {route.visits[0].notes}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={() => handleMarkPosterMade(route.id)}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '10px',
                                                fontWeight: '800',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <Check size={16} /> Poster Made
                                        </button>
                                        <button
                                            onClick={() => handleMarkPosterNotNeeded(route.id)}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                background: 'linear-gradient(135deg, #64748B, #475569)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '10px',
                                                fontWeight: '800',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <X size={16} /> Not Needed
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {jansamparkRoutes.length === 0 && (
                                <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #F1F5F9', borderRadius: '24px' }}>
                                    कोई अपकमिंग जनसंपर्क नहीं है।
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {jansamparkHistory.map(route => (
                                <div key={route.id} className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #10B981' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '800', fontSize: '15px' }}>
                                            📅 {new Date(route.date).toLocaleDateString('hi-IN')}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>
                                            📍 {route.visits?.map((v: any) => v.village).join(', ')}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ fontSize: '11px', color: route.posterStatus === 'MADE' ? '#059669' : '#64748B' }}>
                                            {route.posterStatus === 'MADE' ? '✓ Poster Made' : '◯ Not Needed'}
                                            {route.posterMadeAt && (
                                                <div style={{ color: '#64748B' }}>
                                                    {new Date(route.posterMadeAt).toLocaleDateString('hi-IN')}
                                                </div>
                                            )}
                                        </div>
                                        <span style={{
                                            padding: '6px 12px',
                                            borderRadius: '50px',
                                            background: route.posterStatus === 'MADE' ? '#DCFCE7' : '#F1F5F9',
                                            color: route.posterStatus === 'MADE' ? '#15803D' : '#64748B',
                                            fontSize: '11px',
                                            fontWeight: '900'
                                        }}>
                                            {route.posterStatus === 'MADE' ? 'COMPLETED' : 'NOT NEEDED'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {jansamparkHistory.length === 0 && (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #F1F5F9', borderRadius: '24px' }}>
                                    कोई हिस्ट्री नहीं है।
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* Modal for viewing approval content */}
            {viewingApproval && (
                <div
                    onClick={() => setViewingApproval(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white',
                            borderRadius: '24px',
                            maxWidth: '900px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                            position: 'relative'
                        }}
                    >
                        <div style={{ position: 'sticky', top: 0, background: 'white', padding: '24px', borderBottom: '1px solid #E2E8F0', borderRadius: '24px 24px 0 0', zIndex: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{viewingApproval.title}</h3>
                                    <div style={{ fontSize: '13px', color: '#64748B' }}>
                                        {viewingApproval.contentType} • {new Date(viewingApproval.createdAt).toLocaleDateString('hi-IN')}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewingApproval(null)}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: '#F1F5F9',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={20} color="#64748B" />
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: '24px' }}>
                            {(() => {
                                const urls = JSON.parse(viewingApproval.mediaUrls || '[]');
                                return (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                                        {urls.map((url: string, idx: number) => (
                                            <div key={idx} style={{
                                                background: '#F8FAFC',
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                border: '2px solid #E2E8F0'
                                            }}>
                                                {viewingApproval.contentType === 'Poster' ? (
                                                    <img
                                                        src={url}
                                                        alt={`Media ${idx + 1}`}
                                                        style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).parentElement!.innerHTML += `<div style="padding: 40px; text-align: center; color: #94A3B8;"><ImageIcon size="48" /><div style="margin-top: 12px; font-size: 13px;">Image not available</div></div>`;
                                                        }}
                                                    />
                                                ) : (
                                                    <video
                                                        src={url}
                                                        controls
                                                        style={{ width: '100%', height: '300px' }}
                                                    />
                                                )}
                                                <div style={{ padding: '12px', fontSize: '12px', fontWeight: '700', color: '#64748B' }}>
                                                    {viewingApproval.contentType} {idx + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                            {JSON.parse(viewingApproval.mediaUrls || '[]').length === 0 && (
                                <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
                                    <ImageIcon size={48} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
                                    <div style={{ fontSize: '15px', fontWeight: '700' }}>कोई मीडिया नहीं है</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .card { background: white; border: 1px solid #E2E8F0; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .media-chip:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .media-chip { transition: all 0.2s; border: none; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
