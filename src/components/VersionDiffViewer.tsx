'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IVersionDiff, IChange } from '@/types';
import { ChevronDown, ChevronRight, Plus, Minus, Edit } from 'lucide-react';
// Removed react-diff-viewer dependency - using simple diff display instead

interface VersionDiffViewerProps {
  diff: IVersionDiff;
  showFullDiff?: boolean;
}

export default function VersionDiffViewer({ diff, showFullDiff = false }: VersionDiffViewerProps) {
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());
  const [selectedChangeType, setSelectedChangeType] = useState<string>('all');

  const toggleChange = (changeId: string) => {
    const newExpanded = new Set(expandedChanges);
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId);
    } else {
      newExpanded.add(changeId);
    }
    setExpandedChanges(newExpanded);
  };

  const getChangeIcon = (action: string) => {
    switch (action) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'removed':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'modified':
        return <Edit className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getChangeColor = (action: string) => {
    switch (action) {
      case 'added':
        return 'bg-green-50 border-green-200';
      case 'removed':
        return 'bg-red-50 border-red-200';
      case 'modified':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filteredChanges = selectedChangeType === 'all'
    ? diff.changes
    : diff.changes.filter(change => change.type === selectedChangeType);

  const changeTypes = ['all', 'section', 'subsection', 'content', 'metadata'];

  const renderContentDiff = (change: IChange) => {
    if (change.type === 'content' && change.oldValue && change.newValue) {
      const oldText = extractTextFromContent(change.oldValue);
      const newText = extractTextFromContent(change.newValue);

      return (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Previous Version</h4>
              <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
                <pre className="whitespace-pre-wrap">{oldText}</pre>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Current Version</h4>
              <div className="bg-green-50 border border-green-200 p-3 rounded text-sm">
                <pre className="whitespace-pre-wrap">{newText}</pre>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const extractTextFromContent = (content: any): string => {
    if (!content || !content.content) return '';

    let text = '';
    const extractFromNode = (node: any): void => {
      if (node.type === 'text') {
        text += node.text || '';
      } else if (node.content && Array.isArray(node.content)) {
        node.content.forEach(extractFromNode);
      }
    };

    if (Array.isArray(content.content)) {
      content.content.forEach(extractFromNode);
    }

    return text;
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Version Comparison Summary
            <div className="flex gap-2">
              <Badge variant="outline">
                {diff.fromVersion} → {diff.toVersion}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {diff.summary.sectionsAdded}
              </div>
              <div className="text-sm text-gray-600">Sections Added</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {diff.summary.sectionsRemoved}
              </div>
              <div className="text-sm text-gray-600">Sections Removed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {diff.summary.sectionsModified}
              </div>
              <div className="text-sm text-gray-600">Sections Modified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {diff.summary.subsectionsAdded}
              </div>
              <div className="text-sm text-gray-600">Subsections Added</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {diff.summary.subsectionsRemoved}
              </div>
              <div className="text-sm text-gray-600">Subsections Removed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {diff.summary.subsectionsModified}
              </div>
              <div className="text-sm text-gray-600">Subsections Modified</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {changeTypes.map(type => (
          <Button
            key={type}
            variant={selectedChangeType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChangeType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
            <Badge variant="secondary" className="ml-2">
              {type === 'all' ? diff.changes.length : diff.changes.filter(c => c.type === type).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Changes List */}
      <div className="space-y-4">
        {filteredChanges.map((change) => (
          <Card key={change.id} className={`border-l-4 ${getChangeColor(change.action)}`}>
            <CardHeader className="pb-2">
              <div
                className="flex items-center cursor-pointer"
                onClick={() => toggleChange(change.id)}
              >
                {expandedChanges.has(change.id) ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                {getChangeIcon(change.action)}
                <div className="ml-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{change.type}</Badge>
                    <Badge variant="outline">{change.action}</Badge>
                    {change.sectionType && (
                      <Badge variant="secondary">{change.sectionType}</Badge>
                    )}
                    {change.sectionCode && (
                      <Badge variant="secondary">{change.sectionCode}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{change.description}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(change.timestamp).toLocaleString()}
                </div>
              </div>
            </CardHeader>

            {expandedChanges.has(change.id) && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="text-sm">
                    <strong>Path:</strong> {change.path}
                  </div>

                  {change.action === 'modified' && change.oldValue && change.newValue && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Previous Value</h4>
                        <div className="bg-red-50 p-3 rounded border">
                          <pre className="text-sm whitespace-pre-wrap">
                            {typeof change.oldValue === 'string'
                              ? change.oldValue
                              : JSON.stringify(change.oldValue, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">New Value</h4>
                        <div className="bg-green-50 p-3 rounded border">
                          <pre className="text-sm whitespace-pre-wrap">
                            {typeof change.newValue === 'string'
                              ? change.newValue
                              : JSON.stringify(change.newValue, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {change.action === 'added' && change.newValue && (
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Added Content</h4>
                      <div className="bg-green-50 p-3 rounded border">
                        <pre className="text-sm whitespace-pre-wrap">
                          {typeof change.newValue === 'string'
                            ? change.newValue
                            : JSON.stringify(change.newValue, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {change.action === 'removed' && change.oldValue && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Removed Content</h4>
                      <div className="bg-red-50 p-3 rounded border">
                        <pre className="text-sm whitespace-pre-wrap">
                          {typeof change.oldValue === 'string'
                            ? change.oldValue
                            : JSON.stringify(change.oldValue, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {renderContentDiff(change)}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredChanges.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No changes found for the selected filter.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}