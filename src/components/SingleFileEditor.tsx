'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ISection, ISubsection, IAIPDocument } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save, Eye, FileText } from 'lucide-react';

interface SingleFileEditorProps {
  document?: IAIPDocument;
  onSave?: (document: Partial<IAIPDocument>) => void;
  onPreview?: () => void;
}

const defaultSections: ISection[] = [
  {
    id: uuidv4(),
    type: 'GEN',
    title: 'General Information',
    order: 1,
    subsections: [
      {
        id: uuidv4(),
        code: '1.1',
        title: 'Designated Authorities',
        content: { type: 'doc', content: [] },
        images: [],
        order: 1,
        lastModified: new Date(),
        modifiedBy: '' as any,
      },
      {
        id: uuidv4(),
        code: '1.2',
        title: 'Entry/Exit Points',
        content: { type: 'doc', content: [] },
        images: [],
        order: 2,
        lastModified: new Date(),
        modifiedBy: '' as any,
      },
    ],
  },
  {
    id: uuidv4(),
    type: 'ENR',
    title: 'En-Route Information',
    order: 2,
    subsections: [
      {
        id: uuidv4(),
        code: '1.1',
        title: 'General Rules',
        content: { type: 'doc', content: [] },
        images: [],
        order: 1,
        lastModified: new Date(),
        modifiedBy: '' as any,
      },
    ],
  },
  {
    id: uuidv4(),
    type: 'AD',
    title: 'Aerodrome Information',
    order: 3,
    subsections: [
      {
        id: uuidv4(),
        code: '1.1',
        title: 'Introduction',
        content: { type: 'doc', content: [] },
        images: [],
        order: 1,
        lastModified: new Date(),
        modifiedBy: '' as any,
      },
    ],
  },
];

export default function SingleFileEditor({ document, onSave, onPreview }: SingleFileEditorProps) {
  const [title, setTitle] = useState(document?.title || 'New AIP Document');
  const [country, setCountry] = useState(document?.country || '');
  const [airport, setAirport] = useState(document?.airport || '');
  const [sections, setSections] = useState<ISection[]>(document?.sections || defaultSections);
  const [activeSection, setActiveSection] = useState(sections[0]?.id);
  const [activeSubsection, setActiveSubsection] = useState(sections[0]?.subsections[0]?.id);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
    ],
    content: getCurrentSubsectionContent(),
    onUpdate: ({ editor }) => {
      updateSubsectionContent(editor.getJSON());
    },
  });

  function getCurrentSubsectionContent() {
    const section = sections.find(s => s.id === activeSection);
    const subsection = section?.subsections.find(s => s.id === activeSubsection);
    return subsection?.content || { type: 'doc', content: [] };
  }

  function updateSubsectionContent(content: any) {
    setSections(prev => prev.map(section =>
      section.id === activeSection
        ? {
            ...section,
            subsections: section.subsections.map(sub =>
              sub.id === activeSubsection
                ? { ...sub, content, lastModified: new Date() }
                : sub
            )
          }
        : section
    ));
  }

  useEffect(() => {
    if (editor) {
      const content = getCurrentSubsectionContent();
      editor.commands.setContent(content);
    }
  }, [activeSection, activeSubsection, editor]);

  const addSection = () => {
    const newSection: ISection = {
      id: uuidv4(),
      type: 'GEN',
      title: 'New Section',
      order: sections.length + 1,
      subsections: [
        {
          id: uuidv4(),
          code: '1.1',
          title: 'New Subsection',
          content: { type: 'doc', content: [] },
          images: [],
          order: 1,
          lastModified: new Date(),
          modifiedBy: '' as any,
        }
      ],
    };
    setSections([...sections, newSection]);
  };

  const addSubsection = (sectionId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            subsections: [
              ...section.subsections,
              {
                id: uuidv4(),
                code: `${section.subsections.length + 1}.1`,
                title: 'New Subsection',
                content: { type: 'doc', content: [] },
                images: [],
                order: section.subsections.length + 1,
                lastModified: new Date(),
                modifiedBy: '' as any,
              }
            ]
          }
        : section
    ));
  };

  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
    if (activeSection === sectionId) {
      const remaining = sections.filter(s => s.id !== sectionId);
      if (remaining.length > 0) {
        setActiveSection(remaining[0].id);
        setActiveSubsection(remaining[0].subsections[0]?.id);
      }
    }
  };

  const removeSubsection = (sectionId: string, subsectionId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            subsections: section.subsections.filter(s => s.id !== subsectionId)
          }
        : section
    ));

    if (activeSubsection === subsectionId) {
      const section = sections.find(s => s.id === sectionId);
      const remaining = section?.subsections.filter(s => s.id !== subsectionId);
      if (remaining && remaining.length > 0) {
        setActiveSubsection(remaining[0].id);
      }
    }
  };

  const handleSave = () => {
    const documentData: Partial<IAIPDocument> = {
      title,
      country,
      airport,
      sections,
      documentType: 'AIP',
      metadata: {
        language: 'en',
        authority: 'Civil Aviation Authority',
        contact: 'contact@aviation.gov',
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
    };

    onSave?.(documentData);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Structure */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Document Structure</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="ICAO code"
                />
              </div>
              <div>
                <Label htmlFor="airport">Airport</Label>
                <Input
                  id="airport"
                  value={airport}
                  onChange={(e) => setAirport(e.target.value)}
                  placeholder="Airport code"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Sections</h3>
            <Button onClick={addSection} size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {sections.map((section) => (
              <Card key={section.id} className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{section.type}</Badge>
                    <span className="text-sm font-medium">{section.title}</span>
                  </div>
                  <Button
                    onClick={() => removeSection(section.id)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-1">
                  {section.subsections.map((subsection) => (
                    <div
                      key={subsection.id}
                      className={`p-2 rounded cursor-pointer text-sm flex items-center justify-between ${
                        activeSubsection === subsection.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setActiveSection(section.id);
                        setActiveSubsection(subsection.id);
                      }}
                    >
                      <span>{subsection.code} - {subsection.title}</span>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSubsection(section.id, subsection.id);
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    onClick={() => addSubsection(section.id)}
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Subsection
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="text-sm text-gray-600">
              Editing: {sections.find(s => s.id === activeSection)?.type} -
              {sections.find(s => s.id === activeSection)?.subsections.find(s => s.id === activeSubsection)?.code}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={onPreview} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {sections.find(s => s.id === activeSection)?.subsections.find(s => s.id === activeSubsection)?.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <div className="prose max-w-none h-full">
                <EditorContent editor={editor} className="h-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}