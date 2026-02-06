// src/pages/Profile/ProfilePage.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import axiosClient from "../app/axiosClient";
import { updateAuthUser } from "../features/auth/authSlice";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const { user } = useSelector((state) => state.auth);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("profilePic", file);

      const res = await axiosClient.post(
        "/api/users/upload-profile-pic",
        formData,
      );

      if (res.data?.success) {
        const newUrl = res.data.data.profilePic;

        setProfileForm((prev) => ({ ...prev, profilePic: newUrl }));

        dispatch(updateAuthUser({ profilePic: newUrl }));

        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    username: "",
    email: "",
    profilePic: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const googleLinked = !!user?.authProviders?.some(
    (p) => p.provider === "google",
  );

  useEffect(() => {
    const oauth = params.get("oauth");
    const linked = params.get("linked");
    const provider = params.get("provider");

    if (linked === "google") {
      toast({
        title: "Google linked",
        description: "Your Google account is now connected.",
      });
      return;
    }

    if (!oauth) return;

    if (oauth === "cancelled") {
      toast({
        title: "Linking cancelled",
        description: "Google account was not linked.",
      });
    } else if (oauth === "expired") {
      toast({
        variant: "destructive",
        title: "Linking expired",
        description: "Please try linking Google again.",
      });
    } else if (oauth === "failed") {
      toast({
        variant: "destructive",
        title: "Linking failed",
        description: "Please try again.",
      });
    } else if (provider) {
      toast({
        variant: "destructive",
        title: "Linking failed",
        description: "Please try again.",
      });
    }
  }, [params, toast]);

  // Load current user from backend (in case local state is stale)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await axiosClient.get("/api/users/me");
        if (res.data?.success) {
          const u = res.data.data;
          setProfileForm({
            fullName: u.fullName || "",
            username: u.username || "",
            email: u.email || "",
            profilePic: u.profilePic || "",
          });

          // also sync with redux
          dispatch(
            updateAuthUser({
              fullName: u.fullName,
              username: u.username,
              email: u.email,
              profilePic: u.profilePic,
              role: u.role,
              authProviders: u.authProviders || [],
            }),
          );
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast({
          title: "Error loading profile",
          description:
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message,
          variant: "destructive",
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [dispatch, toast]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const res = await axiosClient.patch("/api/users/profile", profileForm);
      if (res.data?.success) {
        const updatedUser = res.data.data;

        dispatch(
          updateAuthUser({
            fullName: updatedUser.fullName,
            username: updatedUser.username,
            email: updatedUser.email,
            profilePic: updatedUser.profilePic,
            role: updatedUser.role,
          }),
        );

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Profile update failed",
        description:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message,
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);

    try {
      const res = await axiosClient.patch("/api/users/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.data?.success) {
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully.",
        });

        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      toast({
        title: "Password update failed",
        description:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message,
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLinkGoogle = () => {
    window.location.href = `${API_BASE}/api/auth/oauth/google/link/start`;
  };

  const handleUnlinkGoogle = async () => {
    try {
      const res = await axiosClient.delete("/api/auth/oauth/google/unlink");
      if (res.data?.success) {
        const remaining = (user?.authProviders || []).filter(
          (p) => p.provider !== "google",
        );
        dispatch(updateAuthUser({ authProviders: remaining }));
        toast({
          title: "Google unlinked",
          description: "Your Google account has been unlinked.",
        });
      }
    } catch (error) {
      toast({
        title: "Unlink failed",
        description:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* PROFILE INFO */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            View and update your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-5 space-y-3">
            <p className="text-sm font-medium">Connected accounts</p>
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm">
                <p className="font-medium">Google</p>
                <p className="text-xs text-muted-foreground">
                  {googleLinked ? "Connected" : "Not connected"}
                </p>
              </div>
              {googleLinked ? (
                <Button
                  variant="destructive"
                  type="button"
                  onClick={handleUnlinkGoogle}
                >
                  Unlink
                </Button>
              ) : (
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleLinkGoogle}
                >
                  Link Google
                </Button>
              )}
            </div>
            <Separator />
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={profileForm.profilePic}
                    alt={profileForm.fullName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl">
                    {profileForm.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Input
                    type="file"
                    id="profile-picture-upload"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleProfilePictureUpload}
                    disabled={uploadingImage || loadingProfile}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("profile-picture-upload")?.click()
                    }
                    disabled={uploadingImage || loadingProfile}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      "Change Photo"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={profileForm.fullName}
                onChange={handleProfileChange}
                placeholder="Your full name"
                disabled={loadingProfile || savingProfile}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={profileForm.username}
                onChange={handleProfileChange}
                placeholder="Your username"
                disabled={loadingProfile || savingProfile}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                placeholder="you@example.com"
                disabled={loadingProfile || savingProfile}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profilePic">Profile Picture URL</Label>
              <Input
                id="profilePic"
                name="profilePic"
                value={profileForm.profilePic}
                onChange={handleProfileChange}
                placeholder="https://..."
                disabled={loadingProfile || savingProfile}
              />
            </div>

            <Button type="submit" disabled={savingProfile || loadingProfile}>
              {savingProfile ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* CHANGE PASSWORD */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                disabled={changingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                disabled={changingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                disabled={changingPassword}
              />
            </div>

            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? "Updating..." : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
