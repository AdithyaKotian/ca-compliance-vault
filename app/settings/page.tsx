"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Lock, Building, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/components/providers/profile-provider";

export default function SettingsPage() {
  const { profile, refreshProfile, loading: profileLoading } = useProfile();

  // Profile Edit State
  const [fullName, setFullName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Change Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error("Full name must be at least 2 characters");
      return;
    }

    if (!profile?.id) {
      toast.error("User session not found");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
        })
        .eq("id", profile.id);

      if (error) {
        toast.error(error.message || "Failed to update profile");
        return;
      }

      await refreshProfile();
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Profile update failed");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    // Validation: format and size (max 2MB)
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WEBP image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload to Supabase avatars bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        toast.error(uploadError.message || "Failed to upload avatar image");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
        })
        .eq("id", profile.id);

      if (profileError) {
        toast.error(profileError.message || "Failed to save avatar URL");
        return;
      }

      await refreshProfile();
      toast.success("Avatar updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Avatar upload failed");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    // Password complexity check
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber) {
      toast.error("Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message || "Failed to update password");
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "CA";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <DashboardShell>
      <div className="space-y-8 max-w-4xl">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Profile &amp; Settings</h1>
            <p className="text-sm text-slate-500">
              Manage your personal credentials, profile picture, and firm subscription details.
            </p>
          </div>
          <Badge variant="outline" className="text-xs uppercase font-semibold text-slate-600 bg-white">
            {profile?.role || "Firm Admin"}
          </Badge>
        </header>

        {/* Section 1: Profile Information */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-slate-700" />
              <CardTitle className="text-lg">Profile Information</CardTitle>
            </div>
            <CardDescription>
              Update your display name and photo shown across compliance records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-slate-200">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "User Avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900 text-xl font-bold text-white">
                    {getInitials(profile?.full_name)}
                  </div>
                )}
              </Avatar>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex items-center gap-2 cursor-pointer rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition-colors"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {isUploadingAvatar ? "Uploading..." : "Upload Photo"}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Allowed formats: JPG, PNG, or WEBP. Max file size: 2MB.
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Full Name *</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Email Address</label>
                  <Input
                    value={profile?.email || "admin@kotianandco.in"}
                    disabled
                    className="bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Role</label>
                  <Input
                    value={profile?.role ? profile.role.toUpperCase() : "ADMIN"}
                    disabled
                    className="bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Firm ID</label>
                  <Input
                    value={profile?.firm_id || "11111111-1111-1111-1111-111111111111"}
                    disabled
                    className="bg-slate-50 text-slate-500 font-mono text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isUpdatingProfile || profileLoading}>
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Section 2: Change Password */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-slate-700" />
              <CardTitle className="text-lg">Security &amp; Password</CardTitle>
            </div>
            <CardDescription>
              Ensure your account is protected with a secure, unique password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-700">Password Requirements:</div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${newPassword.length >= 8 ? "text-emerald-600" : "text-slate-400"}`} />
                  At least 8 characters
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}`} />
                  Upper &amp; lowercase letters
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${/[0-9]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}`} />
                  At least one numeric digit
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Section 3: Firm Information */}
        <Card className="border-slate-200 bg-slate-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-slate-700" />
              <CardTitle className="text-lg">Firm Subscription &amp; Workspace</CardTitle>
            </div>
            <CardDescription>
              Organization-wide license and workspace information (Read-only).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg bg-white p-3 border border-slate-200">
                <div className="text-xs text-slate-500">Firm Name</div>
                <div className="font-semibold text-slate-900 mt-0.5">Kotian &amp; Co.</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Chartered Accountants</div>
              </div>

              <div className="rounded-lg bg-white p-3 border border-slate-200">
                <div className="text-xs text-slate-500">Active Plan</div>
                <div className="font-semibold text-emerald-700 mt-0.5">Growth Workspace</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Unlimited Clients &amp; Storage</div>
              </div>

              <div className="rounded-lg bg-white p-3 border border-slate-200">
                <div className="text-xs text-slate-500">Member Since</div>
                <div className="font-semibold text-slate-900 mt-0.5">January 2024</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Enterprise Vault Tier</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
