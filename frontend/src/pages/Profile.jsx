// src/pages/Profile/ProfilePage.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from "../app/axiosClient";
import { updateAuthUser } from "../features/auth/authSlice";
import { useToast } from "@/components/ui/use-toast";

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

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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
            })
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
          })
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
          <form onSubmit={handleProfileSubmit} className="space-y-4">
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
