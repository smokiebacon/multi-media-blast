
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Send, Clock } from 'lucide-react';
import MediaDropzone from './MediaDropzone';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Platform } from '@/types/platforms';

interface PostFormProps {
  connectedPlatforms: Platform[];
}

const PostForm: React.FC<PostFormProps> = ({ connectedPlatforms }) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleMediaFileAccepted = (file: File) => {
    setMediaFile(file);
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId) 
        : [...prev, platformId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mediaFile) {
      toast({
        title: "No media selected",
        description: "Please upload an image or video first.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      toast({
        title: "No platforms selected",
        description: "Please select at least one platform to post to.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate posting to platforms
    try {
      // Here we would handle the actual posting to each platform
      // For now we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Post successful!",
        description: `Your media has been posted to ${selectedPlatforms.length} platform(s).`,
      });
      
      // Reset form
      setMediaFile(null);
      setCaption('');
      setSelectedDate(undefined);
      setSelectedPlatforms([]);
    } catch (error) {
      toast({
        title: "Post failed",
        description: "There was an error posting your media. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border">
        <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
        
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
            Select Platforms
          </label>
          <div className="flex flex-wrap gap-2">
            {connectedPlatforms.length > 0 ? (
              connectedPlatforms.map((platform) => (
                <Badge
                  key={platform.id}
                  variant={selectedPlatforms.includes(platform.id) ? "default" : "outline"}
                  className="cursor-pointer py-2 px-3"
                  onClick={() => togglePlatform(platform.id)}
                >
                  <platform.icon className="h-4 w-4 mr-1" />
                  {platform.name}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No platforms connected. Connect a platform first to post.
              </p>
            )}
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || !mediaFile || selectedPlatforms.length === 0}
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
