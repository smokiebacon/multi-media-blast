
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import { uploadFileToStorage, uploadToYouTube } from '@/utils/mediaUpload';

// Import shared components
import PostFormFields from './posts/PostFormFields';
import PostMediaUpload from './posts/PostMediaUpload';
import PostSubmitButton from './posts/PostSubmitButton';
import AccountSelector from './post/AccountSelector';
import PostScheduler from './post/PostScheduler';
import UploadStatusModal from './posts/UploadStatusModal';

interface Upload {
  id: string;
  platform: string;
  status: string; // 'pending', 'uploading', 'completed', 'failed'
  message?: string;
}

interface PostFormProps {
  onUploadStart?: (upload: {id: string, platform: string, status: string}) => void;
  onUploadUpdate?: (id: string, status: string) => void;
}

const PostForm: React.FC<PostFormProps> = ({ onUploadStart, onUploadUpdate }) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add state for uploads and modal
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { platformAccounts } = usePlatformAccounts(user?.id);

  const handleMediaFileAccepted = (file: File) => {
    setMediaFile(file);
    const previewUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(previewUrl);
  };

  const handleUploadStart = (upload: {id: string, platform: string, status: string}) => {
    setUploads(prev => [...prev, upload]);
    setIsStatusModalOpen(true);
    onUploadStart?.(upload);
  };

  const handleUploadUpdate = (id: string, status: string) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === id ? { ...upload, status } : upload
      )
    );
    onUploadUpdate?.(id, status);
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId) 
        : [...prev, accountId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please login to create posts.",
        variant: "destructive",
      });
      return;
    }
    
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your post.",
        variant: "destructive",
      });
      return;
    }
    
    if (!mediaFile) {
      toast({
        title: "No media selected",
        description: "Please upload an image or video first.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedAccounts.length === 0) {
      toast({
        title: "No accounts selected",
        description: "Please select at least one account to post to.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    // Clear previous upload status
    setUploads([]);
    
    try {
      const mediaUrl = await uploadFileToStorage(mediaFile, user.id);
      if (!mediaUrl) {
        throw new Error("Failed to upload media file");
      }
      
      const selectedPlatformAccounts = platformAccounts.filter(account => 
        selectedAccounts.includes(account.id)
      );
      
      const uploadPromises = [];
      const uploadResults = [];
      
      for (const account of selectedPlatformAccounts) {
        if (account.platform_id === 'youtube') {
          const isVideo = mediaFile.type.startsWith('video/');
          if (isVideo) {
            uploadPromises.push(
              uploadToYouTube(
                account.id, 
                mediaUrl, 
                title, 
                caption, 
                platformAccounts,
                handleUploadStart,
                handleUploadUpdate
              ).then(result => {
                uploadResults.push({
                  platform: 'youtube',
                  account: account.account_name,
                  success: result.success,
                  url: result.videoUrl || null,
                  error: result.error || null
                });
                return result;
              })
            );
          } else {
            toast({
              title: "YouTube upload skipped",
              description: `YouTube only accepts video files. Your image was not uploaded to ${account.account_name}.`,
              variant: "default"
            });
          }
        }
      }
      
      if (uploadPromises.length > 0) {
        await Promise.allSettled(uploadPromises);
      }
      
      const status = selectedDate ? 'scheduled' : 'published';
      
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        title: title,
        content: caption,
        media_urls: [mediaUrl],
        platforms: [...new Set(selectedPlatformAccounts.map(account => account.platform_id))],
        status: status,
        scheduled_for: selectedDate ? selectedDate.toISOString() : null,
        published_at: !selectedDate ? new Date().toISOString() : null,
      });
      
      if (error) throw error;
      
      const successfulUploads = uploadResults.filter(r => r.success).length;
      const failedUploads = uploadResults.filter(r => !r.success).length;
      
      toast({
        title: selectedDate ? "Post scheduled!" : "Post published!",
        description: `${successfulUploads} successful uploads, ${failedUploads} failed uploads.`,
        variant: successfulUploads > 0 ? "default" : "destructive",
      });
      
      // Reset form
      setMediaFile(null);
      setMediaPreviewUrl(null);
      setCaption('');
      setTitle('');
      setSelectedDate(undefined);
      setSelectedAccounts([]);
    } catch (error) {
      console.error('Error posting:', error);
      toast({
        title: "Post failed",
        description: "There was an error publishing your post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = !!title.trim() && !!mediaFile && selectedAccounts.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border">
        <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
        
        <PostFormFields 
          title={title}
          setTitle={setTitle}
          caption={caption}
          setCaption={setCaption}
        />
        
        <PostMediaUpload 
          mediaFile={mediaFile}
          mediaPreviewUrl={mediaPreviewUrl}
          onFileAccepted={handleMediaFileAccepted}
        />
        
        <PostScheduler 
          selectedDate={selectedDate} 
          onDateChange={setSelectedDate} 
        />
        
        <AccountSelector 
          platformAccounts={platformAccounts}
          selectedAccounts={selectedAccounts}
          onToggleAccount={toggleAccount}
        />
        
        <PostSubmitButton 
          isSubmitting={isSubmitting}
          isValid={isValid}
          isScheduled={!!selectedDate}
          actionText="Post"
        />

      </div>

      {/* Upload Status Modal */}
      <UploadStatusModal 
        isOpen={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        uploads={uploads}
      />
    </form>
  );
};

export default PostForm;
