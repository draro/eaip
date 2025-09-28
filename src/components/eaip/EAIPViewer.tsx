'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronRight,
  ChevronDown,
  Home,
  FileText,
  Calendar,
  Download,
  Search,
  MapPin,
  Plane,
  Radio
} from 'lucide-react';

interface AIPDocument {
  _id: string;
  title: string;
  sectionCode: string;
  subsectionCode: string;
  content: any;
  version: {
    versionNumber: string;
    airacCycle: string;
    effectiveDate: string;
  };
  lastModified: string;
}

interface AIPVersion {
  _id: string;
  versionNumber: string;
  airacCycle: string;
  effectiveDate: string;
  status: string;
}

interface EAIPSection {
  code: string;
  title: string;
  icon: any;
  subsections: {
    code: string;
    title: string;
    documents: AIPDocument[];
  }[];
}

export default function EAIPViewer() {
  const [versions, setVersions] = useState<AIPVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<AIPVersion | null>(null);
  const [documents, setDocuments] = useState<AIPDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<AIPDocument | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Standard eAIP structure according to ICAO Annex 15
  const eaipStructure: EAIPSection[] = [
    {
      code: 'GEN',
      title: 'General',
      icon: Home,
      subsections: [
        { code: '0', title: 'Preface', documents: [] },
        { code: '1', title: 'National Regulations and Requirements', documents: [] },
        { code: '2', title: 'Tables and Codes', documents: [] },
        { code: '3', title: 'Services', documents: [] },
        { code: '4', title: 'Charges for Airports/Heliports and Air Navigation Services', documents: [] },
      ]
    },
    {
      code: 'ENR',
      title: 'En Route',
      icon: Plane,
      subsections: [
        { code: '0', title: 'Preface', documents: [] },
        { code: '1', title: 'General Rules and Procedures', documents: [] },
        { code: '2', title: 'Air Traffic Services Airspace', documents: [] },
        { code: '3', title: 'ATS Routes', documents: [] },
        { code: '4', title: 'Radio Navigation Aids/Systems', documents: [] },
        { code: '5', title: 'Navigation Warnings', documents: [] },
        { code: '6', title: 'En-route Charts', documents: [] },
      ]
    },
    {
      code: 'AD',
      title: 'Aerodromes',
      icon: MapPin,
      subsections: [
        { code: '0', title: 'Preface', documents: [] },
        { code: '1', title: 'Introduction', documents: [] },
        { code: '2', title: 'Aerodromes', documents: [] },
        { code: '3', title: 'Heliports', documents: [] },
      ]
    }
  ];

  const [sections, setSections] = useState<EAIPSection[]>(eaipStructure);

  useEffect(() => {
    fetchVersions();
  }, []);

  useEffect(() => {
    if (selectedVersion) {
      fetchDocuments();
    }
  }, [selectedVersion]);

  const fetchVersions = async () => {
    try {
      const response = await fetch('/api/versions');
      const data = await response.json();
      if (data.success) {
        setVersions(data.data);
        // Auto-select the latest active version
        const activeVersion = data.data.find((v: AIPVersion) => v.status === 'active') || data.data[0];
        setSelectedVersion(activeVersion);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!selectedVersion) return;

    try {
      const response = await fetch(`/api/documents?versionId=${selectedVersion._id}`);
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data);
        organizeDocumentsBySection(data.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const organizeDocumentsBySection = (docs: AIPDocument[]) => {
    const updatedSections = sections.map(section => ({
      ...section,
      subsections: section.subsections.map(subsection => ({
        ...subsection,
        documents: docs.filter(doc =>
          doc.sectionCode === section.code &&
          doc.subsectionCode.startsWith(subsection.code)
        )
      }))
    }));
    setSections(updatedSections);
  };

  const toggleSection = (sectionCode: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionCode)) {
      newExpanded.delete(sectionCode);
    } else {
      newExpanded.add(sectionCode);
    }
    setExpandedSections(newExpanded);
  };

  const renderTipTapContent = (content: any) => {
    if (!content || !content.content) return null;

    const renderNode = (node: any): React.ReactNode => {
      switch (node.type) {
        case 'paragraph':
          return (
            <p className="mb-4">
              {node.content?.map((child: any, index: number) => renderNode(child))}
            </p>
          );
        case 'heading':
          const HeadingTag = `h${node.attrs?.level || 1}` as keyof JSX.IntrinsicElements;
          return (
            <HeadingTag className={`font-bold mb-3 ${
              node.attrs?.level === 1 ? 'text-2xl' :
              node.attrs?.level === 2 ? 'text-xl' :
              node.attrs?.level === 3 ? 'text-lg' : 'text-base'
            }`}>
              {node.content?.map((child: any, index: number) => renderNode(child))}
            </HeadingTag>
          );
        case 'bulletList':
          return (
            <ul className="list-disc list-inside mb-4 space-y-1">
              {node.content?.map((item: any, index: number) => (
                <li key={index}>
                  {item.content?.[0]?.content?.map((child: any, index: number) => renderNode(child))}
                </li>
              ))}
            </ul>
          );
        case 'orderedList':
          return (
            <ol className="list-decimal list-inside mb-4 space-y-1">
              {node.content?.map((item: any, index: number) => (
                <li key={index}>
                  {item.content?.[0]?.content?.map((child: any, index: number) => renderNode(child))}
                </li>
              ))}
            </ol>
          );
        case 'table':
          return (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-gray-300">
                <tbody>
                  {node.content?.map((row: any, rowIndex: number) => (
                    <tr key={rowIndex}>
                      {row.content?.map((cell: any, cellIndex: number) => {
                        const CellTag = cell.type === 'tableHeader' ? 'th' : 'td';
                        return (
                          <CellTag
                            key={cellIndex}
                            className={`border border-gray-300 p-2 ${
                              cell.type === 'tableHeader' ? 'bg-gray-100 font-semibold' : ''
                            }`}
                          >
                            {cell.content?.map((child: any, index: number) => renderNode(child))}
                          </CellTag>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        case 'image':
          return (
            <div className="my-4 text-center">
              <img
                src={node.attrs?.src}
                alt={node.attrs?.alt || ''}
                className="max-w-full h-auto mx-auto border border-gray-200"
              />
            </div>
          );
        case 'text':
          let text = node.text || '';
          let element = <span>{text}</span>;

          if (node.marks) {
            node.marks.forEach((mark: any) => {
              switch (mark.type) {
                case 'bold':
                  element = <strong>{element}</strong>;
                  break;
                case 'italic':
                  element = <em>{element}</em>;
                  break;
              }
            });
          }

          return element;
        default:
          return null;
      }
    };

    return (
      <div className="prose max-w-none">
        {content.content.map((node: any, index: number) => (
          <div key={index}>{renderNode(node)}</div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading eAIP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50">
      {/* Navigation Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">eAIP</h1>
          </div>

          {/* Version Selector */}
          {selectedVersion && (
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">
                AIRAC {selectedVersion.airacCycle}
              </Badge>
              <div className="text-sm text-gray-600">
                Version {selectedVersion.versionNumber}
              </div>
              <div className="text-xs text-gray-500">
                Effective: {new Date(selectedVersion.effectiveDate).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tree */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSections.has(section.code);

              return (
                <div key={section.code} className="mb-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto"
                    onClick={() => toggleSection(section.code)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Icon className="h-4 w-4 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">{section.code}</div>
                        <div className="text-xs text-gray-500">{section.title}</div>
                      </div>
                    </div>
                  </Button>

                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {section.subsections.map((subsection) => (
                        <div key={subsection.code}>
                          <div className="text-sm font-medium text-gray-700 p-2">
                            {section.code} {subsection.code} - {subsection.title}
                          </div>
                          {subsection.documents.map((doc) => (
                            <Button
                              key={doc._id}
                              variant={selectedDocument?._id === doc._id ? "secondary" : "ghost"}
                              className="w-full justify-start text-left p-2 h-auto ml-4"
                              onClick={() => setSelectedDocument(doc)}
                            >
                              <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs font-medium truncate">
                                  {doc.sectionCode} {doc.subsectionCode}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {doc.title}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedDocument && (
              <>
                <Badge variant="secondary">
                  {selectedDocument.sectionCode} {selectedDocument.subsectionCode}
                </Badge>
                <h2 className="font-semibold text-gray-900">{selectedDocument.title}</h2>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-auto">
          {selectedDocument ? (
            <div className="max-w-4xl mx-auto p-6">
              {/* Document Header */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedDocument.sectionCode} {selectedDocument.subsectionCode} - {selectedDocument.title}
                  </h1>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Version: {selectedDocument.version.versionNumber}</span>
                  <span>AIRAC: {selectedDocument.version.airacCycle}</span>
                  <span>Effective: {new Date(selectedDocument.version.effectiveDate).toLocaleDateString()}</span>
                  <span>Last Modified: {new Date(selectedDocument.lastModified).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Document Content */}
              <div className="eaip-content">
                {renderTipTapContent(selectedDocument.content)}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Radio className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Electronic Aeronautical Information Publication
                </h3>
                <p className="text-gray-500 mb-4">
                  Select a document from the navigation panel to view its content
                </p>
                {selectedVersion && (
                  <div className="text-sm text-gray-400">
                    AIRAC {selectedVersion.airacCycle} - Version {selectedVersion.versionNumber}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}