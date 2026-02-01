'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, Phone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                mobile,
                password,
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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '400px', background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#64748B', textDecoration: 'none', marginBottom: '24px', fontWeight: '700' }}>
                    <ArrowLeft size={16} /> वापस जाएं
                </Link>

                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1E293B', marginBottom: '8px' }}>CreatiAV लॉगिन</h1>
                    <p style={{ color: '#64748B', fontSize: '14px' }}>अपना अधिकृत मोबाइल नंबर और पासवर्ड दर्ज करें</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#334155' }}>मोबाइल नंबर</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                required
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px' }}
                                placeholder="यहाँ लिखें..."
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#334155' }}>पासवर्ड</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px' }}
                                placeholder="पासवर्ड यहाँ लिखें..."
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{ marginBottom: '20px', padding: '12px', background: '#FEF2F2', color: '#DC2626', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            background: '#2563EB',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'लॉगिन हो रहा है...' : 'लॉगिन करें'}
                    </button>
                </form>
            </div>
        </div>
    );
}
