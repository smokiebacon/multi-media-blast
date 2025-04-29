
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { uploadFileToStorage } from '@/utils/mediaUpload';
import { 
  validateFileSize, 
  handleUploadToYouTube, 
  createPostInDatabase,
  Upload
} from '@/utils/uploadHandlers';

// Set maximum file size constants (in bytes)
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export type PostType = 'media' | 'text';

interface UsePostFormProps {
  userId?: string;
  platformAccounts: any[];
  onUploadStart?: (upload: Upload) => void;
  onUploadUpdate?: (id: string, status: string) => void;
}

export function usePostForm({
  userId,
  platformAccounts,
  onUploadStart,
  onUploadUpdate
}: UsePostFormProps) {
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
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  const { toast } = useToast();

  const handleMediaFileAccepted = (file: File) => {
    // Check file size
    const error = validateFileSize(file, MAX_VIDEO_SIZE, MAX_IMAGE_SIZE);
    
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

  const localUploadStart = (upload: Upload) => {
    setUploads(prev => [...prev, upload]);
    setIsStatusModalOpen(true);
    onUploadStart?.(upload);
  };

  const localUploadUpdate = (id: string, status: string) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === id ? { ...upload, status: status as any } : upload
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
    if (currentStep < 2 && isCurrentStepValid()) {
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

  // Final validation for form submission
  const isValid = title.trim() && selectedAccounts.length > 0 && 
                 (postType === 'text' || (postType === 'media' && !!mediaFile && !mediaError));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
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
      const sizeError = validateFileSize(mediaFile, MAX_VIDEO_SIZE, MAX_IMAGE_SIZE);
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
        mediaUrl = await uploadFileToStorage(mediaFile, userId);
        if (!mediaUrl) {
          throw new Error("Failed to upload media file");
        }
      }
      
      const uploadResults = await handleUploadToYouTube(
        selectedAccounts,
        platformAccounts,
        mediaUrl, 
        title, 
        caption,
        { onUploadStart: localUploadStart, onUploadUpdate: localUploadUpdate }
      );
      
      if (uploadResults.length > 0) {
        setIsStatusModalOpen(true);
      }
      
      const { error } = await createPostInDatabase(
        userId,
        title,
        caption,
        mediaUrl,
        postType,
        selectedAccounts,
        platformAccounts,
        selectedDate
      );
      
      if (error) throw error;
      
      const successfulUploads = uploadResults.filter(r => r.success).length;
      const failedUploads = uploadResults.filter(r => !r.success).length;
      
      toast({
        title: selectedDate ? "Post scheduled!" : "Post published!",
        description: `${successfulUploads > 0 ? `${successfulUploads} successful uploads, ${failedUploads} failed uploads.` : "Post created successfully."}`,
        variant: successfulUploads > 0 || postType === 'text' ? "default" : "destructive",
      });
      
      // Reset form
      resetForm();
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

  const resetForm = () => {
    setCurrentStep(1);
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setMediaError(null);
    setCaption('');
    setTitle('');
    setSelectedDate(undefined);
    setSelectedAccounts([]);
    setPostType('media'); // Reset to default tab
  };

  return {
    currentStep,
    postType,
    mediaFile,
    mediaPreviewUrl,
    mediaError,
    caption,
    title,
    selectedDate,
    selectedAccounts,
    isSubmitting,
    uploads,
    isStatusModalOpen,
    setPostType,
    setCaption,
    setTitle,
    setSelectedDate,
    handleMediaFileAccepted,
    handleClearMedia,
    toggleAccount,
    handleStatusModalClose,
    setIsStatusModalOpen,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    isCurrentStepValid,
    isValid,
    handleSubmit
  };
}
