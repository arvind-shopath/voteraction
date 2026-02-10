'use client';

import React, { useState, useEffect } from 'react';
import { getIssues, createIssue, updateIssue } from '@/app/actions/issues';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import { AlertCircle, Clock, MapPin, CheckCircle2, Plus } from 'lucide-react';

export default function IssuesPage() {
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedArea, setSelectedArea] = useState('All');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Infrastructure',
        priority: 'Medium',
        boothNumber: '',
        village: '',
        area: '',
        mediaUrls: '',
        videoUrl: ''
    });

    const [uploading, setUploading] = useState(false);

    const { data: session }: any = useSession();
    const { simulationPersona } = useView();
    const assemblyId = (simulationPersona as any)?.assemblyId || (session?.user as any)?.assemblyId || 13;


    useEffect(() => {
        fetchIssues();
    }, []);

    async function fetchIssues() {
        setLoading(true);
        const data = await getIssues(assemblyId);
        setIssues(data);
        setLoading(false);
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        try {
            const res = await fetch('/api/cloud/upload', {
                method: 'POST',
                body: formDataUpload
            });
            const data = await res.json();
            if (data.success) {
                if (type === 'photo') {
                    const current = formData.mediaUrls ? formData.mediaUrls.split(',') : [];
                    setFormData({ ...formData, mediaUrls: [...current, data.url].join(',') });
                } else {
                    setFormData({ ...formData, videoUrl: data.url });
                }
            }
        } catch (err) {
            console.error('Upload failed', err);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            boothNumber: formData.boothNumber ? parseInt(formData.boothNumber) : undefined,
            assemblyId
        };

        if (editingId) {
            await updateIssue(editingId, payload);
        } else {
            await createIssue(payload);
        }

        setShowAdd(false);
        setEditingId(null);
        setFormData({
            title: '', description: '', category: 'Infrastructure', priority: 'Medium', boothNumber: '',
            village: '', area: '', mediaUrls: '', videoUrl: '', status: 'Open'
        } as any);
        fetchIssues();
    };

    const handleEdit = (issue: any) => {
        setFormData({
            title: issue.title,
            description: issue.description || '',
            category: issue.category || 'Infrastructure',
            priority: issue.priority || 'Medium',
            boothNumber: issue.boothNumber ? issue.boothNumber.toString() : '',
            village: issue.village || '',
            area: issue.area || '',
            mediaUrls: issue.mediaUrls || '',
            videoUrl: issue.videoUrl || '',
            status: issue.status || 'Open'
        } as any);
        setEditingId(issue.id);
        setShowAdd(true);
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        await updateIssue(id, { status: newStatus });
        fetchIssues();
    };

    const columns = [
        { name: 'खुली हुई', status: 'Open', color: 'var(--danger)' },
        { name: 'प्रक्रिया में', status: 'InProgress', color: 'var(--warning)' },
        { name: 'हल हो गई', status: 'Closed', color: 'var(--success)' },
    ];

    const uniqueAreas = ['All', ...Array.from(new Set(issues.map(i => i.area).filter(a => a)))];
    const filteredIssues = issues.filter(i => selectedArea === 'All' || i.area === selectedArea);

    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '32px', padding: '16px', background: '#FEF2F2', borderRadius: '16px', border: '1px solid #FECACA' }}>
                <p style={{ color: '#DC2626', fontSize: '13px', fontWeight: '800' }}>
                    📢 ये जगह फाइल स्टोर करने के लिए नहीं हैं.. यहां से आप फोटो और वीडियो सिर्फ भेज सकते हैं.. ये फाइलें 7 दिन में डिलीट हो जाएंगी.. प्लीज अपने पास बैकअप रखे..
                </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700' }}>समस्या एवं शिकायत ट्रैकिंग</h1>
                    <p style={{ color: '#6B7280', fontSize: '14px' }}>क्षेत्र: {selectedArea === 'All' ? 'सभी क्षेत्र' : selectedArea}</p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <select
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                    >
                        {uniqueAreas.map((area: any) => (
                            <option key={area} value={area}>{area}</option>
                        ))}
                    </select>

                    <button onClick={() => {
                        setShowAdd(!showAdd); setEditingId(null); setFormData({
                            title: '', description: '', category: 'Infrastructure', priority: 'Medium', boothNumber: '',
                            village: '', area: '', mediaUrls: '', videoUrl: '', status: 'Open'
                        } as any);
                    }}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--primary-bg)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: '700'
                        }}>
                        <Plus size={18} /> नई शिकायत दर्ज करें
                    </button>
                </div>
            </div>

            {showAdd && (
                <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>{editingId ? 'शिकायत सुधारें' : 'नई शिकायत दर्ज करें'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>शिकायत का विषय</label>
                                <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Categorization & Status</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }}>
                                        <option value="Infrastructure">इन्फ्रास्ट्रक्चर</option>
                                        <option value="Utility">बिजली / पानी</option>
                                        <option value="Road">सड़क / मार्ग</option>
                                        <option value="Sanitation">सफाई / स्वच्छता</option>
                                        <option value="Other">अन्य</option>
                                    </select>
                                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }}>
                                        <option value="Low">Low Priority</option>
                                        <option value="Medium">Medium Priority</option>
                                        <option value="High">High Priority</option>
                                    </select>
                                    <select value={(formData as any).status} onChange={(e) => setFormData({ ...formData, status: e.target.value } as any)}
                                        style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', background: '#F0F9FF', fontWeight: '700' }}>
                                        <option value="Open">Open</option>
                                        <option value="InProgress">In Progress</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Location Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>बूथ नंबर</label>
                                <input type="number" value={formData.boothNumber} onChange={(e) => setFormData({ ...formData, boothNumber: e.target.value })}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>गाँव / मोहल्ला</label>
                                <input type="text" value={formData.village || ''} onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>क्षेत्र (Area)</label>
                                <input type="text" value={formData.area || ''} onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>विवरण</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', height: '100px' }} />
                        </div>

                        {/* Media Uploads */}
                        <div style={{ marginBottom: '16px', padding: '16px', background: '#F9FAFB', borderRadius: '12px', border: '1px dashed #D1D5DB' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>मीडिया अपलोड (Media Upload)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>फोटो चुनें (Photo)</p>
                                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} disabled={uploading}
                                        style={{ fontSize: '13px' }} />
                                    {formData.mediaUrls && (
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                                            {formData.mediaUrls.split(',').map((url, idx) => (
                                                <img key={idx} src={url} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>वीडियो चुनें (Video)</p>
                                    <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} disabled={uploading}
                                        style={{ fontSize: '13px' }} />
                                    {formData.videoUrl && (
                                        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--success)', fontWeight: '600' }}>✓ Video Uploaded</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button type="button" onClick={() => setShowAdd(false)}
                                style={{ padding: '8px 16px', background: '#F3F4F6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                कैंसिल
                            </button>
                            <button type="submit" disabled={uploading}
                                style={{ padding: '8px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', opacity: uploading ? 0.5 : 1 }}>
                                {uploading ? 'अपलोड हो रहा है...' : (editingId ? 'अपडेट करें' : 'सेव करें')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px' }}>लोड हो रहा है...</div>
            ) : (
                <div className="grid-3-responsive" style={{ height: 'calc(100vh - 200px)' }}>
                    <style jsx>{`
                        .grid-3-responsive {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 24px;
                        }
                        @media (max-width: 1024px) {
                            .grid-3-responsive {
                                grid-template-columns: 1fr;
                                height: auto !important;
                                gap: 32px;
                            }
                        }
                    `}</style>
                    {columns.map((column) => (
                        <div key={column.status} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{
                                padding: '12px 16px',
                                background: 'white',
                                borderBottom: `3px solid ${column.color}`,
                                borderRadius: '8px 8px 0 0',
                                fontWeight: '700',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                {column.name}
                                <span style={{ fontSize: '12px', background: '#F3F4F6', padding: '2px 8px', borderRadius: '10px' }}>
                                    {filteredIssues.filter(i => i.status === column.status).length}
                                </span>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {filteredIssues.filter(i => i.status === column.status).map((issue) => (
                                    <div key={issue.id} style={{
                                        padding: '16px',
                                        background: 'white',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        position: 'relative'
                                    }}>
                                        {/* Edit Button */}
                                        <button onClick={() => handleEdit(issue)}
                                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        </button>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', paddingRight: '20px' }}>
                                            <div style={{
                                                fontSize: '12px',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: issue.priority === 'High' ? '#FEE2E2' : issue.priority === 'Medium' ? '#FEF3C7' : '#E0F2FE',
                                                color: issue.priority === 'High' ? '#B91C1C' : issue.priority === 'Medium' ? '#92400E' : '#0369A1',
                                                fontWeight: '700'
                                            }}>
                                                {issue.priority === 'High' ? 'उच्च' : issue.priority === 'Medium' ? 'मध्यम' : 'निम्न'}
                                            </div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} /> {Math.floor((new Date().getTime() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24))} दिन
                                            </span>
                                        </div>

                                        <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>{issue.title}</h4>
                                        {issue.description && <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>{issue.description}</p>}

                                        {/* Locations */}
                                        <div style={{ fontSize: '12px', color: '#4B5563', marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {issue.village && <span style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>🏘 {issue.village}</span>}
                                            {issue.area && <span style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>📍 {issue.area}</span>}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {issue.boothNumber && <><MapPin size={12} /> बूथ {issue.boothNumber}</>}
                                                </span>
                                                {issue.updatedByName && (
                                                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>
                                                        एडिट: {issue.updatedByName}
                                                    </span>
                                                )}
                                            </div>
                                            {issue.status !== 'Closed' && (
                                                <button onClick={() => handleStatusChange(issue.id, issue.status === 'Open' ? 'InProgress' : 'Closed')}
                                                    style={{ fontSize: '11px', padding: '4px 8px', background: '#EFF6FF', color: '#1E40AF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
                                                    {issue.status === 'Open' ? 'शुरू करें' : 'पूर्ण करें'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
