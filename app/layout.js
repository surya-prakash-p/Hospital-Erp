import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AuthProvider } from "@/lib/auth-context";
import { SidebarProvider } from "@/components/sidebar-context";
import { AuditTracker } from "@/components/audit-tracker";
import { MainLayoutContent } from "@/components/main-layout-content";

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
