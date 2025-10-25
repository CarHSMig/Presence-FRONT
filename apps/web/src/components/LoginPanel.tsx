"use client";

import Image from 'next/image';
import { useTheme } from 'next-themes';
import panelImageLight from '@/assets/images/login/login_panel_light.jpg';
import panelImageDark from '@/assets/images/login/login_panel_dark.jpg';

export default function LoginPanel() {
  const { theme } = useTheme();
  
  const panelImage = theme === 'dark' ? panelImageDark : panelImageLight;
  
  return (
    <div className="w-2/4 relative">
      <Image 
        src={panelImage} 
        alt="Painel de Login" 
        fill
        className="object-cover"
        priority
      />
    </div>
  );
}
