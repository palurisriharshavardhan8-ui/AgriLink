'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  updateProfile,
  fetchFarmInfo,
  upsertFarmInfo,
  FarmFpoRow,
} from '@/lib/services/profile';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  User,
  Sprout,
  Building2,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  X,
} from 'lucide-react';

const ROLE_META: Record<
  string,
  { label: string; description: string; variant: 'evergreen' | 'sprout' | 'harvest' | 'sand' | 'earth' }
> = {
  farmer_fpo: {
    label: 'Farmer / FPO',
    description: 'Publish produce batches, manage listings, and fulfill buyer orders.',
    variant: 'evergreen',
  },
  consumer: {
    label: 'Consumer',
    description: 'Order fresh farm produce directly and join community neighbourhood carts.',
    variant: 'sprout',
  },
  bulk_buyer: {
    label: 'Bulk Buyer',
    description: 'Institutional procurement from FPO clusters with mandi price benchmarking.',
    variant: 'harvest',
  },
  delivery_partner: {
    label: 'Delivery Partner',
    description: 'Handle farm pickups and hyperlocal last-mile delivery routes.',
    variant: 'sand',
  },
  admin: {
    label: 'Platform Admin',
    description: 'Full ecosystem visibility, role management, and ONDC oversight.',
    variant: 'earth',
  },
};

