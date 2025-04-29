
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from '@/components/Dashboard';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subscription = searchParams.get('subscription');
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (subscription === 'success') {
      toast({
        title: "Subscription Started",
        description: "Your subscription has been successfully set up with a 7-day free trial.",
        variant: "default"
      });
    } else if (subscription === 'canceled') {
      toast({
        title: "Subscription Canceled",
        description: "You have canceled the subscription process.",
        variant: "default"
      });
    }
  }, [subscription, toast]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <Dashboard />;
}
