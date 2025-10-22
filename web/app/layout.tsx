import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Medusa",
  description: "Deploy any agent in secure containers. Execute parallel workflows, switch contexts instantly, and maintain control over AI-generated code.",
  icons: {
    icon: [
      { url: '/medusa-logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/medusa-logo.png', sizes: '16x16', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: { url: '/medusa-logo.png', sizes: '180x180', type: 'image/png' },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
