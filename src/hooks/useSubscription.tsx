
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type SubscriptionStatus = {
  loading: boolean;
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  inTrial: boolean;
  error: string | null;
};

export function useSubscription() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<SubscriptionStatus>({
    loading: true,
    subscribed: false,
    subscriptionTier: null,
    subscriptionEnd: null,
    inTrial: false,
    error: null,
  });

  const checkSubscription = async () => {
    if (!session) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setStatus(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message || 'Failed to check subscription status' 
        }));
        return;
      }
      
      setStatus({
        loading: false,
        subscribed: data.subscribed,
        subscriptionTier: data.subscription_tier,
        subscriptionEnd: data.subscription_end,
        inTrial: data.in_trial,
        error: null,
      });
    } catch (err) {
      console.error('Exception checking subscription:', err);
      setStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: err instanceof Error ? err.message : 'An unknown error occurred' 
      }));
    }
  };

  const createCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) {
        toast({
          title: "Checkout Error",
          description: error.message || "Failed to create checkout session",
          variant: "destructive"
        });
        return null;
      }
      
      return data.url as string;
    } catch (err) {
      toast({
        title: "Checkout Error",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive"
      });
      return null;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        toast({
          title: "Portal Error",
          description: error.message || "Failed to open customer portal",
          variant: "destructive"
        });
        return null;
      }
      
      return data.url as string;
    } catch (err) {
      toast({
        title: "Portal Error",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [session]);

  return {
    ...status,
    checkSubscription,
    createCheckout,
    openCustomerPortal
  };
}
