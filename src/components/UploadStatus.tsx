
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader, AlertCircle, Clock } from 'lucide-react';

interface Upload {
  id: string;
  platform: string;
  status: string; // 'pending', 'uploading', 'completed', 'failed'
  message?: string;
}

interface UploadStatusProps {
  uploads: Upload[];
}

const UploadStatus: React.FC<UploadStatusProps> = ({ uploads }) => {
  if (uploads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload Status</CardTitle>
          <CardDescription>
            Monitor the status of your social media uploads here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No uploads in progress. Create a post to see upload status here.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Status</CardTitle>
        <CardDescription>
          Monitor the status of your social media uploads
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {uploads.map((upload) => (
            <div 
              key={upload.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-background"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {upload.status === 'completed' && (
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  )}
                  {upload.status === 'uploading' && (
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                    </div>
                  )}
                  {upload.status === 'pending' && (
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  )}
                  {upload.status === 'failed' && (
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="font-medium">{upload.platform}</div>
                  <div className="text-sm text-muted-foreground">
                    {upload.message || 
                      (upload.status === 'completed' ? 'Upload successful' : 
                       upload.status === 'uploading' ? 'Currently uploading...' :
                       upload.status === 'pending' ? 'Waiting to upload...' :
                       'Upload failed')}
                  </div>
                </div>
              </div>
              
              <Badge 
                variant={
                  upload.status === 'completed' ? 'default' : 
                  upload.status === 'uploading' ? 'secondary' :
                  upload.status === 'pending' ? 'outline' :
                  'destructive'
                }
              >
                {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadStatus;
