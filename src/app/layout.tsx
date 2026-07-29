import type { Metadata } from "next";
import { Noto_Sans_JP, DM_Sans } from "next/font/google";
import {
  getSiteUrl,
  SITE_NAME,
  SITE_TITLE,
  SITE_DEFAULT_DESCRIPTION,
  SITE_OG_DESCRIPTION,
  SITE_KEYWORDS,
} from "@/lib/seo";
import { OrganizationJsonLd } from "@/components/json-ld/Organization";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_OG_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_OG_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} ${dmSans.variable}`}>
      <body className="bg-ivory font-sans text-sumi antialiased">
        <OrganizationJsonLd />
        {children}
      </body>
    </html>
  );
}
