/*
 * 🔒 LOCKED BY USER
 * -------------------------------------------------------------------------
 * This file is considered STABLE and LOCKED.
 * DO NOT MODIFY this file without explicit permission from the user.
 * -------------------------------------------------------------------------
 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import { Search, Filter, Users, MapPin, Phone, MessageSquare, Save, X, ChevronDown, ChevronUp, Edit2, User, Home, Eye, UserPlus, Trash, UserMinus, Loader2, Printer, Activity, Flag, Tent, FileBox, ShieldCheck, Star, Vote, LayoutDashboard, Share2, Handshake, Settings, Megaphone, BarChart3, ListTodo, AlertTriangle, BookOpen, Shield, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLayout } from '@/context/LayoutContext';

interface SidebarProps {
    candidateName?: string;
    candidateImageUrl?: string | null;
    partyLogoUrl?: string | null;
    realUserName?: string;
    realUserImage?: string | null;
    isWorker?: boolean;
}

const Sidebar = ({ candidateName, candidateImageUrl, partyLogoUrl, realUserName, realUserImage, isWorker }: SidebarProps) => {
    const pathname = usePathname();
    const { data: session }: any = useSession();
    const { effectiveRole, effectiveWorkerType, simulationPersona, setEffectiveRole } = useView();

    const [lang, setLang] = useState('hi');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('app_lang');
            if (stored) setLang(stored);
        }
    }, []);

    const realRole = session?.user?.role || 'CANDIDATE';
    const isActuallyGlobal = realRole === 'ADMIN' || realRole === 'SUPERADMIN';
    const role = effectiveRole || realRole;
    const workerType = effectiveWorkerType || session?.user?.workerType;
    const isSimulatingActive = (effectiveRole && effectiveRole !== realRole) || !!simulationPersona;
    const isGlobal = (role === 'ADMIN' || role === 'SUPERADMIN') && !isSimulatingActive;

    // Profile Info (The person currently logged in - ALWAYS show real user details for Admin/SuperAdmin)
    // For Candidates, we prioritize the candidateName prop which reflects the Assembly branding
    // Update: If it's a real WORKER login, show their real name instead of Candidate branding
    const userName = isActuallyGlobal
        ? (realUserName || session?.user?.name || (realRole === 'SUPERADMIN' ? 'सर्वेसर्वा' : 'एडमिन'))
        : (simulationPersona?.name || (isWorker ? realUserName : (candidateName || realUserName)) || session?.user?.name || (role === 'CANDIDATE' ? 'कैंडिडेट दृश्य' : (role === 'WORKER' ? 'कार्यकर्ता दृश्य' : 'सिमुलेशन दृश्य')));

    const userImage = isActuallyGlobal
        ? (realUserImage || session?.user?.image)
        : (simulationPersona?.image || (isWorker ? realUserImage : (candidateImageUrl || realUserImage)) || session?.user?.image);

    const getMenuItems = () => {
        // Core Admin View (Switching to other views via Header View Switcher)
        if (role === 'SUPERADMIN' || role === 'ADMIN') {
            return [
                { name: lang === 'hi' ? 'कंट्रोल हाउस' : 'Control House', path: '/admin', icon: Activity },
                { name: lang === 'hi' ? 'प्रत्याशी और टीमें' : 'Candidates & Teams', path: '/admin/candidates', icon: Star },
                { name: lang === 'hi' ? 'यूजर मास्टर' : 'User Master', path: '/admin/users', icon: Users },
                { name: lang === 'hi' ? 'विधानसभा प्रबंधन' : 'Assembly Management', path: '/admin/assemblies', icon: Tent },
                { name: lang === 'hi' ? 'पार्टी प्रबंधन' : 'Party Management', path: '/admin/parties', icon: Flag },
                { name: lang === 'hi' ? 'मतदाता मास्टर डेटा' : 'Voter Master Data', path: '/admin/voters', icon: Vote },
                { name: lang === 'hi' ? 'निर्वाचन आयोग अपडेट' : 'ECI Updates', path: '/eci-updates', icon: ShieldCheck },
                { name: lang === 'hi' ? 'मतदान वार रूम' : 'War Room (LIVE)', path: '/poll-day', icon: Zap },
                { name: lang === 'hi' ? 'सिस्टम लॉग्स' : 'System Logs', path: '/admin/logs', icon: Activity },
                { name: lang === 'hi' ? 'प्रोफाइल सेटिंग' : 'Profile Settings', path: '/profile', icon: Settings },
            ];
        }

        if (role === 'CANDIDATE') {
            return [
                { name: lang === 'hi' ? 'प्रत्याशी डैशबोर्ड' : 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: lang === 'hi' ? 'मतदाता सूची' : 'Voter List', path: '/voters', icon: Vote },
                { name: lang === 'hi' ? 'निर्वाचन आयोग अपडेट' : 'ECI Updates', path: '/eci-updates', icon: ShieldCheck },
                { name: lang === 'hi' ? 'बूथ प्रबंधन' : 'Booth Management', path: '/booths', icon: Tent },
                { name: lang === 'hi' ? 'कार्यकर्ता और टीम' : 'Workers & Team', path: '/workers', icon: Users },
                { name: lang === 'hi' ? 'कार्य प्रबंधन' : 'Task Management', path: '/tasks', icon: ListTodo },
                { name: lang === 'hi' ? 'समस्याएं' : 'Issues', path: '/issues', icon: AlertTriangle },
                { name: lang === 'hi' ? 'जनसंपर्क' : 'Public Relations', path: '/jansampark', icon: Handshake },
                { name: lang === 'hi' ? 'मतदान वार रूम' : 'War Room (LIVE)', path: '/poll-day', icon: Zap },
                { name: lang === 'hi' ? 'सेटिंग्स और ब्रांडिंग' : 'Settings & Branding', path: '/settings', icon: Settings },
            ];
        }

        // BOOTH MANAGER (Worker with type BOOTH_MANAGER)
        if (role === 'WORKER' && workerType === 'BOOTH_MANAGER') {
            return [
                { name: lang === 'hi' ? 'बूथ डैशबोर्ड' : 'Booth Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: lang === 'hi' ? 'मतदाता सूची' : 'My Booth Voters', path: '/voters', icon: Vote },
                { name: lang === 'hi' ? 'जनसंपर्क' : 'Public Relations', path: '/jansampark', icon: Handshake },
                { name: lang === 'hi' ? 'बूथ कार्यकर्ता' : 'Booth Workers', path: '/workers', icon: Users },
                { name: lang === 'hi' ? 'मेरे कार्य' : 'My Tasks', path: '/worker/tasks', icon: ListTodo },
                { name: lang === 'hi' ? 'समस्या रिपोर्ट' : 'Report Issue', path: '/issues', icon: AlertTriangle },
                { name: lang === 'hi' ? 'मतदान वार रूम' : 'War Room (LIVE)', path: '/poll-day', icon: Zap },
                { name: lang === 'hi' ? 'प्रोफाइल सेटिंग' : 'Profile Settings', path: '/profile', icon: Settings },
            ];
        }

        // PANNA PRAMUKH (Worker with type PANNA_PRAMUKH)
        if (role === 'WORKER' && workerType === 'PANNA_PRAMUKH') {
            return [
                { name: lang === 'hi' ? 'पन्ना डैशबोर्ड' : 'Page Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: lang === 'hi' ? 'आपका पन्ना' : 'Your Panna', path: '/voters?filter=my-panna', icon: BookOpen },
                { name: lang === 'hi' ? 'मतदाता सूची' : 'Booth Voters', path: '/voters', icon: Users },
                { name: lang === 'hi' ? 'जनसंपर्क' : 'PR Entry', path: '/jansampark', icon: Handshake },
                { name: lang === 'hi' ? 'मेरे कार्य' : 'Tasks', path: '/worker/tasks', icon: ListTodo },
                { name: lang === 'hi' ? 'मतदान वार रूम' : 'War Room (LIVE)', path: '/poll-day', icon: Zap },
                { name: lang === 'hi' ? 'समस्या दर्ज करें' : 'Help/Issue', path: '/issues', icon: AlertTriangle },
                { name: lang === 'hi' ? 'प्रोफाइल सेटिंग' : 'Profile Settings', path: '/profile', icon: Settings },
            ];
        }

        // FIELD WORKER / GROUND WORKER (Worker with type FIELD or GROUND)
        if (role === 'WORKER' && (workerType === 'FIELD' || workerType === 'GROUND')) {
            return [
                { name: lang === 'hi' ? 'कार्यकर्ता डैशबोर्ड' : 'Ground Worker Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: lang === 'hi' ? 'मतदाता सूची' : 'Voter List', path: '/voters', icon: Users },
                { name: lang === 'hi' ? 'जनसंपर्क' : 'PR Entry', path: '/jansampark', icon: Handshake },
                { name: lang === 'hi' ? 'मेरे कार्य' : 'My Tasks', path: '/worker/tasks', icon: ListTodo },
                { name: lang === 'hi' ? 'मतदान वार रूम' : 'War Room (LIVE)', path: '/poll-day', icon: Zap },
                { name: lang === 'hi' ? 'समस्या दर्ज करें' : 'Report Issue', path: '/issues', icon: AlertTriangle },
                { name: lang === 'hi' ? 'प्रोफाइल सेटिंग' : 'Profile Settings', path: '/profile', icon: Settings },
            ];
        }

        // Generic fallback for WORKER (if no workerType)
        if (role === 'WORKER') {
            return [
                { name: lang === 'hi' ? 'कार्यकर्ता डैशबोर्ड' : 'Worker Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: lang === 'hi' ? 'मतदाता सूची' : 'Voter List', path: '/voters', icon: Vote },
                { name: lang === 'hi' ? 'जनसंपर्क' : 'PR Entry', path: '/jansampark', icon: Handshake },
                { name: lang === 'hi' ? 'मेरे कार्य' : 'My Tasks', path: '/worker/tasks', icon: ListTodo },
                { name: lang === 'hi' ? 'समस्या दर्ज करें' : 'Report Issue', path: '/issues', icon: AlertTriangle },
                { name: lang === 'hi' ? 'मतदान वार रूम' : 'War Room (LIVE)', path: '/poll-day', icon: Zap },
                { name: lang === 'hi' ? 'प्रोफाइल सेटिंग' : 'Profile Settings', path: '/profile', icon: Settings },
            ];
        }

        return [];
    };

    const searchParams = useSearchParams();
    const { isSidebarOpen, isSidebarCollapsed: layoutCollapsed, toggleCollapse, toggleSidebar, closeSidebar } = useLayout();
    const currentMenu = getMenuItems();

    // On mobile, never treat it as collapsed internally (always show branding/text when open)
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const isSidebarCollapsed = isMobile ? !isSidebarOpen : layoutCollapsed;
    const isSocialCentral = (workerType === 'SOCIAL_CENTRAL' || workerType?.startsWith('CENTRAL_'));

    if (pathname.startsWith('/social-sena') && role === 'SOCIAL_MEDIA' && isSocialCentral) {
        return null;
    }

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={`sidebar-backdrop ${isSidebarOpen ? 'visible' : ''}`}
                onClick={closeSidebar}
            />

            <div className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Collapse Toggle Button (Desktop) */}
                <button
                    onClick={() => isMobile ? toggleSidebar() : toggleCollapse()}
                    style={{
                        position: 'absolute',
                        right: '-12px',
                        top: '40px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        zIndex: 101,
                        color: '#64748B'
                    }}
                >
                    {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
                {/* Mobile Close Button */}
                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'none' }} className="mobile-close-btn">
                    <button onClick={closeSidebar} style={{ background: 'transparent', border: 'none', color: '#64748B' }}>
                        <X size={24} />
                    </button>
                </div>
                <style jsx>{`
                    @media (max-width: 768px) {
                        .mobile-close-btn { 
                            display: block !important; 
                            z-index: 10000;
                            cursor: pointer;
                        }
                    }
                `}</style>

                <div style={{ padding: isSidebarCollapsed ? '20px 8px' : '24px 24px 0', textAlign: 'center', transition: 'all 0.3s' }}>
                    <img
                        src={isSidebarCollapsed ? "/icon.png" : "/logo.png?v=2"}
                        alt="Voteraction Logo"
                        style={{
                            height: isSidebarCollapsed ? '32px' : '60px',
                            width: 'auto',
                            filter: isSidebarCollapsed ? 'none' : 'drop-shadow(0 4px 15px rgba(0,0,0,0.8))',
                            transition: 'all 0.3s'
                        }}
                    />
                </div>
                {!isSidebarCollapsed && (
                    <div className="sidebar-brand" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '24px',
                                background: '#F1F5F9',
                                border: '2px solid var(--primary-bg)',
                                overflow: 'hidden',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s'
                            }}>
                                {userImage ? (
                                    <img src={userImage} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : isActuallyGlobal ? (
                                    <Shield size={40} color="var(--primary-bg)" />
                                ) : (
                                    <Users size={40} color="var(--primary-bg)" />
                                )}
                            </div>
                            {role !== 'ADMIN' && role !== 'SUPERADMIN' && partyLogoUrl && (
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    marginTop: '-34px',
                                    marginLeft: '54px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    padding: '4px',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                                    zIndex: 1
                                }}>
                                    <img src={partyLogoUrl} alt="Party" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                            )}
                            <div className="sidebar-brand-text" style={{ marginTop: (isGlobal || !partyLogoUrl) ? '0' : '12px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B', marginBottom: '2px' }} className="sidebar-brand-text">
                                    {userName}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', letterSpacing: '0.05em' }} className="sidebar-brand-text">
                                    {effectiveRole === 'SOCIAL_MEDIA' ? 'सोशल सेना' : (isGlobal ? 'सिस्टम एडमिन' : 'कैंडिडेट')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="sidebar-menu" style={{ padding: '0 16px' }}>
                    {currentMenu.map((item) => {
                        const Icon = item.icon as any;
                        // Better Active Logic:
                        // 1. If item has query params, check both pathname and search params
                        // 2. Otherwise just check pathname startsWith
                        let isActive = false;
                        if (item.path.includes('?')) {
                            const [p, q] = item.path.split('?');
                            const params = new URLSearchParams(q);
                            const filterParam = params.get('filter');
                            isActive = pathname === p && searchParams.get('filter') === filterParam;
                        } else {
                            // Categorized active logic for Candidates vs General Users
                            if (item.path === '/admin/candidates') {
                                isActive = pathname.startsWith('/admin/candidates') ||
                                    (pathname === '/admin/users' && !!searchParams.get('assembly'));
                            } else if (item.path === '/admin/users') {
                                isActive = pathname === '/admin/users' && !searchParams.get('assembly');
                            } else if (item.path === '/admin') {
                                isActive = pathname === '/admin';
                            } else if (item.path === '/dashboard') {
                                isActive = pathname === '/dashboard';
                            } else if (item.path === '/social-team') {
                                isActive = pathname === '/social-team';
                            } else {
                                // For others, check if it's the exact path or a subpath
                                // For /voters, ensure no filter param is present if the item doesn't have one
                                const isBasePath = pathname === item.path;
                                const isSubPath = item.path !== '/' && pathname.startsWith(item.path + '/');
                                if (item.path === '/voters') {
                                    isActive = isBasePath && !searchParams.get('filter');
                                } else {
                                    isActive = isBasePath || isSubPath;
                                }
                            }
                        }

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`menu-item ${isActive ? 'active' : ''}`}
                                title={isSidebarCollapsed ? item.name : ''}
                            >
                                <Icon size={20} className="menu-icon" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Footer Controls (View Switcher & Language) */}
                {!isSidebarCollapsed && (
                    <div style={{ padding: '16px', borderTop: '1px solid #E2E8F0', marginTop: 'auto' }}>
                        {/* Language Toggle */}
                        <div style={{ display: 'flex', marginBottom: '16px', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
                                <button
                                    suppressHydrationWarning
                                    onClick={() => {
                                        localStorage.setItem('app_lang', 'hi');
                                        setLang('hi');
                                        window.location.reload();
                                    }}
                                    style={{
                                        padding: '6px 16px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: (mounted && lang !== 'en') ? 'white' : 'transparent',
                                        color: (mounted && lang !== 'en') ? '#1E293B' : '#64748B',
                                        boxShadow: (mounted && lang !== 'en') ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >हिंदी</button>
                                <button
                                    suppressHydrationWarning
                                    onClick={() => {
                                        localStorage.setItem('app_lang', 'en');
                                        setLang('en');
                                        window.location.reload();
                                    }}
                                    style={{
                                        padding: '6px 16px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: (mounted && lang === 'en') ? 'white' : 'transparent',
                                        color: (mounted && lang === 'en') ? '#1E293B' : '#64748B',
                                        boxShadow: (mounted && lang === 'en') ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >English</button>
                            </div>
                        </div>

                        {/* View Switching UI removed as it is now in a global floating button for Super Admins */}
                    </div>
                )}
            </div >
        </>
    );
};


export default Sidebar;
