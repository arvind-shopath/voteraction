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
import { useRouter } from 'next/navigation';
import { useView } from '@/context/ViewContext';
import {
    getSocialPosts,
    getAssemblySocialLinks,
    updateAssemblySocialLinks,
    createCandidatePostRequest,
    getCandidatePostRequests,
    getSocialMediaApprovals,
    approveSocialMediaContent,
    rejectSocialMediaContent
} from '@/app/actions/social';
import { getCentralTasks, candidateReviewCentralWork } from '@/app/actions/centralContent';
import {
    Send, Image as ImageIcon, Loader2,
    X, Globe, ChevronDown, ChevronUp, Film, CheckCircle
} from 'lucide-react';

export default function CandidateSocialPage() {
    const { data: session, status }: any = useSession();
    const { effectiveRole, simulationPersona } = useView();
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [teamApprovals, setTeamApprovals] = useState<any[]>([]);
    const [centralApprovals, setCentralApprovals] = useState<any[]>([]);
    const [officialPosts, setOfficialPosts] = useState<any[]>([]); // needed for filter logic if any remaining
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [savingLinks, setSavingLinks] = useState(false);
    const [activePreviewTab, setActivePreviewTab] = useState<'Facebook' | 'Twitter' | 'Instagram'>('Facebook');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLinksOpen, setIsLinksOpen] = useState(false);
    const [isRequestFormOpen, setIsRequestFormOpen] = useState(false); // Collapsible Request Form State
    const [tagInput, setTagInput] = useState('');
    const [showUpload, setShowUpload] = useState(false); // For modal if needed, but we use inline form here
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({ location: '', subject: '', content: '', tags: [] as string[], photoFiles: [] as File[], videoFiles: [] as File[] });
    const [profileUrls, setProfileUrls] = useState({ facebook: '', instagram: '', twitter: '' });
    const [socialLinks, setSocialLinks] = useState<any>(null);
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

    const assemblyId = (simulationPersona as any)?.assemblyId || (session?.user as any)?.assemblyId || 13;
    const realRole = session?.user?.role || 'CANDIDATE';
    const role = effectiveRole || realRole;
    const isCandidate = role === 'CANDIDATE';
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(role);
    const isSocialMediaTeam = role === 'SOCIAL_MEDIA';
    const isGroundWorker = !isCandidate && !isAdmin && !isSocialMediaTeam;




    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [postsRes, requestsRes, linksRes, approvalsRes] = await Promise.all([
                getSocialPosts(assemblyId),
                getCandidatePostRequests(assemblyId),
                getAssemblySocialLinks(assemblyId),
                (isCandidate || isAdmin) ? getSocialMediaApprovals(assemblyId) : Promise.resolve([])
            ]);

            setPendingRequests(Array.isArray(requestsRes) ? requestsRes : []);
            setSocialLinks(linksRes);
            setTeamApprovals(Array.isArray(approvalsRes) ? approvalsRes : []);

            // Fetch Central Team Approvals
            if (session?.user?.id) {
                const cApps = await getCentralTasks({ candidateId: parseInt(session.user.id), status: 'SENT_TO_CANDIDATE' });
                setCentralApprovals(cApps);
            }

            setOfficialPosts(Array.isArray(postsRes) ? postsRes.filter((p: any) => p.postType === 'Post') : []);

            if (linksRes) setProfileUrls({ facebook: linksRes.facebookUrl || '', instagram: linksRes.instagramUrl || '', twitter: linksRes.twitterUrl || '' });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveContent = async (id: number) => {
        try {
            const userId = parseInt((session?.user as any)?.id || '0');
            if (!userId) return alert('Session Error: Please re-login');

            await approveSocialMediaContent(id, userId);
            alert('✓ कंटेंट अप्रूव कर दिया गया है!');
            fetchInitialData();
        } catch (error) { console.error(error); alert('Approval Failed'); }
    };

    const handleRejectContent = async (id: number) => {
        const reason = prompt('अस्वीकार करने का कारण लिखें:');
        if (!reason) return;
        try {
            const userId = parseInt((session?.user as any)?.id || '0');
            if (!userId) return alert('Session Error: Please re-login');

            await rejectSocialMediaContent(id, userId, reason);
            alert('कंटेंट रिजेक्ट कर दिया गया है।');
            fetchInitialData();
        } catch (error) { console.error(error); alert('Rejection Failed'); }
    };

    const handleCentralApprove = async (taskId: number) => {
        try {
            await candidateReviewCentralWork(taskId, true);
            alert('✓ सेंट्रल टीम का कंटेंट अप्रूव हो गया!');
            fetchInitialData();
        } catch (e) { console.error(e); }
    };

    const handleCentralReject = async (taskId: number) => {
        const r = prompt("रिजेक्ट करने का कारण बताएं:");
        if (!r) return;
        try {
            await candidateReviewCentralWork(taskId, false, r);
            alert('कंटेंट रिजेक्ट कर दिया गया है।');
            fetchInitialData();
        } catch (e) { console.error(e); }
    };

    const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.endsWith(',')) {
            const newTag = value.slice(0, -1).trim();
            if (newTag && !formData.tags.includes(newTag)) setFormData({ ...formData, tags: [...formData.tags, newTag] });
            setTagInput('');
        } else setTagInput(value);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFormData({ ...formData, photoFiles: [...formData.photoFiles, ...Array.from(e.target.files)] });
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFormData({ ...formData, videoFiles: [...formData.videoFiles, ...Array.from(e.target.files)] });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.content) return alert('विवरण दें!');
        setUploading(true);
        try {
            const uploadFile = async (file: File) => {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('candidateName', socialLinks?.candidateName || session?.user?.name || 'Candidate');
                const res = await fetch('/api/cloud/upload', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.success) return data.url;
                throw new Error('Upload failed');
            };

            const photoUrls = await Promise.all(formData.photoFiles.map(f => uploadFile(f)));
            const videoUrls = await Promise.all(formData.videoFiles.map(f => uploadFile(f)));

            await createCandidatePostRequest({
                assemblyId, location: formData.location, subject: formData.subject, description: formData.content,
                importantPeople: JSON.stringify(formData.tags), photoUrls: JSON.stringify(photoUrls), videoUrls: JSON.stringify(videoUrls),
                createdBy: session.user.id
            });
            alert('✓ रिक्वेस्ट भेज दी गई! (Files Uploaded)');
            setFormData({ location: '', subject: '', content: '', tags: [], photoFiles: [], videoFiles: [] });
            fetchInitialData();
        } catch (error) { console.error(error); alert('Upload Error'); } finally { setUploading(false); }
    };

    const handleSaveLinks = async () => {
        setSavingLinks(true);
        try {
            await updateAssemblySocialLinks(assemblyId, {
                facebookUrl: profileUrls.facebook,
                instagramUrl: profileUrls.instagram,
                twitterUrl: profileUrls.twitter
            });
            alert('✓ लिंक सेव हो गए!');
            fetchInitialData();
        } catch (error) { console.error(error); } finally { setSavingLinks(false); }
    };

    const router = useRouter(); // Need to import useRouter

    useEffect(() => {
        if (status === 'authenticated') {
            // Only redirect Ground Workers, allow Social Team to view this dashboard
            if (isGroundWorker) router.replace('/social/worker');
            else fetchInitialData();
        }
    }, [status, isGroundWorker]);

    // ... existing loaders ...
    if (status === 'loading' || loading) return <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={48} color="#2563EB" /></div>;

    // Only block Ground Workers
    if (isGroundWorker) return <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={48} color="#2563EB" /></div>;

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px', padding: '16px', background: '#FEF2F2', borderRadius: '16px', border: '1px solid #FECACA' }}>
                <p style={{ color: '#DC2626', fontSize: '13px', fontWeight: '800' }}>
                    📢 ये जगह फाइल स्टोर करने के लिए नहीं हैं.. यहां से आप फोटो और वीडियो सिर्फ भेज सकते हैं.. ये फाइलें 7 दिन में डिलीट हो जाएंगी.. प्लीज अपने पास बैकअप रखे..
                </p>
            </div>
            <div className="responsive-grid">
                <div style={{ display: 'grid', gap: '32px' }}>
                    {/* Approvals Section for candidate (Local Team + Central Team) */}
                    {(teamApprovals.filter(a => a.status === 'PENDING').length > 0 || centralApprovals.length > 0) && (
                        <div className="card" style={{ padding: '32px', borderRadius: '24px', background: '#F0FDF4', border: '2px solid #22C55E' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <CheckCircle size={22} color="#16A34A" /> टीम द्वारा भेजे गए कंटेंट (मंजूरी हेतु)
                            </h3>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                {/* Local Team Approvals */}
                                {teamApprovals.filter(a => a.status === 'PENDING').map(app => (
                                    <div key={app.id} style={{ background: 'white', padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {app.contentType === 'Poster' ? <ImageIcon size={24} color="#2563EB" /> : <Film size={24} color="#16A34A" />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '16px' }}>{app.title}</div>
                                                <div style={{ fontSize: '12px', color: '#64748B' }}>लोकल टीम द्वारा • {new Date(app.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button onClick={() => setSelectedMedia(JSON.parse(app.mediaUrls || '[]')[0])} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontWeight: '700' }}>व्यू करें</button>
                                            <button onClick={() => handleApproveContent(app.id)} style={{ padding: '10px 20px', background: '#16A34A', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>अप्रूव करें</button>
                                            <button onClick={() => handleRejectContent(app.id)} style={{ padding: '10px 20px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>रिजेक्ट</button>
                                        </div>
                                    </div>
                                ))}

                                {/* Central Team Approvals */}
                                {centralApprovals.map(task => (
                                    <div key={`central-${task.id}`} style={{ background: 'white', padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #2563EB' }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <CheckCircle size={24} color="#2563EB" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '16px' }}>{task.title} <span style={{ fontSize: '10px', color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '4px' }}>CENTRAL SENA</span></div>
                                                <div style={{ fontSize: '12px', color: '#64748B' }}>सेंट्रल सोशल सेना द्वारा • {new Date(task.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button onClick={() => setSelectedMedia(task.outputMediaUrls)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontWeight: '700' }}>व्यू करें</button>
                                            <button onClick={() => handleCentralApprove(task.id)} style={{ padding: '10px 20px', background: '#16A34A', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>अप्रूव करें</button>
                                            <button onClick={() => handleCentralReject(task.id)} style={{ padding: '10px 20px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>रिजेक्ट</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Collapsible Links Section */}
                    <div className="card" style={{ overflow: 'hidden', borderRadius: '24px' }}>
                        <button onClick={() => setIsLinksOpen(!isLinksOpen)} style={{ width: '100%', padding: '24px 32px', background: 'white', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: isLinksOpen ? '1px solid #E2E8F0' : 'none' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', color: '#0F172A' }}><Globe size={22} color="#2563EB" /> सोशल मीडिया लिंक्स</h3>
                            {isLinksOpen ? <ChevronUp size={24} color="#64748B" /> : <ChevronDown size={24} color="#64748B" />}
                        </button>
                        {isLinksOpen && (
                            <div style={{ padding: '32px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                                    <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Facebook पेज</label><input type="text" placeholder="Facebook URL" value={profileUrls.facebook} onChange={e => setProfileUrls({ ...profileUrls, facebook: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }} /></div>
                                    <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Twitter (X)</label><input type="text" placeholder="Twitter URL" value={profileUrls.twitter} onChange={e => setProfileUrls({ ...profileUrls, twitter: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }} /></div>
                                    <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Instagram</label><input type="text" placeholder="Instagram URL" value={profileUrls.instagram} onChange={e => setProfileUrls({ ...profileUrls, instagram: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }} /></div>
                                </div>
                                <button onClick={handleSaveLinks} disabled={savingLinks} style={{ background: '#2563EB', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>{savingLinks ? <Loader2 className="animate-spin" /> : 'सेटिंग्स सेव करें'}</button>
                            </div>
                        )}
                    </div>

                    {/* Request Form */}
                    <div className="card" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
                        <button onClick={() => setIsRequestFormOpen(!isRequestFormOpen)} style={{ width: '100%', padding: '24px 32px', background: 'white', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: isRequestFormOpen ? '1px solid #E2E8F0' : 'none' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', color: '#0F172A' }}><Send size={22} color="#2563EB" /> नई पोस्ट अनुरोध (Raw Content)</h3>
                            {isRequestFormOpen ? <ChevronUp size={24} color="#64748B" /> : <ChevronDown size={24} color="#64748B" />}
                        </button>

                        {isRequestFormOpen && (
                            <div style={{ padding: '32px' }}>
                                <form onSubmit={handleSubmit}>
                                    <div className="grid-2" style={{ marginBottom: '24px' }}>
                                        <input type="text" placeholder="स्थान (उदा: गांधी मैदान)" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                                        <input type="text" placeholder="विषय (उदा: जनसभा रैली)" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                                    </div>
                                    <div style={{ marginBottom: '24px' }}>
                                        <textarea rows={5} placeholder="कच्चा विवरण यहाँ विस्तार से लिखें..." value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '15px' }} />
                                    </div>
                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>महत्वपूर्ण नाम (कॉमा [,] लगाएं)</label>
                                        <input type="text" placeholder="नाम लिखें और कॉमा [,] दबाएं" value={tagInput} onChange={handleTagChange} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '12px' }} />
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {formData.tags.map(t => (<span key={t} style={{ background: '#EFF6FF', color: '#2563EB', padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>{t} <X size={14} style={{ cursor: 'pointer' }} onClick={() => setFormData({ ...formData, tags: formData.tags.filter(tg => tg !== t) })} /></span>))}
                                        </div>
                                    </div>

                                    {/* Split Upload Areas */}
                                    <div className="grid-2" style={{ marginBottom: '32px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>फोटो अपलोड</label>
                                            <div onClick={() => imageInputRef.current?.click()} style={{ border: '2px dashed #E2E8F0', borderRadius: '16px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC' }}>
                                                <ImageIcon size={24} color="#94A3B8" style={{ marginBottom: '8px' }} /><div style={{ fontSize: '13px', fontWeight: '700' }}>फोटो चुनें</div>
                                                <input type="file" multiple accept="image/*" hidden ref={imageInputRef} onChange={handleImageChange} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '8px', marginTop: '12px' }}>
                                                {formData.photoFiles.map((file, idx) => (
                                                    <div key={idx} style={{ position: 'relative', height: '70px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                                        <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button type="button" onClick={() => setFormData({ ...formData, photoFiles: formData.photoFiles.filter((_, i) => i !== idx) })} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>वीडियो अपलोड</label>
                                            <div onClick={() => videoInputRef.current?.click()} style={{ border: '2px dashed #E2E8F0', borderRadius: '16px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC' }}>
                                                <Film size={24} color="#94A3B8" style={{ marginBottom: '8px' }} /><div style={{ fontSize: '13px', fontWeight: '700' }}>वीडियो चुनें</div>
                                                <input type="file" multiple accept="video/*" hidden ref={videoInputRef} onChange={handleVideoChange} />
                                            </div>
                                            <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                                                {formData.videoFiles.map((file, idx) => (
                                                    <div key={idx} style={{ padding: '8px 12px', background: '#F1F5F9', borderRadius: '8px', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>{file.name}</span>
                                                        <button type="button" onClick={() => setFormData({ ...formData, videoFiles: formData.videoFiles.filter((_, i) => i !== idx) })} style={{ background: 'none', border: 'none', color: '#EF4444' }}><X size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={uploading} style={{ width: '100%', padding: '18px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '16px' }}>{uploading ? <Loader2 className="animate-spin" /> : <Send size={20} />} टीम को भेजें</button>
                                </form>
                            </div>
                        )}
                    </div>
                    <div className="card" style={{ padding: '32px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '22px', fontWeight: '800' }}>अनुरोध स्टेटस ट्रैकिंग (Log)</h3>
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                        </div>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {pendingRequests.filter(r => {
                                if (!r.createdAt) return false;
                                // Fix type mismatch: createdBy is number, session.id is string
                                const isMyRequest = String(r.createdBy) === String(session?.user?.id);
                                if (!isMyRequest) return false;

                                // Fix Date Comparison (Compare localized dates)
                                const reqDate = new Date(r.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
                                return reqDate === selectedDate;
                            }).map(req => (
                                <div key={req.id} style={{ padding: '24px', background: '#F8FAFC', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', border: '1px solid #F1F5F9' }}>
                                    <div><div style={{ fontSize: '18px', fontWeight: '800' }}>{req.subject}</div><div style={{ fontSize: '13px', color: '#64748B' }}>📍 {req.location} • {new Date(req.createdAt).toLocaleTimeString()}</div></div>
                                    <span style={{ padding: '8px 20px', borderRadius: '50px', fontSize: '11px', fontWeight: '900', background: req.status === 'PUBLISHED' ? '#DCFCE7' : '#FEF3C7', color: req.status === 'PUBLISHED' ? '#16A34A' : '#D97706' }}>{req.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Approval History Section moved to bottom */}
                    {teamApprovals.filter(a => ['APPROVED', 'REJECTED'].includes(a.status)).length > 0 && (
                        <div className="card" style={{ padding: '32px', borderRadius: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🕒</div>
                                अप्रूवल हिस्ट्री (History)
                            </h3>
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {teamApprovals.filter(a => ['APPROVED', 'REJECTED'].includes(a.status)).map(app => (
                                    <div key={app.id} style={{ padding: '20px', background: '#F8FAFC', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E2E8F0' }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                                                {app.contentType === 'Poster' ? <ImageIcon size={20} color="#64748B" /> : <Film size={20} color="#64748B" />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '15px', color: '#334155' }}>{app.title}</div>
                                                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Update: {new Date(app.updatedAt || app.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: '800',
                                            background: app.status === 'APPROVED' ? '#DCFCE7' : '#FEF2F2',
                                            color: app.status === 'APPROVED' ? '#16A34A' : '#EF4444'
                                        }}>
                                            {app.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview (Sticky) */}
                <div style={{ position: 'sticky', top: '40px', height: 'fit-content' }}>
                    <div className="card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', background: '#F1F5F9' }}>
                            {['Facebook', 'Twitter', 'Instagram'].map(tab => (
                                <button key={tab} onClick={() => setActivePreviewTab(tab as any)} style={{ flex: 1, padding: '16px', border: 'none', background: activePreviewTab === tab ? 'white' : 'transparent', borderBottom: activePreviewTab === tab ? `4px solid #2563EB` : 'none', fontWeight: '800' }}>{tab}</button>
                            ))}
                        </div>
                        <div style={{ height: '550px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>फीड लोड हो रही है...</div>
                    </div>
                </div>
            </div>

            {/* Media Preview Modal */}
            {selectedMedia && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedMedia(null)}>
                    <div style={{ position: 'relative', width: '90%', maxWidth: '800px', maxHeight: '90%', background: 'white', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedMedia(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}><X size={20} /></button>

                        {selectedMedia.includes('simulated.storage') ? (
                            <div style={{ padding: '60px', textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🖼️</div>
                                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Storage Simulation</h3>
                                <p style={{ color: '#64748B' }}>यह एक डेमो फाइल है: {selectedMedia.split('/').pop()}</p>
                                <p style={{ fontSize: '12px', marginTop: '20px', color: '#94A3B8' }}>(Real storage setup के बाद यहाँ असली इमेज दिखेगी)</p>
                            </div>
                        ) : (
                            selectedMedia.endsWith('.mp4') || selectedMedia.endsWith('.mov') ? (
                                <video src={selectedMedia} controls autoPlay style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }} />
                            ) : (
                                <img
                                    src={selectedMedia}
                                    alt="Preview"
                                    style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', objectFit: 'contain' }}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null; // prevent loop
                                        // Show a nice visual placeholder if load fails
                                        target.src = "https://placehold.co/600x400/e2e8f0/475569?text=Preview+Image\\n(Simulator)";
                                    }}
                                />
                            )
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .card { background: white; border: 1px solid #E2E8F0; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
