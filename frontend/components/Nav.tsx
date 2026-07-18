"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/research", label: "Research" },
  { href: "/comparison", label: "Comparison" },
  { href: "/portfolio", label: "Portfolio" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container/80 backdrop-blur-md border-b border-outline-variant">
      <div className="flex justify-between items-center h-16 px-gutter md:px-margin-desktop w-full mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-headline-md text-headline-md font-bold text-primary tracking-tight cursor-pointer">
            FinPilot Pro
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "font-body-lg text-primary border-b-2 border-primary pb-1 cursor-pointer"
                      : "font-body-lg text-on-surface-variant hover:text-primary transition-colors duration-200 cursor-pointer"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors bg-transparent border-none">
            notifications
          </button>
          <button className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors bg-transparent border-none">
            settings
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant">
            <img
              className="w-full h-full object-cover"
              alt="Financial Analyst Headshot"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3ysPUhIkXVbryfhIfUwMSIltS6wZH0Xa69vvf0rKVVtjmwgW_tnm-UT7NhjcvYAl7m9vY0R86qGGVBPR-tL7B6ywgW3IyFCp09sGSjZJ3BGZcGb1YkXtfU9J4MsNdj0tFut5AcuVm8Pbirv-zyWeOysnXz8Q5tNIoOLaS50HhykxLVnEiY-u6g944ODFjQZ1lPbAqikSN7ZIzJtONbKHkPt_uUtolNWOl3_K8F7aCopmYgxbPN1BTI3v0u5rBIKYQNvZYG6mI1zH2"
            />
          </div>
        </div>
      </div>
    </header>
  );
}