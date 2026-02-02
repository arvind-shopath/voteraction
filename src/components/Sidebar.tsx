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
import {
    LayoutDashboard,
    Users,
    Tent,
    AlertTriangle,
    Vote,
    FileBox,
    Settings,
    ListTodo,
    Shield,
    Handshake,
    Activity,
    Share2,
    Monitor,
    Flag,
    BookOpen,
    Megaphone,
    X,
    BarChart3,
    MapPin,
    ShieldCheck,
    Star
} from 'lucide-react';
import { useLayout } from '@/context/LayoutContext';

interface SidebarProps {
    candidateName?: string;
    candidateImageUrl?: string | null;
    partyLogoUrl?: string | null;
}

const Sidebar = ({ candidateName, candidateImageUrl, partyLogoUrl }: SidebarProps) => {
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

    const realRole = session?.user?.role || 'MANAGER';
    const role = effectiveRole || realRole;
    const workerType = effectiveWorkerType || session?.user?.workerType;
    const isGlobal = (role === 'ADMIN' || role === 'SUPERADMIN') && !effectiveRole;

    // Branding Logic
    const isSimulatingActive = (effectiveRole && effectiveRole !== realRole) || !!simulationPersona;
    const userName = simulationPersona?.name || (isSimulatingActive
        ? (role === 'MANAGER' ? 'कैंडिडेट दृश्य' : (role === 'WORKER' ? 'कार्यकर्ता दृश्य' : 'सिमुलेशन दृश्य'))
        : (session?.user?.name || candidateName || 'यूजर'));
    const userImage = simulationPersona?.image || session?.user?.image || candidateImageUrl;

    const getMenuItems = () => {
        // Core Admin View (Switching to other views via Header View Switcher)
        if (role === 'SUPERADMIN' || role === 'ADMIN') {
            return [
                { name: lang === 'hi' ? 'कंट्रोल हाउस' : 'Control House', path: '/admin', icon: Activity },
                // Admin no longer sees "User Dashboard" link here to avoid confusion
                { name: lang === 'hi' ? 'कैंडिडेट्स (Teams)' : 'Candidates (Teams)', path: '/admin/candidates', icon: Star },
                { name: lang === 'hi' ? 'यूजर मास्टर' : 'User Master', path: '/admin/users', icon: Users },
                { name: lang === 'hi' ? 'विधानसभा मैनेजमेंट' : 'Assembly Management', path: '/admin/assemblies', icon: Tent },
                { name: lang === 'hi' ? 'पार्टी मैनेजमेंट' : 'Party Management', path: '/admin/parties', icon: Flag },
                { name: lang === 'hi' ? 'मतदाता मास्टर डेटा' : 'Voter Master Data', path: '/admin/voters', icon: Vote },
                { name: lang === 'hi' ? 'डेटा इम्पॉर्ट' : 'Data Import', path: '/voters/import', icon: FileBox },
                { name: lang === 'hi' ? 'सोशल पैनल' : 'Social Panel', path: '/social-team', icon: ShieldCheck },
                { name: lang === 'hi' ? 'सिस्टम ऑडिट लॉग्स' : 'System Logs', path: '/admin/logs', icon: Activity },
            ];
        }

        if (role === 'MANAGER') {
            return [
                { name: lang === 'hi' ? 'कैंडिडेट डैशबोर्ड' : 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: lang === 'hi' ? 'मतदाता सूची' : 'Voter List', path: '/voters', icon: Vote },
                { name: lang === 'hi' ? 'बूथ प्रबंधन' : 'Booth Management', path: '/booths', icon: Tent },
                { name: lang === 'hi' ? 'कार्यकर्ता & टीम' : 'Workers & Team', path: '/workers', icon: Users },
                { name: lang === 'hi' ? 'टास्क मैनेजमेंट' : 'Task Management', path: '/tasks', icon: ListTodo },
                { name: lang === 'hi' ? 'समस्याएं (Issues)' : 'Issues', path: '/issues', icon: AlertTriangle },
                { name: lang === 'hi' ? 'सोशल मीडिया' : 'Social Media', path: '/social', icon: Share2 },
                { name: lang === 'hi' ? 'जनसंपर्क (PR)' : 'Public Relations', path: '/jansampark', icon: Handshake },
                { name: lang === 'hi' ? 'सेटिंग्स & ब्रांडिंग' : 'Settings & Branding', path: '/settings', icon: Settings },
            ];
        }

        // BOOTH MANAGER (Worker with type BOOTH_MANAGER)
        if (role === 'WORKER' && workerType === 'BOOTH_MANAGER') {
            return [
                { name: lang === 'hi' ? 'बूथ डैशबोर्ड' : 'Booth Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: lang === 'hi' ? 'मेरे बूथ के मतदाता' : 'My Booth Voters', path: '/voters', icon: Vote },
                { name: lang === 'hi' ? 'जनसंपर्क (Route)' : 'Public Relations', path: '/jansampark', icon: Handshake },
                { name: lang === 'hi' ? 'बूथ कार्यकर्ता' : 'Booth Workers', path: '/workers', icon: Users },
                { name: lang === 'hi' ? 'मेरे टास्क (Tasks)' : 'My Tasks', path: '/worker/tasks', icon: ListTodo },
                { name: lang === 'hi' ? 'समस्या रिपोर्ट' : 'Report Issue', path: '/issues', icon: AlertTriangle },
                { name: lang === 'hi' ? 'प्रचार सामग्री' : 'Campaign Material', path: '/social/materials', icon: Megaphone },
            ];
        }

        // PANNA PRAMUKH (Worker with type PANNA_PRAMUKH)
        if (role === 'WORKER' && workerType === 'PANNA_PRAMUKH') {
            return [
                { name: lang === 'hi' ? 'पन्ना डैशबोर्ड' : 'Page Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: lang === 'hi' ? 'मेरे बूथ के मतदाता' : 'Booth Voters', path: '/voters', icon: Users },
                { name: lang === 'hi' ? 'आपका पन्ना' : 'Your Panna', path: '/voters?filter=my-panna', icon: BookOpen },
                { name: lang === 'hi' ? 'जनसंपर्क (Route)' : 'PR Entry', path: '/jansampark', icon: Handshake },
                { name: lang === 'hi' ? 'टास्क (Tasks)' : 'Tasks', path: '/worker/tasks', icon: ListTodo },
                { name: lang === 'hi' ? 'प्रचार सामग्री' : 'Campaign Material', path: '/social/materials', icon: Megaphone },
                { name: lang === 'hi' ? 'मदद/समस्या' : 'Help/Issue', path: '/issues', icon: AlertTriangle },
            ];
        }

        // FIELD WORKER / GROUND WORKER (Worker with type FIELD)
        if (role === 'WORKER' && workerType === 'FIELD') {
            return [
                { name: lang === 'hi' ? 'ग्राउंड वर्कर डैशबोर्ड' : 'Ground Worker Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: lang === 'hi' ? 'मतदाता सूची' : 'Voter List', path: '/voters', icon: Users },
                { name: lang === 'hi' ? 'जनसंपर्क एंट्री' : 'PR Entry', path: '/jansampark', icon: Handshake },
                { name: lang === 'hi' ? 'मेरे टास्क (Tasks)' : 'My Tasks', path: '/worker/tasks', icon: ListTodo },
                { name: lang === 'hi' ? 'प्रचार सामग्री' : 'Campaign Material', path: '/social/materials', icon: Megaphone },
                { name: lang === 'hi' ? 'समस्या दर्ज करें' : 'Report Issue', path: '/issues', icon: AlertTriangle },
            ];
        }

        if (role === 'SOCIAL_MEDIA') {
            const isCentral = workerType === 'SOCIAL_CENTRAL' || workerType?.startsWith('CENTRAL_');
            if (isCentral) {
                return [
                    { name: lang === 'hi' ? 'सेंट्रल पैनल' : 'Central Panel', path: '/social-team', icon: ShieldCheck },
                    { name: lang === 'hi' ? 'एनालिटिक्स' : 'Analytics', path: '/social/analytics', icon: BarChart3 },
                ];
            }
            return [
                { name: lang === 'hi' ? 'कंटेंट डैशबोर्ड' : 'Content Dashboard', path: '/social/local-team', icon: LayoutDashboard },
                { name: lang === 'hi' ? 'प्रचार सामग्री' : 'Campaign Material', path: '/social/materials', icon: Megaphone },
                { name: lang === 'hi' ? 'एनालिटिक्स' : 'Analytics', path: '/social/analytics', icon: BarChart3 },
            ];
        }

        // Generic fallback for WORKER (if no workerType)
        if (role === 'WORKER') {
            return [
                { name: lang === 'hi' ? 'कार्यकर्ता डैशबोर्ड' : 'Worker Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: lang === 'hi' ? 'मतदाता सूची' : 'Voter List', path: '/voters', icon: Vote },
                { name: lang === 'hi' ? 'जनसंपर्क एंट्री' : 'PR Entry', path: '/jansampark', icon: Handshake },
                { name: lang === 'hi' ? 'मेरे टास्क (Tasks)' : 'My Tasks', path: '/worker/tasks', icon: ListTodo },
                { name: lang === 'hi' ? 'प्रचार सामग्री' : 'Campaign Material', path: '/social/materials', icon: Megaphone },
                { name: lang === 'hi' ? 'समस्या दर्ज करें' : 'Report Issue', path: '/issues', icon: AlertTriangle },
            ];
        }

        return [];
    };

    const searchParams = useSearchParams();
    const { isSidebarOpen, closeSidebar } = useLayout();
    const currentMenu = getMenuItems();

    if (pathname === '/social-team' && role === 'SOCIAL_MEDIA' && (workerType === 'SOCIAL_CENTRAL' || workerType?.startsWith('CENTRAL_'))) {
        return null;
    }

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={`sidebar-backdrop ${isSidebarOpen ? 'visible' : ''}`}
                onClick={closeSidebar}
            />

            <div className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`} style={{ color: 'white' }}>
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

                <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
                    <img src="/logo.png" alt="Voteraction Logo" style={{ height: '32px', width: 'auto' }} />
                </div>
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
                            justifyContent: 'center'
                        }}>
                            {isGlobal ? (
                                <Shield size={40} color="var(--primary-bg)" />
                            ) : userImage ? (
                                <img src={userImage} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                        <div style={{ marginTop: (isGlobal || !partyLogoUrl) ? '0' : '12px' }}>
                            <div style={{ fontSize: '18px', fontWeight: '900', lineHeight: 1.2 }}>
                                {role === 'SUPERADMIN' ? (lang === 'hi' ? 'सर्वेसर्वा' : 'Super Admin') : role === 'ADMIN' ? (lang === 'hi' ? 'एडमिन पोर्टल' : 'Admin Portal') : userName}
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>
                                {role.replace('_', ' ')} {lang === 'hi' ? 'कंट्रोल' : 'CONTROL'}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '16px 24px', margin: '0 16px', borderRadius: '12px', fontSize: '12px', marginBottom: '24px', border: '1px solid var(--primary-bg)', background: 'transparent' }}>
                    <div style={{ color: '#64748B', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{lang === 'hi' ? 'अनुभाग:' : 'Section:'}</span>
                        <span style={{ color: 'var(--primary-bg)', fontWeight: '800' }}>{isGlobal ? (lang === 'hi' ? 'संपूर्ण मैनेजमेंट' : 'Global Admin') : (lang === 'hi' ? '2026 चुनाव' : '2026 Election')}</span>
                    </div>
                    <div style={{ color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{lang === 'hi' ? 'प्राथमिकता:' : 'Priority:'}</span>
                        <span style={{ color: '#10B981', fontWeight: '800' }}>{lang === 'hi' ? 'उच्च' : 'High'}</span>
                    </div>
                </div>

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
                            } else if (item.path === '/admin' || item.path === '/dashboard' || item.path === '/social-team') {
                                isActive = pathname === item.path;
                            } else {
                                // For others, check if it's the exact path or a subpath
                                isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path + '/'));
                            }
                        }

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`menu-item ${isActive ? 'active' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    marginBottom: '4px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={20} className="menu-icon" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Footer Controls (View Switcher & Language) */}
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
            </div>
        </>
    );
};


export default Sidebar;
