import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./site.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ce que la moyenne ne dit pas",
  description: "Une exploration des ruptures derrière les moyennes de santé mentale.",
  openGraph: {
    title: "Ce que la moyenne ne dit pas",
    description: "Suivez les trajectoires de santé mentale que la moyenne nationale efface.",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og-trajectoires.png", width: 1536, height: 1024, alt: "Des fils de trajectoires se séparent après un point de rupture" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ce que la moyenne ne dit pas",
    description: "Une exploration des ruptures derrière les moyennes de santé mentale.",
    images: ["/og-trajectoires.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
