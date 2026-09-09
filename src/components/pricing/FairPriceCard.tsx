'use client';

import React, { useState } from 'react';
import {
  FairPriceRecommendation,
  getAvailableMandiLocations,
} from '@/lib/services/fairPrice';
import { ProduceCategory } from '@/types/database.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  TrendingUp,
  Scale,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface FairPriceCardProps {
  recommendation: FairPriceRecommendation;
  category: ProduceCategory;
  selectedMandiId: string;
  onSelectMandi: (mandiId: string) => void;
  onAcceptFairPrice: (suggestedPrice: number, benchmarkPrice: number) => void;
  currentPricePerKg: string;
  quantityKg: number;
}

export const FairPriceCard: React.FC<FairPriceCardProps> = ({
  recommendation,
  category,
  selectedMandiId,
  onSelectMandi,
  onAcceptFairPrice,
  currentPricePerKg,
  quantityKg,
}) => {
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);

  const availableMarkets = getAvailableMandiLocations(category);
  const currentPriceNum = parseFloat(currentPricePerKg);
  const isApplied = !isNaN(currentPriceNum) && Math.abs(currentPriceNum - recommendation.suggestedPricePerKg) < 0.01;
  const isOverridden = !isNaN(currentPriceNum) && currentPriceNum > 0 && !isApplied;

  const {
    mandiRate,
    mandiBenchmarkPricePerKg,
    suggestedPricePerKg,
    directProducerMarginPerKg,
    directProducerMarginPercent,
    totalEstimatedFarmerPayout,
    estimatedBuyerSavingsPercent,
    calculationBasis,
    dataSourceLabel,
  } = recommendation;

  return (
    <Card className="p-4 bg-gradient-to-br from-agri-sprout-soft/30 via-white to-agri-harvest-soft/20 border-agri-sprout-bright/40 rounded-2xl shadow-sm space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-agri-earth-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-agri-evergreen text-white flex items-center justify-center font-bold">
            <Scale className="h-4 w-4 text-agri-sprout-bright" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-agri-earth-900 leading-none">
                AgriLink Fair Price Engine
              </h3>
              <Badge variant="sprout" className="text-[9px] py-0 px-1.5 gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                <span>SIH26033 Benchmark</span>
              </Badge>
            </div>
            <p className="text-[11px] text-agri-earth-700 mt-0.5">
              Transparent Mandi price discovery eliminating middleman margin
            </p>
          </div>
        </div>

        {/* Status indicator badge */}
        <div>
          {isApplied ? (
            <Badge variant="evergreen" className="text-[10px] gap-1 py-1">
              <CheckCircle2 className="h-3 w-3 text-agri-sprout-bright" />
              <span>Fair Price Applied</span>
            </Badge>
          ) : isOverridden ? (
            <Badge variant="harvest" className="text-[10px] py-1">
              <span>Custom Price: ₹{currentPriceNum}/kg</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] py-1 text-agri-earth-700">
              Recommendation Ready
            </Badge>
          )}
        </div>
      </div>

      {/* Market / Location Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-agri-earth-200/80 text-xs">
        <div className="flex items-center gap-1.5 text-agri-earth-700">
          <Building2 className="h-3.5 w-3.5 text-agri-sprout shrink-0" />
          <span className="font-semibold text-agri-earth-900">Reference Mandi:</span>
          <span className="truncate max-w-[200px] sm:max-w-[260px] font-medium" title={mandiRate.mandiName}>
            {mandiRate.mandiName} ({mandiRate.district}, {mandiRate.state})
          </span>
        </div>

        {availableMarkets.length > 1 && (
          <select
            value={selectedMandiId || mandiRate.id}
            onChange={(e) => onSelectMandi(e.target.value)}
            className="text-xs rounded-lg border border-agri-earth-200 bg-agri-earth-50 px-2 py-1 font-semibold text-agri-earth-800 focus:outline-none focus:ring-1 focus:ring-agri-sprout cursor-pointer"
          >
            {availableMarkets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Primary Metrics Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Mandi Modal Price */}
        <div className="bg-white p-3 rounded-xl border border-agri-earth-200 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-agri-earth-600 font-semibold">
            <span>Mandi Modal Benchmark</span>
            <Building2 className="h-3 w-3 text-agri-harvest" />
          </div>
          <div className="text-lg font-black text-agri-earth-900">
            ₹{mandiBenchmarkPricePerKg.toFixed(2)} <span className="text-xs font-normal text-agri-earth-600">/ kg</span>
          </div>
          <p className="text-[10px] text-agri-earth-500">
            ₹{mandiRate.modalPricePerQuintal.toLocaleString('en-IN')}/quintal (APMC)
          </p>
        </div>

        {/* Direct Trade Margin */}
        <div className="bg-white p-3 rounded-xl border border-agri-earth-200 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-agri-earth-600 font-semibold">
            <span>Direct Producer Surplus</span>
            <TrendingUp className="h-3 w-3 text-agri-sprout" />
          </div>
          <div className="text-lg font-black text-agri-sprout-dark">
            +{directProducerMarginPercent}%
          </div>
          <p className="text-[10px] text-agri-earth-600">
            +₹{directProducerMarginPerKg.toFixed(2)}/kg over raw mandi
          </p>
        </div>

        {/* AgriLink Suggested Fair Price */}
        <div className="bg-agri-sprout-soft/40 p-3 rounded-xl border border-agri-sprout-bright/60 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-agri-evergreen font-bold">
            <span>Suggested Fair Price</span>
            <Scale className="h-3 w-3 text-agri-evergreen" />
          </div>
          <div className="text-xl font-black text-agri-evergreen">
            ₹{suggestedPricePerKg.toFixed(2)} <span className="text-xs font-normal text-agri-evergreen">/ kg</span>
          </div>
          <p className="text-[10px] text-agri-evergreen/80 font-medium">
            Est. Payout: ₹{totalEstimatedFarmerPayout.toLocaleString('en-IN')} ({quantityKg || 1} kg)
          </p>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={() => setShowCalculationDetails(!showCalculationDetails)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-agri-earth-700 hover:text-agri-evergreen transition-colors"
        >
          <Info className="h-3.5 w-3.5 text-agri-sprout" />
          <span>{showCalculationDetails ? 'Hide Calculation Basis' : 'View Transparent Calculation Basis'}</span>
          {showCalculationDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <Button
          type="button"
          variant={isApplied ? 'outline' : 'primary'}
          size="sm"
          onClick={() => onAcceptFairPrice(suggestedPricePerKg, mandiBenchmarkPricePerKg)}
          className="gap-1.5 text-xs font-bold shrink-0 shadow-sm"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-agri-sprout-bright" />
          <span>
            {isApplied ? 'Fair Price Applied (₹' + suggestedPricePerKg.toFixed(2) + '/kg)' : 'Apply Suggested Fair Price (₹' + suggestedPricePerKg.toFixed(2) + '/kg)'}
          </span>
        </Button>
      </div>

      {/* Transparent Calculation Breakdown Drawer */}
      {showCalculationDetails && (
        <div className="bg-white p-3 rounded-xl border border-agri-earth-200 text-xs space-y-2.5 animate-in fade-in duration-200">
          <div className="font-bold text-agri-earth-900 border-b border-agri-earth-100 pb-1.5 flex items-center justify-between">
            <span>Deterministic Pricing Breakdown</span>
            <span className="text-[10px] font-normal text-agri-earth-600">
              Buyer Savings: ~{estimatedBuyerSavingsPercent}% vs APMC retail max
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            {calculationBasis.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="font-bold text-agri-evergreen min-w-[18px]">{idx + 1}.</span>
                <div>
                  <span className="font-bold text-agri-earth-900">{step.step}: </span>
                  <span className="text-agri-earth-700">{step.description}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-agri-earth-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-agri-earth-600">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-agri-sprout" />
              <span>{mandiRate.mandiName}, {mandiRate.state}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-agri-harvest" />
              <span>Baseline Recorded: {mandiRate.recordedDate}</span>
            </span>
          </div>
        </div>
      )}

      {/* Data Source & Evaluation Disclaimer */}
      <div className="text-[10px] text-agri-earth-600 flex items-center justify-between px-1 pt-0.5">
        <span className="font-medium truncate max-w-[320px] sm:max-w-none">
          {dataSourceLabel}
        </span>
        <span className="italic text-agri-earth-500 shrink-0">
          Deterministic Algorithm
        </span>
      </div>
    </Card>
  );
};
