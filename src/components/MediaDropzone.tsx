
import React, { useCallback, useState } from 'react';
import { Upload, Image, Film, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface MediaDropzoneProps {
  onFileAccepted: (file: File) => void;
  hidePreview?: boolean;
}

const MediaDropzone: React.FC<MediaDropzoneProps> = ({ 
  onFileAccepted,
  hidePreview = false
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const { toast } = useToast();
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  }, []);
  
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  }, []);
  
  const validateAndProcessFile = (file: File) => {
    if (file.type.match('image.*')) {
      setFileType('image');
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      onFileAccepted(file);
    } else if (file.type.match('video.*')) {
      setFileType('video');
      const url = URL.createObjectURL(file);
      setFilePreview(url);
      onFileAccepted(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload an image or video file.",
        variant: "destructive",
      });
    }
  };
  
  const removeFile = () => {
    setFilePreview(null);
    setFileType(null);
  };
  
  return (
    <div className="w-full">
      {!filePreview ? (
        <div 
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center focus:outline-none",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileInput}
          />
          <label 
            htmlFor="file-upload" 
            className="flex flex-col items-center cursor-pointer"
          >
            <Upload 
              className={cn(
                "h-12 w-12 mb-4",
                isDragActive ? "text-primary" : "text-muted-foreground"
              )} 
            />
            <p className="text-lg font-medium mb-1">
              Drag & drop or click to upload
            </p>
            <p className="text-sm text-muted-foreground">
              Support images and videos
            </p>
          </label>
        </div>
      ) : !hidePreview ? (
        <div className="relative rounded-lg overflow-hidden border">
          {fileType === 'image' && (
            <img 
              src={filePreview} 
              alt="Preview" 
              className="w-full h-[300px] object-contain bg-black/5"
            />
          )}
          {fileType === 'video' && (
            <video 
              src={filePreview} 
              controls 
              className="w-full h-[300px] object-contain bg-black/5"
            />
          )}
          <button 
            onClick={removeFile}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Remove file"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/30 text-white flex items-center">
            {fileType === 'image' ? (
              <Image className="h-4 w-4 mr-2" />
            ) : (
              <Film className="h-4 w-4 mr-2" />
            )}
            <span className="text-sm">
              {fileType === 'image' ? 'Image ready to post' : 'Video ready to post'}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MediaDropzone;
