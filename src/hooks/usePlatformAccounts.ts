
import { useState, useEffect } from 'react';
import { PlatformAccount } from '@/types/platform-accounts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePlatformAccounts = (userId: string | undefined) => {
  const [platformAccounts, setPlatformAccounts] = useState<PlatformAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchPlatformAccounts(userId);
    }
  }, [userId]);

  const fetchPlatformAccounts = async (userId: string) => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('platform_accounts')
      .select('*')
      .eq('user_id', userId);

    setLoading(false);

    if (error) {
      toast({
        title: "Error fetching accounts",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setPlatformAccounts(data || []);
  };

  const refreshAccounts = () => {
    if (userId) {
      fetchPlatformAccounts(userId);
    }
  };

  return { platformAccounts, loading, refreshAccounts };
};
