
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import PostFormContent from './posts/PostFormContent';
import { Upload } from '@/utils/uploadHandlers';

interface PostFormProps {
  onUploadStart?: (upload: Upload) => void;
  onUploadUpdate?: (id: string, status: string) => void;
}

const PostForm: React.FC<PostFormProps> = ({ onUploadStart, onUploadUpdate }) => {
  const { user } = useAuth();
  const { platformAccounts } = usePlatformAccounts(user?.id);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <PostFormContent 
        userId={user?.id} 
        platformAccounts={platformAccounts}
        onUploadStart={onUploadStart}
        onUploadUpdate={onUploadUpdate}
      />
    </form>
  );
};

export default PostForm;
