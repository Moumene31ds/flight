import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AeroSim AI — Airline Simulation Game",
  description: "Next-generation real-time airline management simulation game driven by autonomous AI systems.",
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-brand-cyan/30 selection:text-white">
        <NextIntlClientProvider messages={messages}>
          <div className="cosmic-bg">
            <div className="cosmic-glow-1"></div>
            <div className="cosmic-glow-2"></div>
            <div className="cosmic-glow-3"></div>
          </div>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
