import './globals.css';
import { Playfair_Display, Montserrat } from 'next/font/google';
import { AppSidebar } from "@/components/app-sidebar"

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });

export const metadata = {
  title: 'Thangam Hospital - Hospital ERP',
  description: 'Integrated Hospital ERP Portal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${montserrat.variable} font-sans antialiased`}>
        <div className="flex min-h-screen bg-slate-50">
          <AppSidebar />
          <main className="flex-1 min-w-0">
            <header className="h-14 border-b border-slate-200 bg-white flex items-center px-6">
              <span className="text-sm font-medium text-slate-500">Thangam Hospitals ERP</span>
            </header>
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
