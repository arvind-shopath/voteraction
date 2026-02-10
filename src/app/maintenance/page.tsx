'use client';

import { useState, useEffect } from 'react';
import { Wrench, Code, Sparkles, Clock, RefreshCw } from 'lucide-react';

export default function MaintenancePage() {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Animated background particles */}
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0.1,
            }}>
                {[...Array(20)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        width: `${Math.random() * 100 + 50}px`,
                        height: `${Math.random() * 100 + 50}px`,
                        borderRadius: '50%',
                        background: 'white',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
                    }} />
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-30px); }
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.6; }
                    }
                `
            }} />

            {/* Main content card */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '32px',
                padding: '60px 40px',
                maxWidth: '600px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Icon */}
                <div style={{
                    width: '120px',
                    height: '120px',
                    margin: '0 auto 30px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
                    animation: 'pulse 2s ease-in-out infinite',
                }}>
                    <Wrench size={60} color="white" />
                </div>

                {/* Heading */}
                <h1 style={{
                    fontSize: '40px',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '20px',
                }}>
                    We're Building Something Amazing!
                </h1>

                {/* Hindi text */}
                <h2 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#4A5568',
                    marginBottom: '30px',
                }}>
                    हम कुछ नया बना रहे हैं!
                </h2>

                {/* Description */}
                <p style={{
                    fontSize: '18px',
                    color: '#718096',
                    lineHeight: '1.8',
                    marginBottom: '40px',
                }}>
                    Our team is currently working on exciting new features and improvements.
                    The app will be back online shortly. Thank you for your patience!
                </p>

                <p style={{
                    fontSize: '16px',
                    color: '#718096',
                    lineHeight: '1.8',
                    marginBottom: '40px',
                    fontWeight: '600',
                }}>
                    हमारी टीम नए फीचर्स पर काम कर रही है। जल्द ही ऐप वापस आ जाएगा!
                </p>

                {/* Features being worked on */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '20px',
                    marginBottom: '40px',
                }}>
                    {[
                        { icon: Code, label: 'Bug Fixes', color: '#667eea' },
                        { icon: Sparkles, label: 'New Features', color: '#764ba2' },
                        { icon: RefreshCw, label: 'Updates', color: '#48bb78' },
                    ].map((item, i) => (
                        <div key={i} style={{
                            padding: '20px',
                            background: 'linear-gradient(135deg, #f6f8fb 0%, #f0f2f5 100%)',
                            borderRadius: '16px',
                            border: '2px solid #e2e8f0',
                        }}>
                            <item.icon size={32} color={item.color} style={{ marginBottom: '10px' }} />
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#2D3748' }}>
                                {item.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Animated loading text */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%)',
                    borderRadius: '16px',
                }}>
                    <Clock size={24} color="#667eea" />
                    <span style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#2D3748',
                    }}>
                        Developer Mode Active{dots}
                    </span>
                </div>

                {/* Footer */}
                <p style={{
                    marginTop: '30px',
                    fontSize: '14px',
                    color: '#A0AEC0',
                    fontWeight: '600',
                }}>
                    आप Superadmin से संपर्क कर सकते हैं अधिक जानकारी के लिए
                </p>
            </div>
        </div>
    );
}
