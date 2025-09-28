'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import DropCursor from '@tiptap/extension-dropcursor';
import React, { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Table as TableIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo
} from 'lucide-react';

interface TipTapEditorProps {
  content?: any;
  onChange?: (content: any) => void;
  onImageUpload?: (file: File) => Promise<string>;
  className?: string;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  onImageUpload,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'prose-bullet-list',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'prose-ordered-list',
        },
      }),
      ListItem,
      Table.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 100,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      DropCursor,
    ],
    content: content || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] ${className}`,
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const files = Array.from(event.dataTransfer.files);
          const imageFiles = files.filter(file => file.type.startsWith('image/'));

          if (imageFiles.length > 0 && onImageUpload) {
            imageFiles.forEach(async (file) => {
              try {
                const url = await onImageUpload(file);
                if (url) {
                  const { state } = view;
                  const { tr } = state;
                  const pos = event instanceof DragEvent ?
                    view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos || 0 : 0;

                  tr.insert(pos, state.schema.nodes.image.create({ src: url }));
                  view.dispatch(tr);
                }
              } catch (error) {
                console.error('Failed to upload image:', error);
              }
            });
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
  });

  const handleImageUpload = useCallback(async () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/') && onImageUpload && editor) {
      try {
        const url = await onImageUpload(file);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [editor, onImageUpload]);

  const insertTable = useCallback(() => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  }, [editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="border rounded-lg">
      <div className="border-b p-2 flex flex-wrap gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={insertTable}
        >
          <TableIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleImageUpload}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      {editor.isActive('table') && (
        <div className="border-b p-2 flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
          >
            Add Column Before
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            Add Column After
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            Delete Column
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().addRowBefore().run()}
          >
            Add Row Before
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            Add Row After
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            Delete Row
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            Delete Table
          </Button>
        </div>
      )}

      <div className="p-4">
        <EditorContent editor={editor} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default TipTapEditor;