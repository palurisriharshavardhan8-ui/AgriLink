'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchProduceListings, ProduceListingRow } from '@/lib/services/listings';
import { CreateListingModal } from '@/components/listings/CreateListingModal';
import { ProduceDetailModal } from '@/components/listings/ProduceDetailModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Store,
  Search,
  Filter,
  Sprout,
  ArrowRight,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  X,
  PackageX,
} from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Produce' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'grains_pulses', label: 'Grains & Pulses' },
  { id: 'spices', label: 'Organic Spices' },
  { id: 'dairy_other', label: 'Dairy & Other' },
];

export default function MarketplacePage() {
  const { user, role } = useAuth();

  const [listings, setListings] = useState<ProduceListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedListingDetail, setSelectedListingDetail] = useState<ProduceListingRow | null>(null);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchProduceListings({
        category: selectedCategory,
        search: searchTerm,
      });
      setListings(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load produce listings.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadListings();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadListings]);

  // Client side max price filter if applied
  const filteredListings = listings.filter((item) => {
    if (maxPrice && parseFloat(maxPrice) > 0) {
      return item.price_per_kg <= parseFloat(maxPrice);
    }
    return true;
  });

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Module Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-earth-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-agri-sprout-soft text-agri-evergreen flex items-center justify-center">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-agri-earth-900">
                Produce Marketplace
              </h1>
              <Badge variant="sprout">Direct Trade Active</Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1">
              Direct Farmer & FPO produce listings with fair mandi price benchmarks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={showFilterDrawer ? 'primary' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2 font-bold shadow-sm"
            onClick={handleOpenCreateModal}
          >
            <Sprout className="h-4 w-4 text-agri-sprout-bright" />
            <span>List Produce</span>
          </Button>
        </div>
      </div>

      {/* Filter Control Drawer / Panel */}
      {showFilterDrawer && (
        <Card className="p-4 bg-agri-earth-50 border-agri-earth-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <span className="text-xs font-bold text-agri-earth-900">Max Price Filter (₹/kg):</span>
            <Input
              type="number"
              placeholder="e.g. 100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-32 h-8 text-xs bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-agri-earth-700"
              onClick={() => {
                setMaxPrice('');
                setSelectedCategory('all');
                setSearchTerm('');
              }}
            >
              Reset Filters
            </Button>
            <button
              onClick={() => setShowFilterDrawer(false)}
              className="p-1 rounded-lg text-agri-earth-600 hover:bg-agri-earth-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <Badge
                key={tab.id}
                variant={isActive ? 'evergreen' : 'outline'}
                onClick={() => setSelectedCategory(tab.id)}
                className="cursor-pointer py-1.5 px-3 text-xs font-semibold whitespace-nowrap transition-all"
              >
                {tab.label}
              </Badge>
            );
          })}
        </div>

        <div className="w-full sm:w-80 relative">
          <Input
            placeholder="Search produce name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs h-9 pl-9"
          />
          <Search className="h-4 w-4 text-agri-earth-700 absolute left-3 top-2.5 pointer-events-none" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-xs text-agri-earth-500 hover:text-agri-earth-900"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <Card className="p-6 bg-red-50 border-red-200 text-red-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>Error Loading Marketplace Data</span>
          </div>
          <p className="text-xs leading-relaxed">{errorMsg}</p>
          <Button variant="outline" size="sm" onClick={loadListings} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </Button>
        </Card>
      )}

      {/* Loading Skeleton Grid */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-agri-earth-100 rounded-lg" />
                <div className="h-4 w-16 bg-agri-earth-100 rounded-lg" />
              </div>
              <div className="h-36 rounded-xl bg-agri-earth-100" />
              <div className="h-5 w-3/4 bg-agri-earth-100 rounded-lg" />
              <div className="h-3 w-full bg-agri-earth-100 rounded-lg" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !errorMsg && filteredListings.length === 0 && (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4 bg-white border-dashed border-agri-earth-300">
          <div className="h-16 w-16 rounded-3xl bg-agri-sprout-soft text-agri-evergreen flex items-center justify-center">
            <PackageX className="h-8 w-8 text-agri-sprout" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-lg font-bold text-agri-earth-900">No Produce Listings Found</h3>
            <p className="text-xs text-agri-earth-700 leading-relaxed">
              {searchTerm || selectedCategory !== 'all' || maxPrice
                ? 'No produce listings match your active search or filter criteria. Try resetting filters.'
                : 'Be the first producer to publish a direct produce batch on AgriLink!'}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            {(searchTerm || selectedCategory !== 'all' || maxPrice) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                  setMaxPrice('');
                }}
              >
                Clear All Filters
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="gap-2 font-bold">
              <Sprout className="h-4 w-4 text-agri-sprout-bright" />
              <span>List Produce Batch</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Dynamic Produce Grid */}
      {!loading && !errorMsg && filteredListings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => {
            let savingsPercent: number | null = null;
            if (item.mandi_benchmark_price && item.mandi_benchmark_price > item.price_per_kg) {
              savingsPercent = Math.round(
                ((item.mandi_benchmark_price - item.price_per_kg) / item.mandi_benchmark_price) * 100
              );
            }

            return (
              <Card key={item.id} hoverEffect className="space-y-4 flex flex-col justify-between bg-white border-agri-earth-200">
                <div className="space-y-3">
                  {/* Category & Badge Header */}
                  <div className="flex items-center justify-between">
                    <Badge variant="sprout" className="text-[10px] uppercase">
                      {item.category.replace('_', ' ')}
                    </Badge>
                    {savingsPercent !== null && (
                      <Badge variant="evergreen" className="text-[10px] gap-1">
                        <TrendingDown className="h-3 w-3 text-agri-sprout-bright" />
                        <span>{savingsPercent}% Save</span>
                      </Badge>
                    )}
                  </div>

                  {/* Produce Image / Placeholder */}
                  <div className="h-36 rounded-xl bg-agri-sprout-soft/30 border border-agri-sprout-bright/20 flex items-center justify-center overflow-hidden relative">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-agri-evergreen opacity-75">
                        <Sprout className="h-8 w-8 text-agri-sprout" />
                        <span className="text-[10px] font-semibold">AgriLink Direct Produce</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Farmer */}
                  <div>
                    <h3 className="text-base font-extrabold text-agri-earth-900 leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-agri-earth-700 mt-1">
                      By: <span className="font-semibold">{item.profiles?.full_name || 'Verified FPO Producer'}</span>
                    </p>
                  </div>

                  {/* Pricing Info */}
                  <div className="flex items-baseline justify-between pt-1 border-t border-agri-earth-100">
                    <div>
                      <span className="text-[10px] text-agri-earth-700 uppercase font-semibold block">Selling Price</span>
                      <span className="text-lg font-black text-agri-evergreen">₹{item.price_per_kg} / kg</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-agri-earth-700 uppercase font-semibold block">Mandi Benchmark</span>
                      <span className="text-xs font-bold text-agri-earth-800">
                        {item.mandi_benchmark_price ? `₹${item.mandi_benchmark_price}/kg` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-agri-earth-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-agri-earth-800">
                    Stock: {item.available_quantity_kg} kg
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs font-semibold"
                    onClick={() => setSelectedListingDetail(item)}
                  >
                    <span>View Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Listing Modal */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadListings}
      />

      {/* Produce Detail Modal */}
      <ProduceDetailModal
        listing={selectedListingDetail}
        isOpen={!!selectedListingDetail}
        onClose={() => setSelectedListingDetail(null)}
        onOrderSuccess={loadListings}
      />
    </div>
  );
}
