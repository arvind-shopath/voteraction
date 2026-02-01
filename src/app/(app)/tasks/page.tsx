'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getWorkersInAssembly, createBulkTasks } from '@/app/actions/worker';
import { ListTodo, Plus, Search, CheckCircle2, Clock, AlertCircle, Image as ImageIcon, Loader2, X, Users, Filter } from 'lucide-react';

export default function TaskManagementPage() {
    const { data: session }: any = useSession();
    const assemblyId = session?.user?.assemblyId || 1;

    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        mediaUrls: '',
        targetType: 'All', // All, BoothManagers, PannaPramukhs, GroundWorkers, Selected
        selectedWorkerIds: [] as number[]
    });

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchWorkers();
    }, []);

    async function fetchWorkers() {
        setLoading(true);
        const data = await getWorkersInAssembly(assemblyId);
        // Exclude Social Media roles if any (though they usually aren't in Worker table)
        // Also exclude self
        const filtered = data.filter((w: any) => w.user?.role !== 'SOCIAL_MEDIA');
        setWorkers(filtered);
        setLoading(false);
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: data });
            const json = await res.json();
            if (json.success) {
                setFormData(prev => ({ ...prev, mediaUrls: json.url }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return alert('कृपया टास्क का शीर्षक लिखें');

        let targetIds: number[] = [];
        if (formData.targetType === 'All') {
            targetIds = workers.map(w => w.id);
        } else if (formData.targetType === 'BoothManagers') {
            targetIds = workers.filter(w => w.type === 'BOOTH_MANAGER').map(w => w.id);
        } else if (formData.targetType === 'PannaPramukhs') {
            targetIds = workers.filter(w => w.type === 'PANNA_PRAMUKH').map(w => w.id);
        } else if (formData.targetType === 'GroundWorkers') {
            targetIds = workers.filter(w => w.type === 'FIELD' || w.type === 'SOCIAL_MEDIA').map(w => w.id);
        } else {
            targetIds = formData.selectedWorkerIds;
        }

        if (targetIds.length === 0) return alert('कृपया कम से कम एक कार्यकर्ता चुनें');

        setSubmitting(true);
        try {
            await createBulkTasks({
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                workerIds: targetIds,
                assemblyId,
                mediaUrls: formData.mediaUrls
            });
            alert('टास्क सफलतापूर्वक असाइन कर दिए गए हैं!');
            setIsModalOpen(false);
            setFormData({
                title: '',
                description: '',
                priority: 'Medium',
                mediaUrls: '',
                targetType: 'All',
                selectedWorkerIds: []
            });
        } catch (err) {
            alert('टास्क असाइन करने में विफल');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleWorkerSelection = (id: number) => {
        setFormData(prev => ({
            ...prev,
            selectedWorkerIds: prev.selectedWorkerIds.includes(id)
                ? prev.selectedWorkerIds.filter(wid => wid !== id)
                : [...prev.selectedWorkerIds, id]
        }));
    };

    const filteredWorkers = workers.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.mobile?.includes(searchQuery)
    );

    return (
        <div style={{ paddingBottom: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>टास्क मैनेजमेंट (Task Management)</h1>
                    <p style={{ color: '#64748B', marginTop: '4px' }}>कार्यकर्ताओं को टास्क दें और उनकी प्रोग्रेस ट्रैक करें</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{ background: 'var(--primary-bg)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                >
                    <Plus size={20} /> नया टास्क असाइन करें
                </button>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', background: '#F1F5F9', borderRadius: '12px', color: '#64748B' }}><Users size={20} /></div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>कुल कार्यकर्ता</div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>{workers.length}</div>
                        </div>
                    </div>
                </div>
                {/* Add more stats cards here and later */}
            </div>

            {/* Modal for Creating Task */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="card" style={{ background: 'white', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '24px', position: 'relative' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', right: '24px', top: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <ListTodo size={24} color="var(--primary-bg)" /> नया टास्क बनाएं
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                                {/* Left Side: Details */}
                                <div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>टास्क का नाम (Title)</label>
                                        <input
                                            type="text"
                                            placeholder="जैसे: मतदाता सूची का सत्यापन..."
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '15px' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>टास्क की जानकारी (Description)</label>
                                        <textarea
                                            placeholder="काम का विवरण विस्तार से लिखें..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            style={{ width: '100%', height: '120px', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '15px', resize: 'none' }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>प्राथमिकता (Priority)</label>
                                            <select
                                                value={formData.priority}
                                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white' }}
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                                <option value="Urgent">Urgent</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>मीडिया (Media)</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="file"
                                                    onChange={handleFileUpload}
                                                    style={{ width: '100%', opacity: 0, position: 'absolute', top: 0, left: 0, bottom: 0, cursor: 'pointer' }}
                                                />
                                                <div style={{ padding: '12px', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '12px', textAlign: 'center', fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                                                    {formData.mediaUrls ? 'Image Uploaded ✓' : 'Add Image'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Assignment */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '12px' }}>किसे असाइन करना है? (Assign To)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                                        {['All', 'BoothManagers', 'PannaPramukhs', 'GroundWorkers', 'Selected'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, targetType: type })}
                                                style={{
                                                    padding: '10px',
                                                    borderRadius: '10px',
                                                    border: '1px solid',
                                                    borderColor: formData.targetType === type ? 'var(--primary-bg)' : '#E2E8F0',
                                                    background: formData.targetType === type ? '#EFF6FF' : 'white',
                                                    color: formData.targetType === type ? 'var(--primary-bg)' : '#475569',
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {type === 'All' ? 'सभी को' : type === 'BoothManagers' ? 'सिर्फ बूथ मैनेजर्स' : type === 'PannaPramukhs' ? 'सिर्फ पन्ना प्रमुख' : type === 'GroundWorkers' ? 'ग्राउण्ड कार्यकर्ता' : 'चयनित (Select)'}
                                            </button>
                                        ))}
                                    </div>

                                    {(formData.targetType === 'Selected' || formData.targetType !== 'Selected') && (
                                        <div style={{ border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden' }}>
                                            <div style={{ padding: '12px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Search size={16} color="#94A3B8" />
                                                <input
                                                    type="text"
                                                    placeholder="नाम से खोजें..."
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    style={{ background: 'transparent', border: 'none', fontSize: '14px', width: '100%', outline: 'none' }}
                                                />
                                            </div>
                                            <div style={{ height: '200px', overflowY: 'auto', padding: '12px' }}>
                                                {filteredWorkers.map(w => {
                                                    const isSelected = formData.targetType === 'Selected'
                                                        ? formData.selectedWorkerIds.includes(w.id)
                                                        : (formData.targetType === 'All' ||
                                                            (formData.targetType === 'BoothManagers' && w.type === 'BOOTH_MANAGER') ||
                                                            (formData.targetType === 'FieldWorkers' && (w.type === 'FIELD' || w.type === 'SOCIAL_MEDIA')) ||
                                                            (formData.targetType === 'GroundWorkers' && (w.type === 'FIELD' || w.type === 'SOCIAL_MEDIA')) ||
                                                            (formData.targetType === 'PannaPramukhs' && w.type === 'PANNA_PRAMUKH'));

                                                    return (
                                                        <div
                                                            key={w.id}
                                                            onClick={() => formData.targetType === 'Selected' && toggleWorkerSelection(w.id)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '12px',
                                                                padding: '8px',
                                                                borderRadius: '8px',
                                                                cursor: formData.targetType === 'Selected' ? 'pointer' : 'default',
                                                                background: isSelected ? '#F0F9FF' : 'transparent',
                                                                marginBottom: '4px'
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: '16px',
                                                                height: '16px',
                                                                borderRadius: '4px',
                                                                border: '2px solid',
                                                                borderColor: isSelected ? 'var(--primary-bg)' : '#CBD5E1',
                                                                background: isSelected ? 'var(--primary-bg)' : 'transparent',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                {isSelected && <CheckCircle2 size={12} color="white" />}
                                                            </div>
                                                            <div style={{ fontSize: '14px', fontWeight: '600', color: isSelected ? '#1E40AF' : '#1E293B' }}>{w.name}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748B', marginLeft: 'auto', background: '#F1F5F9', padding: '2px 8px', borderRadius: '12px' }}>{w.type}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    कैंसिल
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ padding: '12px 40px', borderRadius: '12px', border: 'none', background: 'var(--primary-bg)', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                                >
                                    {submitting ? <Loader2 size={20} className="animate-spin" /> : <ListTodo size={20} />}
                                    टास्क असाइन करें
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}
