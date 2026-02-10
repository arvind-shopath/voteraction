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
    Loader2, Download, Image as ImageIcon, Film, X, Upload, Check, AlertCircle, Eye, Zap, TrendingUp,
    LayoutDashboard, FileText, Share2, BarChart3, ArrowLeft
} from 'lucide-react';

export default function LocalTeamDashboard() {
    const { data: session }: any = useSession();
    const { effectiveRole, simulationPersona } = useView();
    const [requests, setRequests] = useState<any[]>([]);
    const [approvals, setApprovals] = useState<any[]>([]);
    const [jansamparkRoutes, setJansamparkRoutes] = useState<any[]>([]);
    const [jansamparkHistory, setJansamparkHistory] = useState<any[]>([]);
    const [jansamparkTab, setJansamparkTab] = useState<'upcoming' | 'history'>('upcoming');
    const [viewingApproval, setViewingApproval] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form states for approval upload
    const [approvalForm, setApprovalForm] = useState({ title: '', contentType: 'Poster', files: [] as File[] });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dynamic assemblyId: from simulation or session
    const assemblyId = (simulationPersona as any)?.assemblyId || (session?.user as any)?.assemblyId || 1;

    useEffect(() => {
        if (session?.user) fetchData();
    }, [session, assemblyId]);

    const fetchData = async () => {
        if (!assemblyId) return;
        setLoading(true);
        try {
            const [reqRes, appRes, routesRes, historyRes] = await Promise.all([
                getCandidatePostRequests(assemblyId),
                getSocialMediaApprovals(assemblyId),
                getJansamparkRoutes(assemblyId, true),  // Only unmarked (poster not made)
                getJansamparkRoutes(assemblyId, false)  // Only marked (poster made)
            ]);
            setRequests(reqRes || []);
            setApprovals(appRes || []);
            setJansamparkRoutes(routesRes || []);
            setJansamparkHistory(historyRes || []);
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
            fetchData();
        } catch (error) { console.error(error); }
    };

    const handleApprovalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!approvalForm.title || approvalForm.files.length === 0) return alert('शीर्षक और फाइल आवश्यक है!');
        setUploading(true);
        try {
            const uploadedUrls = [];
            for (const file of approvalForm.files) {
                const formData = new FormData();
                formData.append('file', file);
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
            alert('✓ अप्रूवल के लिए भेज दिया गया!');
            setApprovalForm({ title: '', contentType: 'Poster', files: [] });
            fetchData();
        } catch (error) { console.error(error); alert('फाइल अपलोड में समस्या आई।'); } finally { setUploading(false); }
    };

    const handleMarkPosterMade = async (routeId: number) => {
        try {
            await markPosterMade(routeId, session.user.id);
            alert('✓ पोस्टर बनाना मार्क कर दिया गया!');
            fetchData();
        } catch (error) { console.error(error); }
    };

    const handleMarkPosterNotNeeded = async (routeId: number) => {
        try {
            await markPosterNotNeeded(routeId, session.user.id);
            alert('✓ पोस्टर की जरूरत नहीं मार्क कर दी गई!');
            fetchData();
        } catch (error) { console.error(error); }
    };

    if (loading) return <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" color="#2563EB" /></div>;

    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const acceptedRequests = requests.filter(r => r.status === 'ACCEPTED');

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', paddingBottom: '100px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px', padding: '16px', background: '#FEF2F2', borderRadius: '16px', border: '1px solid #FECACA' }}>
                <p style={{ color: '#DC2626', fontSize: '13px', fontWeight: '800' }}>
                    📢 ये जगह फाइल स्टोर करने के लिए नहीं हैं.. यहां से आप फोटो और वीडियो सिर्फ भेज सकते हैं.. ये फाइलें 7 दिन में डिलीट हो जाएंगी.. प्लीज अपने पास बैकअप रखे..
                </p>
            </div>
            {/* Header */}
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A' }}>सोशल मीडिया <span style={{ color: '#2563EB' }}>टीम डैशबोर्ड</span></h1>
                <p style={{ color: '#64748B', fontSize: '16px' }}>कैंडिडेट सोशल मीडिया टीम के लिए विशेष पैनल</p>
            </div>

            <div style={{ display: 'grid', gap: '60px' }}>
                {/* SECTION 1: नई पोस्ट अनुरोध */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', color: '#1E293B' }}>
                            <Zap size={24} color="#F59E0B" fill="#F59E0B" /> नई पोस्ट अनुरोध (Candidate Requests)
                        </h2>
                        <span style={{ background: '#FEF3C7', color: '#B45309', padding: '6px 16px', borderRadius: '50px', fontSize: '12px', fontWeight: '900' }}>{pendingRequests.length} पेंडिंग</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                        {pendingRequests.map(req => {
                            const photos = JSON.parse(req.photoUrls || '[]');
                            const videos = JSON.parse(req.videoUrls || '[]');
                            return (
                                <div key={req.id} style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '24px', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{ fontWeight: '900', fontSize: '18px', color: '#1E293B' }}>{req.subject}</div>
                                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>{new Date(req.createdAt).toLocaleDateString('hi-IN')}</div>
                                    </div>
                                    <p style={{ fontSize: '14px', color: '#475569', marginBottom: '24px', lineHeight: '1.6' }}>{req.description}</p>

                                    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><ImageIcon size={14} /> कच्चा मीडिया (Raw Media)</div>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {photos.map((url: string, i: number) => (
                                                <div key={i} style={{ background: '#EFF6FF', color: '#2563EB', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Download size={14} /> Photo {i + 1}
                                                </div>
                                            ))}
                                            {videos.map((url: string, i: number) => (
                                                <div key={i} style={{ background: '#F0FDF4', color: '#16A34A', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Film size={14} /> Video {i + 1}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}><MapPin size={16} /> {req.location}</div>
                                        <button onClick={() => handleAccept(req.id)} style={{ padding: '12px 28px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>स्वीकार करें (Accept)</button>
                                    </div>
                                </div>
                            );
                        })}
                        {pendingRequests.length === 0 && <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #F1F5F9', borderRadius: '24px' }}>कोई नया अनुरोध नहीं है।</div>}
                    </div>
                </section>

                {/* SECTION 2: पोस्ट स्टेटस ट्रैकिंग */}
                <section>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#1E293B' }}>
                        <Send size={24} color="#2563EB" /> पोस्ट स्टेटस ट्रैकिंग (Track & Live)
                    </h2>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {acceptedRequests.map(req => (
                            <div key={req.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '24px', borderLeft: '6px solid #2563EB' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr 1fr', gap: '32px', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '900', fontSize: '16px', color: '#1E293B' }}>{req.subject}</div>
                                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>स्वीकृत: {new Date(req.acceptedAt).toLocaleDateString('hi-IN')}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
                                        <button onClick={() => handlePublish(req.id)} style={{ padding: '14px 28px', background: '#059669', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px -2px rgba(5, 150, 105, 0.3)' }}>
                                            <Check size={20} /> Posted (हो गया)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {acceptedRequests.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #F1F5F9', borderRadius: '24px' }}>कोई एक्टिव टास्क नहीं है।</div>}
                    </div>
                </section>

                {/* SECTION 3: कंटेंट अप्रूवल */}
                <section>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#1E293B' }}>
                        <CheckCircle size={24} color="#8B5CF6" /> कंटेंट अप्रूवल (Upload for Candidate)
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: '40px' }}>
                        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: '900', marginBottom: '24px', color: '#1E293B' }}>नया कंटेंट भेजें</h3>
                            <form onSubmit={handleApprovalSubmit}>
                                <div style={{ marginBottom: '20px' }}>
                                    <input type="text" placeholder="कंटेंट का नाम (उदा: जनसभा पोस्टर)" value={approvalForm.title} onChange={e => setApprovalForm({ ...approvalForm, title: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }} />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <select value={approvalForm.contentType} onChange={e => setApprovalForm({ ...approvalForm, contentType: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', fontWeight: '800', outline: 'none', fontSize: '14px', appearance: 'none', background: '#F8FAFC' }}>
                                        <option value="Poster">Edit Poster (फोटो)</option>
                                        <option value="Video">Edit Video (वीडियो)</option>
                                    </select>
                                </div>
                                <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #CBD5E1', padding: '40px 20px', borderRadius: '20px', textAlign: 'center', background: '#F8FAFC', cursor: 'pointer', marginBottom: '24px', transition: 'all 0.2s' }}>
                                    <Upload size={32} color="#94A3B8" style={{ marginBottom: '12px' }} />
                                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#475569' }}>फाइल चुनें</div>
                                    <input type="file" multiple hidden ref={fileInputRef} onChange={e => e.target.files && setApprovalForm({ ...approvalForm, files: [...approvalForm.files, ...Array.from(e.target.files)] })} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
                                    {approvalForm.files.map((f, i) => (
                                        <div key={i} style={{ background: '#F1F5F9', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', border: '1px solid #E2E8F0' }}>
                                            {f.name.length > 15 ? f.name.substring(0, 15) + '...' : f.name}
                                            <X size={14} style={{ cursor: 'pointer' }} onClick={() => setApprovalForm({ ...approvalForm, files: approvalForm.files.filter((_, idx) => i !== idx) })} />
                                        </div>
                                    ))}
                                </div>
                                <button type="submit" disabled={uploading} style={{ width: '100%', padding: '18px', background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)' }}>
                                    {uploading ? <Loader2 className="animate-spin" /> : 'अप्रूवल के लिए भेजें'}
                                </button>
                            </form>
                        </div>

                        <div style={{ display: 'grid', gap: '16px', height: 'fit-content' }}>
                            {approvals.map(app => (
                                <div key={app.id} style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: app.contentType === 'Poster' ? '#EFF6FF' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {app.contentType === 'Poster' ? <ImageIcon size={22} color="#2563EB" /> : <Film size={22} color="#16A34A" />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '900', fontSize: '16px', color: '#1E293B' }}>{app.title}</div>
                                            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>{new Date(app.createdAt).toLocaleDateString('hi-IN')}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {app.status === 'APPROVED' && <span style={{ padding: '8px 18px', borderRadius: '50px', background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} /> APPROVED</span>}
                                        {app.status === 'REJECTED' && <span style={{ padding: '8px 18px', borderRadius: '50px', background: '#FEE2E2', color: '#B91C1C', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} /> REJECTED</span>}
                                        {app.status === 'PENDING' && <span style={{ padding: '8px 18px', borderRadius: '50px', background: '#FEF3C7', color: '#B45309', fontSize: '11px', fontWeight: '900' }}>PENDING</span>}
                                        <button onClick={() => setViewingApproval(app)} style={{ padding: '10px', border: 'none', background: '#F1F5F9', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}><Eye size={20} color="#64748B" /></button>
                                    </div>
                                </div>
                            ))}
                            {approvals.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #F1F5F9', borderRadius: '24px' }}>कोई अप्रूवल बकाया नहीं है।</div>}
                        </div>
                    </div>
                </section>

                {/* SECTION 4: जनसंपर्क पोस्टर */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', color: '#1E293B' }}>
                            <MapPin size={24} color="#10B981" /> जनसंपर्क पोस्टर (Candidate's Jansampark)
                        </h2>
                        <div style={{ display: 'flex', gap: '8px', background: '#F1F5F9', padding: '6px', borderRadius: '16px' }}>
                            {['upcoming', 'history'].map((tab: any) => (
                                <button key={tab} onClick={() => setJansamparkTab(tab)} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: jansamparkTab === tab ? 'white' : 'transparent', fontWeight: '900', fontSize: '12px', color: jansamparkTab === tab ? '#10B981' : '#64748B', cursor: 'pointer', boxShadow: jansamparkTab === tab ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', textTransform: 'capitalize' }}>
                                    {tab} ({tab === 'upcoming' ? jansamparkRoutes.length : jansamparkHistory.length})
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                        {(jansamparkTab === 'upcoming' ? jansamparkRoutes : jansamparkHistory).map(route => (
                            <div key={route.id} style={{ borderRadius: '24px', border: '2px solid #E2E8F0', padding: '24px', position: 'relative', background: jansamparkTab === 'upcoming' ? 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)' : 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div style={{ fontWeight: '900', fontSize: '18px', color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Clock size={18} /> {new Date(route.date).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '800', background: '#F1F5F9', padding: '4px 10px', borderRadius: '8px' }}>
                                        {route.visits?.length || 0} Villages
                                    </div>
                                </div>

                                <div style={{ background: 'white', padding: '16px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #E2E8F0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#94A3B8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📍 गांव / Villages:</div>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {route.visits?.map((visit: any, idx: number) => (
                                            <div key={idx} style={{ background: '#EFF6FF', color: '#2563EB', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', border: '1px solid #DBEAFE' }}>
                                                {visit.village} {visit.time && `(${visit.time})`}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {jansamparkTab === 'upcoming' ? (
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => handleMarkPosterMade(route.id)} style={{ flex: 1.5, padding: '14px', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}><Check size={18} /> Poster Made</button>
                                        <button onClick={() => handleMarkPosterNotNeeded(route.id)} style={{ flex: 1, padding: '14px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' }}>Not Needed</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: route.posterStatus === 'MADE' ? '#059669' : '#64748B' }}>
                                            {route.posterStatus === 'MADE' ? '✓ Poster Made' : '◯ Not Needed'}
                                        </div>
                                        <span style={{ padding: '6px 16px', borderRadius: '50px', background: route.posterStatus === 'MADE' ? '#DCFCE7' : '#F1F5F9', color: route.posterStatus === 'MADE' ? '#15803D' : '#64748B', fontSize: '11px', fontWeight: '900' }}>{route.posterStatus === 'MADE' ? 'COMPLETED' : 'REJECTED'}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {(jansamparkTab === 'upcoming' ? jansamparkRoutes : jansamparkHistory).length === 0 && <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #F1F5F9', borderRadius: '24px' }}>कोई जनसंपर्क रिकॉर्ड नहीं है।</div>}
                    </div>
                </section>
            </div>

            {/* Modal for viewing approval content */}
            {viewingApproval && (
                <div onClick={() => setViewingApproval(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px' }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '32px', maxWidth: '1000px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative' }}>
                        <div style={{ position: 'sticky', top: 0, background: 'white', padding: '32px', borderBottom: '1px solid #F1F5F9', borderRadius: '32px 32px 0 0', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', marginBottom: '4px' }}>{viewingApproval.title}</h3>
                                <div style={{ fontSize: '14px', color: '#64748B', fontWeight: '700' }}>{viewingApproval.contentType} • {new Date(viewingApproval.createdAt).toLocaleDateString('hi-IN')}</div>
                            </div>
                            <button onClick={() => setViewingApproval(null)} style={{ width: '48px', height: '48px', borderRadius: '16px', border: 'none', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} color="#64748B" /></button>
                        </div>
                        <div style={{ padding: '32px' }}>
                            {(() => {
                                const urls = JSON.parse(viewingApproval.mediaUrls || '[]');
                                return (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                        {urls.map((url: string, idx: number) => (
                                            <div key={idx} style={{ background: '#F8FAFC', borderRadius: '20px', overflow: 'hidden', border: '2px solid #F1F5F9' }}>
                                                {viewingApproval.contentType === 'Poster' ? <img src={url} alt="Media" style={{ width: '100%', height: '350px', objectFit: 'cover' }} /> : <video src={url} controls style={{ width: '100%', height: '350px' }} />}
                                                <div style={{ padding: '16px', fontSize: '13px', fontWeight: '800', color: '#64748B', textAlign: 'center' }}>Media File {idx + 1}</div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                section { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
