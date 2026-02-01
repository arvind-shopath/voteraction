'use client';

import React from 'react';
import { Share2, Clock, Calendar, Filter, Megaphone } from 'lucide-react';

export default function PostSchedulePage() {
    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800' }}>पोस्ट शेड्यूल (Schedule)</h1>
                    <p style={{ color: '#64748B' }}>आने वाली पोस्ट और मीडिया की योजना</p>
                </div>
            </div>

            <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '20px' }}>
                <div style={{ width: '64px', height: '64px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#64748B' }}>
                    <Calendar size={32} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>अभी कोई शेड्यूल नहीं है</h3>
                <p style={{ color: '#94A3B8' }}>कंटेंट सेक्शन से नई पोस्ट शेड्यूल करें।</p>
            </div>
        </div>
    );
}
