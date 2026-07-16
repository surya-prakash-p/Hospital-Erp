import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata = {
  title: 'Thangam Hospital - Hospital ERP',
  description: 'Integrated Hospital ERP Portal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <div className="flex min-h-screen bg-slate-50">
          <AppSidebar />
          <main className="flex-1 min-w-0 flex flex-col">
            <Header />
            <div className="p-6 flex-1 overflow-y-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
