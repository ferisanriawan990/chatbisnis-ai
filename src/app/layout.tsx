import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChatBisnis AI - Chatbot WhatsApp AI untuk UMKM",
  description: "Platform chatbot WhatsApp AI untuk UMKM Indonesia dengan Baileys, n8n, knowledge base, dan otomatisasi customer service.",
  keywords: "chatbot whatsapp, ai customer service, umkm digital, baileys, n8n chatbot, whatsapp otomatis, chatbisnis ai",
  robots: "index, follow",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://chatbisnis-ai.vercel.app'),
  openGraph: {
    title: "ChatBisnis AI - Chatbot WhatsApp AI untuk UMKM",
    description: "Tingkatkan penjualan dan layanan pelanggan Anda dengan Chatbot WhatsApp AI yang terintegrasi.",
    url: 'https://chatbisnis-ai.vercel.app',
    siteName: 'ChatBisnis AI',
    images: [
      {
        url: '/og-image.png', // Replace with your actual image
        width: 1200,
        height: 630,
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChatBisnis AI',
    description: 'Platform chatbot WhatsApp AI untuk UMKM Indonesia',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
    >
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
