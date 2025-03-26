'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { login, type LoginActionState } from '../actions';
import { cn } from '@/lib/utils';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-border shadow-sm">
        <div className="flex flex-col space-y-6 p-8">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign In
            </h1>
            <p className="text-sm text-muted-foreground">
              Use your email and password to sign in
            </p>
          </div>
          
          <AuthForm action={handleSubmit} defaultEmail={email}>
            <SubmitButton 
              isSuccessful={isSuccessful} 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </SubmitButton>
            
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {"Don't have an account? "}
              <Link
                href="/register"
                className={cn(
                  "font-medium text-primary hover:text-primary/90 hover:underline underline-offset-4"
                )}
              >
                Sign up
              </Link>
              {' for free.'}
            </div>
          </AuthForm>
        </div>
      </div>
    </div>
  );
}
