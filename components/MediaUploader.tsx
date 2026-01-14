import React, { useState, useRef } from 'react';
import { Upload, Loader, Check, X } from 'lucide-react';
import { uploadMedia } from '../services/mediaService';
import { MediaUpload } from '../types';

interface MediaUploaderProps {
  userId: string;
  onMediaUploaded: (media: MediaUpload) => void;
  acceptedFormats?: string;
  maxFileSize?: number; // in MB
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  userId,
  onMediaUploaded,
  acceptedFormats = 'image/*,video/*',
  maxFileSize = 50, // 50MB default
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxFileSize) {
      setError(`File size exceeds ${maxFileSize}MB limit`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Only image and video files are supported');
      return;
    }

    setIsUploading(true);
    try {
      const media = await uploadMedia(file, userId, (percent) => {
        setUploadProgress(percent);
      });
      onMediaUploaded(media);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setUploadProgress(0);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = true;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = false;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = false;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
          dragOverRef.current
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary/2'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="w-full max-w-xs flex flex-col items-center">
            <div className="flex justify-between w-full mb-1">
               <span className="text-sm font-medium text-primary">Uploading...</span>
               <span className="text-sm font-bold text-gray-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Please wait while we process your file</p>
          </div>
        ) : success ? (
          <>
            <Check size={32} className="text-green-500 mb-2" />
            <p className="text-sm text-green-600">Uploaded successfully!</p>
          </>
        ) : (
          <>
            <Upload size={32} className="text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              Drag media here or click to upload
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max file size: {maxFileSize}MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
          <X size={16} />
          {error}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
