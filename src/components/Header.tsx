
import React from 'react';
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, UserRound } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type HeaderProps = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnDashboard = location.pathname === '/dashboard';
  const { t } = useTranslation();

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
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-brand-purple to-brand-teal flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">MultiMediaBlast</h1>
        </div>
        
        {user && (
          <div className="hidden md:flex items-center ml-6 space-x-2 border-l pl-6">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.email?.charAt(0).toUpperCase() || <UserRound className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
        )}
      </div>
      
      {/* Only show navigation menu when user is NOT logged in */}
      {!user && (
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink 
                onClick={() => scrollToSection('platforms')} 
                className={navigationMenuTriggerStyle()}
              >
                {t('header.platforms')}
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                onClick={() => scrollToSection('features')} 
                className={navigationMenuTriggerStyle()}
              >
                {t('header.features')}
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                onClick={() => scrollToSection('pricing')} 
                className={navigationMenuTriggerStyle()}
              >
                {t('header.pricing')}
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                onClick={() => scrollToSection('testimonials')} 
                className={navigationMenuTriggerStyle()}
              >
                {t('header.reviews')}
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                onClick={() => scrollToSection('faq')} 
                className={navigationMenuTriggerStyle()}
              >
                {t('header.faq')}
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )}
      
      <div className="flex items-center gap-4">
        <LanguageSelector />
        {user ? (
          <>
            {!isOnDashboard && (
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                {t('header.dashboard')}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => logout()}
            >
              {t('header.logout')}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => navigate('/auth')}
          >
            {t('header.login')}
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
