import React, { useRef, useState } from 'react';

interface ImageUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onFilesSelected,
  maxFiles = 10,
  disabled = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = (rawFiles: FileList | File[]) => {
    const files = Array.from(rawFiles);
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError('Please select valid image files.');
      return;
    }
    if (imageFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    setError(null);
    onFilesSelected(imageFiles);

    // Reset input so the same file can be re-selected after removal
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files) processFiles(e.currentTarget.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className='space-y-2'>
      <span className='block text-sm font-semibold text-black'>
        Product Images
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-3xl border  px-6 py-8 transition cursor-pointer select-none ${
          isDragging
            ? 'border-dark-red bg-[#F4E0D4]/50'
            : 'bg-[#D9D9D9]/13 hover:border-dark-red hover:bg-[#F4E0D4]/30'
        } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <svg
          className='h-8 w-8 text-black'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5'
          />
        </svg>
        <p className='text-sm text-black'>Drag &amp; Drop images or browse</p>
        <p className='text-xs text-[#000000]/68 font-aboreto font-normal'>
          PNG, JPG, WEBP up to 10MB each ·
        </p>
        <input
          ref={inputRef}
          type='file'
          multiple
          accept='image/*'
          onChange={handleFileChange}
          disabled={disabled}
          className='hidden'
        />
      </div>
      {error && <p className='text-sm text-red-600'>{error}</p>}
    </div>
  );
};
