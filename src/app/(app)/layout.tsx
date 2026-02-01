import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { prisma as prismaInstance } from '@/lib/prisma';
import { auth } from '@/auth';
import { LayoutProvider } from '@/context/LayoutContext';
import { cookies } from 'next/headers';
import ClientLayout from '@/components/ClientLayout';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const assemblyId = (session?.user as any)?.assemblyId;

    const cookieStore = await cookies();
    const personaCookie = cookieStore.get('simulationPersona')?.value;
    let simulatedPersona = null;
    if (personaCookie) {
        try { simulatedPersona = JSON.parse(decodeURIComponent(personaCookie)); } catch (e) { }
    }

    let branding = {
        themeColor: '#1E3A8A',
        candidateName: simulatedPersona?.name || 'उम्मीदवार',
        candidateImageUrl: simulatedPersona?.image || null,
        logoUrl: null
    };

    try {
        const prisma = prismaInstance as any;
        const assembly = assemblyId
            ? await prisma.assembly.findUnique({ where: { id: assemblyId } })
            : await prisma.assembly.findFirst();

        if (assembly) {
            branding = {
                themeColor: assembly.themeColor || '#1E3A8A',
                candidateName: assembly.candidateName || 'उम्मीदवार',
                candidateImageUrl: assembly.candidateImageUrl,
                logoUrl: assembly.logoUrl
            };
        }
    } catch (error) {
        console.error('Branding fetch failed:', error);
    }

    const effectiveRole = cookieStore.get('effectiveRole')?.value;
    const effectiveWorkerType = cookieStore.get('effectiveWorkerType')?.value;
    const isCentralSocial = effectiveRole === 'SOCIAL_MEDIA' && (effectiveWorkerType === 'SOCIAL_CENTRAL' || effectiveWorkerType?.startsWith('CENTRAL_'));

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
                />
                <div className="main-container">
                    <Header
                        candidateName={branding.candidateName}
                        candidateImageUrl={branding.candidateImageUrl}
                    />
                    <main className="content">
                        {children}
                    </main>
                </div>
            </ClientLayout>
        </LayoutProvider>
    );
}
