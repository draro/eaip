'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, GitCommit, Calendar, User, GitCompare } from 'lucide-react';

interface DocumentDiffViewerProps {
  document: {
    _id: string;
    title: string;
    organization: {
      _id: string;
      name: string;
    };
  };
}

interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author: string;
}

interface ContentDiff {
  changes: ContentChange[];
  totalAdditions: number;
  totalDeletions: number;
}

interface ContentChange {
  section: string;
  subsection?: string;
  type: 'added' | 'deleted' | 'modified';
  oldContent?: string;
  newContent?: string;
}

function createContentDiff(oldDoc: any, newDoc: any): ContentDiff {
  const changes: ContentChange[] = [];
  let totalAdditions = 0;
  let totalDeletions = 0;

  // Compare title
  if (oldDoc.title !== newDoc.title) {
    changes.push({
      section: 'Document Title',
      type: 'modified',
      oldContent: oldDoc.title,
      newContent: newDoc.title
    });
    totalAdditions++;
    totalDeletions++;
  }

  // Create maps for easy lookup
  const oldSections = new Map(oldDoc.sections?.map((s: any) => [s.id, s]) || []);
  const newSections = new Map(newDoc.sections?.map((s: any) => [s.id, s]) || []);

  // Check for modified and deleted sections
  oldSections.forEach((oldSection, sectionId) => {
    const newSection = newSections.get(sectionId);

    if (!newSection) {
      // Section deleted
      changes.push({
        section: oldSection.title,
        type: 'deleted',
        oldContent: oldSection.content
      });
      totalDeletions++;
    } else {
      // Check if section content changed
      if (oldSection.content !== newSection.content) {
        changes.push({
          section: newSection.title,
          type: 'modified',
          oldContent: oldSection.content,
          newContent: newSection.content
        });
        totalAdditions++;
        totalDeletions++;
      }

      // Compare subsections
      const oldSubs = new Map(oldSection.subsections?.map((s: any) => [s.code, s]) || []);
      const newSubs = new Map(newSection.subsections?.map((s: any) => [s.code, s]) || []);

      oldSubs.forEach((oldSub, subCode) => {
        const newSub = newSubs.get(subCode);

        if (!newSub) {
          changes.push({
            section: newSection.title,
            subsection: `${oldSub.code} - ${oldSub.title}`,
            type: 'deleted',
            oldContent: oldSub.content
          });
          totalDeletions++;
        } else if (oldSub.content !== newSub.content) {
          changes.push({
            section: newSection.title,
            subsection: `${newSub.code} - ${newSub.title}`,
            type: 'modified',
            oldContent: oldSub.content,
            newContent: newSub.content
          });
          totalAdditions++;
          totalDeletions++;
        }
      });

      // Check for added subsections
      newSubs.forEach((newSub, subCode) => {
        if (!oldSubs.has(subCode)) {
          changes.push({
            section: newSection.title,
            subsection: `${newSub.code} - ${newSub.title}`,
            type: 'added',
            newContent: newSub.content
          });
          totalAdditions++;
        }
      });
    }
  });

  // Check for added sections
  newSections.forEach((newSection, sectionId) => {
    if (!oldSections.has(sectionId)) {
      changes.push({
        section: newSection.title,
        type: 'added',
        newContent: newSection.content
      });
      totalAdditions++;
    }
  });

  return {
    changes,
    totalAdditions,
    totalDeletions
  };
}

