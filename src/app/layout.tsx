import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { StoreProvider } from "@/components/StoreProvider";
import { AuthProvider } from "@/lib/auth-context";
import { Shell } from "@/components/Shell";
import "./globals.css";

const mcFont = localFont({
  src: [
    {
      path: "../../public/folder/mcFont-regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/folder/mcFont-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-mc",
  display: "swap",
});

export const metadata: Metadata = {
  title: "רשימת קניות",
  description: "אפליקציית רשימת קניות למטבח",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "רשימת קניות",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={mcFont.variable}>
      <body className="antialiased bg-background text-foreground font-sans">
        <AuthProvider>
          <StoreProvider>
            <Shell>
              {children}
            </Shell>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
