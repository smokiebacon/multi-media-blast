
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

const PostForm: React.FC = () => {
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
      // Generate a unique file path for the media
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // For now, we're simulating the media upload - in a real app, you'd upload to Supabase Storage
      // const { error: uploadError } = await supabase.storage
      //  .from('media')
      //  .upload(filePath, mediaFile);
      
      // if (uploadError) throw uploadError;
      
      // For this demo, just create a fake URL
      const mediaUrl = `https://example.com/media/${filePath}`;
      
      // Get platform IDs from the selected accounts
      const selectedPlatformAccounts = platformAccounts.filter(account => 
        selectedAccounts.includes(account.id)
      );
      
      const platformIds = [...new Set(selectedPlatformAccounts.map(account => account.platform_id))];
      
      // Determine status based on scheduled date
      const status = selectedDate ? 'scheduled' : 'published';
      
      // Insert post data
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        title: title,
        content: caption,
        media_urls: [mediaUrl],
        platforms: platformIds,
        status: status,
        scheduled_for: selectedDate ? selectedDate.toISOString() : null,
        published_at: !selectedDate ? new Date().toISOString() : null,
      });
      
      if (error) throw error;
      
      toast({
        title: selectedDate ? "Post scheduled!" : "Post published!",
        description: selectedDate 
          ? `Your post has been scheduled for ${format(selectedDate, 'MMMM d, yyyy')}` 
          : "Your post has been published successfully.",
      });
      
      // Reset form
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

  // Group accounts by platform
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
