'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, Phone, ArrowLeft, Eye, EyeOff, Shield, Database, Users, BarChart3, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                mobile,
                password,
                rememberMe: rememberMe ? 'true' : 'false',
                redirect: false,
            });

            if (res?.error) {
                setError('गलत मोबाइल नंबर या पासवर्ड');
                setLoading(false);
            } else {
                router.push('/');
            }
        } catch (error) {
            setError('कुछ गलत हुआ, कृपया पुन: प्रयास करें');
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: 'white', fontFamily: 'Inter, sans-serif' }}>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                body { margin: 0; }
            `}</style>

            {/* Left Side: Branding & Info */}
            <div className="branding-side" style={{
                flex: '1.2',
                background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
                padding: '60px',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative Elements */}
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}></div>

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '100px', fontSize: '14px', fontWeight: '700', marginBottom: '32px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <Shield size={16} /> अधिकृत चुनावी प्रबंधन प्रणाली
                    </div>

                    <h1 style={{ fontSize: '48px', fontWeight: '900', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-0.02em' }}>
                        वोटरएक्शन: <br /><span style={{ color: '#93C5FD' }}>जीत की डिजिटल रणनीति</span>
                    </h1>

                    <p style={{ fontSize: '18px', color: '#BFDBFE', lineHeight: '1.6', marginBottom: '48px' }}>
                        MLAs और उम्मीदवारों के लिए सबसे आधुनिक डेटा एनालिटिक्स और बूथ प्रबंधन प्लेटफार्म। जीत की रणनीति अब आपके हाथों में।
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {[
                            { icon: <Database size={20} />, title: 'सटीक वोटर डेटाबेस', desc: 'जाति और उम्र के आधार पर सटीक विश्लेषण' },
                            { icon: <Users size={20} />, title: 'कार्यकर्ता मैनेजमेंट', desc: 'पन्ना प्रमुखों की बेहतर रीयल-टाइम मॉनिटरिंग' },
                            { icon: <BarChart3 size={20} />, title: 'बूथ-वार रिपोर्टिंग', desc: 'हर बूथ पर अपनी पकड़ मजबूत करें' }
                        ].map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800' }}>{item.title}</h4>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#93C5FD' }}>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '60px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', marginLeft: '0px' }}>
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3B82F6', border: '2px solid #1E3A8A', marginLeft: i === 1 ? 0 : '-10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>{String.fromCharCode(64 + i)}</div>
                                ))}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#DBEAFE' }}>500+ अधिकृत कैंडिडेट उपयोग कर रहे हैं</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="login-side" style={{
                flex: '0.8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                background: '#FFFFFF'
            }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748B', textDecoration: 'none', marginBottom: '32px', fontWeight: '700', padding: '8px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                            <ArrowLeft size={16} /> वेबसाइट पर वापस जाएं
                        </Link>

                        <img src="/logo.png" alt="VoterAction Logo" style={{ height: '40px', width: 'auto', marginBottom: '24px' }} />

                        <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>वोटरएक्शन लॉगिन</h2>
                        <p style={{ color: '#64748B', fontSize: '16px', fontWeight: '500' }}>जारी रखने के लिए अपने फोन नंबर से लॉगिन करें</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '10px', color: '#475569' }}>पंजीकृत मोबाइल नंबर</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Phone size={18} />
                                    <div style={{ width: '1px', height: '20px', background: '#E2E8F0' }}></div>
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 16px 16px 54px',
                                        borderRadius: '16px',
                                        border: '2px solid #F1F5F9',
                                        background: '#F8FAFC',
                                        outline: 'none',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s',
                                        color: '#1E293B'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.border = '2px solid #2563EB';
                                        e.target.style.background = 'white';
                                        e.target.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.border = '2px solid #F1F5F9';
                                        e.target.style.background = '#F8FAFC';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                    placeholder="यहाँ नंबर लिखें"
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '10px', color: '#475569' }}>आपका पासवर्ड</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Lock size={18} />
                                    <div style={{ width: '1px', height: '20px', background: '#E2E8F0' }}></div>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 54px 16px 54px',
                                        borderRadius: '16px',
                                        border: '2px solid #F1F5F9',
                                        background: '#F8FAFC',
                                        outline: 'none',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s',
                                        color: '#1E293B'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.border = '2px solid #2563EB';
                                        e.target.style.background = 'white';
                                        e.target.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.border = '2px solid #F1F5F9';
                                        e.target.style.background = '#F8FAFC';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                    placeholder="पासवर्ड लिखें"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#94A3B8',
                                        cursor: 'pointer',
                                        padding: '8px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer',
                                        accentColor: '#2563EB',
                                        borderRadius: '6px'
                                    }}
                                />
                                <label htmlFor="rememberMe" style={{ fontSize: '14px', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>लॉगिन बनाए रखें</label>
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                marginBottom: '24px',
                                padding: '16px',
                                background: '#FFF1F2',
                                color: '#E11D48',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: '800',
                                textAlign: 'center',
                                border: '1px solid #FFE4E6',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                justifyContent: 'center'
                            }}>
                                <span style={{ fontSize: '18px' }}>⚠️</span> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '18px',
                                borderRadius: '16px',
                                border: 'none',
                                background: '#2563EB',
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: '900',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(37, 99, 235, 0.5)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(37, 99, 235, 0.4)';
                                }
                            }}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" style={{
                                        width: '20px',
                                        height: '20px',
                                        border: '3px solid rgba(255,255,255,0.3)',
                                        borderTop: '3px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    लॉगिन हो रहा है...
                                </>
                            ) : 'लॉगिन करें'}
                        </button>
                    </form>

                    <div style={{ marginTop: '40px', textAlign: 'center' }}>
                        <p style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>
                            तकनीकी सहायता: <a href="#" style={{ color: '#2563EB', textDecoration: 'none' }}>CreatiAV सपोर्ट टीम</a>
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @media (max-width: 900px) {
                    .branding-side { display: none !important; }
                    .login-side { flex: 1 !important; }
                }
            `}</style>
        </div>
    );
}
