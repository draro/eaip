# Testing Real-Time Collaborative Editing

## Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3000` with WebSocket support.

2. **Make sure MongoDB is running** for authentication and document storage.

## Test Scenario 1: Two Editors, Same Document

### Step 1: Open Browser 1
1. Open Chrome/Safari: `http://localhost:3000`
2. Sign in as User 1 (e.g., admin)
3. Navigate to Documents → Select a document → Click "Edit"
4. You should see the document editor

### Step 2: Open Browser 2 (Incognito/Private Mode)
1. Open Chrome Incognito or Safari Private Window: `http://localhost:3000`
2. Sign in as User 2 (different user)
3. Navigate to the **same document** → Click "Edit"

### Step 3: Test Real-Time Features

**✅ Presence Indicators**
- In both browsers, you should see a presence indicator near the top showing "1 editor active"
- Each editor will see a colored avatar with the other user's initial
- Hover over the avatar to see the user's name

**✅ Section Presence**
- When User 1 clicks to expand a section, User 2 should see a colored badge next to that section showing User 1's name
- The badge will show which section is being actively edited

**✅ Real-Time Content Changes**
- User 1: Type some text in a section
- User 2: Should see the text appear in real-time (within 1-2 seconds)
- User 2: Edit a different section
- User 1: Should see User 2's changes appear

**✅ Multiple Sections**
- User 1: Edit Section GEN 1.1
- User 2: Edit Section GEN 1.2 simultaneously
- Both should see each other's presence indicators on different sections
- Both should receive the other's changes

## Test Scenario 2: Disconnect and Reconnect

### Step 1: Simulate Network Issue
1. In Browser 1, open DevTools (F12)
2. Go to Network tab → Enable "Offline"
3. The presence indicator should disappear from Browser 2 after ~30 seconds
4. Disable "Offline" in Browser 1
5. The presence indicator should reappear in Browser 2

### Step 2: Verify Recovery
- User 1 should automatically reconnect
- Changes made while offline won't be broadcast (but are saved locally)
- Once reconnected, new changes are broadcast again

## Test Scenario 3: Three or More Editors

1. Open 3+ browser windows/tabs (can use different browsers)
2. Sign in as different users in each
3. Open the same document in edit mode
4. Verify:
   - All avatars appear in the presence indicator
   - If more than 5 users, it shows "+X more"
   - Each user has a unique color
   - All users see everyone else's changes

## Expected Behaviors

### ✅ What Should Work

| Feature | Expected Behavior |
|---------|------------------|
| **Presence** | See all active editors with avatars |
| **Section Focus** | See colored badges showing who's editing which section |
| **Real-Time Content** | See text appear as others type |
| **Colors** | Each user has a consistent, unique color |
| **Reconnection** | Automatic reconnect after network issues |
| **Cleanup** | Inactive users removed after 30 seconds |

### ⚠️ What Doesn't Work (By Design)

| Feature | Behavior |
|---------|----------|
| **Conflict Resolution** | Last save wins - no automatic merge |
| **Cursor Position** | Cursor tracking not implemented in this version |
| **Auto-Save** | Changes are NOT saved automatically - users must click "Save" |
| **Version Control** | No automatic versioning of collaborative edits |

## Troubleshooting

### Problem: Not seeing other editors

**Check:**
1. Both users are on the same document ID (check URL)
2. WebSocket connection is established (check browser console for "Connected to collaboration server")
3. Server is running with `npm run dev` (not `npm run dev:next`)
4. Port 3000 is not blocked by firewall

**Solution:**
```bash
# Restart server
pkill -f "node server.js"
npm run dev
```

### Problem: Changes not appearing

**Check:**
1. Network tab in DevTools - look for WebSocket connection (ws://)
2. Console for any errors
3. Both users are in edit mode (not view mode)

**Debug:**
```javascript
// In browser console
console.log('WebSocket status:', window.io) // Should exist
```

### Problem: "Module not found" error

**Check:**
```bash
# Make sure all packages are installed
npm install

# Check if server.js exists
ls -la server.js
```

## Production Considerations

Before deploying to production:

1. **SSL/TLS**: WebSockets need `wss://` in production
2. **Environment Variables**: Update `NEXTAUTH_URL` in production
3. **Scaling**: Consider Redis adapter for Socket.IO if scaling horizontally
4. **Monitoring**: Add logging for connection counts and errors
5. **Rate Limiting**: Add rate limiting to prevent abuse
6. **Authentication**: Ensure WebSocket connections validate JWT tokens

## Performance Metrics

Expected performance:
- **Latency**: < 100ms for local network, < 500ms for remote
- **Concurrent Users**: Up to 50 users per document (recommended)
- **Memory**: ~10MB per active document session
- **Bandwidth**: ~5KB/s per active editor

## Next Steps

To improve the collaborative editing:
1. Add operational transformation for better conflict resolution
2. Implement live cursor tracking
3. Add auto-save every 30 seconds
4. Show typing indicators
5. Add chat/comments
6. Implement document locking for critical sections
