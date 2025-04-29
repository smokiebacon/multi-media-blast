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
import { ChevronUp, ChevronDown } from 'lucide-react';

// Import components
import PostItem from './posts/PostItem';
import PostsPagination from './posts/PostsPagination';
import PostsLoading from './posts/PostsLoading';
import EmptyPosts from './posts/EmptyPosts';
import EditPostDialog from './posts/EditPostDialog';

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
  account_ids: string[] | null;
  user_id: string;
};

type SortDirection = 'asc' | 'desc';

const PostsList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const pageSize = 10;
  const { user } = useAuth();
  const { toast } = useToast();
  const { platformAccounts } = usePlatformAccounts(user?.id);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, currentPage, sortField, sortDirection]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Count total posts
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
        
      setTotalPages(Math.ceil((count || 0) / pageSize));
      
      // Start building the query
      let query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id);
      
      // Apply sorting if selected
      if (sortField === 'status') {
        query = query.order('status', { ascending: sortDirection === 'asc' });
        // Add secondary ordering by date to keep consistent order for same status
        query = query.order('created_at', { ascending: false });
      } else {
        // Default ordering
        query = query.order('created_at', { ascending: false });
      }
      
      // Apply pagination
      query = query.range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
      
      const { data, error } = await query;

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
  
  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setIsEditDialogOpen(true);
  };
  
  const handlePostUpdated = () => {
    fetchPosts();
  };
  
  const handleSort = (field: string) => {
    // If clicking on the same field, toggle direction
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set as active and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
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
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortField === 'status' && (
                            sortDirection === 'asc' 
                              ? <ChevronUp className="h-4 w-4" /> 
                              : <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Platforms</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <PostItem 
                        key={post.id} 
                        post={post} 
                        platformAccounts={platformAccounts}
                        onEditPost={handleEditPost}
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
      
      {editingPost && (
        <EditPostDialog 
          post={editingPost}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onPostUpdated={handlePostUpdated}
          platformAccounts={platformAccounts}
        />
      )}
    </div>
  );
};

export default PostsList;
