'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import RichTextEditor from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronRight, GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollaboration } from '@/hooks/useCollaboration';
import CollaborativePresence from '@/components/CollaborativePresence';

interface Subsection {
  id: string;
  code: string;
  title: string;
  content?: string;
  order: number;
  lastModified?: Date;
  modifiedBy?: string;
}

interface Section {
  id: string;
  type: string;
  title: string;
  content?: string;
  subsections?: Subsection[];
  order: number;
}

interface Document {
  _id: string;
  title: string;
  documentType: string;
  country: string;
  airport?: string;
  sections: Section[];
  status: string;
  version: any;
  airacCycle: string;
  effectiveDate: string;
}

export default function EditDocumentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;

  const [document, setDocument] = useState<Document | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Real-time collaboration
  const {
    connected,
    activeEditors,
    cursors,
    updateCursor,
    updateContent,
    focusSection,
  } = useCollaboration({
    documentId: params.id,
    userId: user?.id || user?._id || 'anonymous',
    userName: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Guest',
    onContentChange: (data) => {
      // Handle incoming content changes from other editors
      if (data.sectionId) {
        setSections(prev => prev.map(section => {
          if (section.id === data.sectionId) {
            if (data.subsectionId) {
              // Update subsection content
              return {
                ...section,
                subsections: section.subsections?.map(sub =>
                  sub.id === data.subsectionId
                    ? { ...sub, content: data.content }
                    : sub
                ) || []
              };
            } else {
              // Update section content
              return { ...section, content: data.content };
            }
          }
          return section;
        }));
      }
    },
  });

  useEffect(() => {
    fetchDocument();
  }, [params.id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${params.id}`);
      const data = await response.json();

      if (data.success && data.data) {
        setDocument(data.data);

        // Initialize sections with default content if missing
        const initializedSections = (data.data.sections || []).map((section: Section) => ({
          ...section,
          content: section.content || '',
          subsections: (section.subsections || []).map((sub: Subsection) => ({
            ...sub,
            code: sub.code || '',
            content: sub.content || ''
          }))
        }));

        setSections(initializedSections);
        const allSectionIds = new Set<string>(initializedSections.map((s: Section) => s.id));
        setExpandedSections(allSectionIds);
      } else {
        console.error('Failed to fetch document:', data.error);
        alert('Failed to load document');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      alert('Error loading document');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return { ...section, title };
      }
      return section;
    }));
  };

  const updateSectionContent = (sectionId: string, content: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return { ...section, content };
      }
      return section;
    }));

    // Broadcast change to other editors
    if (connected) {
      updateContent(sectionId, undefined, content);
    }
  };

  const updateSubsectionContent = (sectionId: string, subsectionId: string, content: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId && section.subsections) {
        return {
          ...section,
          subsections: section.subsections.map(sub =>
            sub.id === subsectionId ? { ...sub, content } : sub
          )
        };
      }
      return section;
    }));

    // Broadcast change to other editors
    if (connected) {
      updateContent(sectionId, subsectionId, content);
    }
  };

  const updateSubsectionTitle = (sectionId: string, subsectionId: string, title: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId && section.subsections) {
        return {
          ...section,
          subsections: section.subsections.map(sub =>
            sub.id === subsectionId ? { ...sub, title } : sub
          )
        };
      }
      return section;
    }));
  };

  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type: 'GEN',
      title: 'New Section',
      content: '',
      subsections: [],
      order: sections.length
    };
    setSections([...sections, newSection]);
    setExpandedSections(prev => new Set(prev).add(newSection.id));
  };

  const renumberSubsections = () => {
    setSections(prev => prev.map((section, sectionIndex) => {
      if (section.subsections && section.subsections.length > 0) {
        const chapterNumber = sectionIndex + 1;
        return {
          ...section,
          subsections: section.subsections.map((sub, subIndex) => ({
            ...sub,
            code: `${section.type}-${chapterNumber}.${subIndex + 1}`,
            order: subIndex
          }))
        };
      }
      return section;
    }));
  };

  const addSubsection = (sectionId: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);

    setSections(prev => {
      const newSections = prev.map((section, sectionIndex) => {
        if (section.id === sectionId) {
          const subsectionCount = (section.subsections?.length || 0) + 1;
          const chapterNumber = sectionIndex + 1;
          const newSubsection: Subsection = {
            id: `subsection-${timestamp}-${random}`,
            code: `${section.type}-${chapterNumber}.${subsectionCount}`,
            title: 'New Subsection',
            content: '<p>Enter subsection content here...</p>',
            order: subsectionCount - 1
          };
          console.log('Adding subsection:', newSubsection);
          console.log('Current subsections:', section.subsections);
          const updatedSection = {
            ...section,
            subsections: [...(section.subsections || []), newSubsection]
          };
          console.log('Updated section subsections:', updatedSection.subsections);
          return updatedSection;
        }
        return section;
      });
      console.log('All sections after add:', newSections);
      return newSections;
    });
  };

  const deleteSection = (sectionId: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      setSections(prev => prev.filter(s => s.id !== sectionId));
    }
  };

  const deleteSubsection = (sectionId: string, subsectionId: string) => {
    if (confirm('Are you sure you want to delete this subsection?')) {
      setSections(prev => prev.map(section => {
        if (section.id === sectionId && section.subsections) {
          return {
            ...section,
            subsections: section.subsections.filter(sub => sub.id !== subsectionId)
          };
        }
        return section;
      }));
    }
  };

  const handleSave = async () => {
    if (!document) return;

    setSaving(true);
    try {
      console.log('Saving sections:', sections);
      const response = await fetch(`/api/documents/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections })
      });

      const result = await response.json();
      console.log('Save result:', result);
      if (result.success) {
        alert('Document saved successfully!');
        // Force a refresh and navigate to view page
        router.push(`/documents/${params.id}?t=${Date.now()}`);
        router.refresh();
      } else {
        alert(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout user={user}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading document...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!document) {
    return (
      <Layout user={user}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">Document not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button onClick={() => router.push(`/documents/${params.id}`)} variant="outline" className="w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to View
                </Button>

                {/* Collaborative Presence Indicator */}
                {connected && activeEditors.length > 0 && (
                  <CollaborativePresence
                    activeEditors={activeEditors}
                    currentUserId={user?.id || user?._id || 'anonymous'}
                  />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={addSection} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
                <Button onClick={renumberSubsections} variant="outline">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Renumber All
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>

          {/* Document Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">{document.title}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="text-sm py-1">{document.documentType}</Badge>
                <Badge variant="outline" className="text-sm py-1">{document.country}</Badge>
                {document.airport && <Badge variant="outline" className="text-sm py-1">{document.airport}</Badge>}
                <Badge variant="outline" className="text-sm py-1">AIRAC {document.airacCycle}</Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Sections Editor */}
          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.id} className="overflow-hidden">
                <div className="p-3 md:p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100" onClick={() => toggleSection(section.id)}>
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                      {expandedSections.has(section.id) ? <ChevronDown className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0" /> : <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0" />}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-1 min-w-0">
                        <h3 className="font-semibold text-base md:text-lg break-words">
                          {section.title}
                        </h3>
                        <Badge variant="outline" className="self-start sm:self-auto">{section.type}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }} className="flex-shrink-0">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {expandedSections.has(section.id) && (
                  <CardContent className="pt-4 space-y-4">
                    {/* Section Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                        <Input value={section.title} onChange={(e) => updateSectionTitle(section.id, e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section Type</label>
                        <Select value={section.type} onValueChange={(value) => setSections(prev => prev.map(s => s.id === section.id ? { ...s, type: value } : s))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GEN">GEN - General</SelectItem>
                            <SelectItem value="ENR">ENR - En-Route</SelectItem>
                            <SelectItem value="AD">AD - Aerodrome</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Section Content */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Section Content</label>
                      <RichTextEditor
                        value={section.content || ''}
                        onChange={(value) => updateSectionContent(section.id, value)}
                        placeholder="Enter section content..."
                        minHeight="200px"
                        onCursorChange={(position) => {
                          if (connected) {
                            updateCursor(section.id, undefined, position);
                          }
                        }}
                        onFocus={() => {
                          if (connected) {
                            focusSection(section.id);
                          }
                        }}
                        remoteCursors={cursors
                          .filter(c => c.sectionId === section.id && !c.subsectionId)
                          .map(c => ({
                            userId: c.userId,
                            userName: c.userName,
                            userColor: c.userColor,
                            position: c.cursorPosition || 0,
                          }))}
                      />
                    </div>

                    {/* Subsections */}
                    <div className="border-t pt-8 mt-8">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-semibold text-gray-800">Subsections</h4>
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          className="bg-blue-600 hover:bg-blue-700"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Button clicked for section:', section.id);
                            addSubsection(section.id);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Subsection
                        </Button>
                      </div>

                      {section.subsections && section.subsections.length > 0 ? (
                        <div className="space-y-8">
                          {section.subsections.map((subsection, idx) => (
                            <div key={subsection.id} className="bg-white border-l-4 border-blue-400 rounded-r-lg p-5 shadow-sm">
                              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h5 className="font-semibold text-gray-800 text-base">
                                    {subsection.code} - {subsection.title}
                                  </h5>
                                  {connected && cursors.filter(c => c.sectionId === section.id && c.subsectionId === subsection.id).length > 0 && (
                                    <div className="flex items-center gap-2">
                                      {cursors
                                        .filter(c => c.sectionId === section.id && c.subsectionId === subsection.id)
                                        .map((cursor, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-medium"
                                            style={{ backgroundColor: cursor.userColor }}
                                          >
                                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                                            {cursor.userName}
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSubsection(section.id, subsection.id);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                  <Input
                                    value={subsection.title}
                                    onChange={(e) => updateSubsectionTitle(section.id, subsection.id, e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                  <Input
                                    value={subsection.code || ''}
                                    onChange={(e) => setSections(prev => prev.map(s => s.id === section.id && s.subsections ? { ...s, subsections: s.subsections.map(sub => sub.id === subsection.id ? { ...sub, code: e.target.value } : sub) } : s))}
                                    placeholder="e.g., GEN-1.1"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                                <RichTextEditor
                                  value={subsection.content || ''}
                                  onChange={(value) => updateSubsectionContent(section.id, subsection.id, value)}
                                  placeholder="Enter subsection content..."
                                  minHeight="250px"
                                  onCursorChange={(position) => {
                                    if (connected) {
                                      updateCursor(section.id, subsection.id, position);
                                    }
                                  }}
                                  onFocus={() => {
                                    if (connected) {
                                      focusSection(section.id, subsection.id);
                                    }
                                  }}
                                  remoteCursors={cursors
                                    .filter(c => c.sectionId === section.id && c.subsectionId === subsection.id)
                                    .map(c => ({
                                      userId: c.userId,
                                      userName: c.userName,
                                      userColor: c.userColor,
                                      position: c.cursorPosition || 0,
                                    }))}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <p className="text-gray-500 mb-2">No subsections yet</p>
                          <p className="text-sm text-gray-400">Click "Add Subsection" above to create one</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Save Button at Bottom */}
          <div className="flex justify-center sm:justify-end sticky bottom-4 md:bottom-6 z-10">
            <Button onClick={handleSave} disabled={saving} size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg w-full sm:w-auto">
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
