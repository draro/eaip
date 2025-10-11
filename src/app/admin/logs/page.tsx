'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuditLog {
  _id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  organizationId?: {
    _id: string;
    name: string;
    domain: string;
  };
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  duration?: number;
  statusCode?: number;
  method?: string;
  url?: string;
  tags?: string[];
  details?: any;
}

interface LogsResponse {
  success: boolean;
  error?: string;
  data?: {
    logs: AuditLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    filters: {
      levels: string[];
      actions: string[];
      resources: string[];
    };
    userRole: string;
  };
}

export default function AuditLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [level, setLevel] = useState('');
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    levels: [] as string[],
    actions: [] as string[],
    resources: [] as string[]
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const [userRole, setUserRole] = useState<string>('');

  // Check authentication and authorization
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(level && { level }),
        ...(action && { action }),
        ...(resource && { resource }),
        ...(search && { search }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await fetch(`/api/admin/logs?${params}`);
      const data: LogsResponse = await response.json();

      if (!response.ok || !data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch logs');
      }

      setLogs(data.data.logs);
      setPagination(data.data.pagination);
      setFilterOptions(data.data.filters);
      setUserRole(data.data.userRole);

    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLogs();
    }
  }, [status, page, level, action, resource, search, startDate, endDate]);

  // Reset filters
  const resetFilters = () => {
    setLevel('');
    setAction('');
    setResource('');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Get level badge color
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'debug':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchLogs}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-gray-600 mt-1">
                {userRole === 'super_admin'
                  ? 'Viewing all logs across all organizations'
                  : 'Viewing logs for your organization only'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                userRole === 'super_admin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {userRole === 'super_admin' ? 'Super Admin' : 'Organization Admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Message
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search in messages..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                {filterOptions.levels.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                {filterOptions.actions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Resource Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource
              </label>
              <select
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Resources</option>
                {filterOptions.resources.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reset Filters
              </button>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={fetchLogs}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Total Logs</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {pagination.total.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Current Page</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {pagination.page} / {pagination.pages}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Actions</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {filterOptions.actions.length}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Resources</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {filterOptions.resources.length}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  {userRole === 'super_admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={userRole === 'super_admin' ? 8 : 7} className="px-6 py-12 text-center text-gray-500">
                      No logs found matching the current filters
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLog(log)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getLevelColor(log.level)}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                        {log.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <code className="px-2 py-1 bg-gray-100 rounded text-xs">{log.action}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <code className="px-2 py-1 bg-gray-100 rounded text-xs">{log.resource}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.userId ? (
                          <div>
                            <div className="font-medium text-gray-900">{log.userId.name}</div>
                            <div className="text-xs text-gray-500">{log.userId.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      {userRole === 'super_admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.organizationId ? (
                            <div>
                              <div className="font-medium text-gray-900">{log.organizationId.name}</div>
                              <div className="text-xs text-gray-500">{log.organizationId.domain}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">System</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Timestamp</div>
                  <div className="text-sm text-gray-900 mt-1">{formatDate(selectedLog.timestamp)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Level</div>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getLevelColor(selectedLog.level)}`}>
                      {selectedLog.level}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Action</div>
                  <div className="text-sm text-gray-900 mt-1">
                    <code className="px-2 py-1 bg-gray-100 rounded">{selectedLog.action}</code>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Resource</div>
                  <div className="text-sm text-gray-900 mt-1">
                    <code className="px-2 py-1 bg-gray-100 rounded">{selectedLog.resource}</code>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Message</div>
                <div className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedLog.message}
                </div>
              </div>

              {selectedLog.userId && (
                <div>
                  <div className="text-sm font-medium text-gray-500">User</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {selectedLog.userId.name} ({selectedLog.userId.email}) - {selectedLog.userId.role}
                  </div>
                </div>
              )}

              {selectedLog.organizationId && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Organization</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {selectedLog.organizationId.name} ({selectedLog.organizationId.domain})
                  </div>
                </div>
              )}

              {selectedLog.ipAddress && (
                <div>
                  <div className="text-sm font-medium text-gray-500">IP Address</div>
                  <div className="text-sm text-gray-900 mt-1">{selectedLog.ipAddress}</div>
                </div>
              )}

              {selectedLog.requestId && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Request ID</div>
                  <div className="text-sm text-gray-900 mt-1">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">{selectedLog.requestId}</code>
                  </div>
                </div>
              )}

              {selectedLog.method && selectedLog.url && (
                <div>
                  <div className="text-sm font-medium text-gray-500">HTTP Request</div>
                  <div className="text-sm text-gray-900 mt-1">
                    <code className="px-2 py-1 bg-gray-100 rounded">{selectedLog.method} {selectedLog.url}</code>
                  </div>
                </div>
              )}

              {selectedLog.statusCode && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Status Code</div>
                  <div className="text-sm text-gray-900 mt-1">
                    <span className={`px-2 py-1 rounded ${
                      selectedLog.statusCode >= 200 && selectedLog.statusCode < 300
                        ? 'bg-green-100 text-green-800'
                        : selectedLog.statusCode >= 400
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedLog.statusCode}
                    </span>
                  </div>
                </div>
              )}

              {selectedLog.duration && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Duration</div>
                  <div className="text-sm text-gray-900 mt-1">{selectedLog.duration}ms</div>
                </div>
              )}

              {selectedLog.tags && selectedLog.tags.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Tags</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedLog.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">Additional Details</div>
                  <pre className="text-xs text-gray-900 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
