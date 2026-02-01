'use client';

import React, { useState, useEffect } from 'react';
import { Activity, AlertOctagon, Clock, Users, ArrowRight } from 'lucide-react';

const pollData = Array.from({ length: 40 }, (_, i) => ({
    id: i + 1,
    number: 100 + i + 1,
    turnout: Math.floor(Math.random() * 40) + 20,
    voted: Math.floor(Math.random() * 500) + 200,
    total: 1000,
    status: Math.random() > 0.8 ? 'Alert' : 'Normal',
    lastUpdate: '10 मि. पहले'
}));

export default function PollDayPage() {
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        setCurrentTime(new Date().toLocaleTimeString('hi-IN'));
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('hi-IN'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div style={{ padding: '0px' }}>
            <div style={{
                background: '#111827',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '8px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: '8px solid var(--danger)'
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Activity className="status-red" /> मतदान वार रूम (War Room) - LIVE
                    </h1>
                    <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>विधानसभा क्षेत्र: 123-उत्तर, चरण: 02</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>{currentTime}</div>
                    <div style={{ fontSize: '13px', color: 'var(--success)', fontWeight: '600' }}>सिस्टम ऑनलाइन • डेटा अपडेट हो रहा है</div>
                </div>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card" style={{ background: '#1F2937', color: 'white', border: 'none' }}>
                    <div className="kpi-label" style={{ color: '#9CA3AF' }}>कुल मतदान प्रतिशत</div>
                    <div className="kpi-value" style={{ fontSize: '36px' }}>42.5%</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>समय: 12:00 PM तक</div>
                </div>
                <div className="kpi-card" style={{ background: '#1F2937', color: 'white', border: 'none' }}>
                    <div className="kpi-label" style={{ color: '#9CA3AF' }}>अनुमानित वोट</div>
                    <div className="kpi-value" style={{ fontSize: '36px' }}>45,230</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>लक्ष्य: 85,000</div>
                </div>
                <div className="kpi-card" style={{ background: '#1F2937', color: 'white', border: 'none' }}>
                    <div className="kpi-label" style={{ color: '#9CA3AF' }}>अलर्ट (Booth Issues)</div>
                    <div className="kpi-value status-red" style={{ fontSize: '36px' }}>08</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>त्वरित कार्यवाही आवश्यक</div>
                </div>
                <div className="kpi-card" style={{ background: '#1F2937', color: 'white', border: 'none' }}>
                    <div className="kpi-label" style={{ color: '#9CA3AF' }}>सक्रिय इंचार्ज</div>
                    <div className="kpi-value status-green" style={{ fontSize: '36px' }}>242/245</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>3 बूथ पर संपर्क टूटा</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {pollData.map((booth) => (
                    <div key={booth.id} style={{
                        background: booth.status === 'Alert' ? '#450a0a' : 'white',
                        color: booth.status === 'Alert' ? '#fecaca' : 'var(--text-primary)',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        position: 'relative',
                        animation: booth.status === 'Alert' ? 'pulse 2s infinite' : 'none'
                    }}>
                        <style jsx>{`
              @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
                100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
              }
            `}</style>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '800', fontSize: '18px' }}>#{booth.number}</span>
                            {booth.status === 'Alert' && <AlertOctagon size={18} />}
                        </div>

                        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>मतदान प्रतिशत</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>{booth.turnout}%</div>

                        <div style={{ height: '4px', width: '100%', background: booth.status === 'Alert' ? 'rgba(255,255,255,0.2)' : '#F3F4F6', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${booth.turnout}%`,
                                height: '100%',
                                background: booth.turnout < 25 ? 'var(--danger)' : 'var(--success)'
                            }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', opacity: 0.7 }}>
                            <span>{booth.voted}/{booth.total}</span>
                            <span>{booth.lastUpdate}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Incident Pop-up Strip */}
            <div style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '350px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                zIndex: 1000
            }}>
                <div style={{ padding: '12px 16px', background: 'var(--danger)', color: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertOctagon size={18} /> नई घटना दर्ज
                </div>
                <div style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>बूथ नं. 114 - विवाद</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>EV मशीन में तकनीकी खराबी के कारण मतदान रुका हुआ है।</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={{ padding: '6px 12px', background: '#F3F4F6', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>इग्नोर</button>
                        <button style={{ padding: '6px 12px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            जांच करें <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
