# Collaborative Editing Integration Example

## How to Add Real-Time Collaboration to Document Editor

Here's a step-by-step guide to integrate collaborative editing into `/src/app/documents/[id]/edit/page.tsx`:

### 1. Import Required Dependencies

```typescript
import { useCollaboration } from '@/hooks/useCollaboration';
import CollaborativePresence, { SectionPresenceIndicator } from '@/components/CollaborativePresence';
```

### 2. Add Collaboration Hook

```typescript
export default function EditDocumentPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const user = session?.user as any;

  // ... existing state ...

  // Add collaboration hook
  const {
    connected,
    activeEditors,
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

  // ... rest of component ...
}
```

### 3. Add Presence Indicator in Header

```typescript
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-4">
    <Button variant="outline" onClick={() => router.back()}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back
    </Button>
    <h1 className="text-2xl font-bold">{document?.title}</h1>
  </div>

  {/* Add presence indicator */}
  <div className="flex items-center gap-4">
    {connected && (
      <CollaborativePresence
        activeEditors={activeEditors}
        currentUserId={user?.id || user?._id || 'anonymous'}
      />
    )}
    <Button onClick={handleSave} disabled={saving}>
      <Save className="w-4 h-4 mr-2" />
      {saving ? 'Saving...' : 'Save'}
    </Button>
  </div>
</div>
```

### 4. Add Section Presence Indicators

```typescript
{sections.map((section) => (
  <div key={section.id} className="border rounded-lg mb-4">
    <div className="flex items-center justify-between p-4 bg-gray-50">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{section.title}</h3>

        {/* Show who's editing this section */}
        <SectionPresenceIndicator
          sectionId={section.id}
          activeEditors={activeEditors}
          currentUserId={user?.id || user?._id || 'anonymous'}
        />
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => toggleSection(section.id)}
      >
        {expandedSections.has(section.id) ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </Button>
    </div>

    {/* Section content */}
  </div>
))}
```

### 5. Broadcast Content Changes

```typescript
const updateSectionContent = (sectionId: string, content: string) => {
  // Update local state
  setSections(prev => prev.map(section =>
    section.id === sectionId ? { ...section, content } : section
  ));

  // Broadcast to other editors
  if (connected) {
    updateContent(sectionId, undefined, content);
  }
};

const updateSubsectionContent = (
  sectionId: string,
  subsectionId: string,
  content: string
) => {
  // Update local state
  setSections(prev => prev.map(section => {
    if (section.id === sectionId) {
      return {
        ...section,
        subsections: section.subsections?.map(sub =>
          sub.id === subsectionId ? { ...sub, content } : sub
        ) || []
      };
    }
    return section;
  }));

  // Broadcast to other editors
  if (connected) {
    updateContent(sectionId, subsectionId, content);
  }
};
```

### 6. Track Focus Changes

```typescript
const handleSectionFocus = (sectionId: string, subsectionId?: string) => {
  if (connected) {
    focusSection(sectionId, subsectionId);
  }
};

// Use in RichTextEditor component
<RichTextEditor
  content={subsection.content}
  onChange={(content) => updateSubsectionContent(section.id, subsection.id, content)}
  onFocus={() => handleSectionFocus(section.id, subsection.id)}
/>
```

### 7. Add Connection Status Indicator (Optional)

```typescript
{!connected && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
    <div className="flex items-center gap-2 text-yellow-800">
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm">
        Real-time collaboration disconnected. Changes will not be visible to other editors.
      </span>
    </div>
  </div>
)}
```

## Complete Example

See the full working example in `/src/app/documents/[id]/edit/page.tsx` after integration.

## Testing

1. Open the same document in two different browsers (or incognito mode)
2. Log in as different users in each browser
3. Edit different sections simultaneously
4. See real-time updates and presence indicators

## Notes

- Changes are broadcasted in real-time but NOT saved automatically
- Users still need to click "Save" to persist changes to the database
- The collaboration system handles showing changes, not conflict resolution
- Last save wins - consider adding autosave or conflict detection
