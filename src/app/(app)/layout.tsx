import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { prisma as prismaInstance } from '@/lib/prisma';
import { auth } from '@/auth';
import { LayoutProvider } from '@/context/LayoutContext';
import { cookies } from 'next/headers';
import ClientLayout from '@/components/ClientLayout';
import OfflineSyncManager from '@/components/OfflineSyncManager';
import Link from 'next/link';
import WorkerFAB from '@/components/WorkerFAB';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const prisma = prismaInstance as any;

    // Fetch latest user data from DB to ensure we have current assemblyId and name
    let dbUser: any = null;
    const sessionUserId = parseInt((session?.user as any)?.id);
    if (session?.user && !isNaN(sessionUserId)) {
        try {
            dbUser = await prisma.user.findUnique({
                where: { id: sessionUserId }
            });
        } catch (e) {
            console.error('Layout User Fetch Error:', e);
        }
    }

    const userRole = dbUser?.role || (session?.user as any)?.role;
    const assemblyId = dbUser?.assemblyId || (session?.user as any)?.assemblyId;

    // SOURCE OF TRUTH: Database first, then session
    const realUserName = dbUser?.name || session?.user?.name || 'यूजर';
    const realUserImage = dbUser?.image || (session?.user as any)?.image;

    const cookieStore = await cookies();
    const effectiveRoleCookie = cookieStore.get('effectiveRole')?.value;
    const effectiveWorkerType = cookieStore.get('effectiveWorkerType')?.value;
    const personaCookie = cookieStore.get('simulationPersona')?.value;

    // SIMULATION IS SUPERADMIN ONLY — ignore cookies for all other roles
    const isSuperAdmin = userRole === 'SUPERADMIN';
    const effectiveRole = isSuperAdmin ? effectiveRoleCookie : undefined;

    let simulatedPersona = null;
    if (isSuperAdmin && personaCookie) {
        try { simulatedPersona = JSON.parse(decodeURIComponent(personaCookie)); } catch (e) { }
    }

    const isSimulatingActive = isSuperAdmin && ((effectiveRole && effectiveRole !== userRole) || !!simulatedPersona);
    const isGlobalView = (userRole === 'SUPERADMIN') && !isSimulatingActive;

    const isWorker = effectiveRole === 'WORKER' || userRole === 'WORKER';

    let branding = {
        themeColor: '#1E3A8A',
        candidateName: simulatedPersona?.name || realUserName || 'उम्मीदवार',
        candidateImageUrl: simulatedPersona?.image || realUserImage || null,
        logoUrl: null
    };

    try {
        // If it's a global view for Admin/SuperAdmin, don't fetch a default assembly branding
        const shouldFetchBranding = assemblyId || !isGlobalView;

        const assembly = shouldFetchBranding
            ? (assemblyId
                ? await prisma.assembly.findUnique({ where: { id: assemblyId } })
                : await prisma.assembly.findFirst())
            : null;

        if (assembly) {
            let logoUrl = assembly.logoUrl;
            let themeColor = assembly.themeColor;

            // If assembly.party is set, try fetching party color & logo
            if (assembly.party) {
                try {
                    const party = await prisma.party.findFirst({
                        where: {
                            OR: [
                                { name: assembly.party },
                                { name: { contains: assembly.party.split(' ')[0] } }
                            ]
                        },
                        select: { logo: true, color: true }
                    });
                    if (party) {
                        if (!logoUrl) logoUrl = party.logo;
                        if (!themeColor || themeColor === '#1E3A8A') themeColor = party.color;
                    }
                } catch (e) {
                    console.error('Party lookup error:', e);
                }
            }

            // For WORKER role, always use their real name, not assembly's candidate name
            const nameToUse = isWorker
                ? realUserName
                : (simulatedPersona?.name || assembly.candidateName || realUserName);
            const imgToUse = isWorker
                ? (realUserImage || assembly.candidateImageUrl)
                : (simulatedPersona?.image || assembly.candidateImageUrl || realUserImage);

            branding = {
                themeColor: themeColor || '#1E3A8A',
                candidateName: nameToUse,
                candidateImageUrl: imgToUse,
                logoUrl: logoUrl
            };
        }
    } catch (error) {
        console.error('Branding fetch failed:', error);
    }



    return (
        <LayoutProvider>
            <ClientLayout>
                <style dangerouslySetInnerHTML={{
                    __html: `
            :root {
              --primary-bg: ${branding.themeColor};
              --primary-hover: ${branding.themeColor}dd;
              --sidebar-bg: ${branding.themeColor}0f; /* very light shade */
              --sidebar-text: #1E293B;
              --sidebar-active-bg: ${branding.themeColor};
              --sidebar-active-text: #ffffff;
            }
            .sidebar { background: #ffffff !important; border-right: 1px solid #e2e8f0 !important; color: #1E293B !important; }
            .sidebar .menu-item.active { background: var(--primary-bg) !important; color: #ffffff !important; }
            .sidebar .menu-item { color: #64748B !important; }
            .sidebar .menu-item:hover { background: #F8FAFC !important; }
            .sidebar .active-dot { background: var(--primary-bg) !important; }
            .no-sidebar .main-container { margin-left: 0 !important; }
          `}} />
                <Sidebar
                    candidateName={branding.candidateName}
                    candidateImageUrl={branding.candidateImageUrl}
                    partyLogoUrl={branding.logoUrl}
                    realUserName={realUserName}
                    realUserImage={realUserImage}
                    isWorker={isWorker}
                />
                <div className="main-container">
                    <Header
                        candidateName={branding.candidateName}
                        candidateImageUrl={branding.candidateImageUrl}
                        realUserName={realUserName}
                        realUserImage={realUserImage}
                        isWorker={isWorker}
                    />
                    <main className="content">
                        {children}
                    </main>
                    <OfflineSyncManager />
                    <WorkerFAB />
                </div>
            </ClientLayout>
        </LayoutProvider>
    );
}
