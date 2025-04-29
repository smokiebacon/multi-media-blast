
import React from 'react';
import PostFormFields from './PostFormFields';

interface PostDetailsStepProps {
  title: string;
  setTitle: (title: string) => void;
  caption: string;
  setCaption: (caption: string) => void;
}

const PostDetailsStep: React.FC<PostDetailsStepProps> = ({
  title,
  setTitle,
  caption,
  setCaption
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Post Details</h3>
      <PostFormFields
        title={title}
        setTitle={setTitle}
        caption={caption}
        setCaption={setCaption}
      />
    </div>
  );
};

export default PostDetailsStep;
