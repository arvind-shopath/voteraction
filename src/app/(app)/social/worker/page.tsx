'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getSocialPosts } from '@/app/actions/social';
import { Loader2, Megaphone } from 'lucide-react';

export default function WorkerSocialPage() {
    const router = useRouter();
    const { data: session, status }: any = useSession();
    const [officialPosts, setOfficialPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const assemblyId = 1;

    // Redirect if manager or social media team
    useEffect(() => {
        if (status === 'authenticated') {
            const role = session?.user?.role;
            if (role === 'MANAGER' || role === 'SOCIAL_MEDIA' || ['ADMIN', 'SUPERADMIN'].includes(role)) {
                router.push('/social');
            }
        }
    }, [status, session, router]);

    useEffect(() => {
        if (status === 'authenticated') fetchData();
    }, [status]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const postsRes = await getSocialPosts(assemblyId);
            setOfficialPosts(postsRes.filter((p: any) => p.postType === 'Post'));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={48} color="#2563EB" />
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div className="card" style={{ padding: '32px', borderRadius: '24px', background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)', color: 'white', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Megaphone size={28} /> आज का सोशल टास्क
                </h2>
                <p style={{ opacity: 0.9 }}>नमस्ते {session?.user?.name}, पोस्ट्स शेयर करें और अपनी सक्रियता बढ़ाएं।</p>
            </div>

            {/* Posts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {officialPosts.map(post => (
                    <div key={post.id} className="card" style={{ overflow: 'hidden', borderRadius: '20px' }}>
                        {post.mediaUrls && <img src={post.mediaUrls} alt={post.content} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />}
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '20px', lineHeight: '1.6' }}>{post.content}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <a
                                    href={post.liveLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        padding: '12px',
                                        background: '#F1F5F9',
                                        color: '#1E293B',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        fontWeight: '800',
                                        textDecoration: 'none',
                                        fontSize: '13px',
                                        transition: 'all 0.2s'
                                    }}
                                    className="hover-btn"
                                >
                                    लाइक करें
                                </a>
                                <button
                                    onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(post.content + '\n' + post.liveLink)}`, '_blank')}
                                    style={{
                                        padding: '12px',
                                        background: '#25D366',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: '800',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    className="hover-btn"
                                >
                                    शेयर करें
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {officialPosts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
                    <Megaphone size={64} color="#CBD5E1" style={{ margin: '0 auto 20px' }} />
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>अभी कोई पोस्ट नहीं है</div>
                    <div style={{ fontSize: '14px', marginTop: '8px' }}>जल्द ही नई पोस्ट आने वाली हैं!</div>
                </div>
            )}

            <style jsx>{`
                .card { 
                    background: white; 
                    border: 1px solid #E2E8F0; 
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    transition: all 0.3s;
                }
                .card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px -10px rgba(0,0,0,0.15);
                }
                .hover-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .animate-spin { 
                    animation: spin 1s linear infinite; 
                }
                @keyframes spin { 
                    from { transform: rotate(0deg); } 
                    to { transform: rotate(360deg); } 
                }
            `}</style>
        </div>
    );
}
