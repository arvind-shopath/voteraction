/* 🔒 LOCKED BY USER */
'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import { createCampaignMaterial } from '@/app/actions/social';
import {
    Loader2, Upload, Link as LinkIcon, Image as ImageIcon, Video,
    Facebook, Twitter, Instagram, Send, Film
} from 'lucide-react';

export default function UpdateMaterialsPage() {
    const { data: session }: any = useSession();
    const { effectiveRole } = useView();
    const assemblyId = session?.user?.assemblyId || 1;
    const userId = session?.user?.id;

    // Authorization Check
    const allowed = effectiveRole === 'SOCIAL_MEDIA' || effectiveRole === 'ADMIN' || session?.user?.role === 'SOCIAL_MEDIA';

    if (!allowed) {
        return (
            <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#64748B' }}>
                <h2>Access Denied</h2>
                <p>This page is only for the Social Media Team.</p>
            </div>
        );
    }

    const [loading, setLoading] = useState(false);

    // --- Social Link State ---
    const [socialLink, setSocialLink] = useState('');
    const [socialPlatform, setSocialPlatform] = useState('Facebook');

    // --- Photo State ---
    const [photoTitle, setPhotoTitle] = useState('');
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);

    // --- Video State ---
    const [videoTitle, setVideoTitle] = useState('');
    const [videoFiles, setVideoFiles] = useState<File[]>([]);


    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createCampaignMaterial({
                title: `${socialPlatform} Post`,
                description: 'Social Media Link',
                materialType: 'Link',
                fileUrls: JSON.stringify([socialLink]),
                platform: socialPlatform,
                assemblyId,
                createdBy: Number(userId)
            });
            alert('Link Posted Successfully!');
            setSocialLink('');
        } catch (error) {
            alert('Error posting link');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (title: string, files: File[], type: 'Image' | 'Video') => {
        if (files.length === 0) return;
        setLoading(true);
        try {
            const fileUrls = [];
            for (const file of files) {
                const fd = new FormData();
                fd.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.success) fileUrls.push(data.url);
            }

            await createCampaignMaterial({
                title: title,
                description: `Uploaded ${type}`,
                materialType: type,
                fileUrls: JSON.stringify(fileUrls),
                platform: 'All',
                assemblyId,
                createdBy: Number(userId)
            });
            alert(`${type} Uploaded Successfully!`);

            if (type === 'Image') { setPhotoTitle(''); setPhotoFiles([]); }
            else { setVideoTitle(''); setVideoFiles([]); }

        } catch (error) {
            alert(`Error uploading ${type}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', background: 'linear-gradient(to right, #2563EB, #9333EA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Update Campaign Materials
            </h1>
            <p style={{ color: '#6B7280', fontSize: '16px', marginBottom: '40px' }}>Upload content for the ground team.</p>

            <div style={{ display: 'grid', gap: '32px' }}>

                {/* 1. SOCIAL LINKS */}
                <div style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ background: '#EFF6FF', padding: '10px', borderRadius: '12px' }}><LinkIcon color="#2563EB" size={24} /></div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1F2937' }}>Post Social Links</h2>
                    </div>
                    <form onSubmit={handleLinkSubmit} style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {['Facebook', 'Twitter', 'Instagram'].map(p => (
                                <button
                                    key={p} type="button" onClick={() => setSocialPlatform(p)}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid',
                                        borderColor: socialPlatform === p ? '#2563EB' : '#E5E7EB',
                                        background: socialPlatform === p ? '#EFF6FF' : 'white',
                                        color: socialPlatform === p ? '#2563EB' : '#6B7280',
                                        fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {p === 'Facebook' && <Facebook size={18} />}
                                    {p === 'Twitter' && <Twitter size={18} />}
                                    {p === 'Instagram' && <Instagram size={18} />}
                                    {p}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input required type="url" placeholder="Paste your post URL here..." value={socialLink} onChange={e => setSocialLink(e.target.value)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #E5E7EB', outline: 'none', fontSize: '15px' }} />
                            <button disabled={loading} type="submit" style={{ padding: '0 24px', borderRadius: '12px', background: '#2563EB', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Post</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 2. UPLOAD PHOTOS */}
                <div style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ background: '#F0FDF4', padding: '10px', borderRadius: '12px' }}><ImageIcon color="#16A34A" size={24} /></div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1F2937' }}>Upload Photos</h2>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleUpload(photoTitle, photoFiles, 'Image'); }} style={{ display: 'grid', gap: '20px' }}>
                        <input required placeholder="Title (e.g. Rally Photos)" value={photoTitle} onChange={e => setPhotoTitle(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #E5E7EB', outline: 'none', fontSize: '15px', fontWeight: '600' }} />
                        <label style={{ border: '3px dashed #E5E7EB', borderRadius: '20px', padding: '30px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: photoFiles.length > 0 ? '#F0FDF4' : '#F9FAFB' }}>
                            <input type="file" hidden multiple accept="image/*" onChange={e => setPhotoFiles(Array.from(e.target.files || []))} />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <Upload size={24} color={photoFiles.length > 0 ? '#16A34A' : '#9CA3AF'} />
                                <span style={{ fontWeight: '600', color: '#4B5563' }}>{photoFiles.length > 0 ? `${photoFiles.length} photos selected` : 'Select Photos'}</span>
                            </div>
                        </label>
                        <button disabled={loading} type="submit" style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#10B981', color: 'white', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
                            {loading ? 'Uploading...' : 'Upload Photos'}
                        </button>
                    </form>
                </div>

                {/* 3. UPLOAD VIDEOS */}
                <div style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ background: '#FEF2F2', padding: '10px', borderRadius: '12px' }}><Film color="#DC2626" size={24} /></div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1F2937' }}>Upload Videos</h2>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleUpload(videoTitle, videoFiles, 'Video'); }} style={{ display: 'grid', gap: '20px' }}>
                        <input required placeholder="Title (e.g. Speech Video)" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #E5E7EB', outline: 'none', fontSize: '15px', fontWeight: '600' }} />
                        <label style={{ border: '3px dashed #E5E7EB', borderRadius: '20px', padding: '30px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: videoFiles.length > 0 ? '#FEF2F2' : '#F9FAFB' }}>
                            <input type="file" hidden multiple accept="video/*" onChange={e => setVideoFiles(Array.from(e.target.files || []))} />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <Upload size={24} color={videoFiles.length > 0 ? '#DC2626' : '#9CA3AF'} />
                                <span style={{ fontWeight: '600', color: '#4B5563' }}>{videoFiles.length > 0 ? `${videoFiles.length} videos selected` : 'Select Videos'}</span>
                            </div>
                        </label>
                        <button disabled={loading} type="submit" style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#DC2626', color: 'white', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
                            {loading ? 'Uploading...' : 'Upload Videos'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
