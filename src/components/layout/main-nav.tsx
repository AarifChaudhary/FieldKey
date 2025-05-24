
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// These are the items for the desktop navigation.
// Mobile navigation items are now defined directly in header.tsx within the Sheet.
const navItems = [
  { href: '/', label: 'Generator' },
  { href: '/presets', label: 'Presets' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/settings', label: 'Settings' },
  { href: '/about', label: 'About' },
];

export default function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'transition-colors hover:text-primary',
            pathname === item.href ? 'text-primary' : 'text-foreground/60'
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
