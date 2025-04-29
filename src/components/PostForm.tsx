import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Send, Clock } from 'lucide-react';
import MediaDropzone from './MediaDropzone';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { PlatformAccount } from '@/types/platform-accounts';
import { platforms as allPlatforms } from '@/data/platforms';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';

interface PostFormProps {
  onUploadStart?: (upload: {id: string, platform: string, status: string}) => void;
  onUploadUpdate?: (id: string, status: string) => void;
}

const PostForm: React.FC<PostFormProps> = ({ onUploadStart, onUploadUpdate }) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [platformAccounts, setPlatformAccounts] = useState<PlatformAccount[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPlatformAccounts();
    }
  }, [user]);

  const fetchPlatformAccounts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('platform_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error fetching accounts",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setPlatformAccounts(data || []);
  };

  const handleMediaFileAccepted = (file: File) => {
    setMediaFile(file);
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId) 
        : [...prev, accountId]
    );
  };

  const uploadFileToStorage = async (file: File) => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    
    const { data: bucketExists } = await supabase.storage.getBucket('media');
    if (!bucketExists) {
      await supabase.storage.createBucket('media', {
        public: false,
        fileSizeLimit: 1073741824,
      });
    }
    
    const { error: uploadError, data } = await supabase.storage
      .from('media')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);
    
    return publicUrlData.publicUrl;
  };

  const uploadToYouTube = async (
    accountId: string, 
    mediaUrl: string, 
    title: string, 
    description: string
  ) => {
    const uploadId = uuidv4();
    const account = platformAccounts.find(acc => acc.id === accountId);
    
    if (!account || account.platform_id !== 'youtube') {
      return { success: false, error: 'Invalid account' };
    }
    
    if (!account.access_token) {
      return { success: false, error: 'No access token available' };
    }
    
    try {
      onUploadStart?.({
        id: uploadId,
        platform: 'YouTube',
        status: 'uploading'
      });
      
      const { data, error } = await supabase.functions.invoke('youtube-upload', {
        body: {
          mediaUrl,
          title,
          description,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          channelId: account.account_identifier
        }
      });
      
      if (error) {
        console.error('Error calling YouTube upload function:', error);
        onUploadUpdate?.(uploadId, 'failed');
        return { success: false, error: error.message };
      }
      
      if (data.error) {
        console.error('YouTube upload failed:', data.error);
        onUploadUpdate?.(uploadId, 'failed');
        return { success: false, error: data.error };
      }
      
      onUploadUpdate?.(uploadId, 'completed');
      return { success: true, videoId: data.videoId, videoUrl: data.videoUrl };
    } catch (error) {
      console.error('Error in YouTube upload:', error);
      onUploadUpdate?.(uploadId, 'failed');
      return { success: false, error: error.message };
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
    
    try {
      const mediaUrl = await uploadFileToStorage(mediaFile);
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
              uploadToYouTube(account.id, mediaUrl, title, caption)
                .then(result => {
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
              variant: "warning"
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
      
      setMediaFile(null);
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

  const accountsByPlatform = platformAccounts.reduce<Record<string, PlatformAccount[]>>((acc, account) => {
    if (!acc[account.platform_id]) {
      acc[account.platform_id] = [];
    }
    acc[account.platform_id].push(account);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border">
        <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
        
        <div className="mb-6">
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
        
        <div className="mb-6">
          <MediaDropzone onFileAccepted={handleMediaFileAccepted} />
        </div>
        
        <div className="mb-6">
          <label htmlFor="caption" className="block text-sm font-medium mb-2">
            Caption
          </label>
          <Textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption for your post..."
            className="resize-none"
            rows={4}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Schedule (Optional)
          </label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  Set time
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Time selection coming soon</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Select Accounts
          </label>
          <div className="space-y-4">
            {Object.entries(accountsByPlatform).map(([platformId, accounts]) => {
              const platform = allPlatforms.find(p => p.id === platformId);
              if (!platform) return null;
              
              return (
                <div key={platformId} className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">{platform.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {accounts.map((account) => (
                      <Badge
                        key={account.id}
                        variant={selectedAccounts.includes(account.id) ? "default" : "outline"}
                        className="cursor-pointer py-2 px-3"
                        onClick={() => toggleAccount(account.id)}
                      >
                        <platform.icon className="h-4 w-4 mr-1" />
                        {account.account_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
            {platformAccounts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No accounts connected. Please connect accounts in the Platforms tab first.
              </p>
            )}
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || !mediaFile || selectedAccounts.length === 0 || !title.trim()}
        >
          {isSubmitting ? (
            <>Posting...</>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {selectedDate ? 'Schedule Post' : 'Post Now'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default PostForm;
