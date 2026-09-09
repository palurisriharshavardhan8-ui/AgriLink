'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProduceListingRow, createDirectOrder } from '@/lib/services/listings';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { X, Sprout, ShoppingCart, TrendingDown, CheckCircle2, AlertCircle, User } from 'lucide-react';

interface ProduceDetailModalProps {
  listing: ProduceListingRow | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess?: () => void;
}

export const ProduceDetailModal: React.FC<ProduceDetailModalProps> = ({
  listing,
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { user } = useAuth();
  const [orderQty, setOrderQty] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !listing) return null;

  const qty = parseFloat(orderQty) || 0;
  const totalPrice = qty * listing.price_per_kg;

  let savingsPercent: number | null = null;
  if (listing.mandi_benchmark_price && listing.mandi_benchmark_price > listing.price_per_kg) {
    savingsPercent = Math.round(
      ((listing.mandi_benchmark_price - listing.price_per_kg) / listing.mandi_benchmark_price) * 100
    );
  }

  const isOwner = !!(user && listing && user.id === listing.farmer_id);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user) {
      setErrorMsg('Please sign in to place an order.');
      return;
    }

    if (isOwner) {
      setErrorMsg('Self-purchase is not allowed: Producers cannot purchase their own produce listings.');
      return;
    }

    if (qty <= 0) {
      setErrorMsg('Please enter a valid order quantity.');
      return;
    }

    if (qty > listing.available_quantity_kg) {
      setErrorMsg(`Order quantity exceeds available stock of ${listing.available_quantity_kg} kg.`);
      return;
    }

    setSubmitting(true);

    try {
      await createDirectOrder({
        listing_id: listing.id,
        quantity_kg: qty,
      });

      setSuccessMsg(`Order placed successfully for ${qty} kg of ${listing.title}!`);
      setTimeout(() => {
        if (onOrderSuccess) onOrderSuccess();
        onClose();
        setSuccessMsg(null);
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-xl p-6 bg-white shadow-2xl rounded-2xl border-agri-earth-200 max-h-[90vh] overflow-y-auto relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="sprout" className="text-xs uppercase">
              {listing.category.replace('_', ' ')}
            </Badge>
            {isOwner && (
              <Badge variant="outline" className="text-xs font-semibold text-amber-700 border-amber-300 bg-amber-50">
                Your Listing
              </Badge>
            )}
            {savingsPercent !== null && !isOwner && (
              <Badge variant="evergreen" className="text-xs gap-1">
                <TrendingDown className="h-3.5 w-3.5 text-agri-sprout-bright" />
                <span>{savingsPercent}% Direct Savings</span>
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-agri-earth-600 hover:bg-agri-earth-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Title & Image Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold text-agri-earth-900 tracking-tight">
            {listing.title}
          </h2>

          <div className="h-48 rounded-2xl bg-agri-sprout-soft/40 border border-agri-sprout-bright/30 flex items-center justify-center overflow-hidden relative">
            {listing.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.image_url}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-agri-evergreen opacity-70">
                <Sprout className="h-12 w-12 text-agri-sprout" />
                <span className="text-xs font-semibold">AgriLink Direct Produce Batch</span>
              </div>
            )}
          </div>
        </div>

        {/* Details & Producer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-agri-earth-50 p-4 rounded-xl border border-agri-earth-200 text-xs">
          <div>
            <span className="text-agri-earth-700 font-semibold block">Producer / Farmer</span>
            <div className="flex items-center gap-1.5 pt-1 font-bold text-agri-earth-900">
              <User className="h-3.5 w-3.5 text-agri-sprout" />
              <span>{listing.profiles?.full_name || 'Verified FPO Producer'}</span>
            </div>
          </div>

          <div>
            <span className="text-agri-earth-700 font-semibold block">Available Quantity</span>
            <span className="font-bold text-agri-earth-900 pt-1 block text-sm">
              {listing.available_quantity_kg} kg
            </span>
          </div>

          <div>
            <span className="text-agri-earth-700 font-semibold block">AgriLink Price</span>
            <span className="font-extrabold text-agri-evergreen text-base pt-0.5 block">
              ₹{listing.price_per_kg} / kg
            </span>
          </div>

          <div>
            <span className="text-agri-earth-700 font-semibold block">Mandi Benchmark</span>
            <span className="font-bold text-agri-earth-800 pt-0.5 block">
              {listing.mandi_benchmark_price ? `₹${listing.mandi_benchmark_price} / kg` : 'N/A'}
            </span>
          </div>
        </div>

        {listing.description && (
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-agri-earth-800">
              Batch Description
            </h4>
            <p className="text-xs text-agri-earth-700 leading-relaxed bg-white p-3 rounded-xl border border-agri-earth-100">
              {listing.description}
            </p>
          </div>
        )}

        {/* Alert Notifications */}
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

        {/* Direct Order Form or Self-Purchase Guard */}
        {isOwner ? (
          <div className="pt-4 border-t border-agri-earth-200 space-y-3">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Self-Purchase Prohibited</span>
              </div>
              <p className="text-agri-earth-700 leading-relaxed">
                You are the registered producer/seller of this produce listing (<strong>{listing.title}</strong>). Producers cannot place orders on their own listings.
              </p>
            </div>
            <div className="flex items-center justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="pt-4 border-t border-agri-earth-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-agri-earth-900 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-agri-sprout" />
              <span>Place Direct Purchase Order</span>
            </h4>

            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Input
                  label="Order Quantity (kg)"
                  type="number"
                  min="1"
                  max={listing.available_quantity_kg}
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="flex-1 pb-1">
                <span className="text-xs font-semibold text-agri-earth-700 block">Total Amount</span>
                <span className="text-lg font-black text-agri-earth-900">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
                Close
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting || listing.available_quantity_kg <= 0}
                className="gap-2 font-bold"
              >
                {submitting ? 'Processing Order...' : 'Confirm Order'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
