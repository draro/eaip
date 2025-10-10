'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  User,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';

interface ActionLog {
  _id: string;
  actionType: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  details: Record<string, any>;
}

interface ActionLogsViewerProps {
  documentId?: string;
  checklistInstanceId?: string;
  maxHeight?: string;
}

export default function ActionLogsViewer({
  documentId,
  checklistInstanceId,
  maxHeight = '500px',
}: ActionLogsViewerProps) {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, documentId, checklistInstanceId, actionTypeFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (documentId) params.append('documentId', documentId);
      if (checklistInstanceId) params.append('checklistInstanceId', checklistInstanceId);
      if (actionTypeFilter) params.append('actionType', actionTypeFilter);

      const res = await fetch(`/api/action-logs?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    return <Activity className="h-4 w-4" />;
  };

  const getActionBadgeColor = (actionType: string) => {
    if (actionType.includes('approved')) return 'bg-green-500';
    if (actionType.includes('rejected')) return 'bg-red-500';
    if (actionType.includes('completed')) return 'bg-blue-500';
    if (actionType.includes('deleted')) return 'bg-red-500';
    if (actionType.includes('created')) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    return (
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">All Actions</option>
              <option value="checkbox_ticked">Checkbox Ticked</option>
              <option value="checkbox_unticked">Checkbox Unticked</option>
              <option value="document_completed">Document Completed</option>
              <option value="document_approved">Document Approved</option>
              <option value="document_rejected">Document Rejected</option>
              <option value="note_added">Note Added</option>
              <option value="version_restored">Version Restored</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading activity logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No activity logs found</p>
          </div>
        ) : (
          <div
            className="space-y-3 overflow-y-auto"
            style={{ maxHeight }}
          >
            {filteredLogs.map((log) => (
              <div
                key={log._id}
                className="border-l-4 pl-4 py-3 hover:bg-gray-50 transition-colors"
                style={{ borderColor: getActionBadgeColor(log.actionType).replace('bg-', '') }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getActionBadgeColor(log.actionType)}>
                        {formatActionType(log.actionType)}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm mb-2">
                      <User className="h-3 w-3 text-gray-500" />
                      <span className="font-medium">{log.userName}</span>
                      <span className="text-gray-500">({log.userEmail})</span>
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="bg-gray-50 rounded p-2 mt-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Details:</p>
                        {Object.entries(log.details).map(([key, value]) => (
                          <div key={key} className="text-xs text-gray-600">
                            <span className="font-medium">{key}:</span>{' '}
                            {typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
