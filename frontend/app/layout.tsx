// frontend/app/layout.tsx
import type { Metadata } from 'next';
// @ts-expect-error CSS import is handled by Next.js bundler.
import './globals.css';

export const metadata: Metadata = {
  title: 'FinPilot • Equity Research',
  description: 'Professional Multi-Agent Equity Research Platform',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b1326] text-[#dae2fd] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}