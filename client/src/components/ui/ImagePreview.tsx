import React from 'react';

interface ImagePreviewProps {
  images: string[];
  onRemove?: (index: number) => void;
  readOnly?: boolean;
  title?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  onRemove,
  readOnly = false,
  title,
}) => {
  if (images.length === 0) return null;

  return (
    <div className='space-y-2'>
      <span className='block text-sm font-semibold text-black'>
        {title || 'Image Preview'} ({images.length})
      </span>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
        {images.map((url, idx) => (
          <div key={idx} className='group relative overflow-hidden rounded-2xl border border-[#d5bd9d] bg-[#F7EEE1]'>
            <img
              src={url}
              alt={`Preview ${idx + 1}`}
              className='h-28 w-full object-cover'
            />
            {!readOnly && onRemove && (
              <button
                type='button'
                onClick={() => onRemove(idx)}
                className='absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-dark-red text-xs text-white opacity-0 shadow transition group-hover:opacity-100'
                title='Remove image'
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
