
"use client";

import Link from 'next/link';
import MainNav from './main-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation'; // Import usePathname
import { cn } from '@/lib/utils'; // Import cn

const navItems = [
  { href: '/', label: 'Generator' },
  { href: '/presets', label: 'Presets' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/settings', label: 'Settings' },
  { href: '/about', label: 'About' },
];

export default function Header() {
  const pathname = usePathname(); // Get current pathname for active link styling in mobile nav

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-lg font-bold text-primary">
          <ShieldCheck className="h-7 w-7" />
          <span>FieldKey</span>
        </Link>
        <div className="flex items-center space-x-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex">
            <MainNav />
          </div>
          <ThemeToggle />
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:w-[300px] p-0">
                <div className="p-6">
                  <Link href="/" className="flex items-center space-x-2 text-lg font-bold text-primary mb-6">
                    <ShieldCheck className="h-7 w-7" />
                    <span>FieldKey</span>
                  </Link>
                  <nav className="flex flex-col space-y-3">
                    {navItems.map((item) => (
                       <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            'text-lg font-medium transition-colors hover:text-primary',
                            pathname === item.href ? 'text-primary' : 'text-foreground/80'
                          )}
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
