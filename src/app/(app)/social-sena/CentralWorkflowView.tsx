'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Send, CheckCircle2, XCircle, Clock, RefreshCw,
    ImageIcon, Video, FileText, Search,
    Plus, MessageSquare, ChevronRight, User,
    ArrowLeft, LayoutDashboard, Share2, Filter, Loader2, Upload as UploadIcon, X
} from 'lucide-react';
import {
    createCentralTask, getCentralTasks, submitCentralWork,
    reviewCentralWork, sendCentralToCandidate
} from '@/app/actions/centralContent';
import { getUsers, getAssemblies } from '@/app/actions/admin';
import { useView } from '@/context/ViewContext';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// --- Helper Component for Media Previews ---
function MediaPreview({ urls, onRemove }: { urls: string, onRemove?: (url: string) => void }) {
    if (!urls) return null;
    const urlList = urls.split(',').map(u => u.trim()).filter(Boolean);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginTop: '12px' }}>
            {urlList.map((url, i) => {
                const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') || url.includes('/video/');
                return (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1', background: '#F8FAFC', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        {isVideo ? (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }} onClick={() => window.open(url, '_blank')}>
                                <Video size={24} color="white" />
                            </div>
                        ) : (
                            <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')} />
                        )}
                        {onRemove && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(url); }}
                                style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255,255,255,0.9)', color: '#EF4444', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function CentralWorkflowView({ lang = 'hi', onBack }: { lang?: string, onBack?: () => void }) {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role;

    const { effectiveWorkerType } = useView();
    const workerType = effectiveWorkerType;

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();



    // Filter Logic and Data
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'TASKS' | 'CREATE' | 'REVIEW' | 'SEND_CANDIDATE'>('TASKS');
    const [selectedTask, setSelectedTask] = useState<any>(null);


    // URL State Sync
    useEffect(() => {
        const v = searchParams.get('v');
        const tid = searchParams.get('tid');

        if (v === 'create') setView('CREATE');
        else if (tid && tasks.length > 0) {
            const found = tasks.find(t => t.id.toString() === tid);
            if (found) {
                setSelectedTask(found);
                setView('TASKS');
            }
        } else {
            setView('TASKS');
            setSelectedTask(null);
        }
    }, [searchParams, tasks]);

    const setUrlState = (v: string | null, tid: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (v) params.set('v', v); else params.delete('v');
        if (tid) params.set('tid', tid); else params.delete('tid');
        router.push(`${pathname}?${params.toString()}`);
    };

    const [newTask, setNewTask] = useState({ title: '', instructions: '', inputMediaUrls: '', designerId: '' });
    const [designerDraft, setDesignerDraft] = useState(''); // Separate state for designer submission
    const [designers, setDesigners] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);

    // Persistence: Save and Load Form Drafts
    useEffect(() => {
        const savedNewTask = localStorage.getItem('draft_new_task');
        if (savedNewTask) try { setNewTask(JSON.parse(savedNewTask)); } catch (e) { }

        const savedDesignerDraft = localStorage.getItem('draft_designer_work');
        if (savedDesignerDraft) setDesignerDraft(savedDesignerDraft);
    }, []);

    useEffect(() => {
        localStorage.setItem('draft_new_task', JSON.stringify(newTask));
    }, [newTask]);

    useEffect(() => {
        localStorage.setItem('draft_designer_work', designerDraft);
    }, [designerDraft]);

    const handleCloudUpload = async (targetField: 'input' | 'output') => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
        input.multiple = true;

        input.onchange = async (e: any) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            setUploading(true);
            try {
                const uploadedUrls: string[] = [];
                for (let i = 0; i < files.length; i++) {
                    const fd = new FormData();
                    fd.append('file', files[i]);
                    const res = await fetch('/api/cloud/upload', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (data.success) uploadedUrls.push(data.url);
                }

                const urlString = uploadedUrls.join(', ');
                if (targetField === 'input') {
                    setNewTask(prev => ({ ...prev, inputMediaUrls: prev.inputMediaUrls ? `${prev.inputMediaUrls}, ${urlString}` : urlString }));
                } else {
                    setDesignerDraft(prev => prev ? `${prev}, ${urlString}` : urlString);
                }
            } catch (err) {
                alert("Upload failed");
            } finally {
                setUploading(false);
            }
        };
        input.click();
    };

    const isDesigner = workerType === 'CENTRAL_DESIGNER' || userRole === 'DESIGNER';
    const isEditor = workerType === 'CENTRAL_EDITOR' || userRole === 'EDITOR';
    const isManager = (workerType === 'CENTRAL_MANAGER' || userRole === 'SM_MANAGER' || userRole === 'ADMIN' || userRole === 'SUPERADMIN') && !isDesigner && !isEditor;
    const isProWorker = isDesigner || isEditor;

    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const filters: any = {};
            // If simulating designer/editor, show their specific tasks. 
            // BUT if superadmin and tasks are empty, maybe show all (for demo)?
            // For now, stick to simulating the actual designer view.
            if (isProWorker) filters.designerId = parseInt((session?.user as any).id);

            console.log("Fetching Central Tasks with filters:", filters);
            const data = await getCentralTasks(filters);
            setTasks(data);

            if (isManager) {
                const [allUsers, allAsms] = await Promise.all([getUsers(), getAssemblies()]);
                setDesigners(allUsers.filter((u: any) =>
                    (u.role === 'SOCIAL_MEDIA' || u.role === 'DESIGNER' || u.role === 'EDITOR') &&
                    (u.worker?.type === 'CENTRAL_DESIGNER' || u.worker?.type === 'CENTRAL_EDITOR' || u.role === 'DESIGNER' || u.role === 'EDITOR')
                ));
                setCandidates(allUsers.filter((u: any) => u.role === 'CANDIDATE').map((u: any) => {
                    const asm = allAsms.find((a: any) => a.id === u.assemblyId);
                    return { ...u, assembly: asm?.name };
                }));
            }
        } catch (e) {
            console.error("Load error in CentralWorkflow:", e);
        }
        setLoading(false);
        setIsInitialLoad(false);
    };

    useEffect(() => {
        if (session?.user) {
            loadData(tasks.length > 0);
        }
    }, [session?.user?.id, workerType]);

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.designerId) return;
        setLoading(true);
        try {
            await createCentralTask({
                ...newTask,
                designerId: parseInt(newTask.designerId)
            });
            setUrlState(null, null);
            loadData();
            setNewTask({ title: '', instructions: '', inputMediaUrls: '', designerId: '' });
            localStorage.removeItem('draft_new_task');
        } catch (e) { alert("Failed to create task"); }
        setLoading(false);
    };

    const handleSubmitWork = async (taskId: number, urls: string) => {
        setLoading(true);
        try {
            await submitCentralWork(taskId, urls);
            loadData();
            setSelectedTask(null);
        } catch (e) { alert("Submission failed"); }
        setLoading(false);
    };

    const handleReviewWork = async (taskId: number, status: any, feedback: string) => {
        setLoading(true);
        try {
            await reviewCentralWork(taskId, status, feedback);
            loadData();
            setUrlState(null, null);
            localStorage.removeItem('draft_designer_work');
            setDesignerDraft('');
        } catch (e) { alert("Review failed"); }
        setLoading(false);
    };

    const handleSendToCandidate = async (taskId: number, candidateId: number) => {
        if (!confirm("क्या आप यह कंटेंट कैंडिडेट को भेजना चाहते हैं?")) return;
        setLoading(true);
        try {
            await sendCentralToCandidate(taskId, candidateId);
            loadData();
            setUrlState(null, null);
        } catch (e) { alert("Send failed"); }
        setLoading(false);
    };

    if (loading && isInitialLoad) {
        return (
            <div style={{ padding: '100px', textAlign: 'center', color: '#94A3B8', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                <Loader2 className="animate-spin" size={48} />
                <div style={{ fontWeight: '900', fontSize: '24px' }}>Loading Workspace...</div>
                <div style={{ fontSize: '14px' }}>Please wait while we sync your tasks</div>
            </div>
        );
    }

    const renderTaskCard = (task: any) => (
        <div key={task.id} onClick={() => setUrlState(null, task.id.toString())} style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{
                    fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '8px',
                    background: task.status.includes('APPROVED') ? '#ECFDF5' :
                        task.status === 'ASSIGNED' ? '#EFF6FF' :
                            task.status === 'SUBMITTED' ? '#FFF7ED' :
                                task.status.includes('REJECTED') ? '#FEF2F2' :
                                    task.status === 'CORRECTION_REQUESTED' ? '#FFFBEB' : '#F1F5F9',
                    color: task.status.includes('APPROVED') ? '#059669' :
                        task.status === 'ASSIGNED' ? '#2563EB' :
                            task.status === 'SUBMITTED' ? '#C2410C' :
                                task.status.includes('REJECTED') ? '#DC2626' :
                                    task.status === 'CORRECTION_REQUESTED' ? '#D97706' : '#475569'
                }}>
                    {task.status === 'CORRECTION_REQUESTED' ? 'सुधार आवश्यक' :
                        task.status === 'REJECTED_BY_MANAGER' ? 'रिजेक्ट किया गया' :
                            task.status === 'SUBMITTED' ? 'रिव्यू हेतु' :
                                task.status.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>{task.title}</h4>
            <p style={{ fontSize: '13px', color: '#64748B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '16px' }}>{task.instructions}</p>

            {task.feedback && (task.status === 'CORRECTION_REQUESTED' || task.status.includes('REJECTED')) && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#FFFBEB', borderRadius: '12px', border: '1px solid #FEF3C7', fontSize: '12px', color: '#92400E' }}>
                    <b>फीडबैक:</b> {task.feedback.length > 80 ? task.feedback.substring(0, 80) + '...' : task.feedback}
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px', borderTop: '1px dashed #F1F5F9', marginTop: task.feedback ? '0' : '16px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F1F5F9' }}>
                    {task.designer?.image ? <img src={task.designer.image} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <User size={14} style={{ margin: '5px' }} />}
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>{task.designer?.name || 'Unassigned'}</span>
            </div>
        </div>
    );



    return (
        <div style={{ background: '#F4F7FE', minHeight: '100vh', width: '100%' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                    .sidebar { display: none !important; }
                    .content { padding: 0 !important; background: #F4F7FE !important; }
                    .main-container { background: #F4F7FE !important; margin-left: 0 !important; width: 100% !important; }
                `
            }} />

            <div style={{ width: '100%', padding: '32px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', marginBottom: '4px' }}>
                            {workerType === 'CENTRAL_DESIGNER' ? 'डिजाइनर वर्कस्पेस' : workerType === 'CENTRAL_EDITOR' ? 'वीडियो एडिटर वर्कस्पेस' : 'सोशल मीडिया कैंडिडेट कंट्रोल'}
                        </h1>
                        <p style={{ color: '#64748B', fontWeight: '600' }}>सेंट्रल सोशल सेना वर्कफ़्लो मैनेजमेंट - <span style={{ color: '#2563EB' }}>LIVE v2.3</span></p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>

                        <button onClick={() => loadData(false)} style={{ padding: '12px 20px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> रिफ्रेश {loading && '...'}
                        </button>
                        {isManager && view === 'TASKS' && !selectedTask && (
                            <button onClick={() => setUrlState('create', null)} style={{ padding: '14px 28px', background: '#2563EB', color: 'white', borderRadius: '16px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(37,99,235,0.2)' }}>
                                <Plus size={20} /> नया काम दें
                            </button>
                        )}
                        {view !== 'TASKS' || selectedTask ? (
                            <button onClick={() => setUrlState(null, null)} style={{ padding: '12px 20px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ArrowLeft size={18} /> वापस (Worklist)
                            </button>
                        ) : (
                            onBack && (
                                <button onClick={onBack} style={{ padding: '12px 20px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ArrowLeft size={18} /> पीछे जाएं
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Unified Dashboard Stats (STRICTLY ONE BLOCK) */}
                {!selectedTask && view === 'TASKS' && (
                    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        {[
                            { label: 'कुल टास्क', value: tasks.length, color: '#2563EB', icon: LayoutDashboard },
                            {
                                label: isManager ? 'रिव्यू के लिए पेंडिंग' : 'मेरे पेंडिंग टास्क',
                                value: tasks.filter(t => isManager ? t.status === 'SUBMITTED' : ['ASSIGNED', 'CORRECTION_REQUESTED', 'REJECTED_BY_MANAGER'].includes(t.status)).length,
                                color: '#C2410C', icon: Clock
                            },
                            {
                                label: isManager ? 'सुधार के लिए भेजा' : 'कैंडिडेट को भेजा',
                                value: tasks.filter(t => isManager ? t.status === 'CORRECTION_REQUESTED' : t.status === 'SUBMITTED').length,
                                color: '#7C3AED', icon: RefreshCw
                            },
                            {
                                label: 'कम्पलीट / अप्रूव्ड',
                                value: tasks.filter(t => t.status.startsWith('APPROVED')).length,
                                color: '#10B981', icon: CheckCircle2
                            },
                        ].map(stat => (
                            <div key={stat.label} style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ color: '#94A3B8' }}><stat.icon size={20} /></div>
                                    <span style={{ fontSize: '28px', fontWeight: '900', color: stat.color }}>{stat.value}</span>
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748B' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Task List and other views */}
                {view === 'TASKS' && !selectedTask && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                        {tasks.length === 0 && !loading && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#94A3B8', background: 'white', borderRadius: '32px', border: '1px dashed #E2E8F0' }}>
                                <Clock size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                <div style={{ fontWeight: '800' }}>कोई काम नहीं मिला</div>
                            </div>
                        )}
                        {tasks.map(renderTaskCard)}
                    </div>
                )}

                {/* CREATE TASK VIEW */}
                {view === 'CREATE' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '32px', border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '32px' }}>नया डिजाइन/एडिट टास्क बनाएं</h2>
                        <div style={{ display: 'grid', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px', color: '#475569' }}>टास्क का नाम</label>
                                <input style={inputStyle} placeholder="Eg: रैली के लिए कोलाज" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px', color: '#475569' }}>निर्देश (Instructions)</label>
                                <textarea style={{ ...inputStyle, minHeight: '120px' }} placeholder="विस्तार से बताएं क्या करना है..." value={newTask.instructions} onChange={e => setNewTask({ ...newTask, instructions: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px', color: '#475569' }}>डिजाइनर/एडिटर चुनें</label>
                                <select style={inputStyle} value={newTask.designerId} onChange={e => setNewTask({ ...newTask, designerId: e.target.value })}>
                                    <option value="">--चुनें--</option>
                                    {designers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.worker?.type === 'CENTRAL_DESIGNER' ? 'Designer' : 'Editor'})</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '8px', color: '#475569' }}>इनपुट फाइलें (Input Files)</label>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleCloudUpload('input')}
                                        disabled={uploading}
                                        style={{ width: '100%', padding: '24px', background: '#F8FAFC', border: '2px dashed #E2E8F0', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                    >
                                        {uploading ? <Loader2 className="animate-spin" size={24} color="#2563EB" /> : <UploadIcon size={24} color="#94A3B8" />}
                                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#64748B' }}>{uploading ? 'अपलोडिंग...' : 'फाइलें चुनें (Photos/Videos)'}</span>
                                    </button>
                                    <MediaPreview
                                        urls={newTask.inputMediaUrls}
                                        onRemove={(url) => setNewTask(prev => ({ ...prev, inputMediaUrls: prev.inputMediaUrls.split(',').map(u => u.trim()).filter(u => u !== url).join(', ') }))}
                                    />
                                </div>
                            </div>
                            <button onClick={handleCreateTask} style={{ marginTop: '12px', padding: '16px', background: '#2563EB', color: 'white', borderRadius: '16px', border: 'none', fontWeight: '900', fontSize: '16px', cursor: 'pointer' }}>असाइन करें</button>
                        </div>
                    </div>
                )}

                {/* TASK DETAIL / REVIEW VIEW */}
                {selectedTask && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
                        <div style={{ background: 'white', padding: '40px', borderRadius: '32px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h2 style={{ fontSize: '28px', fontWeight: '900' }}>{selectedTask.title}</h2>
                                <span style={{ padding: '6px 16px', background: '#F1F5F9', borderRadius: '12px', fontSize: '12px', fontWeight: '900' }}>ID: #{selectedTask.id}</span>
                            </div>

                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>निर्देश और इनपुट</h3>
                                <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
                                    <p style={{ fontSize: '16px', color: '#1E293B', lineHeight: 1.6, marginBottom: '20px' }}>{selectedTask.instructions}</p>
                                    <MediaPreview urls={selectedTask.inputMediaUrls} />


                                </div>
                            </div>

                            {/* Output Area */}
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>डिलीवरी / आउटपुट</h3>
                                {selectedTask.outputMediaUrls ? (
                                    <div style={{ padding: '24px', background: '#F0FDF4', borderRadius: '24px', border: '1px solid #DCFCE7' }}>
                                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#166534', marginBottom: '10px' }}>डिजाइनर का आउटपुट:</div>
                                        <MediaPreview urls={selectedTask.outputMediaUrls} />
                                    </div>
                                ) : (
                                    <div style={{ padding: '40px', textAlign: 'center', background: '#FFF7ED', borderRadius: '24px', border: '1px dashed #FFEDD5', color: '#C2410C', fontWeight: '700' }}>अभी तक कोई फाइल अपलोड नहीं की गई है।</div>
                                )}
                            </div>

                            {isProWorker && (selectedTask.status === 'ASSIGNED' || selectedTask.status === 'CORRECTION_REQUESTED' || selectedTask.status === 'REJECTED_BY_MANAGER') && (
                                <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid #F1F5F9' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '12px' }}>
                                        {selectedTask.status.includes('REJECTED') ? 'नया कोलाज/डिजाइन अपलोड करें (दोबारा प्रयास करें)' : 'तैयार डिजाइन अपलोड करें'}
                                    </label>
                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        <button
                                            onClick={() => handleCloudUpload('output')}
                                            disabled={uploading}
                                            style={{ width: '100%', padding: '24px', background: '#F8FAFC', border: '2px dashed #E2E8F0', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                        >
                                            {uploading ? <Loader2 className="animate-spin" size={24} color="#2563EB" /> : <UploadIcon size={24} color="#94A3B8" />}
                                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#64748B' }}>{uploading ? 'अपलोडिंग...' : 'फाइल चुनें (Output File)'}</span>
                                        </button>

                                        <MediaPreview
                                            urls={designerDraft}
                                            onRemove={(url) => setDesignerDraft(prev => prev.split(',').map(u => u.trim()).filter(u => u !== url).join(', '))}
                                        />

                                        <button onClick={() => {
                                            if (designerDraft) handleSubmitWork(selectedTask.id, designerDraft);
                                        }} disabled={!designerDraft} style={{ padding: '18px', background: designerDraft ? '#22C55E' : '#94A3B8', color: 'white', borderRadius: '16px', border: 'none', fontWeight: '900', cursor: designerDraft ? 'pointer' : 'default', fontSize: '16px' }}>
                                            {lang === 'hi' ? 'कैंडिडेट को रिव्यू हेतु भेजें' : 'Send to Manager for Review'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Manager Controls: Review & Send to Candidate */}
                            {isManager && selectedTask.status === 'SUBMITTED' && (
                                <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid #F1F5F9' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '20px' }}>क्वालिटी चेक (Review)</h3>
                                    <textarea id="review-feedback" style={{ ...inputStyle, minHeight: '100px', marginBottom: '20px' }} placeholder="सुधार या रिजेक्शन का कारण लिखें (optional)..." />
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => {
                                            const fb = (document.getElementById('review-feedback') as HTMLTextAreaElement).value;
                                            handleReviewWork(selectedTask.id, 'APPROVED_BY_MANAGER', fb);
                                        }} style={{ flex: 1, padding: '16px', background: '#10B981', color: 'white', borderRadius: '16px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>सही है (Approve)</button>
                                        <button onClick={() => {
                                            const fb = (document.getElementById('review-feedback') as HTMLTextAreaElement).value;
                                            handleReviewWork(selectedTask.id, 'CORRECTION_REQUESTED', fb);
                                        }} style={{ flex: 1, padding: '16px', background: '#F59E0B', color: 'white', borderRadius: '16px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>सुधार करें (Correction)</button>
                                        <button onClick={() => {
                                            const fb = (document.getElementById('review-feedback') as HTMLTextAreaElement).value;
                                            handleReviewWork(selectedTask.id, 'REJECTED_BY_MANAGER', fb);
                                        }} style={{ flex: 1, padding: '16px', background: '#EF4444', color: 'white', borderRadius: '16px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>रिजेक्ट (Reject)</button>
                                    </div>
                                </div>
                            )}

                            {/* Manager Controls: Send to Candidate */}
                            {isManager && selectedTask.status === 'APPROVED_BY_MANAGER' && (
                                <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid #F1F5F9' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Share2 size={24} color="#2563EB" /> कैंडिडेट को भेजें (Send to Candidate)
                                    </h3>
                                    <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                                        <div style={{ position: 'relative', marginBottom: '24px' }}>
                                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: '#94A3B8' }} />
                                            <input style={{ ...inputStyle, paddingLeft: '48px' }} placeholder="कैंडिडेट का नाम सर्च करें..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                        </div>
                                        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'grid', gap: '12px' }}>
                                            {candidates.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                                                <div key={c.id} onClick={() => handleSendToCandidate(selectedTask.id, c.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9' }}>
                                                            {c.image ? <img src={c.image} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <User size={18} style={{ margin: '9px' }} />}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '800', fontSize: '14px' }}>{c.name}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748B' }}>{c.assembly} • ID: {c.id}</div>
                                                        </div>
                                                    </div>
                                                    <button style={{ padding: '6px 14px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '900' }}>चुनें (Select)</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Logs / Meta Dashboard */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>टास्क हिस्ट्री</h3>
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {selectedTask.feedback && (
                                        <div style={{ padding: '16px', background: '#FFFBEB', borderRadius: '16px', border: '1px solid #FEF3C7' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#D97706', marginBottom: '4px' }}>
                                                {selectedTask.status.includes('CANDIDATE') ? 'कैंडिडेट का फीडबैक:' : 'कैंडिडेट का फीडबैक:'}
                                            </div>
                                            <p style={{ fontSize: '13px', color: '#92400E' }}>{selectedTask.feedback}</p>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                                        <Clock size={16} color="#94A3B8" />
                                        <span style={{ color: '#64748B' }}>तैयार किया गया: <b>{new Date(selectedTask.createdAt).toLocaleString()}</b></span>
                                    </div>
                                    {selectedTask.updatedAt !== selectedTask.createdAt && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                                            <RefreshCw size={16} color="#94A3B8" />
                                            <span style={{ color: '#64748B' }}>अंतिम अपडेट: <b>{new Date(selectedTask.updatedAt).toLocaleString()}</b></span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                                        <User size={16} color="#94A3B8" />
                                        <span style={{ color: '#64748B' }}>कैंडिडेट: <b>{selectedTask.manager?.name}</b></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    background: '#F8FAFC',
    fontSize: '14px',
    fontWeight: '700',
    outline: 'none',
    transition: 'border 0.2s',
    '::placeholder': { color: '#CBD5E1' }
} as any;
