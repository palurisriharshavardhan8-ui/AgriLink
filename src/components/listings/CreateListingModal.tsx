'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createProduceListing } from '@/lib/services/listings';
import { calculateFairPrice } from '@/lib/services/fairPrice';
import { ProduceCategory } from '@/types/database.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { FairPriceCard } from '@/components/pricing/FairPriceCard';
import { X, Sprout, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_OPTIONS: { id: ProduceCategory; label: string }[] = [
  { id: 'vegetables', label: 'Fresh Vegetables' },
  { id: 'fruits', label: 'Fresh Fruits' },
  { id: 'grains_pulses', label: 'Grains & Pulses' },
  { id: 'spices', label: 'Organic Spices' },
  { id: 'dairy_other', label: 'Dairy & Other' },
];

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, role } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProduceCategory>('vegetables');
  const [pricePerKg, setPricePerKg] = useState('');
  const [mandiBenchmark, setMandiBenchmark] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedMandiId, setSelectedMandiId] = useState('');

  // Dynamically compute deterministic fair price recommendation
  const fairPriceRecommendation = useMemo(() => {
    return calculateFairPrice({
      category,
      produceName: title,
      quantityKg: parseFloat(quantityKg) || 1,
      location: selectedMandiId || undefined,
    });
  }, [category, title, quantityKg, selectedMandiId]);

  const handleAcceptFairPrice = (suggestedPrice: number, benchmarkPrice: number) => {
    setPricePerKg(suggestedPrice.toString());
    setMandiBenchmark(benchmarkPrice.toString());
  };

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isFarmerOrAdmin = role === 'farmer_fpo' || role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user) {
      setErrorMsg('You must be signed in to create a listing.');
      return;
    }

    if (!isFarmerOrAdmin) {
      setErrorMsg('Only registered Farmer / FPO accounts can create produce listings.');
      return;
    }

    const price = parseFloat(pricePerKg);
    const qty = parseFloat(quantityKg);
    const mandi = mandiBenchmark ? parseFloat(mandiBenchmark) : undefined;

    if (isNaN(price) || price <= 0) {
      setErrorMsg('Please enter a valid price per kg.');
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Please enter a valid available quantity in kg.');
      return;
    }

    setSubmitting(true);

    try {
      await createProduceListing(
        user.id,
        {
          title: title.trim(),
          category,
          price_per_kg: price,
          mandi_benchmark_price: mandi,
          available_quantity_kg: qty,
          description: description.trim() || undefined,
        },
        imageFile
      );

      setSuccessMsg('Produce listing published successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset form
        setTitle('');
        setPricePerKg('');
        setMandiBenchmark('');
        setQuantityKg('');
        setDescription('');
        setImageFile(null);
        setSelectedMandiId('');
        setSuccessMsg(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish listing.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl border-agri-earth-200 max-h-[90vh] overflow-y-auto relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-agri-sprout-soft text-agri-evergreen flex items-center justify-center font-bold">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-agri-earth-900 leading-none">
                List Produce Batch
              </h2>
              <p className="text-xs text-agri-earth-700 mt-1">
                Direct trade listing with Mandi benchmark price
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-agri-earth-600 hover:bg-agri-earth-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Warning if not Farmer */}
        {!isFarmerOrAdmin && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              You are currently logged in as <strong>{role}</strong>. Creating listings is restricted to Producer accounts (`farmer_fpo`).
            </span>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-agri-sprout-soft border border-agri-sprout-bright/40 text-agri-evergreen text-xs flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-agri-sprout shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Produce Title / Name"
            placeholder="e.g. Organic Alphanso Mangoes or Fresh Tomatoes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={submitting || !isFarmerOrAdmin}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-agri-earth-800 mb-1.5">
              Produce Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id);
                    setSelectedMandiId('');
                  }}
                  disabled={submitting || !isFarmerOrAdmin}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                    category === cat.id
                      ? 'border-agri-evergreen bg-agri-sprout-soft text-agri-evergreen ring-1 ring-agri-evergreen'
                      : 'border-agri-earth-200 bg-white text-agri-earth-800 hover:border-agri-earth-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Available Stock Quantity (kg)"
            type="number"
            placeholder="e.g. 500"
            value={quantityKg}
            onChange={(e) => setQuantityKg(e.target.value)}
            required
            disabled={submitting || !isFarmerOrAdmin}
          />

          {/* AgriLink Fair Price Engine Component */}
          <FairPriceCard
            recommendation={fairPriceRecommendation}
            category={category}
            selectedMandiId={selectedMandiId}
            onSelectMandi={(mandiId) => setSelectedMandiId(mandiId)}
            onAcceptFairPrice={handleAcceptFairPrice}
            currentPricePerKg={pricePerKg}
            quantityKg={parseFloat(quantityKg) || 1}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Selling Price (₹ per kg)"
                type="number"
                step="0.5"
                placeholder="e.g. 35"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                required
                disabled={submitting || !isFarmerOrAdmin}
              />
              <span className="text-[10px] text-agri-earth-600 block mt-1">
                Accepted from Fair Price recommendation or manually customized.
              </span>
            </div>

            <div>
              <Input
                label="Mandi Benchmark (₹ per kg)"
                type="number"
                step="0.5"
                placeholder="e.g. 32 (optional)"
                value={mandiBenchmark}
                onChange={(e) => setMandiBenchmark(e.target.value)}
                disabled={submitting || !isFarmerOrAdmin}
              />
              <span className="text-[10px] text-agri-earth-600 block mt-1">
                APMC reference benchmark used for buyer direct savings index.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-agri-earth-800 mb-1.5">
              Batch Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Describe farming techniques, harvest date, quality grade..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting || !isFarmerOrAdmin}
              className="w-full rounded-xl border border-agri-earth-200 p-3 text-xs focus:ring-2 focus:ring-agri-sprout focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-agri-earth-800 mb-1.5">
              Produce Image (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl border border-agri-earth-200 bg-agri-earth-50 text-xs font-medium text-agri-earth-800 hover:bg-agri-earth-100 transition-colors">
                <Upload className="h-4 w-4 text-agri-sprout" />
                <span>{imageFile ? imageFile.name : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={submitting || !isFarmerOrAdmin}
                />
              </label>
              {imageFile && (
                <Badge variant="outline" className="text-[10px]">
                  {(imageFile.size / 1024).toFixed(0)} KB
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-agri-earth-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting || !isFarmerOrAdmin}
              className="gap-2 font-bold"
            >
              {submitting ? 'Publishing...' : 'Publish Listing'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
