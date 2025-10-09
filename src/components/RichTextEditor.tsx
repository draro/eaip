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

      return () => {
        quill.off('selection-change', selectionChangeHandler);
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
            cursorElement.className = 'remote-cursor remote-cursor-blink';
            cursorElement.style.position = 'absolute';
            cursorElement.style.left = `${bounds.left}px`;
            cursorElement.style.top = `${bounds.top}px`;
            cursorElement.style.height = `${bounds.height}px`;
            cursorElement.style.width = '2px';
            cursorElement.style.backgroundColor = cursor.userColor;
            cursorElement.style.zIndex = '9999';
            cursorElement.style.pointerEvents = 'none';

            const label = document.createElement('div');
            label.className = 'remote-cursor-label';
            label.textContent = cursor.userName;
            label.style.position = 'absolute';
            label.style.top = '-24px';
            label.style.left = '-4px';
            label.style.backgroundColor = cursor.userColor;
            label.style.color = 'white';
            label.style.padding = '3px 8px';
            label.style.borderRadius = '4px';
            label.style.fontSize = '11px';
            label.style.whiteSpace = 'nowrap';
            label.style.fontWeight = '600';
            label.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            label.style.letterSpacing = '0.3px';

            cursorElement.appendChild(label);
            editorRoot.parentElement?.appendChild(cursorElement);
          }
        } catch (error) {
          console.error('Error rendering cursor:', error);
        }
      });
    }
  }, [remoteCursors, value]);

  const QuillComponent = ReactQuill as any;

  return (
    <div className="rich-text-editor" style={{ minHeight, position: 'relative', resize: 'vertical', overflow: 'hidden' }}>
      <QuillComponent
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ height: '100%' }}
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
          height: calc(100% - 42px);
        }
        .rich-text-editor .ql-editor {
          min-height: calc(${minHeight} - 42px);
          position: relative;
          max-height: none;
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
        .remote-cursor-blink {
          animation: blink 1s ease-in-out infinite;
        }
        .remote-cursor-label {
          white-space: nowrap;
          user-select: none;
        }
        @keyframes blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
