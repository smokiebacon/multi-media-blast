
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import shared components
import PostSubmitButton from './PostSubmitButton';
import PostScheduler from '../post/PostScheduler';
import StepIndicator from './StepIndicator';
import PostTypeStep from './PostTypeStep';
import PostDetailsStep from './PostDetailsStep';
import { usePostForm, PostType } from '@/hooks/usePostForm';
import { PlatformAccount } from '@/types/platform-accounts';
import { Upload } from '@/utils/uploadHandlers';
import UploadStatusModal from './UploadStatusModal';

interface PostFormContentProps {
  userId?: string;
  platformAccounts: PlatformAccount[];
  onUploadStart?: (upload: Upload) => void;
  onUploadUpdate?: (id: string, status: string) => void;
}

const TOTAL_STEPS = 2;

const PostFormContent: React.FC<PostFormContentProps> = ({
  userId,
  platformAccounts,
  onUploadStart,
  onUploadUpdate
}) => {
  const {
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
  } = usePostForm({
    userId,
    platformAccounts,
    onUploadStart,
    onUploadUpdate
  });

  return (
    <>
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
    </>
  );
};

export default PostFormContent;
