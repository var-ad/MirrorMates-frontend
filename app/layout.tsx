import type { Metadata, Viewport } from "next";
import { Alegreya_Sans, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import "./globals.css";

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Alegreya_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "MirrorMates",
  description:
    "A self-reflective feedback tool built on the Johari Window model.",
  openGraph: {
    title: "MirrorMates",
    description:
      "A self-reflective feedback tool built on the Johari Window model.",
    images: [
      "https://res.cloudinary.com/dyfgrjqsw/image/upload/v1776784269/mirrormates.jpg", // Link to your image
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MirrorMates",
    description:
      "A self-reflective feedback tool built on the Johari Window model.",
    images: [
      "https://res.cloudinary.com/dyfgrjqsw/image/upload/v1776784269/mirrormates.jpg", // Link to your image
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
    >
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
