import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. IMPOR TOASTER DI SINI
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Klinik WMC",
  description: "Sistem Informasi Manajemen Klinik",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {/* HARUS DIBUNGKUS DI SINI */}
        <Providers>
          <Toaster />
          {children}
        </Providers>
      </body>
    </html>
  );
}
