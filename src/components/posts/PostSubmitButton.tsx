
import React from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface PostSubmitButtonProps {
  isSubmitting: boolean;
  isValid: boolean;
  isScheduled: boolean;
  actionText: string;
}

const PostSubmitButton: React.FC<PostSubmitButtonProps> = ({
  isSubmitting,
  isValid,
  isScheduled,
  actionText = "Post"
}) => {
  return (
    <Button 
      type="submit" 
      className="w-full" 
      disabled={isSubmitting || !isValid}
    >
      {isSubmitting ? (
        <>Processing...</>
      ) : (
        <>
          <Send className="h-4 w-4 mr-2" />
          {isScheduled ? `Schedule ${actionText}` : `${actionText} Now`}
        </>
      )}
    </Button>
  );
};

export default PostSubmitButton;
