import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Building2, FileText, CheckCircle2 } from 'lucide-react';

export default function BulkBuyerPage() {
  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-earth-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-agri-harvest-soft text-agri-earth-900 flex items-center justify-center">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-agri-earth-900">
                Bulk & Institutional Buyer Console
              </h1>
              <Badge variant="harvest">Bulk Buyer Role</Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1">
              Contract procurement directly from verified FPOs and regional producer clusters.
            </p>
          </div>
        </div>

        <Button variant="primary" size="sm" className="gap-2">
          <FileText className="h-4 w-4 text-agri-sprout-bright" />
          <span>Request Bulk Quote</span>
        </Button>
      </div>

      {/* Procurement Overview Shell */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card hoverEffect className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-agri-earth-900">FPO Direct Sourcing</h3>
            <Badge variant="outline">Institutional Trade</Badge>
          </div>
          <p className="text-xs text-agri-earth-700 leading-relaxed">
            Source multi-ton produce lots directly from regional Farmer Producer Organizations with transparent quality parameters.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-agri-evergreen pt-2">
            <CheckCircle2 className="h-4 w-4 text-agri-sprout" />
            <span>FPO Contract Procurement Shell</span>
          </div>
        </Card>

        <Card hoverEffect className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-agri-earth-900">Mandi Price Indexing</h3>
            <Badge variant="harvest">Fair Price Engine</Badge>
          </div>
          <p className="text-xs text-agri-earth-700 leading-relaxed">
            Real-time APMC Mandi index data integration for commercial price benchmarking and procurement planning.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-agri-evergreen pt-2">
            <CheckCircle2 className="h-4 w-4 text-agri-sprout" />
            <span>Commercial Price Index Shell</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
