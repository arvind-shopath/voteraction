'use client';

import React from 'react';
import { Download, Monitor, Smartphone, ShieldCheck, Zap } from 'lucide-react';

export default function AppDownloadPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{ marginBottom: '60px' }}>
                    <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#0F172A', marginBottom: '16px' }}>Voteraction <span style={{ color: '#2563EB' }}>एप्प्स</span></h1>
                    <p style={{ fontSize: '20px', color: '#64748B' }}>उच्च-प्रदर्शन और सुरक्षित अनुभव के लिए Voteraction डेस्कटॉप और मोबाइल ऐप डाउनलोड करें</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px', marginBottom: '80px' }}>
                    {/* Windows App */}
                    <div style={{ background: 'white', borderRadius: '32px', padding: '48px', border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'left' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', marginBottom: '24px' }}>
                            <Monitor size={32} />
                        </div>
                        <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1E293B', marginBottom: '12px' }}>Voteraction डेस्कटॉप (Windows)</h2>
                        <p style={{ color: '#64748B', marginBottom: '32px', lineHeight: '1.6' }}>सोशल मीडिया टीम के लिए बेस्ट। इसमें सेशन आइसोलेशन और वन-क्लिक लॉगिन सिंक फीचर शामिल हैं।</p>

                        <a href="/apps/voteraction_setup.exe" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#2563EB', color: 'white', padding: '16px 32px', borderRadius: '16px', fontWeight: '800', textDecoration: 'none', transition: 'transform 0.2s' }}>
                            <Download size={20} /> अभी डाउनलोड करें (Windows)
                        </a>
                        <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '16px', textAlign: 'center' }}>वर्जन 1.0.0 • साइज़: ~60MB</p>
                    </div>

                    {/* Android App */}
                    <div style={{ background: 'white', borderRadius: '32px', padding: '48px', border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'left' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', marginBottom: '24px' }}>
                            <Smartphone size={32} />
                        </div>
                        <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1E293B', marginBottom: '12px' }}>Voteraction मोबाइल (Android)</h2>
                        <p style={{ color: '#64748B', marginBottom: '32px', lineHeight: '1.6' }}>कार्यकर्ताओं और कैंडिडेट्स के लिए बेस्ट। ऑफलाइन सर्वे और डायरेक्ट व्हाट्सएप शेयरिंग के साथ।</p>

                        <a href="/apps/voteraction.apk" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#10B981', color: 'white', padding: '16px 32px', borderRadius: '16px', fontWeight: '800', textDecoration: 'none', transition: 'transform 0.2s' }}>
                            <Download size={20} /> डाउनलोड APK (Android)
                        </a>
                        <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '16px', textAlign: 'center' }}>वर्जन 1.0.1 • साइज़: ~25MB</p>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '32px', padding: '40px', border: '1px solid #E2E8F0', textAlign: 'left' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#1E293B', marginBottom: '32px' }}>हवा में अपडेट (OTA Updates) कैसे काम करते हैं?</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <ShieldCheck size={32} color="#2563EB" style={{ flexShrink: 0 }} />
                            <div>
                                <h4 style={{ fontWeight: '800', marginBottom: '4px' }}>सुरक्षित सिंक</h4>
                                <p style={{ fontSize: '14px', color: '#64748B' }}>आपका डेटा और सेशन पूरी तरह एन्क्रिप्टेड (AES-256) सिंक होता है।</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <Zap size={32} color="#F59E0B" style={{ flexShrink: 0 }} />
                            <div>
                                <h4 style={{ fontWeight: '800', marginBottom: '4px' }}>लाइव अपडेट्स</h4>
                                <p style={{ fontSize: '14px', color: '#64748B' }}>नए फीचर्स के लिए आपको दोबारा ऐप डाउनलोड नहीं करनी होगी।</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '40px', color: '#94A3B8', fontSize: '14px' }}>
                    © 2026 Voteraction Social Dashboard. All Rights Reserved.
                </div>
            </div>
        </div>
    );
}
