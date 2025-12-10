"use client";

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import LoginForm from '@/components/LoginForm';
import LoginPanel from '@/components/LoginPanel';
import Logo from '@/assets/images/logo.png';
import DarkLogo from '@/assets/images/dark-logo.png';
import { ModeToggle } from '@/components/mode-toggle';

export default function LoginPage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitar hidratação mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Usar resolvedTheme para considerar o tema do sistema
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const logoSrc = isDark ? DarkLogo : Logo;

  return (
    <div className="min-h-screen flex">
      <div className="w-2/4 flex items-center justify-center bg-background p-8 relative">
        <div className="w-full max-w-sm">
          <div className="flex items-left justify-center">
            <Image src={logoSrc} alt="Logo" width={500} height={500} className="items-left" />
          </div>
          <LoginForm />
        </div>
        <div className="absolute top-4 left-4">
          <ModeToggle />
        </div>
      </div>
      
      <LoginPanel />
    </div>
  );
}
