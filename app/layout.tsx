import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(`https://${process.env.NEXT_PUBLIC_SITE_URL || 'getshotscore.com'}`),
  title: 'ShotScore — Grade your product main image in seconds',
  description:
    'Free AI grader for Amazon, TikTok Shop and Shopify product main images. Instant score out of 100, breakdown and fixes. No signup.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
