'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (nextLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'zh', label: '中文' },
  ];

  return (
    <div className="relative flex items-center gap-2">
      <Globe className={`w-4.5 h-4.5 text-brand-cyan ${isPending ? 'animate-spin' : ''}`} />
      <select
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        disabled={isPending}
        className="bg-slate-950/80 border border-white/10 rounded-lg py-1.5 ps-2 pe-8 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan cursor-pointer glass-button appearance-none relative"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.25rem',
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-slate-950 text-white py-2">
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
