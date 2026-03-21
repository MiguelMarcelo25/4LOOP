import './globals.css';
import { Poppins } from 'next/font/google';
import Providers from '@/lib/providers';
import Header from '@/app/components/Header';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const dynamic = "force-dynamic";
export const metadata = {
  title: 'Pasig City Sanitation Permit System',
  description: 'A web-based sanitation permit and compliance monitoring platform.',
  icons: {
    icon: '/pasig-seal.png',
  },
};

export default function RootLayout({ children }) {

  return (
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <body className="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-200 font-sans antialiased" suppressHydrationWarning={true}>
        <Providers>
          <div className="min-h-screen flex flex-col">

            <Header />

            {/* Main Content */}
            <main>{children}</main>

          </div>
        </Providers>
      </body>
    </html>
  );
}
