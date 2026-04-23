import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/ToastProvider";
import ThemeToggle from "@/components/ThemeToggle";
import ChatbotBubble from "@/components/ChatbotBubble";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

import "./globals.css";

export const metadata: Metadata = {
  title: "Qypher | Quantum Enterprise SOC",
  description:
    "Real-time Quantum Security Operations Center for high-fidelity firewall monitoring and cryptographic analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background text-foreground">
        <ToastProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 min-h-screen transition-all duration-300 ml-0 lg:ml-64">
              <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
                <div className="flex justify-end mb-6">
                   <ThemeToggle />
                </div>
                <div className="page-fade-in">
                  {children}
                </div>
              </div>
            </main>
          </div>
          <ChatbotBubble />
        </ToastProvider>
      </body>
    </html>
  );
}
