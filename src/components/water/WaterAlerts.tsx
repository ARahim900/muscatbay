
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, Filter, Check, X, Clock } from 'lucide-react';

interface WaterAlertsProps {
  alerts: any[];
  formatTimestamp: (timestamp: Date) => string;
  getSeverityColor: (severity: string) => string;
}

export const WaterAlerts: React.FC<WaterAlertsProps> = ({
  alerts,
  formatTimestamp,
  getSeverityColor
}) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  
  // Filter alerts based on selected filters
  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    
    return matchesStatus && matchesSeverity;
  });
  
  // Get alert type icon based on type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'consumption':
        return <Bell className="h-5 w-5" />;
      case 'loss':
        return <AlertTriangle className="h-5 w-5" />;
      case 'meter':
        return <Clock className="h-5 w-5" />;
      case 'maintenance':
        return <Clock className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <CardTitle className="text-xl">Water System Alerts</CardTitle>
            <CardDescription>Monitor and manage alerts from the water distribution system</CardDescription>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-3 sm:mt-0">
            <div className="flex items-center space-x-2">
              <Select defaultValue={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No alerts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no alerts matching your current filter criteria.
              </p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div key={alert.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="flex items-center px-4 py-4 sm:px-6">
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)} mr-4`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <h4 className="text-sm font-semibold text-gray-900 mr-2">{alert.title}</h4>
                        <Badge variant="outline" className={`${
                          alert.status === 'new' ? 'bg-blue-50 text-blue-700' :
                          alert.status === 'acknowledged' ? 'bg-amber-50 text-amber-700' :
                          'bg-green-50 text-green-700'
                        }`}>
                          {alert.status === 'new' ? 'New' : 
                           alert.status === 'acknowledged' ? 'Acknowledged' : 
                           'Resolved'}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">{formatTimestamp(alert.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
                    
                    <div className="mt-2 flex items-center space-x-2">
                      <Badge variant="outline" className={`${getSeverityColor(alert.severity)}`}>
                        {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                      </Badge>
                      <Badge variant="outline">{alert.type}</Badge>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0 flex space-x-2">
                    {alert.status === 'new' && (
                      <>
                        <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50">
                          <Check className="h-4 w-4 mr-1" />
                          Acknowledge
                        </Button>
                        <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                          <Check className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      </>
                    )}
                    {alert.status === 'acknowledged' && (
                      <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                        <Check className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                    {alert.status === 'resolved' && (
                      <Button variant="outline" size="sm" className="text-gray-500 border-gray-200 hover:bg-gray-50">
                        <X className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
