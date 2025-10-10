'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GitBranch,
  Clock,
  User,
  RotateCcw,
  GitCommit,
  GitCompare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Version {
  _id: string;
  commitHash: string;
  commitMessage: string;
  authorName: string;
  authorEmail: string;
  timestamp: string;
  fileChanges: Array<{
    path: string;
    type: 'added' | 'modified' | 'deleted';
    additions?: number;
    deletions?: number;
  }>;
}

interface VersionHistoryViewerProps {
  documentId: string;
  documentType?: 'checklist_instance' | 'file';
  onRestore?: () => void;
}

export default function VersionHistoryViewer({
  documentId,
  documentType = 'checklist_instance',
  onRestore,
}: VersionHistoryViewerProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/documents/${documentId}/versions?type=${documentType}`
      );
      const data = await res.json();

      if (res.ok) {
        setVersions(data.versions);
      } else {
        console.error('Failed to fetch versions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (commitHash: string) => {
    const confirmed = confirm(
      'Are you sure you want to restore this version? This will create a new commit with the restored state.'
    );

    if (!confirmed) return;

    try {
      setRestoring(true);
      const res = await fetch(`/api/documents/${documentId}/versions/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitHash }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Version restored successfully');
        await fetchVersions();
        if (onRestore) onRestore();
      } else {
        alert(data.error || 'Failed to restore version');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      alert('Failed to restore version');
    } finally {
      setRestoring(false);
    }
  };

  const toggleVersionExpansion = (versionId: string) => {
    setExpandedVersion(expandedVersion === versionId ? null : versionId);
  };

  const handleVersionSelect = (commitHash: string) => {
    if (selectedVersions.includes(commitHash)) {
      setSelectedVersions(selectedVersions.filter((h) => h !== commitHash));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, commitHash]);
    } else {
      setSelectedVersions([selectedVersions[1], commitHash]);
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      window.open(
        `/documents/${documentId}/compare?hash1=${selectedVersions[0]}&hash2=${selectedVersions[1]}`,
        '_blank'
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-gray-500">Loading version history...</div>
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <GitBranch className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500">No version history available</div>
          <p className="text-sm text-gray-400 mt-2">
            Changes will be tracked automatically as you edit
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Version History
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={compareMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedVersions([]);
              }}
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Compare
            </Button>
            {compareMode && selectedVersions.length === 2 && (
              <Button size="sm" onClick={handleCompare}>
                View Comparison
              </Button>
            )}
          </div>
        </div>
        {compareMode && (
          <p className="text-sm text-gray-600 mt-2">
            Select two versions to compare ({selectedVersions.length}/2 selected)
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {versions.map((version, index) => (
            <div
              key={version._id}
              className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                compareMode && selectedVersions.includes(version.commitHash)
                  ? 'border-blue-500 bg-blue-50'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex-1 ${compareMode ? 'cursor-pointer' : ''}`}
                  onClick={() =>
                    compareMode && handleVersionSelect(version.commitHash)
                  }
                >
                  <div className="flex items-center gap-2 mb-2">
                    {index === 0 && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                    <GitCommit className="h-4 w-4 text-gray-400" />
                    <code className="text-xs font-mono text-gray-600">
                      {version.commitHash.substring(0, 7)}
                    </code>
                    {compareMode && (
                      <input
                        type="checkbox"
                        checked={selectedVersions.includes(version.commitHash)}
                        onChange={() => handleVersionSelect(version.commitHash)}
                        className="ml-2"
                      />
                    )}
                  </div>
                  <p className="font-medium text-sm">{version.commitMessage}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {version.authorName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(version.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {index !== 0 && !compareMode && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(version.commitHash)}
                      disabled={restoring}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleVersionExpansion(version._id)}
                  >
                    {expandedVersion === version._id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {expandedVersion === version._id && version.fileChanges.length > 0 && (
                <div className="mt-3 pt-3 border-t space-y-1">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    File Changes:
                  </p>
                  {version.fileChanges.map((change, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs font-mono"
                    >
                      <Badge
                        variant={
                          change.type === 'added'
                            ? 'default'
                            : change.type === 'modified'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-xs"
                      >
                        {change.type}
                      </Badge>
                      <span className="text-gray-600">{change.path}</span>
                      {change.additions !== undefined && (
                        <span className="text-green-600">+{change.additions}</span>
                      )}
                      {change.deletions !== undefined && (
                        <span className="text-red-600">-{change.deletions}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
