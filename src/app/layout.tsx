import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ShipCrop Studio — E-Commerce Shipping Label PDF Cropper",
    template: "%s | ShipCrop Studio",
  },
  description:
    "Crop and prepare shipping label PDFs for Meesho, Flipkart, Amazon, Ajio, and Myntra. Optimized for 4x6 thermal roll printers and A4 multi-label sheets. 100% client-side privacy.",
  keywords: [
    "shipping label cropper",
    "meesho label crop",
    "flipkart label thermal",
    "amazon easyship label",
    "4x6 thermal printer label",
    "shipping label invoice separator",
    "ecommerce seller tools",
  ],
  authors: [{ name: "ShipCrop Studio" }],
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
