'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Clock, User, Eye, RefreshCw } from 'lucide-react';
import DocumentDiff from './DocumentDiff';

interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author: string;
  email: string;
}

interface DocumentHistoryProps {
  documentId: string;
}

export default function DocumentHistory({ documentId }: DocumentHistoryProps) {
  const [history, setHistory] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommits, setSelectedCommits] = useState<{ from: string; to: string } | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [documentId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentId}/history`);
      const data = await response.json();

      if (data.success) {
        setHistory(data.data.history);
      } else {
        console.error('Failed to fetch history:', data.error);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = (fromHash: string, toHash: string) => {
    setSelectedCommits({ from: fromHash, to: toHash });
    setShowDiff(true);
  };

  const handleComparePrevious = (currentHash: string, previousHash: string) => {
    handleCompare(previousHash, currentHash);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No version history available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Document History
            </CardTitle>
            <Badge variant="outline">{history.length} version{history.length !== 1 ? 's' : ''}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((commit, index) => (
              <div
                key={commit.hash}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {commit.hash.substring(0, 7)}
                      </code>
                      {index === 0 && (
                        <Badge className="bg-green-500">Latest</Badge>
                      )}
                    </div>

                    <p className="font-medium text-gray-900 mb-2">
                      {commit.message.split('\n')[0]}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {commit.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(commit.date).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {index < history.length - 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleComparePrevious(commit.hash, history[index + 1].hash)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Compare
                      </Button>
                    )}
                  </div>
                </div>

                {commit.message.includes('\n') && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                      Show details
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {commit.message.split('\n').slice(1).join('\n')}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showDiff && selectedCommits && (
        <DocumentDiff
          documentId={documentId}
          fromCommit={selectedCommits.from}
          toCommit={selectedCommits.to}
          onClose={() => setShowDiff(false)}
        />
      )}
    </div>
  );
}
