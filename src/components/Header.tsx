
import React from 'react';
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

type HeaderProps = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If the section is not on the current page, navigate to home and then scroll
      navigate('/', { state: { scrollTo: id } });
    }
  };

  return (
    <header className="w-full py-4 px-6 flex items-center justify-between bg-background border-b sticky top-0 z-50">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-brand-purple to-brand-teal flex items-center justify-center">
          <span className="text-white font-bold text-lg">M</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">MultiMediaBlast</h1>
      </div>
      
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink 
              onClick={() => scrollToSection('platforms')} 
              className={navigationMenuTriggerStyle()}
            >
              Platforms
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink 
              onClick={() => scrollToSection('features')} 
              className={navigationMenuTriggerStyle()}
            >
              Features
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink 
              onClick={() => scrollToSection('pricing')} 
              className={navigationMenuTriggerStyle()}
            >
              Pricing
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink 
              onClick={() => scrollToSection('testimonials')} 
              className={navigationMenuTriggerStyle()}
            >
              Reviews
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink 
              onClick={() => scrollToSection('faq')} 
              className={navigationMenuTriggerStyle()}
            >
              FAQ
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      
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
