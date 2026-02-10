import './globals.css';
import { Inter, Noto_Sans_Devanagari } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { auth } from '@/auth';
import { getDeveloperMode } from '@/app/actions/system';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const noto = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-noto' });

export const metadata = {
  title: 'Voteraction | उन्नत चुनाव प्रबंधन प्रणाली',
  description: 'MLA उम्मीदवार के लिए चुनावी प्रबंधन प्रणाली',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user as any;
  const isMaintenanceMode = await getDeveloperMode();

  const headersList = await headers();
  const pathname = headersList.get('x-url') || '';

  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const isMaintenancePage = pathname === '/maintenance';

  // Only redirect if:
  // 1. Maintenance mode is active
  // 2. User is NOT a Superadmin
  // 3. We are NOT already on the maintenance page (avoid loop)
  // 4. We are NOT on login page (allow admin login to turn it off)
  const isLoginPage = pathname === '/login';

  if (isMaintenanceMode && !isSuperAdmin && !isMaintenancePage && !isLoginPage) {
    redirect('/maintenance');
  }

  return (
    <html lang="hi">
      <body className={`${inter.variable} ${noto.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
