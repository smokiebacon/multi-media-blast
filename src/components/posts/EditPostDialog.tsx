
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PlatformAccount } from '@/types/platform-accounts';
import AccountSelector from '../post/AccountSelector';
import PostScheduler from '../post/PostScheduler';
import MediaDropzone from '../MediaDropzone';
import { uploadFileToStorage } from '@/utils/mediaUpload';

interface EditPostDialogProps {
  post: {
    id: string;
    title: string;
    content: string | null;
    media_urls: string[] | null;
    scheduled_for: string | null;
    account_ids?: string[] | null;
    user_id: string;
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPostUpdated: () => void;
  platformAccounts: PlatformAccount[];
}

const EditPostDialog: React.FC<EditPostDialogProps> = ({
  post,
  isOpen,
  onOpenChange,
  onPostUpdated,
  platformAccounts,
}) => {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content || '');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(
    post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : null
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    post.scheduled_for ? new Date(post.scheduled_for) : undefined
  );
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    post.account_ids || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  
  // Reset form when post changes
  useEffect(() => {
    if (isOpen) {
      setTitle(post.title);
      setContent(post.content || '');
      setMediaPreviewUrl(post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : null);
      setMediaFile(null);
      setSelectedDate(post.scheduled_for ? new Date(post.scheduled_for) : undefined);
      setSelectedAccounts(post.account_ids || []);
    }
  }, [isOpen, post]);

  const handleMediaFileAccepted = (file: File) => {
    setMediaFile(file);
    // Create a preview URL for the new file
    const previewUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(previewUrl);
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
    
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your post.",
        variant: "destructive",
      });
      return;
    }
    
    if (!mediaPreviewUrl) {
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
    
    try {
      // If a new media file was selected, upload it
      let mediaUrl = post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : null;
      
      if (mediaFile) {
        const uploadedUrl = await uploadFileToStorage(mediaFile, post.user_id);
        if (!uploadedUrl) {
          throw new Error("Failed to upload media file");
        }
        mediaUrl = uploadedUrl;
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
        media_urls: mediaUrl ? [mediaUrl] : post.media_urls,
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
      onOpenChange(false);
      
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your post..."
              className="w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Media
            </label>
            {mediaPreviewUrl ? (
              <div className="relative rounded-lg overflow-hidden border mb-2">
                {mediaPreviewUrl.includes('image') || mediaPreviewUrl.endsWith('.jpg') || mediaPreviewUrl.endsWith('.png') || mediaPreviewUrl.endsWith('.jpeg') ? (
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
            <MediaDropzone onFileAccepted={handleMediaFileAccepted} />
          </div>
          
          <div>
            <label htmlFor="caption" className="block text-sm font-medium mb-2">
              Caption
            </label>
            <Textarea
              id="caption"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a caption for your post..."
              className="resize-none"
              rows={4}
            />
          </div>
          
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
              disabled={isSubmitting || !title.trim() || !mediaPreviewUrl || selectedAccounts.length === 0}
            >
              {isSubmitting ? "Updating..." : "Update Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostDialog;
