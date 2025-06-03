import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SPACING } from '@/lib/constants';
import { Card } from '@/components/ui/card';

/**
 * Props for the TradeCard component
 */
interface TradeCardProps {
  className?: string;
  children?: ReactNode;
  variant?: 'default' | 'compact' | 'minimal';
  onClick?: () => void;
}

/**
 * Props for the TradeCardHeader component
 */
interface TradeCardHeaderProps {
  className?: string;
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  rightContent?: ReactNode;
}

/**
 * Props for the TradeCardContent component
 */
interface TradeCardContentProps {
  className?: string;
  children?: ReactNode;
}

/**
 * Props for the TradeCardFooter component
 */
interface TradeCardFooterProps {
  className?: string;
  children?: ReactNode;
}

/**
 * A card component specifically styled for trading interfaces
 */
export function TradeCard({ 
  className, 
  children, 
  variant = 'default',
  onClick
}: TradeCardProps) {
  return (
    <Card 
      className={cn(
        'w-full border rounded-lg bg-card overflow-hidden',
        variant === 'compact' && `p-${SPACING.SM}`,
        variant === 'default' && `p-${SPACING.MD}`,
        variant === 'minimal' && 'border-0 shadow-none',
        onClick && 'cursor-pointer hover:border-primary/50 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

/**
 * Header section for the TradeCard
 */
export function TradeCardHeader({ 
  className, 
  children,
  title,
  subtitle,
  rightContent
}: TradeCardHeaderProps) {
  // If children are provided, render them directly
  if (children) {
    return (
      <div className={cn('flex justify-between items-center', className)}>
        {children}
      </div>
    );
  }
  
  // Otherwise, render the structured header
  return (
    <div className={cn('flex justify-between items-center', className)}>
      <div className="flex flex-col">
        {title && <h3 className="font-semibold">{title}</h3>}
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {rightContent && (
        <div className="flex items-center">
          {rightContent}
        </div>
      )}
    </div>
  );
}

/**
 * Content section for the TradeCard
 */
export function TradeCardContent({ 
  className, 
  children
}: TradeCardContentProps) {
  return (
    <div className={cn(`mt-${SPACING.MD}`, className)}>
      {children}
    </div>
  );
}

/**
 * Footer section for the TradeCard
 */
export function TradeCardFooter({ 
  className, 
  children 
}: TradeCardFooterProps) {
  return (
    <div className={cn(`mt-${SPACING.MD} pt-${SPACING.SM} border-t flex justify-between items-center`, className)}>
      {children}
    </div>
  );
}