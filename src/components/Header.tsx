'use client';

import React from 'react';
import { LogOut, User, Search, Bell, Menu, Smartphone } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import { getNotifications, markAllAsRead } from '@/app/actions/notifications';
import { useLayout } from '@/context/LayoutContext';
import { getAppEnvironment } from '@/lib/app-utils';
import Link from 'next/link';

interface HeaderProps {
    candidateName?: string;
    candidateImageUrl?: string | null;
}

const Header = ({ candidateName, candidateImageUrl }: HeaderProps) => {
    const { data: session }: any = useSession();
    const { effectiveRole, effectiveWorkerType, setEffectiveRole, isSimulating, simulationPersona } = useView();
    const { toggleSidebar } = useLayout();
    const [unreadCount, setUnreadCount] = React.useState(0);

    const loadUnread = async () => {
        if (!session?.user) return;
        const user = session.user as any;
        const items = await getNotifications(user.id, user.assemblyId);
        setUnreadCount(items.filter((i: any) => !i.isRead).length);
    };

    React.useEffect(() => {
        loadUnread();
        const interval = setInterval(loadUnread, 60000); // 60s polling
        return () => clearInterval(interval);
    }, [session]);

    const userRole = session?.user?.role || 'CANDIDATE';
    const workerType = effectiveWorkerType || session?.user?.workerType;
    const isCentralSocial = effectiveRole === 'SOCIAL_MEDIA' && (workerType === 'SOCIAL_CENTRAL' || workerType?.startsWith('CENTRAL_'));

    const centralRoleName = workerType === 'CENTRAL_MANAGER' ? 'सोशल सेना कैंडिडेट' :
        workerType === 'CENTRAL_DESIGNER' ? 'सोशल सेना डिजाइनर' :
            workerType === 'CENTRAL_EDITOR' ? 'सोशल सेना वीडियो एडिटर' :
                workerType === 'CENTRAL_MONITOR' ? 'सोशल सेना मॉनिटर' : 'सोशल सेना सदस्य';

    const userName = simulationPersona?.name || session?.user?.name || candidateName || 'यूजर';
    const userImage = simulationPersona?.image || session?.user?.image || candidateImageUrl;

    const effectiveRoleToUse = effectiveRole || userRole;
    const isSimulatingActive = isSimulating;

    const isGlobal = effectiveRoleToUse === 'ADMIN' || effectiveRoleToUse === 'SUPERADMIN';

    // Display actual user name
    const displayName = userName;

    // Display role/designation
    const displaySub = isCentralSocial ? centralRoleName : (isSimulatingActive
        ? (effectiveRoleToUse === 'CANDIDATE' ? 'कैंडिडेट डैशबोर्ड' : 'कार्यकर्ता दृश्य')
        : (isGlobal ? 'सेंट्रल कंट्रोलर' : 'विधानसभा डैशबोर्ड'));

    const [isMobile, setIsMobile] = React.useState(false);
    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <header className="header" style={{ padding: isMobile ? '12px 16px' : '12px 32px', background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
                <button
                    onClick={toggleSidebar}
                    className="mobile-menu-btn"
                    style={{ background: 'transparent', border: 'none', color: '#64748B', display: 'none', cursor: 'pointer', padding: 0 }}
                >
                    <Menu size={24} />
                </button>
                <style jsx>{`
                    @media (max-width: 768px) {
                        .mobile-menu-btn { display: block !important; }
                    }
                `}</style>

                {!isMobile && isSimulatingActive && (
                    <span className="phase-indicator" style={{ background: '#FFF7ED', padding: '6px 16px', borderRadius: '100px', fontSize: '12px', border: '1px solid #FFEDD5', color: '#C2410C', fontWeight: '800' }}>
                        सिमुलेशन: <span style={{ textTransform: 'uppercase' }}>{effectiveRoleToUse === 'CANDIDATE' ? 'कैंडिडेट' : 'कार्यकर्ता'} दृश्य</span>
                    </span>
                )}
                {!isMobile && !isGlobal && !isSimulatingActive && (
                    <span className="phase-indicator" style={{ background: '#F8FAFC', padding: '6px 16px', borderRadius: '100px', fontSize: '13px', border: '1px solid #E2E8F0' }}>
                        वर्तमान चरण: <strong style={{ color: '#2563EB' }}>चुनाव प्रचार (Campaign)</strong>
                    </span>
                )}

                <div className="desktop-search" style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input suppressHydrationWarning type="text" placeholder="खोजें..." style={{ padding: '8px 16px 8px 40px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', width: isMobile ? '120px' : '220px', fontSize: '14px' }} />
                </div>
                <style jsx>{`
                    @media (max-width: 768px) {
                        .desktop-search { display: ${isMobile ? 'none' : 'block'} !important; }
                    }
                `}</style>
            </div>

            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '24px' }}>
                <div
                    onClick={async () => {
                        if (unreadCount > 0) {
                            const user = session?.user as any;
                            await markAllAsRead(user.id, user.assemblyId);
                            setUnreadCount(0);
                        }
                    }}
                    style={{ position: 'relative', cursor: 'pointer' }}
                >
                    <Bell size={20} color="#64748B" />
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute', top: '-6px', right: '-6px',
                            background: '#EF4444', color: 'white', border: '2px solid white',
                            borderRadius: '50%', fontSize: '9px', fontWeight: '900',
                            width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {unreadCount}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: isMobile ? '32px' : '40px',
                        height: isMobile ? '32px' : '40px',
                        borderRadius: '10px',
                        backgroundColor: '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '2px solid #E2E8F0'
                    }}>
                        {userImage ? (
                            <img
                                src={userImage}
                                alt={userName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <User size={isMobile ? 16 : 20} color="#64748B" />
                        )}
                    </div>
                    {!isMobile && (
                        <div style={{ lineHeight: '1.2' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>
                                {displayName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>{displaySub}</div>
                        </div>
                    )}
                </div>

                {!isMobile && <div style={{ width: '1px', height: '28px', background: '#E2E8F0' }}></div>}

                {getAppEnvironment() === 'WEB' && (
                    <Link
                        href="/apps"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#EFF6FF',
                            color: '#2563EB',
                            padding: isMobile ? '8px' : '8px 16px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: '800',
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                            border: '1px solid #DBEAFE'
                        }}
                    >
                        <Smartphone size={isMobile ? 20 : 16} /> {!isMobile && 'डाउनलोड एप्प'}
                    </Link>
                )}

                <button
                    suppressHydrationWarning
                    onClick={() => signOut({ callbackUrl: '/' })}
                    style={{
                        background: '#F1F5F9',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        color: '#64748B',
                        transition: 'all 0.2s'
                    }}
                    title="लॉग आउट करें"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
};

export default Header;
