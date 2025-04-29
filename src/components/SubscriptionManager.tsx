
import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Check, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function SubscriptionManager() {
  const { 
    loading, 
    subscribed, 
    subscriptionTier, 
    subscriptionEnd, 
    inTrial,
    createCheckout, 
    openCustomerPortal 
  } = useSubscription();

  const handleStartSubscription = async () => {
    const url = await createCheckout();
    if (url) window.location.href = url;
  };

  const handleManageSubscription = async () => {
    const url = await openCustomerPortal();
    if (url) window.location.href = url;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full relative overflow-hidden">
      {subscribed && (
        <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg font-medium text-sm transform translate-x-0 translate-y-0 shadow-md">
          Active
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl">MultiMediaBlast Pro</CardTitle>
        <CardDescription>Elevate your social media presence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">$9</span>
          <span className="text-muted-foreground ml-2">/month</span>
        </div>
        
        {subscribed && subscriptionEnd && (
          <div className="bg-muted/50 rounded-md p-3 text-sm">
            {inTrial ? (
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Trial ends on {format(new Date(subscriptionEnd), 'MMMM d, yyyy')}</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Subscription renews on {format(new Date(subscriptionEnd), 'MMMM d, yyyy')}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-start">
            <Check className="mr-2 h-4 w-4 text-green-500 mt-1" />
            <span>Share to unlimited social media platforms</span>
          </div>
          <div className="flex items-start">
            <Check className="mr-2 h-4 w-4 text-green-500 mt-1" />
            <span>Schedule up to 100 posts per month</span>
          </div>
          <div className="flex items-start">
            <Check className="mr-2 h-4 w-4 text-green-500 mt-1" />
            <span>Advanced analytics and performance tracking</span>
          </div>
          <div className="flex items-start">
            <Check className="mr-2 h-4 w-4 text-green-500 mt-1" />
            <span>Priority support</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {subscribed ? (
          <Button 
            onClick={handleManageSubscription} 
            variant="outline" 
            className="w-full"
          >
            Manage Subscription
          </Button>
        ) : (
          <Button 
            onClick={handleStartSubscription} 
            className="w-full"
          >
            Start 7-day Free Trial
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
