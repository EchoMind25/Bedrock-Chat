"use client";

import { useRef, useState, type ChangeEvent, type HTMLAttributes } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils/cn";
import { toast } from "../../../lib/stores/toast-store";
import { uploadServerImage } from "../../../app/actions/upload-server-image";

interface ImageUploadProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string | null;
  onChange: (url: string | null) => void;
  /** When provided alongside imageType, uploads to Supabase Storage via server action */
  serverId?: string;
  /** "logo" → server icon path; "banner" → server banner path */
  imageType?: "logo" | "banner";
  aspectRatio?: "square" | "banner"; // square: 1:1, banner: 16:9
  maxSizeMB?: number;
  label?: string;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  serverId,
  imageType,
  aspectRatio = "square",
  maxSizeMB = 5,
  label,
  placeholder,
  className,
  ...props
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    // Client-side type guard
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid File", "Please upload an image file (PNG, JPG, WebP, or GIF)");
      return;
    }

    // Client-side size guard — server action enforces this too
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      toast.error("File Too Large", `Image must be smaller than ${maxSizeMB}MB`);
      return;
    }

    // Server-upload path: MIME magic-byte validation, EXIF stripping, Storage upload
    if (serverId && imageType) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("serverId", serverId);
        formData.append("type", imageType);

        const result = await uploadServerImage(formData);

        if ("error" in result) {
          toast.error("Upload Failed", result.error);
          return;
        }

        onChange(result.url);
        toast.success("Image Uploaded", "Your image has been uploaded successfully");
      } catch {
        toast.error("Upload Failed", "Could not upload image. Please try again.");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Generic fallback: convert to data URL (for non-server-image contexts)
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onChange(dataUrl);
    };
    reader.onerror = () => {
      toast.error("Upload Failed", "Could not read the image file");
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("Image Removed", "The image has been cleared");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && !isUploading) {
      handleFileSelect(file);
    }
  };

  const aspectRatioClass = aspectRatio === "square" ? "aspect-square" : "aspect-video";

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label && <label className="text-sm font-medium">{label}</label>}

      <motion.div
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          aspectRatioClass,
          isUploading
            ? "border-blue-500/50 bg-blue-500/5 cursor-wait"
            : isDragOver
              ? "border-blue-500 bg-blue-500/10 cursor-copy"
              : value
                ? "border-transparent cursor-pointer"
                : "border-white/20 hover:border-white/30 cursor-pointer",
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: value || isUploading ? 1 : 1.02 }}
        whileTap={{ scale: isUploading ? 1 : 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center"
            >
              {value && (
                <img
                  src={value}
                  alt="Current"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <p className="text-sm font-medium text-white/80">Uploading…</p>
              </div>
            </motion.div>
          ) : value ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full"
            >
              <img
                src={value}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />

              {/* Overlay with clear button on hover */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 flex items-center justify-center"
              >
                <motion.button
                  type="button"
                  onClick={handleClear}
                  className="p-3 rounded-full bg-red-500/90 hover:bg-red-500 text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Remove image"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center"
            >
              <div className="p-4 rounded-full bg-white/5">
                {isDragOver ? (
                  <Upload className="w-8 h-8 text-blue-400" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-white/40" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-white/80">
                  {placeholder || "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-white/40">
                  PNG, JPG, WebP or GIF (max {maxSizeMB}MB)
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
