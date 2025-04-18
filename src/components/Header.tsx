
import React from 'react';
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";

type HeaderProps = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="w-full py-4 px-6 flex items-center justify-between bg-background border-b">
      <div className="flex items-center space-x-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-brand-purple to-brand-teal flex items-center justify-center">
          <span className="text-white font-bold text-lg">M</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">MultiMediaBlast</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => logout()}
            >
              Logout
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => navigate('/auth')}
          >
            Login
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
};

export default Header;
