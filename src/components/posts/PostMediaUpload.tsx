
import React from 'react';
import MediaDropzone from '../MediaDropzone';
import { X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface PostMediaUploadProps {
  mediaFile: File | null;
  mediaPreviewUrl: string | null;
  onFileAccepted: (file: File) => void;
  onClearMedia?: () => void;
  error?: string | null; // New prop for error display
}

const PostMediaUpload: React.FC<PostMediaUploadProps> = ({
  mediaFile,
  mediaPreviewUrl,
  onFileAccepted,
  onClearMedia,
  error
}) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">
        Media
      </label>
      
      {/* Error message alert */}
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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
      {/* Only show the MediaDropzone when there is no preview */}
      {!mediaPreviewUrl && (
        <MediaDropzone 
          onFileAccepted={onFileAccepted} 
          hidePreview={!!mediaPreviewUrl} 
        />
      )}
    </div>
  );
};

export default PostMediaUpload;
