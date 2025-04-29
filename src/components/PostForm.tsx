import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import { uploadFileToStorage, uploadToYouTube } from '@/utils/mediaUpload';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import shared components
import PostSubmitButton from './posts/PostSubmitButton';
import PostScheduler from './post/PostScheduler';
import UploadStatusModal from './posts/UploadStatusModal';
import StepIndicator from './posts/StepIndicator';
import PostTypeStep from './posts/PostTypeStep';
import PostDetailsStep from './posts/PostDetailsStep';

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

// Set maximum file size constants (in bytes)
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

type PostType = 'media' | 'text';
const TOTAL_STEPS = 2;

const PostForm: React.FC<PostFormProps> = ({ onUploadStart, onUploadUpdate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [postType, setPostType] = useState<PostType>('media');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
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

  const validateFileSize = (file: File): string | null => {
    const isVideo = file.type.startsWith('video/');
    
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      const sizeMB = Math.round(MAX_VIDEO_SIZE / (1024 * 1024));
      return `Video file is too large. Maximum size is ${sizeMB}MB.`;
    } else if (!isVideo && file.size > MAX_IMAGE_SIZE) {
      const sizeMB = Math.round(MAX_IMAGE_SIZE / (1024 * 1024));
      return `Image file is too large. Maximum size is ${sizeMB}MB.`;
    }
    
    return null;
  };

  const handleMediaFileAccepted = (file: File) => {
    // Check file size
    const error = validateFileSize(file);
    
    if (error) {
      setMediaError(error);
      // Don't set the file if it's too large
      return;
    }
    
    // Clear any previous errors
    setMediaError(null);
    setMediaFile(file);
    const previewUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(previewUrl);
  };

  const handleClearMedia = () => {
    // If there's a preview URL, revoke it to prevent memory leaks
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setMediaError(null);
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

  const handleStatusModalClose = () => {
    // Only reset uploads when the modal is closed after successful submission
    if (uploads.some(u => u.status === 'completed')) {
      setUploads([]);
    }
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId) 
        : [...prev, accountId]
    );
  };

  // Check if the current step is valid
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        // For step 1, we need a valid post type and at least one selected account
        return (postType === 'text' || (postType === 'media' && !!mediaFile && !mediaError)) 
               && selectedAccounts.length > 0;
      case 2:
        // For step 2, we just need a valid title
        return !!title.trim();
      default:
        return false;
    }
  };

  // Navigate to next step
  const goToNextStep = () => {
    if (currentStep < TOTAL_STEPS && isCurrentStepValid()) {
      setCurrentStep(prevStep => prevStep + 1);
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };

  // Go directly to a step if it's accessible
  const goToStep = (step: number) => {
    // Only allow going to a step if all previous steps are valid or if going backwards
    if (step < currentStep || isCurrentStepValid()) {
      setCurrentStep(step);
    }
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
    
    // Validate media only if post type is media
    if (postType === 'media' && !mediaFile) {
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
    
    // Double check file size before submission
    if (postType === 'media' && mediaFile) {
      const sizeError = validateFileSize(mediaFile);
      if (sizeError) {
        setMediaError(sizeError);
        toast({
          title: "File too large",
          description: sizeError,
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    // Clear previous upload status
    setUploads([]);
    
    try {
      let mediaUrl = null;
      
      // Handle media uploads if it's a media post
      if (postType === 'media' && mediaFile) {
        mediaUrl = await uploadFileToStorage(mediaFile, user.id);
        if (!mediaUrl) {
          throw new Error("Failed to upload media file");
        }
      }
      
      const selectedPlatformAccounts = platformAccounts.filter(account => 
        selectedAccounts.includes(account.id)
      );
      
      const uploadPromises = [];
      const uploadResults = [];
      
      // Only attempt YouTube uploads for media posts with videos
      if (postType === 'media' && mediaFile && mediaUrl) {
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
      }
      
      if (uploadPromises.length > 0) {
        setIsStatusModalOpen(true);
        await Promise.allSettled(uploadPromises);
      }
      
      const status = selectedDate ? 'scheduled' : 'published';
      
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        title: title,
        content: caption,
        media_urls: mediaUrl ? [mediaUrl] : [],
        post_type: postType,
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
        description: `${successfulUploads > 0 ? `${successfulUploads} successful uploads, ${failedUploads} failed uploads.` : "Post created successfully."}`,
        variant: successfulUploads > 0 || postType === 'text' ? "default" : "destructive",
      });
      
      // Reset form
      setCurrentStep(1);
      setMediaFile(null);
      setMediaPreviewUrl(null);
      setMediaError(null);
      setCaption('');
      setTitle('');
      setSelectedDate(undefined);
      setSelectedAccounts([]);
      setPostType('media'); // Reset to default tab
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

  // Final validation for form submission
  const isValid = title.trim() && selectedAccounts.length > 0 && 
                 (postType === 'text' || (postType === 'media' && !!mediaFile && !mediaError));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border">
        <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
        
        <StepIndicator 
          currentStep={currentStep} 
          totalSteps={TOTAL_STEPS} 
          onStepClick={goToStep} 
        />
        
        {/* Step 1: Post Type, Media Selection and Account Selection */}
        {currentStep === 1 && (
          <PostTypeStep
            postType={postType}
            setPostType={setPostType}
            mediaFile={mediaFile}
            mediaPreviewUrl={mediaPreviewUrl}
            mediaError={mediaError}
            onFileAccepted={handleMediaFileAccepted}
            onClearMedia={handleClearMedia}
            platformAccounts={platformAccounts}
            selectedAccounts={selectedAccounts}
            onToggleAccount={toggleAccount}
          />
        )}
        
        {/* Step 2: Post Details */}
        {currentStep === 2 && (
          <PostDetailsStep
            title={title}
            setTitle={setTitle}
            caption={caption}
            setCaption={setCaption}
          />
        )}
        
        {/* Always show scheduling on the final step */}
        <div className={currentStep === TOTAL_STEPS ? "block" : "hidden"}>
          <PostScheduler 
            selectedDate={selectedDate} 
            onDateChange={setSelectedDate} 
          />
        </div>
        
        {/* Step Navigation */}
        <div className="flex justify-between mt-6">
          {currentStep > 1 ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={goToPreviousStep}
              className="flex items-center"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div></div> // Empty div to maintain layout
          )}
          
          {currentStep < TOTAL_STEPS ? (
            <Button 
              type="button"
              onClick={goToNextStep}
              disabled={!isCurrentStepValid()}
              className="flex items-center"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <PostSubmitButton 
              isSubmitting={isSubmitting}
              isValid={isValid}
              isScheduled={!!selectedDate}
              actionText="Post"
            />
          )}
        </div>
      </div>

      {/* Upload Status Modal */}
      <UploadStatusModal 
        isOpen={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        uploads={uploads}
        onClose={handleStatusModalClose}
      />
    </form>
  );
};

export default PostForm;
