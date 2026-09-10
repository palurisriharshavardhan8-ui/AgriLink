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
import { VoiceListingAssistant } from '@/components/listings/VoiceListingAssistant';
import {
  VoiceExtractionData,
  normalizeExtractedQuantity,
  normalizePricePerKg,
  inferCategoryFromProduceName,
  matchMandiLocation,
} from '@/lib/services/voiceListing';
import { createCommunityCart } from '@/lib/services/communityCart';
import { X, Sprout, Upload, AlertCircle, CheckCircle2, Users, Sparkles, TrendingDown } from 'lucide-react';

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

  // Community Cart Configuration State
  const [enableCommunityCart, setEnableCommunityCart] = useState(false);
  const [communityTargetKg, setCommunityTargetKg] = useState('');
  const [communityPrice, setCommunityPrice] = useState('');
  const [communityLocality, setCommunityLocality] = useState('Kolar Sector 4 / APMC Cluster');
  const [communityClosingHours, setCommunityClosingHours] = useState('24');
  const [communityMinCommitment, setCommunityMinCommitment] = useState('2');

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

  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const handleVoiceDataExtracted = (data: VoiceExtractionData) => {
    setErrorMsg(null);

    // 1. Product Title & inferred category
    let currentCategory = category;
    if (data.product) {
      setTitle(data.product);
      const inferredCat = inferCategoryFromProduceName(data.product);
      if (inferredCat) {
        setCategory(inferredCat);
        currentCategory = inferredCat;
      }
    }

    // 2. Quantity (normalized to kg)
    if (data.quantity != null) {
      const { quantityKg: normQty } = normalizeExtractedQuantity(data.quantity, data.unit);
      if (normQty != null) {
        setQuantityKg(normQty.toString());
      }
    }

    // 3. Selling Price
    if (data.price != null) {
      const normPrice = normalizePricePerKg(data.price, data.unit);
      if (normPrice != null) {
        setPricePerKg(normPrice.toString());
      }
    }

    // 4. Mandi Location Matching
    if (data.location) {
      const matchedMandi = matchMandiLocation(data.location, currentCategory);
      if (matchedMandi) {
        setSelectedMandiId(matchedMandi);
      }
    }

    // 5. Append harvestDate, availabilityDate, or location notes into description
    const metaParts: string[] = [];
    if (data.location) metaParts.push(`Location: ${data.location}`);
    if (data.harvestDate) metaParts.push(`Harvest: ${data.harvestDate}`);
    if (data.availabilityDate) metaParts.push(`Available: ${data.availabilityDate}`);

    if (metaParts.length > 0) {
      const voiceNote = `[Voice Details] ${metaParts.join(' | ')}`;
      setDescription((prev) => (prev ? `${prev}\n${voiceNote}` : voiceNote));
    }

    setVoiceNotice('Voice details filled! Please check your details before publishing.');
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
      const listing = await createProduceListing(
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

      // Create linked Community Cart if enabled by farmer
      if (enableCommunityCart) {
        const commTarget = parseFloat(communityTargetKg) || Math.min(qty, 100);
        const commPrice = parseFloat(communityPrice) || Math.round(price * 0.9 * 2) / 2;
        const closingAt = new Date(Date.now() + parseInt(communityClosingHours || '24') * 3600 * 1000).toISOString();

        await createCommunityCart({
          listingId: listing?.id || `listing-${Date.now()}`,
          farmerId: user.id,
          title: `${title.trim()} (Community Batch)`,
          category,
          targetQuantityKg: commTarget,
          communityPrice: commPrice,
          regularPrice: price,
          locality: communityLocality,
          closingAt,
          minCommitmentKg: parseFloat(communityMinCommitment) || 2,
        });
      }

      setSuccessMsg(
        enableCommunityCart
          ? 'Produce listing & Hyperlocal Community Cart published successfully!'
          : 'Produce listing published successfully!'
      );
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
        setEnableCommunityCart(false);
        setCommunityTargetKg('');
        setCommunityPrice('');
        setSuccessMsg(null);
        setVoiceNotice(null);
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
      <Card className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl border-agri-earth-200 max-h-[90vh] overflow-y-auto overflow-x-hidden relative space-y-5">
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

        {/* AI Voice Listing Assistant */}
        <VoiceListingAssistant
          onDataExtracted={handleVoiceDataExtracted}
          disabled={submitting || !isFarmerOrAdmin}
        />

        {/* Voice Confirmation Banner */}
        {voiceNotice && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="font-semibold">{voiceNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceNotice(null)}
              className="p-1 text-amber-700 hover:text-amber-900 rounded-lg"
              title="Dismiss note"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

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
            currentMandiBenchmark={mandiBenchmark}
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
                Farmer&apos;s chosen listing price (buyers pay this rate per kg).
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

          {/* Hyperlocal Community Cart Integration Toggle & Config */}
          <div className="rounded-2xl border border-agri-sprout/40 bg-gradient-to-br from-agri-sprout/10 via-agri-earth-50 to-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-agri-sprout/20 text-agri-evergreen">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-agri-evergreen">
                      Community Cart Pooling
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-agri-sprout/30 text-agri-evergreen">
                      Bulk Pre-Order
                    </span>
                  </div>
                  <p className="text-xs text-agri-earth-700 mt-0.5">
                    Allow nearby consumers in the same locality to pool demand. Guarantees bulk sale clearance.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={enableCommunityCart}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setEnableCommunityCart(checked);
                    if (checked) {
                      if (!communityTargetKg && quantityKg) {
                        setCommunityTargetKg(String(Math.min(parseFloat(quantityKg) || 50, 100)));
                      }
                      if (!communityPrice && pricePerKg) {
                        setCommunityPrice(String(Math.round((parseFloat(pricePerKg) || 30) * 0.9 * 2) / 2));
                      }
                    }
                  }}
                  disabled={submitting || !isFarmerOrAdmin}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-agri-earth-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-agri-sprout"></div>
              </label>
            </div>

            {enableCommunityCart && (
              <div className="mt-4 pt-3 border-t border-agri-earth-200/60 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Input
                      label="Target Pool (kg)"
                      type="number"
                      step="5"
                      placeholder="e.g. 50"
                      value={communityTargetKg}
                      onChange={(e) => setCommunityTargetKg(e.target.value)}
                      required={enableCommunityCart}
                      disabled={submitting}
                    />
                    <span className="text-[10px] text-agri-earth-500 block mt-0.5">
                      Min total kg needed to unlock batch
                    </span>
                  </div>

                  <div>
                    <Input
                      label="Community Price (₹/kg)"
                      type="number"
                      step="0.5"
                      placeholder="e.g. 27"
                      value={communityPrice}
                      onChange={(e) => setCommunityPrice(e.target.value)}
                      required={enableCommunityCart}
                      disabled={submitting}
                    />
                    <span className="text-[10px] text-agri-earth-500 block mt-0.5">
                      Special wholesale rate for poolers
                    </span>
                  </div>

                  <div>
                    <Input
                      label="Min per Order (kg)"
                      type="number"
                      step="1"
                      placeholder="e.g. 2"
                      value={communityMinCommitment}
                      onChange={(e) => setCommunityMinCommitment(e.target.value)}
                      required={enableCommunityCart}
                      disabled={submitting}
                    />
                    <span className="text-[10px] text-agri-earth-500 block mt-0.5">
                      Min commitment per consumer
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-agri-earth-800 mb-1">
                      Delivery Hub / Locality
                    </label>
                    <input
                      type="text"
                      value={communityLocality}
                      onChange={(e) => setCommunityLocality(e.target.value)}
                      placeholder="e.g. Indiranagar, Bengaluru or Kolar APMC"
                      className="w-full rounded-xl border border-agri-earth-200 px-3 py-2 text-xs focus:ring-2 focus:ring-agri-sprout focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-agri-earth-800 mb-1">
                      Pool Closes In
                    </label>
                    <select
                      value={communityClosingHours}
                      onChange={(e) => setCommunityClosingHours(e.target.value)}
                      className="w-full rounded-xl border border-agri-earth-200 px-3 py-2 text-xs focus:ring-2 focus:ring-agri-sprout focus:outline-none bg-white"
                    >
                      <option value="12">12 Hours (Fast Pool)</option>
                      <option value="24">24 Hours (Recommended)</option>
                      <option value="48">48 Hours (Weekend Pool)</option>
                      <option value="72">72 Hours (Large Batch)</option>
                    </select>
                  </div>
                </div>

                {/* Pool Economics Summary */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-agri-sprout/15 border border-agri-sprout/30 text-xs text-agri-evergreen">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Projected Farmer Payout:</span>
                  </div>
                  <div className="font-mono font-bold text-sm">
                    ₹{(
                      (parseFloat(communityTargetKg) || 0) *
                      (parseFloat(communityPrice) || 0)
                    ).toLocaleString('en-IN')}
                    <span className="text-[10px] font-normal text-agri-earth-700 ml-1">
                      (for {communityTargetKg || 0} kg bulk dispatch)
                    </span>
                  </div>
                </div>
              </div>
            )}
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