export default function ProfilePage() {
  const { user, profile, role, refreshProfile } = useAuth();

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Farm/FPO state (only for farmer_fpo)
  const [farmInfo, setFarmInfo] = useState<FarmFpoRow | null>(null);
  const [farmLoading, setFarmLoading] = useState(false);
  const [editingFarm, setEditingFarm] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [isFpo, setIsFpo] = useState(false);
  const [farmSaving, setFarmSaving] = useState(false);
  const [farmError, setFarmError] = useState<string | null>(null);
  const [farmSuccess, setFarmSuccess] = useState(false);

  const isFarmer = role === 'farmer_fpo';

  // Sync local form state whenever the AuthContext profile changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhoneNumber(profile.phoneNumber || '');
    }
  }, [profile]);

  // Load farm info for farmer_fpo
  const loadFarmInfo = useCallback(async () => {
    if (!user || !isFarmer) return;
    setFarmLoading(true);
    try {
      const data = await fetchFarmInfo(user.id);
      setFarmInfo(data);
      if (data) {
        setOrgName(data.organization_name);
        setDistrict(data.district || '');
        setState(data.state || '');
        setIsFpo(data.is_fpo);
      }
    } catch {
      // Non-critical: silently fail, farm section will show empty
    } finally {
      setFarmLoading(false);
    }
  }, [user, isFarmer]);

  useEffect(() => {
    loadFarmInfo();
  }, [loadFarmInfo]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await updateProfile(user.id, {
        full_name: fullName.trim() || undefined,
        phone_number: phoneNumber.trim() || undefined,
      });
      await refreshProfile();
      setProfileSuccess(true);
      setEditingProfile(false);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCancelProfileEdit = () => {
    setEditingProfile(false);
    setProfileError(null);
    // Reset to current saved values
    setFullName(profile?.fullName || '');
    setPhoneNumber(profile?.phoneNumber || '');
  };

  const handleSaveFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!orgName.trim()) {
      setFarmError('Organisation name is required.');
      return;
    }
    setFarmSaving(true);
    setFarmError(null);
    setFarmSuccess(false);

    try {
      await upsertFarmInfo(user.id, {
        organization_name: orgName.trim(),
        district: district.trim() || undefined,
        state: state.trim() || undefined,
        is_fpo: isFpo,
      });
      await loadFarmInfo();
      setFarmSuccess(true);
      setEditingFarm(false);
      setTimeout(() => setFarmSuccess(false), 3000);
    } catch (err: unknown) {
      setFarmError(err instanceof Error ? err.message : 'Failed to save farm information.');
    } finally {
      setFarmSaving(false);
    }
  };

  const handleCancelFarmEdit = () => {
    setEditingFarm(false);
    setFarmError(null);
    // Reset to last saved values
    setOrgName(farmInfo?.organization_name || '');
    setDistrict(farmInfo?.district || '');
    setState(farmInfo?.state || '');
    setIsFpo(farmInfo?.is_fpo ?? false);
  };

  const roleMeta = ROLE_META[role] || ROLE_META.consumer;
  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'User';
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-earth-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-agri-earth-100 text-agri-earth-900 flex items-center justify-center font-extrabold text-xl">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-agri-earth-900">{displayName}</h1>
              <Badge variant={roleMeta.variant}>{roleMeta.label}</Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1">
              {user?.email}
              {memberSince && (
                <span className="ml-2 text-agri-earth-500">· Member since {memberSince}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {profileSuccess && (
        <div className="p-3.5 rounded-xl bg-agri-sprout-soft border border-agri-sprout-bright/40 text-agri-evergreen text-xs flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-agri-sprout shrink-0" />
          <span className="font-semibold">Profile updated successfully.</span>
        </div>
      )}
      {farmSuccess && (
        <div className="p-3.5 rounded-xl bg-agri-sprout-soft border border-agri-sprout-bright/40 text-agri-evergreen text-xs flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-agri-sprout shrink-0" />
          <span className="font-semibold">Farm / FPO information saved successfully.</span>
        </div>
      )}

      {/* Account Information Card */}
      <Card className="p-6 bg-white border-agri-earth-200 space-y-5">
        <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-agri-evergreen" />
            <h3 className="text-base font-bold text-agri-earth-900">Account Information</h3>
          </div>
          {!editingProfile && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setEditingProfile(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Button>
          )}
        </div>

        {!editingProfile ? (
          /* View Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-agri-earth-600 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Full Name
              </span>
              <p className="font-bold text-agri-earth-900">
                {profile?.fullName || (
                  <span className="text-agri-earth-500 font-normal italic">Not set</span>
                )}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-agri-earth-600 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email Address
              </span>
              <p className="font-bold text-agri-earth-900">{user?.email || '—'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-agri-earth-600 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Phone Number
              </span>
              <p className="font-bold text-agri-earth-900">
                {profile?.phoneNumber || (
                  <span className="text-agri-earth-500 font-normal italic">Not set</span>
                )}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-agri-earth-600 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Platform Role
              </span>
              <Badge variant={roleMeta.variant} className="text-xs">{roleMeta.label}</Badge>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={profileSaving}
              />
              <Input
                label="Phone Number"
                placeholder="+91 XXXXX XXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={profileSaving}
              />
            </div>

            <div className="p-3 rounded-xl bg-agri-earth-50 border border-agri-earth-200 text-xs text-agri-earth-700">
              <span className="font-semibold">Email address</span> cannot be changed here. Contact support to update it.
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleCancelProfileEdit}
                disabled={profileSaving}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="gap-1.5 text-xs font-bold"
                disabled={profileSaving}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-agri-sprout-bright" />
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Farm / FPO Information — Farmer only */}
      {isFarmer && (
        <Card className="p-6 bg-white border-agri-earth-200 space-y-5">
          <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
            <div className="flex items-center gap-2">
              <Sprout className="h-4 w-4 text-agri-evergreen" />
              <h3 className="text-base font-bold text-agri-earth-900">Farm / FPO Organisation</h3>
              {farmInfo?.is_fpo && (
                <Badge variant="evergreen" className="text-[10px]">FPO Registered</Badge>
              )}
            </div>
            {!editingFarm && !farmLoading && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  setEditingFarm(true);
                  // Pre-fill with existing data if any
                  if (farmInfo) {
                    setOrgName(farmInfo.organization_name);
                    setDistrict(farmInfo.district || '');
                    setState(farmInfo.state || '');
                    setIsFpo(farmInfo.is_fpo);
                  }
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>{farmInfo ? 'Edit' : 'Add Info'}</span>
              </Button>
            )}
          </div>

          {farmLoading && (
            <div className="py-6 text-center text-xs text-agri-earth-600 font-semibold animate-pulse">
              Loading farm information...
            </div>
          )}

          {!farmLoading && !editingFarm && farmInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-agri-earth-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Organisation Name
                </span>
                <p className="font-bold text-agri-earth-900">{farmInfo.organization_name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-agri-earth-600 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                </span>
                <p className="font-bold text-agri-earth-900">
                  {[farmInfo.district, farmInfo.state].filter(Boolean).join(', ') || (
                    <span className="text-agri-earth-500 font-normal italic">Not specified</span>
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-agri-earth-600 uppercase tracking-wider">
                  Entity Type
                </span>
                <p className="font-bold text-agri-earth-900">
                  {farmInfo.is_fpo ? 'Farmer Producer Organisation (FPO)' : 'Individual Farm'}
                </p>
              </div>
            </div>
          )}

          {!farmLoading && !editingFarm && !farmInfo && (
            <div className="py-8 text-center space-y-3 bg-agri-earth-50 rounded-xl border border-dashed border-agri-earth-300">
              <Building2 className="h-8 w-8 text-agri-earth-400 mx-auto" />
              <p className="text-xs text-agri-earth-700">
                No farm or FPO information added yet.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setEditingFarm(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Add Farm / FPO Info</span>
              </Button>
            </div>
          )}

          {editingFarm && (
            <form onSubmit={handleSaveFarm} className="space-y-4">
              {farmError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{farmError}</span>
                </div>
              )}

              <Input
                label="Organisation / Farm Name"
                placeholder="e.g. Rajasthan Kisan Samiti FPO"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                disabled={farmSaving}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="District"
                  placeholder="e.g. Jaipur"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={farmSaving}
                />
                <Input
                  label="State"
                  placeholder="e.g. Rajasthan"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={farmSaving}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isFpo ? 'bg-agri-evergreen' : 'bg-agri-earth-300'
                  } ${farmSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={() => !farmSaving && setIsFpo((v) => !v)}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      isFpo ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-xs font-semibold text-agri-earth-900">
                  Registered as Farmer Producer Organisation (FPO)
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleCancelFarmEdit}
                  disabled={farmSaving}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="gap-1.5 text-xs font-bold"
                  disabled={farmSaving}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-agri-sprout-bright" />
                  {farmSaving ? 'Saving...' : 'Save Farm Info'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* Role Information Card */}
      <Card className="p-6 bg-white border-agri-earth-200 space-y-4">
        <div className="flex items-center gap-2 border-b border-agri-earth-100 pb-3">
          <ShieldCheck className="h-4 w-4 text-agri-evergreen" />
          <h3 className="text-base font-bold text-agri-earth-900">Role & Permissions</h3>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-agri-earth-50 border border-agri-earth-200">
          <Badge variant={roleMeta.variant} className="text-xs shrink-0 mt-0.5">
            {roleMeta.label}
          </Badge>
          <div>
            <p className="text-sm font-bold text-agri-earth-900">{roleMeta.label}</p>
            <p className="text-xs text-agri-earth-700 mt-0.5 leading-relaxed">
              {roleMeta.description}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-agri-earth-500 leading-relaxed">
          Role changes require contacting the platform administrator. Your current role determines which modules and actions are available to you on AgriLink.
        </p>
      </Card>
    </div>
  );
}
