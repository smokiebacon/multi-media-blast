
import { PlatformAccount } from '@/types/platform-accounts';
import { uploadFileToStorage, uploadToYouTube } from '@/utils/mediaUpload';
import { supabase } from '@/integrations/supabase/client';

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed';

export interface Upload {
  id: string;
  platform: string;
  status: UploadStatus;
  message?: string;
}

interface UploadHandlers {
  onUploadStart?: (upload: Upload) => void;
  onUploadUpdate?: (id: string, status: string) => void;
}

export const validateFileSize = (file: File, maxVideoSize: number, maxImageSize: number): string | null => {
  const isVideo = file.type.startsWith('video/');
  
  if (isVideo && file.size > maxVideoSize) {
    const sizeMB = Math.round(maxVideoSize / (1024 * 1024));
    return `Video file is too large. Maximum size is ${sizeMB}MB.`;
  } else if (!isVideo && file.size > maxImageSize) {
    const sizeMB = Math.round(maxImageSize / (1024 * 1024));
    return `Image file is too large. Maximum size is ${sizeMB}MB.`;
  }
  
  return null;
};

export const handleUploadToYouTube = async (
  selectedAccounts: string[],
  platformAccounts: PlatformAccount[],
  mediaUrl: string | null, 
  title: string, 
  caption: string,
  handlers: UploadHandlers
): Promise<any[]> => {
  const uploadPromises = [];
  const uploadResults = [];
  
  // Only attempt YouTube uploads for media posts with videos
  if (mediaUrl) {
    const selectedPlatformAccounts = platformAccounts.filter(account => 
      selectedAccounts.includes(account.id)
    );
    
    for (const account of selectedPlatformAccounts) {
      if (account.platform_id === 'youtube') {
        uploadPromises.push(
          uploadToYouTube(
            account.id, 
            mediaUrl, 
            title, 
            caption, 
            platformAccounts,
            handlers.onUploadStart,
            handlers.onUploadUpdate
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
      }
    }
  }
  
  if (uploadPromises.length > 0) {
    await Promise.allSettled(uploadPromises);
  }
  
  return uploadResults;
};

export const createPostInDatabase = async (
  userId: string,
  title: string,
  caption: string,
  mediaUrl: string | null,
  postType: 'media' | 'text',
  selectedAccounts: string[],
  platformAccounts: PlatformAccount[],
  selectedDate?: Date
) => {
  const status = selectedDate ? 'scheduled' : 'published';
  const selectedPlatformAccounts = platformAccounts.filter(account => 
    selectedAccounts.includes(account.id)
  );
  
  const { error } = await supabase.from('posts').insert({
    user_id: userId,
    title: title,
    content: caption,
    media_urls: mediaUrl ? [mediaUrl] : [],
    post_type: postType,
    platforms: [...new Set(selectedPlatformAccounts.map(account => account.platform_id))],
    status: status,
    scheduled_for: selectedDate ? selectedDate.toISOString() : null,
    published_at: !selectedDate ? new Date().toISOString() : null,
  });
  
  return { error };
};
