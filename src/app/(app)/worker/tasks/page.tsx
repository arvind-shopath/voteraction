'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getWorkerTasks, updateTaskStatus } from '@/app/actions/worker';
import {
    CheckCircle2,
    Clock,
    Image as ImageIcon,
    Video,
    Upload,
    MessageSquare,
    Loader2,
    CheckCircle,
    X
} from 'lucide-react';

export default function WorkerTasksPage() {
    const { data: session }: any = useSession();
    const workerId = session?.user?.workerId;

    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
    const [showReportModal, setShowReportModal] = useState<number | null>(null);
    const [reportText, setReportText] = useState('');
    const [uploading, setUploading] = useState<number | null>(null);

    useEffect(() => {
        if (workerId) {
            fetchTasks();
        } else {
            // Stop loading if no workerId avail (e.g. admin simulation without worker map)
            setLoading(false);
        }
    }, [workerId]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await getWorkerTasks(workerId);
            setTasks(data);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (taskId: number) => {
        setUpdatingTaskId(taskId);
        try {
            await updateTaskStatus(taskId, 'Completed');
            await fetchTasks();
        } catch (error) {
            alert("Failed to update task");
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showReportModal) return;

        setUpdatingTaskId(showReportModal);
        try {
            await updateTaskStatus(showReportModal, 'InProgress', reportText);
            setShowReportModal(null);
            setReportText('');
            await fetchTasks();
        } catch (error) {
            alert("Failed to save report");
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, taskId: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(taskId);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/cloud/upload', {
                method: 'POST',
                body: formData
            });
            const json = await res.json();
            if (json.success) {
                // Update task with media URL
                await updateTaskStatus(taskId, 'InProgress', undefined);
                // In a real app we'd also save the media URL to the task, 
                // but for now we just mark it progressive
                await fetchTasks();
                alert("File uploaded successfully");
            }
        } catch (error) {
            alert("Upload failed");
        } finally {
            setUploading(null);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <Loader2 className="animate-spin" size={40} color="var(--primary-bg)" />
        </div>
    );

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '100px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px', padding: '16px', background: '#FEF2F2', borderRadius: '16px', border: '1px solid #FECACA' }}>
                <p style={{ color: '#DC2626', fontSize: '13px', fontWeight: '800' }}>
                    📢 ये जगह फाइल स्टोर करने के लिए नहीं हैं.. यहां से आप फोटो और वीडियो सिर्फ भेज सकते हैं.. ये फाइलें 7 दिन में डिलीट हो जाएंगी.. प्लीज अपने पास बैकअप रखे..
                </p>
            </div>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827' }}>मेरे चुनावी कार्य (My Tasks)</h1>
                <p style={{ color: '#6B7280', fontSize: '16px' }}>आपको सौंपे गए ग्राउंड और सोशल मीडिया कार्यों की प्रगति यहाँ अपडेट करें।</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {tasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '24px', border: '2px dashed #E2E8F0' }}>
                        <Clock size={48} color="#94A3B8" style={{ marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#475569' }}>कोई कार्य आवंटित नहीं है</h3>
                        <p style={{ color: '#64748B' }}>जब आपको कार्य सौंपे जाएंगे, वे यहाँ दिखाई देंगे।</p>
                    </div>
                ) : tasks.map((task: any) => (
                    <div key={task.id} className="card" style={{
                        padding: '24px',
                        borderLeft: `6px solid ${task.priority === 'High' ? '#DC2626' : task.priority === 'Medium' ? '#F59E0B' : '#2563EB'}`,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        background: 'white',
                        borderRadius: '20px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{
                                        background: task.priority === 'High' ? '#FEF2F2' : task.priority === 'Medium' ? '#FFFBEB' : '#EFF6FF',
                                        color: task.priority === 'High' ? '#DC2626' : task.priority === 'Medium' ? '#D97706' : '#1D4ED8',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        textTransform: 'uppercase'
                                    }}>
                                        {task.priority || 'Normal'} Priority
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>ID: #{task.id}</span>
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px', color: '#1E293B' }}>{task.title}</h3>
                                <p style={{ color: '#475569', fontSize: '15px', marginBottom: '24px', lineHeight: '1.6' }}>{task.description}</p>

                                <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#64748B', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={16} /> Assign: {new Date(task.createdAt).toLocaleDateString('hi-IN')}
                                    </span>
                                    {task.dueDate && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={16} /> Due: {new Date(task.dueDate).toLocaleDateString('hi-IN')}
                                        </span>
                                    )}
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        background: task.status === 'Completed' ? '#D1FAE5' : task.status === 'InProgress' ? '#DBEAFE' : '#FEF3C7',
                                        color: task.status === 'Completed' ? '#065F46' : task.status === 'InProgress' ? '#1E40AF' : '#92400E'
                                    }}>
                                        • {task.status === 'Pending' ? 'लंबित (Pending)' : task.status === 'InProgress' ? 'जारी है (In Progress)' : 'पूरा हुआ (Completed)'}
                                    </span>
                                </div>

                                {/* Media Upload Section */}
                                {task.status !== 'Completed' && (
                                    <div style={{ marginTop: '24px', padding: '20px', background: '#F8FAFC', borderRadius: '12px', border: '2px dashed #E2E8F0' }}>
                                        <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Upload size={16} /> सबूत के लिए फोटो अपलोड करें
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, task.id)}
                                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                                />
                                                <button style={{ width: '100%', padding: '12px', background: 'white', border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>
                                                    {uploading === task.id ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} color="#2563EB" />}
                                                    फोटो अपलोड करें
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginLeft: '24px', textAlign: 'right' }}>
                                {task.status !== 'Completed' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <button
                                            disabled={updatingTaskId === task.id}
                                            onClick={() => handleComplete(task.id)}
                                            style={{
                                                padding: '12px 24px',
                                                background: '#059669',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                fontWeight: '800',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)',
                                                opacity: updatingTaskId === task.id ? 0.7 : 1
                                            }}
                                        >
                                            {updatingTaskId === task.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                            कार्य पूर्ण हुआ
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowReportModal(task.id);
                                                setReportText(task.report || '');
                                            }}
                                            style={{
                                                padding: '10px 24px',
                                                background: 'white',
                                                color: '#64748B',
                                                border: '1px solid #E2E8F0',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            विवरण / प्रोग्रेस लिखें
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ color: '#059669', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle size={32} />
                                        <span style={{ fontSize: '14px', fontWeight: '800' }}>पूर्ण (Done)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {task.report && (
                            <div style={{ marginTop: '20px', padding: '16px', background: '#F1F5F9', borderRadius: '8px', fontSize: '14px', borderLeft: '4px solid #94A3B8' }}>
                                <div style={{ fontWeight: '700', marginBottom: '4px', fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MessageSquare size={12} /> आपकी प्रोग्रेस रिपोर्ट:
                                </div>
                                <div style={{ color: '#1E293B' }}>{task.report}</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>कार्य की प्रगति लिखें</h3>
                            <button onClick={() => setShowReportModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleReportSubmit}>
                            <textarea
                                value={reportText}
                                onChange={(e) => setReportText(e.target.value)}
                                placeholder="आपने क्या काम किया? कोई समस्या या अपडेट?"
                                style={{ width: '100%', height: '150px', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '24px', resize: 'none' }}
                                required
                            />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setShowReportModal(null)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', borderRadius: '12px', fontWeight: '700', border: 'none' }}>कैंसिल</button>
                                <button type="submit" disabled={updatingTaskId !== null} style={{ flex: 1, padding: '12px', background: 'var(--primary-bg)', color: 'white', borderRadius: '12px', fontWeight: '800', border: 'none' }}>
                                    {updatingTaskId !== null ? 'Saving...' : 'अपडेट सेव करें'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

function Calendar(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
    );
}
