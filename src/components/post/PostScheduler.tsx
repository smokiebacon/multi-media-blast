
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PostSchedulerProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

const PostScheduler: React.FC<PostSchedulerProps> = ({ selectedDate, onDateChange }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">
        Schedule (Optional)
      </label>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              Set time
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Time selection coming soon</p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default PostScheduler;
