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

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
        <div style={{ padding: isMobile ? '12px 8px 40px 8px' : '24px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header Area */}
            <div style={{ marginBottom: isMobile ? '20px' : '32px', textAlign: isMobile ? 'center' : 'left' }}>
                <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 900, color: '#1E293B', marginBottom: '6px' }}>
                    मेरी प्रोफाइल
                </h1>
                <p style={{ color: '#64748B', fontSize: isMobile ? '13px' : '15px' }}>अपनी व्यक्तिगत जानकारी और प्रोफाइल फोटो अपडेट करें।</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: isMobile ? '16px' : '24px' }}>
                {/* Profile Card */}
                <div style={{
                    background: 'white',
                    borderRadius: isMobile ? '20px' : '24px',
                    padding: isMobile ? '20px 16px' : '32px',
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
                        width: '160px',
                        height: '160px',
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0) 100%)',
                        borderRadius: '0 0 0 160px',
                        zIndex: 0
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexDirection: isMobile ? 'column' : 'row',
                            textAlign: isMobile ? 'center' : 'left',
                            gap: isMobile ? '18px' : '32px'
                        }}>
                            {/* Image Section */}
                            <div style={{ position: 'relative', margin: '0 auto' }}>
                                <div style={{
                                    width: isMobile ? '120px' : '140px',
                                    height: isMobile ? '120px' : '140px',
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
                                        <Loader2 className="animate-spin" size={36} color="#2563EB" />
                                    ) : image ? (
                                        <img src={image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={50} color="#CBD5E1" />
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        position: 'absolute',
                                        bottom: '2px',
                                        right: '2px',
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '50%',
                                        background: '#2563EB',
                                        color: 'white',
                                        border: '3px solid white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
                                        transition: 'all 0.2s'
                                    }}
                                    title="फोटो बदलें"
                                >
                                    <Camera size={16} />
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
                            <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 12px',
                                    background: '#EFF6FF',
                                    color: '#2563EB',
                                    borderRadius: '100px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    marginBottom: '8px'
                                }}>
                                    <Shield size={13} />
                                    {roleMap[userData?.role] || userData?.role}
                                </div>
                                <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, color: '#1E293B', marginBottom: '4px', wordBreak: 'break-word' }}>
                                    {userData?.name || 'User'}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: '6px', color: '#64748B', fontWeight: 600, fontSize: '13px' }}>
                                    <Phone size={15} />
                                    {userData?.mobile}
                                </div>
                            </div>
                        </div>

                        {/* Edit Form */}
                        <div style={{ marginTop: isMobile ? '24px' : '36px', borderTop: '1px solid #F1F5F9', paddingTop: isMobile ? '20px' : '28px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                                    पूरा नाम
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); setSaved(false); }}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid #E2E8F0',
                                        fontSize: '15px',
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
                                    padding: '14px',
                                    borderRadius: '12px',
                                    background: saved ? '#10B981' : '#2563EB',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '15px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: saved ? '0 10px 20px rgba(16, 185, 129, 0.2)' : '0 10px 20px rgba(37, 99, 235, 0.2)',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {saving ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : saved ? (
                                    <>
                                        <Check size={18} /> अपडेट हो गया!
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} /> सुरक्षित करें
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Additional Info Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: isMobile ? '12px' : '20px' }}>
                    <div style={{ background: '#F8FAFC', borderRadius: '18px', padding: '16px', border: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                                <Shield size={16} />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: '#1E293B' }}>पहुँच स्तर</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, margin: 0 }}>आपकी वर्तमान भूमिका: <span style={{ color: '#2563EB' }}>{roleMap[userData?.role] || userData?.role}</span></p>
                    </div>

                    <div style={{ background: '#F8FAFC', borderRadius: '18px', padding: '16px', border: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                                <ExternalLink size={16} />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: '#1E293B' }}>अन्य जानकारी</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, margin: 0 }}>यूजर आईडी: <span style={{ color: '#2563EB' }}>#{userData?.id}</span></p>
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
