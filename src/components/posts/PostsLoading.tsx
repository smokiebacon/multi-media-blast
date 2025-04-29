
import React from 'react';

const PostsLoading = () => {
  return (
    <div className="text-center py-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="mt-2 text-sm text-muted-foreground">Loading posts...</p>
    </div>
  );
};

export default PostsLoading;
