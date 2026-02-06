import React, { useRef, useState } from "react";
import axiosClient from "@/app/axiosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Trash2, Upload } from "lucide-react";

export default function EventBannerUploader({
  label = "Event Banner",
  value,
  onChange,
  disabled = false,
  onBusyChange,
}) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const busy = uploading || deleting;

  const setBusy = (nextUploading, nextDeleting) => {
    const nextBusy = !!nextUploading || !!nextDeleting;
    onBusyChange?.(nextBusy);
  };

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateFile = (file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return false;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast({
        title: "Image is too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const deleteBanner = async (urlToDelete) => {
    if (!urlToDelete) return;
    try {
      setDeleting(true);
      setBusy(uploading, true);

      const res = await axiosClient.post(
        "/api/events/delete-event-banner-cloudinary",
        {
          eventPicUrl: urlToDelete,
        }
      );

      if (res.data?.success) {
        onChange?.("");
        clearFileInput();
        toast({
          title: "Banner deleted",
          description: "Event banner has been deleted successfully.",
        });
      } else {
        throw new Error(res.data?.message || "Failed to delete banner");
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setBusy(uploading, false);
    }
  };

  const uploadBanner = async (file) => {
    if (!file) return;
    if (!validateFile(file)) return;

    try {
      setBusy(true, deleting);
      if (value) {
        await deleteBanner(value);
      }

      setUploading(true);

      const formData = new FormData();
      formData.append("eventPic", file);

      const res = await axiosClient.post(
        "/api/events/upload-event-profile-pic",
        formData
      );

      if (res.data?.success) {
        const newUrl = res.data?.data?.eventPic;
        onChange?.(newUrl || "");
        clearFileInput();
        toast({
          title: "Banner uploaded",
          description: "Event banner has been uploaded successfully.",
        });
      } else {
        throw new Error(res.data?.message || "Upload failed");
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setBusy(false, deleting);
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadBanner(file);
  };

  return (
    <div className="flex flex-col space-y-2">
      <Label>{label}</Label>

      {value ? (
        <div className="flex items-center gap-4">
          <img
            src={value}
            alt="Event Banner"
            className="h-40 w-auto rounded-md border object-cover"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => deleteBanner(value)}
            disabled={disabled || busy}
            className="text-red-600 hover:text-red-700"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg, image/jpg, image/png, image/webp"
          onChange={onFileChange}
          disabled={disabled || busy}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : value ? (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Change photo
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Choose a photo
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
