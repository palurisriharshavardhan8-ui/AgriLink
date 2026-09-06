import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, Activity, Layers, Users } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-earth-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-agri-earth-800 text-white flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-agri-sprout-bright" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-agri-earth-900">
                Platform Admin Console
              </h1>
              <Badge variant="earth">Admin Role</Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1">
              Ecosystem operations monitoring, role management, and ONDC network oversight.
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-xs py-1 px-3">
          SIH26033 Platform Ops Shell
        </Badge>
      </div>

      {/* Admin Monitoring Grid Shell */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-agri-earth-700 text-xs font-bold">
            <span>5 Preserved Roles</span>
            <Users className="h-4 w-4 text-agri-sprout" />
          </div>
          <div className="text-2xl font-black text-agri-earth-900">All Roles Active</div>
          <p className="text-xs text-agri-earth-700">Role permissions & architecture</p>
        </Card>

        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-agri-earth-700 text-xs font-bold">
            <span>Platform Health</span>
            <Activity className="h-4 w-4 text-agri-evergreen" />
          </div>
          <div className="text-2xl font-black text-agri-earth-900">Operational</div>
          <p className="text-xs text-agri-earth-700">App router console architecture</p>
        </Card>

        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-agri-earth-700 text-xs font-bold">
            <span>ONDC Readiness</span>
            <Layers className="h-4 w-4 text-agri-harvest" />
          </div>
          <div className="text-2xl font-black text-agri-earth-900">Framework Ready</div>
          <p className="text-xs text-agri-earth-700">Open network integration shell</p>
        </Card>
      </div>
    </div>
  );
}
