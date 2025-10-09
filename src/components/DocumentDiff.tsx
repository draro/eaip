'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Minus, Edit, FileText } from 'lucide-react';
import { diffLines, diffWords } from 'diff';

interface DocumentDiffProps {
  documentId: string;
  fromCommit: string;
  toCommit: string;
  onClose: () => void;
}

interface GitChange {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  oldContent?: string;
  newContent?: string;
  diff?: string;
}

interface GitDiffResult {
  additions: number;
  deletions: number;
  changes: GitChange[];
}

export default function DocumentDiff({ documentId, fromCommit, toCommit, onClose }: DocumentDiffProps) {
  const [diff, setDiff] = useState<GitDiffResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiff();
  }, [documentId, fromCommit, toCommit]);

  const fetchDiff = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/documents/${documentId}/diff?from=${fromCommit}&to=${toCommit}`
      );
      const data = await response.json();

      if (data.success) {
        setDiff(data.data.diff);
      } else {
        console.error('Failed to fetch diff:', data.error);
      }
    } catch (error) {
      console.error('Error fetching diff:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTextDiff = (oldText: string, newText: string) => {
    if (!oldText && !newText) return null;

    const diff = diffWords(oldText || '', newText || '');

    return (
      <div className="font-mono text-sm whitespace-pre-wrap">
        {diff.map((part, index) => {
          if (part.added) {
            return (
              <span key={index} className="bg-green-100 text-green-800">
                {part.value}
              </span>
            );
          }
          if (part.removed) {
            return (
              <span key={index} className="bg-red-100 text-red-800 line-through">
                {part.value}
              </span>
            );
          }
          return <span key={index}>{part.value}</span>;
        })}
      </div>
    );
  };

  const renderJsonDiff = (change: GitChange) => {
    try {
      const oldObj = change.oldContent ? JSON.parse(change.oldContent) : {};
      const newObj = change.newContent ? JSON.parse(change.newContent) : {};

      // Extract meaningful fields for display
      const oldTitle = oldObj.title || '';
      const newTitle = newObj.title || '';
      const oldStatus = oldObj.status || '';
      const newStatus = newObj.status || '';

      return (
        <div className="space-y-4">
          {oldTitle !== newTitle && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Title Changed:</div>
              {renderTextDiff(oldTitle, newTitle)}
            </div>
          )}

          {oldStatus !== newStatus && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Status Changed:</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-50">{oldStatus || 'none'}</Badge>
                <span>→</span>
                <Badge variant="outline" className="bg-green-50">{newStatus || 'none'}</Badge>
              </div>
            </div>
          )}

          {/* Section changes */}
          {change.path.includes('documents/') && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Document Content:</div>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                  View detailed changes
                </summary>
                <div className="mt-2 max-h-96 overflow-auto">
                  <pre className="text-xs bg-gray-100 p-3 rounded">
                    {JSON.stringify(newObj, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      );
    } catch (error) {
      // If parsing fails, show raw diff
      return (
        <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96">
          {change.diff || 'No diff available'}
        </pre>
      );
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'deleted':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'modified':
        return <Edit className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChangeBadgeColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-100 text-green-800';
      case 'deleted':
        return 'bg-red-100 text-red-800';
      case 'modified':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading differences...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!diff) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Changes
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Comparing <code className="bg-gray-100 px-1 rounded">{fromCommit.substring(0, 7)}</code>
              {' → '}
              <code className="bg-gray-100 px-1 rounded">{toCommit.substring(0, 7)}</code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                +{diff.additions} additions
              </Badge>
              <Badge className="bg-red-100 text-red-800">
                -{diff.deletions} deletions
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {diff.changes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No changes detected between these versions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {diff.changes.map((change, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 bg-white"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getChangeIcon(change.type)}
                    <span className="font-mono text-sm text-gray-700">
                      {change.path}
                    </span>
                    <Badge className={getChangeBadgeColor(change.type)}>
                      {change.type}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3">
                  {renderJsonDiff(change)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
