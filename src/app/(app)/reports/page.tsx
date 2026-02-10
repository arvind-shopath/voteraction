import React from 'react';
import { FileDown, FileBarChart, History, Download } from 'lucide-react';

export default function ReportsPage() {
    const exports = [
        { name: 'बूथ-वार मतदाता सूची', type: 'Excel', size: '2.4 MB', date: 'आज' },
        { name: 'कार्यकर्ता प्रदर्शन रिपोर्ट', type: 'PDF', size: '1.1 MB', date: 'कल' },
        { name: 'शिकायत निवारण विवरण', type: 'Excel', size: '0.8 MB', date: '2 दिन पहले' },
        { name: 'दैनिक गतिविधि सारांश', type: 'PDF', size: '4.5 MB', date: 'साप्ताहिक' },
    ];

    return (
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>रिपोर्ट्स एवं निर्यात</h1>

            <div className="kpi-grid">
                <div className="kpi-card">
                    <FileBarChart size={32} color="var(--primary-bg)" style={{ marginBottom: '12px' }} />
                    <div className="kpi-label">कुल जेनरेट रिपोर्ट</div>
                    <div className="kpi-value">124</div>
                </div>
                <div className="kpi-card">
                    <Download size={32} color="var(--success)" style={{ marginBottom: '12px' }} />
                    <div className="kpi-label">डाउनलोड्स (आज)</div>
                    <div className="kpi-value">12</div>
                </div>
            </div>

            <div className="card" style={{ background: 'white', padding: 0 }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '18px' }}>डाउनलोड के लिए उपलब्ध फाइलें</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#F9FAFB', textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                            <th style={{ padding: '16px 24px' }}>फाइल का नाम</th>
                            <th style={{ padding: '16px' }}>प्रकार</th>
                            <th style={{ padding: '16px' }}>आकार</th>
                            <th style={{ padding: '16px' }}>दिनांक</th>
                            <th style={{ padding: '16px' }}>कार्य</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exports.map((file, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '16px 24px', fontWeight: '600' }}>{file.name}</td>
                                <td style={{ padding: '16px' }}>{file.type}</td>
                                <td style={{ padding: '16px' }}>{file.size}</td>
                                <td style={{ padding: '16px' }}>{file.date}</td>
                                <td style={{ padding: '16px' }}>
                                    <button style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: 'var(--primary-bg)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}>
                                        <FileDown size={18} /> डाउनलोड
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '24px' }} className="card">
                <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={20} /> हालिया गतिविधि लॉग (Audit Log)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        'एडमिन ने "बूथ 12" की मतदाता सूची डाउनलोड की',
                        'अनिल कुमार (कार्यकर्ता) ने नई शिकायत दर्ज की',
                        'कैंपेन कैंडिडेट ने सोशल मीडिया पोस्ट को अनुमति दी',
                        'सिस्टम ने स्वत: बैकअप पूरा किया'
                    ].map((log, i) => (
                        <div key={i} style={{ padding: '10px 16px', fontSize: '13px', background: '#F9FAFB', borderRadius: '4px', color: 'var(--text-secondary)', borderLeft: '3px solid #CBD5E1' }}>
                            {log} <span style={{ float: 'right', fontSize: '11px' }}>{i + 1} घंटा पहले</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
