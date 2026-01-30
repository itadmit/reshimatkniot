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
  title: "רשימת קניות | ניהול קניות משפחתי חכם",
  description: "אפליקציית רשימת קניות משפחתית חכמה - צרו רשימות קניות משותפות, שתפו בוואטסאפ, וסנכרנו בין כל בני המשפחה בזמן אמת. חינם ופשוט לשימוש!",
  manifest: "/manifest.json",
  metadataBase: new URL("https://kitchenlistil.vercel.app"),
  keywords: ["רשימת קניות", "קניות", "סופר", "משפחה", "רשימה משותפת", "וואטסאפ", "shopping list", "grocery"],
  authors: [{ name: "Kitchen List IL" }],
  creator: "Kitchen List IL",
  publisher: "Kitchen List IL",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: "https://kitchenlistil.vercel.app",
    siteName: "רשימת קניות",
    title: "רשימת קניות | ניהול קניות משפחתי חכם",
    description: "צרו רשימות קניות משותפות עם כל המשפחה, שתפו בוואטסאפ בקליק, וסנכרנו בזמן אמת. חינם ופשוט!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "רשימת קניות - אפליקציה לניהול קניות משפחתי",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "רשימת קניות | ניהול קניות משפחתי חכם",
    description: "צרו רשימות קניות משותפות עם כל המשפחה, שתפו בוואטסאפ בקליק!",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "רשימת קניות",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/apple-icon",
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
