'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AGRI_ROLES } from '@/utils/constants';
import { UserRole } from '@/types';
import { Sprout, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RegisterForm: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('consumer');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const { error } = await signUp(email, password, fullName, selectedRole);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg(
          'Registration successful! Check your email to confirm registration or sign in.'
        );
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl p-8 shadow-xl border-agri-earth-200 bg-white space-y-6">
      {/* Form Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-agri-evergreen text-white shadow-sm mb-1">
          <Sprout className="h-6 w-6 text-agri-sprout-bright" />
        </div>
        <Badge variant="sprout">Join AgriLink Platform</Badge>
        <h2 className="text-2xl font-extrabold text-agri-earth-900 tracking-tight">
          Create Account
        </h2>
        <p className="text-xs text-agri-earth-700">
          Select your ecosystem role and join India&apos;s direct farm-to-consumer platform.
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-agri-sprout-soft border border-agri-sprout-bright/40 text-agri-evergreen text-xs flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-agri-sprout shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 5-Role Selector Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-agri-earth-800">
            Select Your Ecosystem Role
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {AGRI_ROLES.map((role) => {
              const isSelected = selectedRole === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-agri-evergreen bg-agri-sprout-soft/40 shadow-sm ring-1 ring-agri-evergreen'
                      : 'border-agri-earth-200 bg-white hover:border-agri-earth-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={role.badgeVariant} className="text-[10px]">
                      {role.label}
                    </Badge>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-agri-evergreen" />
                    )}
                  </div>
                  <p className="text-[11px] text-agri-earth-700 mt-2 leading-tight">
                    {role.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <Input
          label="Full Name / Organization Name"
          type="text"
          placeholder="e.g. Ramesh Kumar or Punjab Farmers FPO"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

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
          minLength={6}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full gap-2 font-bold"
          disabled={submitting}
        >
          {submitting ? (
            <span>Creating Account...</span>
          ) : (
            <>
              <UserPlus className="h-4 w-4 text-agri-sprout-bright" />
              <span>Register Account</span>
            </>
          )}
        </Button>
      </form>

      {/* Footer Link */}
      <div className="pt-4 border-t border-agri-earth-100 text-center text-xs text-agri-earth-700">
        <span>Already have an account? </span>
        <Link href="/login" className="font-bold text-agri-evergreen hover:underline">
          Sign In Here
        </Link>
      </div>
    </Card>
  );
};
