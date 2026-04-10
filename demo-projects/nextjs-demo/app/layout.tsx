import type { Metadata } from 'next';
import './globals.css';
import { LocatorProvider } from './LocatorProvider';

export const metadata: Metadata = {
  title: 'Next.js Demo',
  description: 'A simple Next.js demo application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LocatorProvider>{children}</LocatorProvider>
      </body>
    </html>
  );
}
