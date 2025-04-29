
import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import UploadStatus from '../UploadStatus';
import { Check, X } from "lucide-react";
import { Button } from '../ui/button';

interface Upload {
  id: string;
  platform: string;
  status: string; // 'pending', 'uploading', 'completed', 'failed'
  message?: string;
}

interface UploadStatusModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  uploads: Upload[];
  onClose?: () => void;
}

const UploadStatusModal: React.FC<UploadStatusModalProps> = ({ 
  isOpen, 
  onOpenChange,
  uploads,
  onClose 
}) => {
  const [autoClose, setAutoClose] = useState(false);
  
  // Check if all uploads are complete or failed
  useEffect(() => {
    if (uploads.length === 0) return;
    
    const allCompleted = uploads.every(upload => 
      upload.status === 'completed' || upload.status === 'failed'
    );
    
    if (allCompleted && autoClose) {
      // Add a small delay before closing to let user see the completion status
      const timer = setTimeout(() => {
        onOpenChange(false);
        onClose?.();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [uploads, autoClose, onOpenChange, onClose]);

  // Enable auto-close after first render
  useEffect(() => {
    if (uploads.length > 0 && isOpen) {
      setAutoClose(true);
    } else {
      setAutoClose(false);
    }
  }, [isOpen, uploads.length]);
  
  // Show dialog only when there are uploads or it's explicitly opened
  const shouldShow = isOpen || uploads.length > 0;
  
  return (
    <Dialog open={shouldShow} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Upload Status
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <UploadStatus uploads={uploads} />
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              onOpenChange(false);
              onClose?.();
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadStatusModal;
