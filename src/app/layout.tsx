import './main.css';
import { Inter, Noto_Sans_Devanagari } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const noto = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-noto' });

export const metadata = {
  title: 'Voteraction | उन्नत चुनाव प्रबंधन प्रणाली',
  description: 'MLA उम्मीदवार के लिए चुनावी प्रबंधन प्रणाली',
};

import { Providers } from '@/components/Providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
