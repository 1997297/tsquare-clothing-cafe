import type { Metadata, Viewport } from "next";
import { Cinzel, Montserrat } from "next/font/google";
import "./globals.css";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { AuthProvider } from "@/lib/auth-context";
import { AccountDataProvider } from "@/lib/account-store";
import { SavedStylesProvider } from "@/lib/saved-store";
import { ThemeProvider } from "@/lib/theme-context";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#11110F",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "TSquare Clothing Cafe | Contemporary African Luxury Menswear",
    template: "%s | TSquare Clothing Cafe",
  },
  description:
    "A premier menswear fashion house based in Abeokuta, Ogun State, Nigeria. Crafted for the man who commands presence through character, individuality, and bespoke tailoring.",
  keywords: [
    "TSquare Clothing Cafe",
    "TCC",
    "African Luxury Menswear",
    "Agbada",
    "Senator Attire",
    "Bespoke Menswear Nigeria",
    "Abeokuta Tailoring",
    "Traditional Nigerian Menswear",
    "Kaftan",
  ],
  authors: [{ name: "TSquare Clothing Cafe" }],
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "/",
    title: "TSquare Clothing Cafe | Contemporary African Luxury Menswear",
    description:
      "Crafted for the man who commands presence. Bespoke menswear shaped by craftsmanship, character and individuality in Abeokuta, Nigeria.",
    siteName: "TSquare Clothing Cafe",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
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
      data-theme="dark"
      suppressHydrationWarning
      className={`${cinzel.variable} ${montserrat.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('tcc-theme');t=t==='light'?'light':'dark';var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-near-black text-warm-ivory selection:bg-champagne selection:text-near-black font-sans">
        <ThemeProvider>
          <AuthProvider>
            <SavedStylesProvider>
              <AccountDataProvider>
                <SiteLayout>{children}</SiteLayout>
              </AccountDataProvider>
            </SavedStylesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
