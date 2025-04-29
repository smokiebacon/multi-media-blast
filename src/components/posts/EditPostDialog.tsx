
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PlatformAccount } from '@/types/platform-accounts';
import { uploadFileToStorage, editYouTubeVideo } from '@/utils/mediaUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Image } from 'lucide-react';

// Import shared components
import PostFormFields from './PostFormFields';
import PostMediaUpload from './PostMediaUpload';
import AccountSelector from '../post/AccountSelector';
import PostScheduler from '../post/PostScheduler';
import UploadStatusModal from './UploadStatusModal';

interface Upload {
  id: string;
  platform: string;
  status: string; // 'pending', 'uploading', 'completed', 'failed'
  message?: string;
}

interface EditPostDialogProps {
  post: {
    id: string;
    title: string;
    content: string | null;
    media_urls: string[] | null;
    scheduled_for: string | null;
    account_ids: string[] | null;
    user_id: string;
    post_type?: 'media' | 'text';
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPostUpdated: () => void;
  platformAccounts: PlatformAccount[];
}

// Set maximum file size constants (in bytes)
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

type PostType = 'media' | 'text';

const EditPostDialog: React.FC<EditPostDialogProps> = ({
  post,
  isOpen,
  onOpenChange,
  onPostUpdated,
  platformAccounts,
}) => {
  const [postType, setPostType] = useState<PostType>('media');
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content || '');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(
    post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : null
  );
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    post.scheduled_for ? new Date(post.scheduled_for) : undefined
  );
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    post.account_ids || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add state for uploads and modal
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  const { toast } = useToast();
  
  // Reset form when post changes
  useEffect(() => {
    if (isOpen) {
      setTitle(post.title);
      setContent(post.content || '');
      setMediaPreviewUrl(post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : null);
      setMediaFile(null);
      setMediaError(null);
      setSelectedDate(post.scheduled_for ? new Date(post.scheduled_for) : undefined);
      setSelectedAccounts(post.account_ids || []);
      setUploads([]);
      // Determine post type based on media_urls (if present, it's a media post)
      setPostType(post.post_type || (post.media_urls && post.media_urls.length > 0 ? 'media' : 'text'));
    }
  }, [isOpen, post]);

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
    // Create a preview URL for the new file
    const previewUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(previewUrl);
  };

  const handleClearMedia = () => {
    // If there's a new media file with a preview URL, revoke it
    if (mediaFile && mediaPreviewUrl && !post.media_urls?.includes(mediaPreviewUrl)) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setMediaError(null);
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId) 
        : [...prev, accountId]
    );
  };

  const handleStatusModalClose = () => {
    // Only reset uploads when the modal is closed after successful submission
    if (uploads.some(u => u.status === 'completed')) {
      setUploads([]);
    }
  };

  const handleUploadStart = (upload: {id: string, platform: string, status: string}) => {
    setUploads(prev => [...prev, upload]);
    setIsStatusModalOpen(true);
  };

  const handleUploadUpdate = (id: string, status: string) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === id ? { ...upload, status } : upload
      )
    );
  };

  const updateYouTubeVideos = async (mediaUrl: string | null) => {
    // Get YouTube accounts from selected accounts
    const youtubeAccounts = platformAccounts.filter(account => 
      selectedAccounts.includes(account.id) && account.platform_id === 'youtube'
    );

    // Get post metadata from Supabase to find YouTube video IDs
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', post.id)
      .single();

    if (postError || !postData) {
      console.error('Error fetching post data:', postError);
      return;
    }

    // Check if this post has a YouTube video ID associated with it
    // In a real app, you'd store YouTube video IDs in a separate column or in metadata
    // For this example, we'll use a simple check on the platforms array
    if (!postData.platforms?.includes('youtube')) {
      console.log('No YouTube video associated with this post');
      return;
    }

    // Loop through YouTube accounts and update videos
    for (const account of youtubeAccounts) {
      // In a real app, you'd fetch the videoId from your database
      // Here we'll use a placeholder - in production you would need to track video IDs
      // This is just a demonstration - ideally you'd store video IDs with each post
      
      // Get videos from this channel to find the one with matching title
      try {
        const { data, error } = await supabase.functions.invoke('youtube-search', {
          body: {
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            query: postData.title, // Search by original title to find our video
            channelId: account.account_identifier
          }
        });
        
        if (error || !data.items?.length) {
          console.error('Error searching for videos:', error || 'No videos found');
          continue;
        }
        
        const videoId = data.items[0].id.videoId;
        
        if (videoId) {
          await editYouTubeVideo(
            videoId,
            title, 
            content,
            account.id,
            platformAccounts,
            handleUploadStart,
            handleUploadUpdate
          );
        }
      } catch (error) {
        console.error('Error updating YouTube video:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your post.",
        variant: "destructive",
      });
      return;
    }
    
    // Only validate media if post type is 'media'
    if (postType === 'media' && !mediaPreviewUrl) {
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
    
    // Check if we have a new file and validate its size (only for media posts)
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
    setUploads([]);
    
    try {
      // If a new media file was selected, upload it (only for media posts)
      let mediaUrl = (postType === 'media' && post.media_urls && post.media_urls.length > 0) ? post.media_urls[0] : null;
      
      if (postType === 'media' && mediaFile) {
        const uploadedUrl = await uploadFileToStorage(mediaFile, post.user_id);
        if (!uploadedUrl) {
          throw new Error("Failed to upload media file");
        }
        mediaUrl = uploadedUrl;
      }

      // Try to update YouTube videos if there are any YouTube accounts selected
      if (postType === 'media' && selectedAccounts.some(accountId => {
        const account = platformAccounts.find(acc => acc.id === accountId);
        return account && account.platform_id === 'youtube';
      })) {
        setIsStatusModalOpen(true);
        await updateYouTubeVideos(mediaUrl);
      }
      
      // Get platform IDs from selected accounts
      const selectedPlatformAccounts = platformAccounts.filter(account => 
        selectedAccounts.includes(account.id)
      );
      
      const platforms = [...new Set(selectedPlatformAccounts.map(account => account.platform_id))];
      
      // Update the post status based on scheduling
      const status = selectedDate ? 'scheduled' : 'published';
      
      // Update the post in the database
      const { error } = await supabase.from('posts').update({
        title: title,
        content: content,
        media_urls: postType === 'media' && mediaUrl ? [mediaUrl] : [],
        post_type: postType,
        platforms: platforms,
        account_ids: selectedAccounts,
        status: status,
        scheduled_for: selectedDate ? selectedDate.toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq('id', post.id);
      
      if (error) throw error;
      
      toast({
        title: "Post updated successfully",
        description: selectedDate ? "Your post has been rescheduled." : "Your post has been updated.",
      });
      
      onPostUpdated();
      
      // We don't immediately close the dialog if there are uploads in progress
      if (uploads.length === 0) {
        onOpenChange(false);
      }
      
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating your post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate based on post type
  const isValid = !!title.trim() && selectedAccounts.length > 0 && 
                 (postType === 'text' || (postType === 'media' && !!mediaPreviewUrl && !mediaError));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Post Type Tabs */}
            <Tabs 
              defaultValue={postType} 
              value={postType} 
              onValueChange={(value) => setPostType(value as PostType)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="media" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Media Post
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Text Post
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="media" className="space-y-4 pt-2">
                <PostFormFields
                  title={title}
                  setTitle={setTitle}
                  caption={content}
                  setCaption={setContent}
                />
                
                <PostMediaUpload
                  mediaFile={mediaFile}
                  mediaPreviewUrl={mediaPreviewUrl}
                  onFileAccepted={handleMediaFileAccepted}
                  onClearMedia={handleClearMedia}
                  error={mediaError}
                />
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4 pt-2">
                <PostFormFields
                  title={title}
                  setTitle={setTitle}
                  caption={content}
                  setCaption={setContent}
                />
              </TabsContent>
            </Tabs>
            
            <PostScheduler 
              selectedDate={selectedDate} 
              onDateChange={setSelectedDate} 
            />
            
            <AccountSelector 
              platformAccounts={platformAccounts}
              selectedAccounts={selectedAccounts}
              onToggleAccount={toggleAccount}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? "Updating..." : "Update Post"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
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

export default EditPostDialog;
