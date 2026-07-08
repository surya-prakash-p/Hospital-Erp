import './globals.css';

export const metadata = {
  title: 'Thangam Hospital - Hospital ERP',
  description: 'Integrated Hospital ERP Portal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
