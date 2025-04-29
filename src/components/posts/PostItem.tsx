
import React from 'react';
import { format } from 'date-fns';
import { TableCell, TableRow } from '@/components/ui/table';
import StatusBadge from './StatusBadge';
import PlatformAccountsDisplay from './PlatformAccountsDisplay';
import { PlatformAccount } from '@/types/platform-accounts';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

type Post = {
  id: string;
  title: string;
  content: string | null;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  platforms: string[] | null;
  media_urls: string[] | null;
  account_ids?: string[] | null;
  user_id: string;
};

type PostItemProps = {
  post: Post;
  platformAccounts: PlatformAccount[];
  onEditPost: (post: Post) => void;
};

const PostItem = ({ post, platformAccounts, onEditPost }: PostItemProps) => {
  const date = post.published_at || post.scheduled_for || post.created_at;
  const dateLabel = post.published_at 
    ? "Published" 
    : post.scheduled_for 
      ? "Scheduled" 
      : "Created";
  
  const getAccountsForPost = (post: Post, platformId: string) => {
    if (post.account_ids && post.account_ids.length > 0) {
      return platformAccounts.filter(account => 
        account.platform_id === platformId && 
        post.account_ids?.includes(account.id)
      );
    }
    
    return platformAccounts.filter(account => account.platform_id === platformId);
  };
  
  return (
    <TableRow>
      <TableCell className="font-medium">{post.title}</TableCell>
      <TableCell>
        <StatusBadge status={post.status} />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          {post.platforms?.map((platformId) => (
            <PlatformAccountsDisplay 
              key={platformId} 
              platformId={platformId}
              accounts={getAccountsForPost(post, platformId)}
            />
          ))}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {dateLabel}: {format(new Date(date), 'MMM d, yyyy')}
        </span>
      </TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onEditPost(post)}
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit post</span>
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default PostItem;
