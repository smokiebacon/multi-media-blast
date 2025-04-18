
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for user's preferred color scheme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    
    // Apply dark mode class if needed
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Show welcome toast
    toast({
      title: "Welcome to MultiMediaBlast!",
      description: "Connect your social accounts and start posting across platforms.",
    });
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="flex-1">
        <section className="py-12 px-4 bg-brand-purple/10 dark:bg-brand-purple/5">
          <div className="container mx-auto max-w-5xl text-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-brand-purple to-brand-teal bg-clip-text text-transparent">
              Post Once, Share Everywhere
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-muted-foreground">
              Save time by uploading your photos and videos to all your social media platforms simultaneously.
            </p>
          </div>
        </section>
        
        <Dashboard />
      </main>
      
      <footer className="py-6 px-4 border-t">
        <div className="container mx-auto max-w-5xl text-center text-sm text-muted-foreground">
          <p>© 2025 MultiMediaBlast. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
