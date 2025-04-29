
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface PostFormFieldsProps {
  title: string;
  setTitle: (title: string) => void;
  caption: string;
  setCaption: (caption: string) => void;
}

const PostFormFields: React.FC<PostFormFieldsProps> = ({
  title,
  setTitle,
  caption,
  setCaption
}) => {
  return (
    <>
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
    </>
  );
};

export default PostFormFields;
