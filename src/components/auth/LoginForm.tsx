'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Sprout, LogIn, AlertCircle } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push('/marketplace');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-8 shadow-xl border-agri-earth-200 bg-white space-y-6">
      {/* Form Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-agri-evergreen text-white shadow-sm mb-1">
          <Sprout className="h-6 w-6 text-agri-sprout-bright" />
        </div>
        <Badge variant="sprout">AgriLink Authentication</Badge>
        <h2 className="text-2xl font-extrabold text-agri-earth-900 tracking-tight">
          Welcome Back
        </h2>
        <p className="text-xs text-agri-earth-700">
          Sign in to access your direct marketplace dashboard & logistics tools.
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full gap-2 font-bold"
          disabled={submitting}
        >
          {submitting ? (
            <span>Signing In...</span>
          ) : (
            <>
              <LogIn className="h-4 w-4 text-agri-sprout-bright" />
              <span>Sign In</span>
            </>
          )}
        </Button>
      </form>

      {/* Footer Link */}
      <div className="pt-4 border-t border-agri-earth-100 text-center text-xs text-agri-earth-700">
        <span>Don&apos;t have an account? </span>
        <Link href="/register" className="font-bold text-agri-evergreen hover:underline">
          Register New Account
        </Link>
      </div>
    </Card>
  );
};
