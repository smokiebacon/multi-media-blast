
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

// Import new components
import PostItem from './posts/PostItem';
import PostsPagination from './posts/PostsPagination';
import PostsLoading from './posts/PostsLoading';
import EmptyPosts from './posts/EmptyPosts';

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
};

const PostsList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const { user } = useAuth();
  const { toast } = useToast();
  const { platformAccounts } = usePlatformAccounts(user?.id);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, currentPage]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Count total posts
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
        
      setTotalPages(Math.ceil((count || 0) / pageSize));
      
      // Fetch paginated posts with account_ids field
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) {
        throw error;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Failed to load posts",
        description: "There was an error loading your posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Your Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PostsLoading />
          ) : posts.length === 0 ? (
            <EmptyPosts />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Platforms</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <PostItem 
                        key={post.id} 
                        post={post} 
                        platformAccounts={platformAccounts}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <PostsPagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PostsList;
