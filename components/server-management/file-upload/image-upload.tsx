"use client";

import { useRef, useEffect, useState, type ChangeEvent, type HTMLAttributes } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "../../../lib/utils/cn";
import { toast } from "../../../lib/stores/toast-store";

interface ImageUploadProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string | null;
  onChange: (url: string | null) => void;
  /**
   * When provided, the component defers uploading to the parent.
   * On file select: creates an ObjectURL for instant preview, calls
   * onChange(objectUrl) AND onFileSelect(file).
   * On clear: calls onChange(null) AND onFileSelect(null).
   */
  onFileSelect?: (file: File | null) => void;
  aspectRatio?: "square" | "banner"; // square: 1:1, banner: 16:9
  maxSizeMB?: number;
  label?: string;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onFileSelect,
  aspectRatio = "square",
  maxSizeMB = 5,
  label,
  placeholder,
  className,
  ...props
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Revoke any outstanding ObjectURL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const revokeOldPreview = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const handleFileSelect = (file: File) => {
    // Client-side type guard
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid File", "Please upload an image file (PNG, JPG, WebP, or GIF)");
      return;
    }

    // Client-side size guard
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      toast.error("File Too Large", `Image must be smaller than ${maxSizeMB}MB`);
      return;
    }

    // Deferred-upload mode: show instant local preview, pass file to parent
    if (onFileSelect) {
      revokeOldPreview();
      const previewUrl = URL.createObjectURL(file);
      objectUrlRef.current = previewUrl;
      onChange(previewUrl);
      onFileSelect(file);
      return;
    }

    // Fallback: convert to data URL (for non-server-image contexts)
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
    fileInputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    revokeOldPreview();
    onChange(null);
    onFileSelect?.(null);
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
    if (file) {
      handleFileSelect(file);
    }
  };

  // Reset error state when value changes (new image selected)
  useEffect(() => {
    setImageError(false);
  }, [value]);

  const aspectRatioClass = aspectRatio === "square" ? "aspect-square" : "aspect-video";

  // Only treat value as valid if it's a non-empty string that looks like a URL/data/blob
  const hasValidImage = !!(
    value &&
    typeof value === "string" &&
    value.trim() !== "" &&
    !imageError
  );

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label && <label className="text-sm font-medium">{label}</label>}

      <motion.div
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          aspectRatioClass,
          isDragOver
            ? "border-blue-500 bg-blue-500/10 cursor-copy"
            : hasValidImage
              ? "border-transparent cursor-pointer"
              : "border-white/20 hover:border-white/30 cursor-pointer",
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: hasValidImage ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {hasValidImage ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img
                src={value!}
                alt="Upload preview"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
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
