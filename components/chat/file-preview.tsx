'use client';

import { motion } from 'motion/react';
import { useMemo } from 'react';

interface FilePreviewProps {
  file: File;
  isUploading: boolean;
  onRemove: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreview({ file, isUploading, onRemove }: FilePreviewProps) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  const previewUrl = useMemo(() => {
    if (isImage || isVideo) return URL.createObjectURL(file);
    return null;
  }, [file, isImage, isVideo]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="mx-3 mt-3 p-3 rounded-xl flex items-center gap-3"
      style={{
        backgroundColor: 'oklch(0.15 0.02 250 / 0.8)',
        border: '1px solid oklch(0.25 0.02 285 / 0.5)',
      }}
    >
      {/* Thumbnail or file icon */}
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
        style={{ backgroundColor: 'oklch(0.2 0.02 250 / 0.5)' }}
      >
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : isVideo && previewUrl ? (
          <video src={previewUrl} className="w-full h-full object-cover" muted />
        ) : (
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/90 truncate">{file.name}</div>
        <div className="text-xs text-white/50">{formatFileSize(file.size)}</div>
      </div>

      {/* Upload spinner or remove button */}
      {isUploading ? (
        <div className="shrink-0 w-8 h-8 flex items-center justify-center">
          <motion.div
            className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/80"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          />
        </div>
      ) : (
        <button
          onClick={onRemove}
          className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Remove file"
        >
          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}
