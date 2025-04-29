
import React from 'react';
import MediaDropzone from '../MediaDropzone';
import { X } from 'lucide-react';

interface PostMediaUploadProps {
  mediaFile: File | null;
  mediaPreviewUrl: string | null;
  onFileAccepted: (file: File) => void;
  onClearMedia?: () => void; // New prop for clearing media
}

const PostMediaUpload: React.FC<PostMediaUploadProps> = ({
  mediaFile,
  mediaPreviewUrl,
  onFileAccepted,
  onClearMedia
}) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">
        Media
      </label>
      {mediaPreviewUrl ? (
        <div className="relative rounded-lg overflow-hidden border mb-2">
          {mediaPreviewUrl.includes('image') || 
           mediaPreviewUrl.endsWith('.jpg') || 
           mediaPreviewUrl.endsWith('.png') || 
           mediaPreviewUrl.endsWith('.jpeg') ? (
            <img 
              src={mediaPreviewUrl} 
              alt="Preview" 
              className="w-full h-[200px] object-contain bg-black/5"
            />
          ) : (
            <video 
              src={mediaPreviewUrl} 
              controls 
              className="w-full h-[200px] object-contain bg-black/5"
            />
          )}
          {/* Add X button to remove media */}
          {onClearMedia && (
            <button 
              onClick={onClearMedia}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Remove media"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      ) : null}
      {/* Hide preview in the MediaDropzone since we're handling it above */}
      <MediaDropzone 
        onFileAccepted={onFileAccepted} 
        hidePreview={!!mediaPreviewUrl} 
      />
    </div>
  );
};

export default PostMediaUpload;
