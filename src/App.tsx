
import { Routes, Route } from 'react-router-dom';
import IndexPage from '@/pages/Index';
import AuthPage from '@/pages/Auth';
import DashboardPage from '@/pages/Dashboard';
import NotFoundPage from '@/pages/NotFound';
import TikTokCallback from '@/pages/TikTokCallback';
import YouTubeCallback from '@/pages/YouTubeCallback';
import InstagramCallback from '@/pages/InstagramCallback';
import './App.css';
import FacebookCallback from './pages/FacebookCallback';

function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/tiktok-callback" element={<TikTokCallback />} />
      <Route path="/youtube-callback" element={<YouTubeCallback />} />
      <Route path="/instagram-callback" element={<InstagramCallback />} />
      <Route path="/facebook-callback" element={<FacebookCallback />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
