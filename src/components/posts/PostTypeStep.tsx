
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Image } from 'lucide-react';
import PostMediaUpload from './PostMediaUpload';
import AccountSelector from '../post/AccountSelector';
import { PlatformAccount } from '@/types/platform-accounts';

interface PostTypeStepProps {
  postType: 'media' | 'text';
  setPostType: (value: 'media' | 'text') => void;
  mediaFile: File | null;
  mediaPreviewUrl: string | null;
  mediaError: string | null;
  onFileAccepted: (file: File) => void;
  onClearMedia: () => void;
  platformAccounts: PlatformAccount[];
  selectedAccounts: string[];
  onToggleAccount: (accountId: string) => void;
}

const PostTypeStep: React.FC<PostTypeStepProps> = ({
  postType,
  setPostType,
  mediaFile,
  mediaPreviewUrl,
  mediaError,
  onFileAccepted,
  onClearMedia,
  platformAccounts,
  selectedAccounts,
  onToggleAccount
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Choose Post Type</h3>
      
      <Tabs defaultValue={postType} value={postType} onValueChange={(value) => setPostType(value as 'media' | 'text')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Media Post
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Text Post
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="media" className="space-y-4">
          <PostMediaUpload
            mediaFile={mediaFile}
            mediaPreviewUrl={mediaPreviewUrl}
            onFileAccepted={onFileAccepted}
            onClearMedia={onClearMedia}
            error={mediaError}
          />
        </TabsContent>
        
        <TabsContent value="text" className="py-2">
          <p className="text-sm text-muted-foreground">
            You're creating a text-only post. Add your title and caption on the next step.
          </p>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8">
        <AccountSelector 
          platformAccounts={platformAccounts}
          selectedAccounts={selectedAccounts}
          onToggleAccount={onToggleAccount}
        />
      </div>
    </div>
  );
};

export default PostTypeStep;
