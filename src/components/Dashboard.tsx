
import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Share2, 
  Activity,
  LogOut
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import PostForm from './PostForm';
import PlatformsManager from './PlatformsManager';
import PostsList from './PostsList';
import UploadStatus from './UploadStatus';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar";

const Dashboard: React.FC = () => {
  const [activeUploads, setActiveUploads] = useState<Array<{id: string, platform: string, status: string}>>([]);
  const [activeTab, setActiveTab] = useState<string>("create");
  const { logout } = useAuth();
  const { t } = useTranslation();
  
  const addUpload = (upload: {id: string, platform: string, status: string}) => {
    setActiveUploads(prev => [...prev, upload]);
  };
  
  const updateUploadStatus = (id: string, status: string) => {
    setActiveUploads(prev => prev.map(upload => 
      upload.id === id ? {...upload, status} : upload
    ));
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="bg-gradient-to-b from-sidebar to-sidebar/90 shadow-xl">
          <SidebarContent className="flex flex-col items-center justify-between h-full py-6">
            {/* Logo at the top */}
            <div className="mb-8 flex justify-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-brand-purple to-brand-teal flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
            </div>
            
            <SidebarMenu className="space-y-4 w-full px-2">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "create"}
                  onClick={() => setActiveTab("create")}
                  tooltip="Create Post"
                  className="w-full flex justify-center items-center"
                >
                  <Upload className="h-5 w-5" />
                  <span className="ml-3 font-medium">{t('sidebar.createPost')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "posts"}
                  onClick={() => setActiveTab("posts")}
                  tooltip="Your Posts"
                  className="w-full flex justify-center items-center"
                >
                  <FileText className="h-5 w-5" />
                  <span className="ml-3 font-medium">{t('sidebar.yourPosts')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "platforms"}
                  onClick={() => setActiveTab("platforms")}
                  tooltip="Manage Platforms"
                  className="w-full flex justify-center items-center"
                >
                  <Share2 className="h-5 w-5" />
                  <span className="ml-3 font-medium">{t('sidebar.managePlatforms')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "status"}
                  onClick={() => setActiveTab("status")}
                  tooltip="Upload Status"
                  className="w-full flex justify-center items-center"
                >
                  <Activity className="h-5 w-5" />
                  <span className="ml-3 font-medium">{t('sidebar.uploadStatus')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            
            {/* Logout button at the bottom */}
            <SidebarFooter className="mt-auto w-full px-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={logout}
                    tooltip="Logout"
                    className="w-full flex justify-center items-center text-red-500 hover:text-red-600 hover:bg-red-100/10"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="ml-3 font-medium">{t('sidebar.logout')}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            {activeTab === "create" && (
              <PostForm onUploadStart={addUpload} onUploadUpdate={updateUploadStatus} />
            )}
            
            {activeTab === "posts" && (
              <PostsList />
            )}
            
            {activeTab === "platforms" && (
              <PlatformsManager />
            )}
            
            {activeTab === "status" && (
              <UploadStatus uploads={activeUploads} />
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
