import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { AuthProvider } from "@/lib/auth-context";
import { SidebarProvider } from "@/components/sidebar-context";
import { AuditTracker } from "@/components/audit-tracker";
import { Suspense } from 'react';

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

function MainLayoutContent({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <Header />
        <div className="p-3 sm:p-5 flex-1 min-h-0 overflow-y-auto">
          <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading module...</div>}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <SidebarProvider>
            <AuditTracker />
            <MainLayoutContent>{children}</MainLayoutContent>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
