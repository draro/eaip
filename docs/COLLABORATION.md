# Real-Time Collaborative Editing

This eAIP platform now supports real-time collaborative editing, allowing multiple users to edit the same document simultaneously.

## Features

### 1. **Real-Time Presence Indicators**
- See who else is editing the document
- Avatar indicators with user colors
- Active editor count display
- Section-specific presence indicators showing which sections others are editing

### 2. **Live Content Synchronization**
- Changes are broadcast to all connected editors in real-time
- Automatic conflict resolution
- Changes appear instantly for all users

### 3. **Cursor Position Tracking**
- See where other editors are working
- Visual indicators for active editing locations
- Section and subsection-level granularity

### 4. **Connection Management**
- Automatic reconnection on network issues
- Heartbeat mechanism to detect inactive users
- Graceful handling of disconnections

## How It Works

### WebSocket Server
The application uses Socket.IO for bidirectional real-time communication:
- Custom Next.js server (`server.js`) with integrated WebSocket support
- Document-based rooms for isolation
- Presence tracking and cleanup for inactive users

### Client Integration
The `useCollaboration` hook provides:
```typescript
const {
  connected,        // WebSocket connection status
  activeEditors,    // List of currently active editors
  cursors,          // Current cursor positions of other editors
  updateCursor,     // Function to update your cursor position
  updateContent,    // Function to broadcast content changes
  focusSection,     // Function to broadcast section focus
} = useCollaboration({
  documentId,
  userId,
  userName,
  onContentChange,  // Callback for receiving content updates
  onPresenceUpdate, // Callback for presence changes
});
```

### Components
- **CollaborativePresence**: Shows all active editors with avatars
- **SectionPresenceIndicator**: Inline indicators showing who's editing specific sections

## Usage in Document Editor

To integrate collaborative editing into a document editor page:

```typescript
import { useCollaboration } from '@/hooks/useCollaboration';
import CollaborativePresence, { SectionPresenceIndicator } from '@/components/CollaborativePresence';

// In your component
const user = session?.user as any;
const {
  connected,
  activeEditors,
  updateCursor,
  updateContent,
  focusSection,
} = useCollaboration({
  documentId: params.id,
  userId: user?.id || user?._id,
  userName: user?.name || `${user?.firstName} ${user?.lastName}`,
  onContentChange: (data) => {
    // Handle incoming content changes
    // Update local state with data.content
  },
});

// Show presence indicators
<CollaborativePresence
  activeEditors={activeEditors}
  currentUserId={user?.id || user?._id}
/>

// In sections, show who's editing
<SectionPresenceIndicator
  sectionId={section.id}
  subsectionId={subsection?.id}
  activeEditors={activeEditors}
  currentUserId={user?.id || user?._id}
/>

// When content changes
updateContent(sectionId, subsectionId, newContent);

// When focusing a section
focusSection(sectionId, subsectionId);
```

## Running the Application

### Development
```bash
npm run dev
```
This starts the custom Next.js server with WebSocket support.

### Production
```bash
npm run build
npm start
```

## Technical Details

### Events
- `join-document`: Join a document editing room
- `cursor-update`: Update cursor position
- `content-update`: Broadcast content changes
- `section-focus`: Indicate which section is being edited
- `heartbeat`: Keep connection alive
- `disconnect`: Clean up on disconnect

### Server Events (sent to clients)
- `presences-update`: Full list of active editors
- `user-joined`: New user joined
- `user-left`: User disconnected
- `cursor-moved`: Cursor position changed
- `content-changed`: Content was updated
- `user-focused`: User focused on a section

### Cleanup
- Inactive users (no activity for 30 seconds) are automatically removed
- Empty document rooms are cleaned up
- Recent edits are kept for the last 100 changes per document

## Security Considerations

- Users must be authenticated via NextAuth
- WebSocket connections validate user sessions
- Document access is controlled by existing API permissions
- CORS configured to only allow requests from the application origin

## Performance

- Efficient room-based broadcasting (only users editing the same document receive updates)
- Debounced content updates to reduce network traffic
- Automatic cleanup of stale data
- Connection pooling and efficient state management

## Future Enhancements

- Operational transformation for more sophisticated conflict resolution
- Document locking for critical sections
- Chat/commenting features
- Revision history with collaborative annotations
- Mobile device support optimization
