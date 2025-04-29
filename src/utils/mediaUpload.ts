
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

export const uploadFileToStorage = async (file: File, userId: string) => {
  if (!userId) return null;
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;
  
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

export interface UploadResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string | null;
  error?: string | null;
}

export const uploadToYouTube = async (
  accountId: string, 
  mediaUrl: string, 
  title: string, 
  description: string,
  platformAccounts: any[],
  onUploadStart?: (upload: {id: string, platform: string, status: string}) => void,
  onUploadUpdate?: (id: string, status: string) => void
): Promise<UploadResult> => {
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
  } catch (error: any) {
    console.error('Error in YouTube upload:', error);
    onUploadUpdate?.(uploadId, 'failed');
    return { success: false, error: error.message };
  }
};
