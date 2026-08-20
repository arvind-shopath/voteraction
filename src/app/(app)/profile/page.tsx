'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { User, Camera, Save, Check, Loader2, ChevronRight, Phone, Shield, ExternalLink } from 'lucide-react';
import { updateUserProfile, getUserProfile } from '@/app/actions/user';

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const [name, setName] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (session?.user) {
            const role = (session.user as any).role;
            if (role === 'CANDIDATE') {
                window.location.href = '/settings';
                return;
            }
            fetchUserData();
        }
    }, [session]);

    const fetchUserData = async () => {
        const id = parseInt((session?.user as any).id);
        const data = await getUserProfile(id);
        if (data) {
            setUserData(data);
            setName(data.name || '');
            setImage(data.image || null);
        }
        setLoading(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setImage(data.url);
            }
        } catch (err) {
            alert('फोटो अपलोड करने में त्रुटि हुई');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) return alert('कृपया अपना नाम दर्ज करें');

        setSaving(true);
        try {
            const res = await updateUserProfile({ name, image });
            if (res.success) {
                await update({ name, image }); // Update client session
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                alert(res.error || 'अपडेट करने में त्रुटि हुई');
            }
        } catch (error) {
            alert('सिस्टम त्रुटि');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                height: '80vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px'
            }}>
                <Loader2 className="animate-spin" size={40} color="#2563EB" />
                <p style={{ fontWeight: 600, color: '#64748B' }}>प्रोफाइल लोड हो रही है...</p>
            </div>
        );
    }

    const roleMap: any = {
        'SUPERADMIN': 'सर्वेसर्वा',
        'ADMIN': 'एडमिन',
        'CANDIDATE': 'कैंडिडेट',
        'SOCIAL_MEDIA': 'सोशल सेना',
        'WORKER': 'कार्यकर्ता'
    };

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header Area */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>
                    मेरी प्रोफाइल
                </h1>
                <p style={{ color: '#64748B' }}>अपनी व्यक्तिगत जानकारी और प्रोफाइल फोटो अपडेट करें।</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                {/* Profile Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '32px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid #F1F5F9',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Background Decorative Element */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '200px',
                        height: '200px',
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0) 100%)',
                        borderRadius: '0 0 0 200px',
                        zIndex: 0
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
                            {/* Image Section */}
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: '150px',
                                    height: '150px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '4px solid white',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                    background: '#F8FAFC',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {uploading ? (
                                        <Loader2 className="animate-spin" size={40} color="#2563EB" />
                                    ) : image ? (
                                        <img src={image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={60} color="#CBD5E1" />
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        position: 'absolute',
                                        bottom: '5px',
                                        right: '5px',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: '#2563EB',
                                        color: 'white',
                                        border: '4px solid white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
                                        transition: 'all 0.2s'
                                    }}
                                    title="फोटो बदलें"
                                >
                                    <Camera size={18} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Basic Info */}
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: '#EFF6FF',
                                    color: '#2563EB',
                                    borderRadius: '100px',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    marginBottom: '12px'
                                }}>
                                    <Shield size={14} />
                                    {roleMap[userData?.role] || userData?.role}
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', marginBottom: '4px' }}>
                                    {userData?.name || 'User'}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: 600 }}>
                                    <Phone size={16} />
                                    {userData?.mobile}
                                </div>
                            </div>
                        </div>

                        {/* Edit Form */}
                        <div style={{ marginTop: '40px', borderTop: '1px solid #F1F5F9', paddingTop: '32px' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>
                                    पूरा नाम
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); setSaved(false); }}
                                    style={{
                                        width: '100%',
                                        padding: '14px 18px',
                                        borderRadius: '12px',
                                        border: '1px solid #E2E8F0',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        background: '#F8FAFC'
                                    }}
                                    onFocus={(e) => e.target.style.border = '1px solid #2563EB'}
                                    onBlur={(e) => e.target.style.border = '1px solid #E2E8F0'}
                                    placeholder="अपना नाम दर्ज करें"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '14px',
                                    background: saved ? '#10B981' : '#2563EB',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '16px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    boxShadow: saved ? '0 10px 20px rgba(16, 185, 129, 0.2)' : '0 10px 20px rgba(37, 99, 235, 0.2)',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {saving ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : saved ? (
                                    <>
                                        <Check size={20} /> अपडेट हो गया!
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} /> सुरक्षित करें
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Additional Info Cards (Optional, adds premium feel) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '20px', border: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#2563EB' }}>
                                <Shield size={18} style={{ margin: '0 auto' }} />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: '#1E293B' }}>पहुँच स्तर</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>आपकी वर्तमान भूमिका: <span style={{ color: '#2563EB' }}>{roleMap[userData?.role] || userData?.role}</span></p>
                    </div>

                    <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '20px', border: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#64748B' }}>
                                <ExternalLink size={18} style={{ margin: '0 auto' }} />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: '#1E293B' }}>अन्य जानकारी</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>यूजर आईडी: <span style={{ color: '#2563EB' }}>#{userData?.id}</span></p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #2563EB;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes animate-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: animate-spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}
