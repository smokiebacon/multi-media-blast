
import { Instagram, Facebook, Youtube, MessageCircle } from 'lucide-react';
import { Platform } from '@/types/platforms';

export const platforms: Platform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: '#E1306C',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: MessageCircle,
    color: '#000000',
  },
];