export default function DocumentDiffViewer({ document }: DocumentDiffViewerProps) {
  const [history, setHistory] = useState<GitCommit[]>([]);
  const [diff, setDiff] = useState<ContentDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [document._id]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Git history for this document
      const historyResponse = await fetch(`/api/documents/${document._id}/history`);
      const historyResult = await historyResponse.json();

      if (!historyResult.success) {
        throw new Error(historyResult.error || 'Failed to fetch history');
      }

      const commits = historyResult.data.history || [];
      setHistory(commits);

      // If we have at least 2 commits, fetch both documents and compare
      if (commits.length >= 2) {
        const latestCommit = commits[0].hash;
        const previousCommit = commits[1].hash;

        // Fetch the actual document content from both commits
        const [latestDoc, previousDoc] = await Promise.all([
          fetch(`/api/documents/${document._id}/version?commit=${latestCommit}`).then(r => r.json()),
          fetch(`/api/documents/${document._id}/version?commit=${previousCommit}`).then(r => r.json())
        ]);

        if (latestDoc.success && previousDoc.success) {
          // Create content-based diff
          const contentDiff = createContentDiff(previousDoc.data, latestDoc.data);
          setDiff(contentDiff);
        }
      } else if (commits.length === 1) {
        // Only one commit, show initial version
        setError('This is the initial version. No previous version to compare.');
      } else {
        setError('No Git history found for this document.');
      }
    } catch (err) {
      console.error('Error fetching diff:', err);
      setError(err instanceof Error ? err.message : 'Failed to load changes');
    } finally {
      setLoading(false);
    }
  };

  const compareWithCurrent = async (commitHash: string) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedCommit(commitHash);

      const latestCommit = history[0].hash;

      // Fetch the actual document content from both commits
      const [latestDoc, selectedDoc] = await Promise.all([
        fetch(`/api/documents/${document._id}/version?commit=${latestCommit}`).then(r => r.json()),
        fetch(`/api/documents/${document._id}/version?commit=${commitHash}`).then(r => r.json())
      ]);

      if (latestDoc.success && selectedDoc.success) {
        // Create content-based diff (compare selected with current)
        const contentDiff = createContentDiff(selectedDoc.data, latestDoc.data);
        setDiff(contentDiff);
      } else {
        setError('Failed to load commit data');
      }
    } catch (err) {
      console.error('Error comparing commits:', err);
      setError(err instanceof Error ? err.message : 'Failed to compare versions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900">No Changes Available</h3>
            <p className="text-sm text-yellow-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!diff && history.length > 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <GitCommit className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Git History Available</h3>
            <p className="text-sm text-blue-700 mt-1">
              This document has {history.length} commit{history.length > 1 ? 's' : ''} in Git history, but no changes to display yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* History Summary */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitCommit className="w-4 h-4" />
              Recent Commits ({history.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 5).map((commit, index) => (
                <div
                  key={commit.hash}
                  className={`flex items-start gap-3 p-3 rounded border transition-all ${
                    selectedCommit === commit.hash
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Badge variant={index === 0 ? 'default' : 'outline'} className="text-xs">
                    {index === 0 ? 'Latest' : `${index} ago`}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-3 h-3" />
                      <span className="font-medium">{commit.author}</span>
                      <Calendar className="w-3 h-3 ml-2" />
                      <span className="text-gray-600">
                        {new Date(commit.date).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{commit.message}</p>
                    <code className="text-xs text-gray-500 font-mono">{commit.hash.substring(0, 8)}</code>
                  </div>
                  {index > 0 && (
                    <Button
                      size="sm"
                      variant={selectedCommit === commit.hash ? 'default' : 'outline'}
                      onClick={() => compareWithCurrent(commit.hash)}
                      disabled={loading}
                      className="flex-shrink-0"
                    >
                      <GitCompare className="w-3 h-3 mr-1" />
                      {selectedCommit === commit.hash ? 'Viewing' : 'Compare'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Changes View */}
      {diff && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-2">
                Changes Summary
                {selectedCommit && (
                  <span className="text-sm font-normal text-gray-600">
                    (comparing <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{selectedCommit.substring(0, 8)}</code> with current)
                  </span>
                )}
              </span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                +{diff.totalAdditions} additions
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                -{diff.totalDeletions} deletions
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {diff.changes.length === 0 ? (
              <p className="text-sm text-gray-600">No content changes detected.</p>
            ) : (
              <div className="space-y-6">
                {diff.changes.map((change, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className={`px-4 py-2 text-sm font-semibold ${
                      change.type === 'added' ? 'bg-green-50 text-green-900 border-l-4 border-green-500' :
                      change.type === 'deleted' ? 'bg-red-50 text-red-900 border-l-4 border-red-500' :
                      'bg-blue-50 text-blue-900 border-l-4 border-blue-500'
                    }`}>
                      <span className="capitalize">{change.type}</span>: {change.section}
                      {change.subsection && <span className="font-normal"> › {change.subsection}</span>}
                    </div>

                    <div className="p-4 space-y-3">
                      {change.type === 'modified' && (
                        <>
                          {change.oldContent && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-red-700 flex items-center gap-1">
                                <span className="bg-red-100 px-2 py-0.5 rounded">Previous Version</span>
                              </div>
                              <div
                                className="prose prose-sm max-w-none p-3 bg-red-50 rounded border-l-2 border-red-300"
                                dangerouslySetInnerHTML={{ __html: change.oldContent }}
                              />
                            </div>
                          )}

                          {change.newContent && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-green-700 flex items-center gap-1">
                                <span className="bg-green-100 px-2 py-0.5 rounded">Current Version</span>
                              </div>
                              <div
                                className="prose prose-sm max-w-none p-3 bg-green-50 rounded border-l-2 border-green-300"
                                dangerouslySetInnerHTML={{ __html: change.newContent }}
                              />
                            </div>
                          )}
                        </>
                      )}

                      {change.type === 'added' && change.newContent && (
                        <div
                          className="prose prose-sm max-w-none p-3 bg-green-50 rounded border-l-2 border-green-500"
                          dangerouslySetInnerHTML={{ __html: change.newContent }}
                        />
                      )}

                      {change.type === 'deleted' && change.oldContent && (
                        <div
                          className="prose prose-sm max-w-none p-3 bg-red-50 rounded border-l-2 border-red-500 line-through"
                          dangerouslySetInnerHTML={{ __html: change.oldContent }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
