'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  onCursorChange?: (position: number) => void;
  onFocus?: () => void;
  remoteCursors?: Array<{
    userId: string;
    userName: string;
    userColor: string;
    position: number;
  }>;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = '200px',
  onCursorChange,
  onFocus,
  remoteCursors = []
}: RichTextEditorProps) {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean'],
      ['code-block'],
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'image',
    'color', 'background',
    'align',
    'code-block',
  ];

  const quillRef = useRef<any>(null);

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();

      // Track cursor position changes
      const selectionChangeHandler = (range: any) => {
        if (range && onCursorChange) {
          onCursorChange(range.index);
        }
      };

      quill.on('selection-change', selectionChangeHandler);

      // Fix space key issue - ensure proper space handling
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
          e.preventDefault();
          const selection = quill.getSelection();
          if (selection) {
            // Get current format at cursor position
            const format = quill.getFormat(selection.index);
            // Insert space with current formatting preserved
            quill.insertText(selection.index, ' ', format);
            quill.setSelection(selection.index + 1);
          }
        }
      };

      const editorContainer = quill.root;
      editorContainer.addEventListener('keydown', handleKeyDown, true);

      return () => {
        quill.off('selection-change', selectionChangeHandler);
        editorContainer.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [onCursorChange]);

  // Render remote cursors
  useEffect(() => {
    if (quillRef.current && remoteCursors.length > 0) {
      const quill = quillRef.current.getEditor();
      const editorRoot = quill.root; // The .ql-editor element

      // Remove old cursor elements
      const oldCursors = editorRoot.parentElement?.querySelectorAll('.remote-cursor');
      oldCursors?.forEach((cursor: Element) => cursor.remove());

      // Add new cursor elements
      remoteCursors.forEach((cursor) => {
        try {
          const bounds = quill.getBounds(cursor.position);
          if (bounds && bounds.height > 0) {
            const cursorElement = document.createElement('div');
            cursorElement.className = 'remote-cursor';
            cursorElement.style.cssText = `
              position: absolute;
              left: ${bounds.left}px;
              top: ${bounds.top}px;
              height: ${bounds.height}px;
              width: 3px;
              background-color: ${cursor.userColor};
              z-index: 9999;
              pointer-events: none;
              transition: all 0.1s ease;
            `;

            const label = document.createElement('div');
            label.className = 'remote-cursor-label';
            label.textContent = cursor.userName;
            label.style.cssText = `
              position: absolute;
              top: -22px;
              left: -2px;
              background-color: ${cursor.userColor};
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 11px;
              white-space: nowrap;
              font-weight: 500;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            `;

            cursorElement.appendChild(label);
            editorRoot.appendChild(cursorElement);
          }
        } catch (error) {
          console.error('Error rendering cursor:', error);
        }
      });
    }
  }, [remoteCursors, value]);

  const QuillComponent = ReactQuill as any;

  return (
    <div className="rich-text-editor" style={{ minHeight, position: 'relative' }}>
      <QuillComponent
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ height: minHeight }}
      />
      <style jsx global>{`
        .rich-text-editor .quill {
          background: white;
          border-radius: 0.375rem;
        }
        .rich-text-editor .ql-container {
          min-height: ${minHeight};
          font-size: 14px;
          position: relative;
        }
        .rich-text-editor .ql-editor {
          min-height: ${minHeight};
          position: relative;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: italic;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
        }
        .remote-cursor {
          position: absolute !important;
          pointer-events: none;
          z-index: 9999 !important;
        }
        .remote-cursor-label {
          white-space: nowrap;
          user-select: none;
        }
      `}</style>
    </div>
  );
}
