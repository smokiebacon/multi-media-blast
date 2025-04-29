
import React from 'react';
import MediaDropzone from '../MediaDropzone';

interface PostMediaUploadProps {
  mediaFile: File | null;
  mediaPreviewUrl: string | null;
  onFileAccepted: (file: File) => void;
}

const PostMediaUpload: React.FC<PostMediaUploadProps> = ({
  mediaFile,
  mediaPreviewUrl,
  onFileAccepted
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
