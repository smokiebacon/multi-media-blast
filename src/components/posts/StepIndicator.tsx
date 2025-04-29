
import React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  currentStep, 
  totalSteps, 
  onStepClick 
}) => {
  return (
    <div className="flex items-center justify-center mb-6">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <React.Fragment key={step}>
          <div 
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border transition-colors",
              currentStep >= step 
                ? "bg-primary border-primary text-primary-foreground" 
                : "border-muted-foreground text-muted-foreground",
              onStepClick && "cursor-pointer hover:opacity-80"
            )}
            onClick={() => onStepClick && onStepClick(step)}
            aria-label={`Step ${step}`}
            role={onStepClick ? "button" : "presentation"}
          >
            {currentStep > step ? (
              <Check className="h-4 w-4" />
            ) : (
              step
            )}
          </div>
          
          {step < totalSteps && (
            <div className={cn(
              "w-12 h-1 mx-2",
              currentStep > step ? "bg-primary" : "bg-muted"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;
