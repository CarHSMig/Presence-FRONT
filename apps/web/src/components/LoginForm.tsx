"use client";

import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginFormData } from '@/validators/auth.validator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import PersonIcon from '@/components/icons/PersonIcon';
import { Loader2, Lock } from 'lucide-react';

export default function LoginForm() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } as LoginFormData,
    validators: {
      onChange: ({ value }) => {
        const result = loginSchema.safeParse(value);
        if (result.success) return undefined;
        return result.error.flatten().fieldErrors.email?.join(', ') || result.error.flatten().fieldErrors.password?.join(', ');
      },
    },
    onSubmit: async ({ value }) => {
      try {
        await login(value.email, value.password);
        toast.success('Login realizado com sucesso!');
        router.push('/');
      } catch (error) {
        toast.error(
          error instanceof Error 
            ? error.message 
            : 'Erro ao fazer login. Tente novamente.'
        );
      }
    },
  });

  return (
    <div className="w-full space-y-8">
      <div className="text-left">
        <h1 className="text-3xl font-bold text-foreground mb-2">LOGIN</h1>
        <p className="text-sm text-muted-foreground">
          Digite suas credenciais para acessar o sistema
        </p>
      </div>
      
      <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <form.Field
                  name="email"
                  children={(field) => (
                    <Input
                      label="Email"
                      type="email"
                      placeholder="email@example.com"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={field.state.meta.errors.length > 0}
                      icon={<PersonIcon className="h-4 w-4 text-muted-foreground" />}
                      iconPosition="left"
                      error={field.state.meta.errors.length > 0}
                      errorMessage={field.state.meta.errors[0] || 'Erro de validação'}
                    />
                  )}
                />

                <form.Field
                  name="password"
                  children={(field) => (
                    <Input
                      label="Senha"
                      placeholder="Digite sua senha"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={field.state.meta.errors.length > 0}
                      variant="secret"
                      icon={<Lock className="h-4 w-4 text-muted-foreground" />}
                      iconPosition="left"
                      showToggle={true}
                      error={field.state.meta.errors.length > 0}
                      errorMessage={field.state.meta.errors[0] || 'Erro de validação'}
                    />
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                loading={isLoading}
                loadingIcon={<Loader2 className="h-4 w-4" />}
                icon={<Lock className="h-4 w-4" />}
                iconPosition="left"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
      </div>
    </div>
  );
}
