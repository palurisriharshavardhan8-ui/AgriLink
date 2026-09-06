import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AGRI_ROLES } from '@/utils/constants';
import { User, Shield, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-earth-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-agri-earth-100 text-agri-earth-900 flex items-center justify-center">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-agri-earth-900">
                User Profile & Settings
              </h1>
              <Badge variant="outline">Account Shell</Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1">
              Manage user details, active ecosystem roles, and notification preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Role Selection Shell */}
      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-agri-evergreen" />
            <h3 className="text-base font-bold text-agri-earth-900">Application Role Architecture</h3>
          </div>
          <Badge variant="sprout">5 Roles Preserved</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {AGRI_ROLES.map((role) => (
            <div key={role.id} className="p-3 rounded-xl border border-agri-earth-200 bg-white space-y-2">
              <Badge variant={role.badgeVariant} className="text-[10px]">
                {role.id}
              </Badge>
              <div className="font-bold text-xs text-agri-earth-900">{role.label}</div>
              <div className="flex items-center gap-1 text-[11px] text-agri-evergreen font-semibold">
                <CheckCircle2 className="h-3 w-3 text-agri-sprout" />
                <span>Architecture Ready</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
