
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WaterDataRefreshProps {
  onRefresh: () => Promise<void>;
  refreshInterval?: number; // in milliseconds
  lastUpdated?: Date;
}

const WaterDataRefresh: React.FC<WaterDataRefreshProps> = ({ 
  onRefresh, 
  refreshInterval = 0, // 0 means no auto-refresh
  lastUpdated 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | undefined>(lastUpdated);
  const [countdown, setCountdown] = useState(0);

  // Format the last updated time
  const formatLastUpdated = () => {
    if (!lastRefreshed) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshed.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefreshed(new Date());
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Set up auto-refresh if interval is provided
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;
    
    // Calculate initial countdown
    if (lastRefreshed) {
      const elapsedMs = Date.now() - lastRefreshed.getTime();
      const remainingMs = Math.max(0, refreshInterval - elapsedMs);
      setCountdown(Math.ceil(remainingMs / 1000));
    } else {
      setCountdown(Math.ceil(refreshInterval / 1000));
    }
    
    // Set up countdown timer
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleRefresh();
          return Math.ceil(refreshInterval / 1000);
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(countdownTimer);
  }, [refreshInterval, lastRefreshed]);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="gap-1"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </span>
      </Button>
      
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        <span>Last updated: {formatLastUpdated()}</span>
        {refreshInterval > 0 && !isRefreshing && (
          <span className="text-blue-500">
            (Auto-refresh in {countdown}s)
          </span>
        )}
      </div>
    </div>
  );
};

export default WaterDataRefresh;
