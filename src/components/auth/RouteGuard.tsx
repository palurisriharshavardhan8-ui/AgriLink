'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isRouteAllowed, ROLE_DEFAULT_ROUTES } from '@/lib/auth/rbac';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';

export const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading } = useAuth();

  // Redirect unauthenticated users to /login immediately after auth state resolves
  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-agri-sprout border-t-transparent animate-spin" />
        <span className="text-xs font-semibold text-agri-earth-700">Verifying role permissions...</span>
      </div>
    );
  }

  // While redirect to /login is in flight, render nothing to prevent flash of protected content
  if (!user) {
    return null;
  }

  const allowed = isRouteAllowed(role, pathname);

  if (!allowed) {
    const defaultDashboard = ROLE_DEFAULT_ROUTES[role] || '/consumer';

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-5 border-amber-200 bg-white shadow-lg">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 mx-auto">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <Badge variant="sand">Access Restricted</Badge>
            <h2 className="text-2xl font-extrabold text-agri-earth-900">
              Unauthorized Route
            </h2>
            <p className="text-xs text-agri-earth-700 leading-relaxed">
              Your active role (<span className="font-bold text-agri-earth-900 uppercase">{role.replace('_', ' ')}</span>) does not have permission to access <code className="bg-agri-earth-100 px-1.5 py-0.5 rounded text-agri-evergreen font-mono">{pathname}</code>.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="primary"
              size="md"
              className="w-full gap-2 font-bold"
              onClick={() => router.push(defaultDashboard)}
            >
              <span>Go to Your Role Dashboard</span>
              <ArrowRight className="h-4 w-4 text-agri-sprout-bright" />
            </Button>

            <Button
              variant="outline"
              size="md"
              className="w-full gap-2 text-xs"
              onClick={() => router.push('/')}
            >
              <Home className="h-4 w-4" />
              <span>Return to Public Website</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
