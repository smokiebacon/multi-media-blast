
import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Share2, 
  Activity, 
  List 
} from 'lucide-react';
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
} from "@/components/ui/sidebar";

const Dashboard: React.FC = () => {
  const [activeUploads, setActiveUploads] = useState<Array<{id: string, platform: string, status: string}>>([]);
  const [activeTab, setActiveTab] = useState<string>("create");
  
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
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "create"}
                  onClick={() => setActiveTab("create")}
                  tooltip="Create Post"
                >
                  <Upload className="h-4 w-4" />
                  <span>Create Post</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "posts"}
                  onClick={() => setActiveTab("posts")}
                  tooltip="Your Posts"
                >
                  <FileText className="h-4 w-4" />
                  <span>Your Posts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "platforms"}
                  onClick={() => setActiveTab("platforms")}
                  tooltip="Manage Platforms"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Manage Platforms</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "status"}
                  onClick={() => setActiveTab("status")}
                  tooltip="Upload Status"
                >
                  <Activity className="h-4 w-4" />
                  <span>Upload Status</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
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
