import Image from 'next/image';
import LoginForm from '@/components/LoginForm';
import LoginPanel from '@/components/LoginPanel';
import Logo from '@/assets/images/logo.png';
import { ModeToggle } from '@/components/mode-toggle';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <div className="w-2/4 flex items-center justify-center bg-background p-8 relative">
        <div className="w-full max-w-sm">
          <div className="flex items-left justify-center">
            <Image src={Logo} alt="Logo" width={500} height={500} className="mb-4 items-left" />
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
