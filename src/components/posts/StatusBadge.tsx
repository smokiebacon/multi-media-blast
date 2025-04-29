
import React from 'react';
import { CheckCircle, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type StatusBadgeProps = {
  status: string;
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500 hover:bg-green-600';
      case 'scheduled':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'draft':
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'draft':
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <Badge className={`${getStatusColor(status)} text-white`}>
      <span className="flex items-center gap-1">
        {getStatusIcon(status)}
        {displayStatus}
      </span>
    </Badge>
  );
};

export default StatusBadge;
