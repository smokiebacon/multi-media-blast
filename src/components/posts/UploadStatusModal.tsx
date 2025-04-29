
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import UploadStatus from '../UploadStatus';

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
}

const UploadStatusModal: React.FC<UploadStatusModalProps> = ({ 
  isOpen, 
  onOpenChange,
  uploads 
}) => {
  // Show dialog only when there are uploads or it's explicitly opened
  const shouldShow = isOpen || uploads.length > 0;
  
  return (
    <Dialog open={shouldShow} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Status</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <UploadStatus uploads={uploads} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadStatusModal;
