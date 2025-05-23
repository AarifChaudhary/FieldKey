import Link from 'next/link';
import MainNav from './main-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-lg font-bold text-primary">
          <ShieldCheck className="h-7 w-7" />
          <span>FieldKey</span>
        </Link>
        <div className="flex items-center space-x-4">
          <MainNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
