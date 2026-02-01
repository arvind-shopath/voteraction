import React from 'react';
import { Calendar, ChevronRight, MapPin, AlertCircle, Image as ImageIcon } from 'lucide-react';

const reports = [
    { id: 1, date: '28 जनवरी 2026', booths: [12, 14, 45], issues: 4, photos: 12, summary: 'सभी बूथों पर घर-घर जनसंपर्क अभियान सुचारू रूप से चल रहा है।' },
    { id: 2, date: '27 जनवरी 2026', booths: [88, 102, 115], issues: 2, photos: 8, summary: 'शहरी क्षेत्रों में युवा वोटर्स के साथ बैठकें की गईं।' },
    { id: 3, date: '26 जनवरी 2026', booths: [14, 45, 88], issues: 7, photos: 15, summary: 'गणतंत्र दिवस समारोह के दौरान जनसंपर्क।' },
    { id: 4, date: '25 जनवरी 2026', booths: [12, 115], issues: 1, photos: 5, summary: 'स्थानीय समस्याओं के समाधान हेतु चौपाल का आयोजन।' },
];

export default function FieldReportsPage() {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700' }}>फील्ड रिपोर्ट</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ padding: '8px 16px', border: '1px solid var(--border)', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>फिल्टर करें</button>
                    <button style={{ padding: '8px 16px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>नया अपडेट</button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reports.map((report) => (
                    <div key={report.id} className="card" style={{ padding: '0', background: 'white' }}>
                        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center', minWidth: '80px', padding: '10px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <Calendar size={20} style={{ marginBottom: '4px', color: 'var(--text-secondary)' }} />
                                    <div style={{ fontSize: '12px', fontWeight: '600' }}>{report.date.split(' ')[0]} {report.date.split(' ')[1]}</div>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>दैनिक कार्य प्रगति रिपोर्ट</h3>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={14} /> {report.booths.length} बूथ कवर किए गए
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <AlertCircle size={14} /> {report.issues} समस्याएँ दर्ज
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <ImageIcon size={14} /> {report.photos} फोटो
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight size={24} color="#9CA3AF" />
                        </div>

                        <div style={{ padding: '0 20px 20px 104px' }}>
                            <p style={{ fontSize: '14px', color: 'var(--text-primary)', background: '#F9FAFB', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #CBD5E1' }}>
                                {report.summary}
                            </p>

                            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                                {[1, 2, 3, 4].map(idx => (
                                    <div key={idx} style={{
                                        width: '60px',
                                        height: '60px',
                                        background: '#E5E7EB',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <ImageIcon size={20} color="#9CA3AF" />
                                    </div>
                                ))}
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    background: 'rgba(0,0,0,0.05)',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: 'var(--text-secondary)'
                                }}>
                                    +{report.photos - 4} और
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
