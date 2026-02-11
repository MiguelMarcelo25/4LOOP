import './globals.css';
import Providers from '@/lib/providers';
import Header from '@/app/components/Header';

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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-300" suppressHydrationWarning={true}>
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
