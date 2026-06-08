import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";


export const metadata: Metadata = {
  title: "ChatBisnis AI - Chatbot WhatsApp AI untuk UMKM",
  description: "Platform chatbot WhatsApp AI untuk UMKM Indonesia dengan WAHA, n8n, knowledge base, dan otomatisasi customer service.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://chatbisnis-ai.vercel.app'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className="h-full antialiased font-sans"
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
