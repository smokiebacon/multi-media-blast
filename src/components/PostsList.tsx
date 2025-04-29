
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { platforms } from '@/data/platforms';

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
      
      // Fetch paginated posts
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500 hover:bg-green-600';
      case 'scheduled':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'draft':
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'draft':
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPlatformInfo = (platformId: string) => {
    return platforms.find(p => p.id === platformId);
  };

  const getAccountsForPlatform = (platformId: string) => {
    return platformAccounts.filter(account => account.platform_id === platformId);
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Your Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">You haven't created any posts yet.</p>
            </div>
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
                    {posts.map((post) => {
                      const date = post.published_at || post.scheduled_for || post.created_at;
                      const dateLabel = post.published_at 
                        ? "Published" 
                        : post.scheduled_for 
                          ? "Scheduled" 
                          : "Created";
                      
                      return (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">{post.title}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(post.status)} text-white`}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(post.status)}
                                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {post.platforms?.map((platformId) => {
                                const platform = getPlatformInfo(platformId);
                                const accounts = getAccountsForPlatform(platformId);
                                
                                if (!platform) return null;
                                
                                return (
                                  <div key={platformId} className="flex flex-col">
                                    <Badge variant="outline" className="bg-muted mb-1">
                                      <platform.icon className="h-3 w-3 mr-1" />
                                      {platform.name}
                                    </Badge>
                                    {accounts.length > 0 ? (
                                      <div className="text-xs text-muted-foreground pl-2">
                                        {accounts.map((account, idx) => (
                                          <div key={account.id}>
                                            {account.account_name}
                                            {idx < accounts.length - 1 ? ", " : ""}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-muted-foreground pl-2">No accounts</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {dateLabel}: {format(new Date(date), 'MMM d, yyyy')}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="cursor-pointer"
                        aria-disabled={currentPage === 1}
                        tabIndex={currentPage === 1 ? -1 : 0}
                      />
                    </PaginationItem>
                    
                    {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            isActive={pageNum === currentPage}
                            onClick={() => setCurrentPage(pageNum)}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="cursor-pointer"
                        aria-disabled={currentPage === totalPages}
                        tabIndex={currentPage === totalPages ? -1 : 0}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PostsList;
