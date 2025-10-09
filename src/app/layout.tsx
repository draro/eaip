import type { Metadata } from "next";
import SessionProvider from "@/components/providers/SessionProvider";
import "./globals.css";
import "../styles/eaip.css";


export const metadata: Metadata = {
  title: "eAIP Editor",
  description: "Electronic Aeronautical Information Publication Editor",
  icons: {
    icon: [
      { url: '/icon?<generated>', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon?<generated>', type: 'image/png', sizes: '180x180' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}