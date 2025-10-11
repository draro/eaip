# Audit Logs Viewer Guide

## Overview

The audit logs viewer provides a comprehensive interface for viewing and analyzing application logs with role-based access control.

**URL:** `/admin/logs`

## Access Control

### Super Admin
- **Access:** ALL logs across ALL organizations
- **Features:**
  - Organization column visible in table
  - Can filter by any organization
  - Sees system-level logs (no organizationId)
  - Useful for security monitoring and compliance audits

### Organization Admin
- **Access:** Logs for THEIR organization ONLY
- **Features:**
  - Organization column hidden (always their org)
  - Automatic filtering by organizationId
  - Cannot see logs from other organizations
  - Useful for organization-level monitoring

### Other Roles
- **Access:** DENIED (403 Forbidden)

## Features

### 1. Advanced Filtering

**Search Box**
- Search text in log messages
- Case-insensitive search
- Real-time filtering

**Level Filter**
- `error` - Error messages (red badge)
- `warn` - Warning messages (yellow badge)
- `info` - Informational messages (blue badge)
- `debug` - Debug messages (gray badge)

**Action Filter**
- Filter by specific actions (login, create, update, delete, etc.)
- Dropdown populated with all available actions in your logs

**Resource Filter**
- Filter by resource type (documents, users, auth, workflows, etc.)
- Dropdown populated with all available resources

**Date Range**
- Start Date: Filter logs after this date/time
- End Date: Filter logs before this date/time
- Both fields support date and time selection

**Quick Actions**
- Reset Filters: Clear all filters and return to default view
- Refresh: Reload logs with current filters

### 2. Statistics Cards

**Total Logs**
- Shows total number of logs matching current filters
- Updates in real-time as filters change

**Current Page**
- Shows current page number and total pages
- Helps with navigation

**Actions**
- Count of unique action types in your logs
- Indicates variety of operations

**Resources**
- Count of unique resource types in your logs
- Indicates system coverage

### 3. Data Table

**Columns:**
- **Timestamp** - When the log was created (formatted: "Jan 1, 2025, 10:30:45 AM")
- **Level** - Log level with color-coded badge
- **Message** - Log message (truncated, click to see full)
- **Action** - Action performed (code-styled)
- **Resource** - Resource affected (code-styled)
- **User** - User who performed action (name + email)
- **Organization** - Organization (super_admin only)
- **Actions** - View Details button

**Sorting:**
- Logs are sorted by timestamp (newest first)

**Pagination:**
- 50 logs per page (configurable)
- Previous/Next buttons
- Shows current range (e.g., "Showing 1 to 50 of 1,234 results")

### 4. Log Details Modal

Click any log row or "View Details" button to open detailed view:

**Basic Information:**
- Timestamp
- Level (badge)
- Action (code-styled)
- Resource (code-styled)
- Message (full text)

**User Information:**
- User name
- User email
- User role

**Organization Information:**
- Organization name
- Organization domain

**HTTP Request Info:**
- Request method (GET, POST, PUT, DELETE, etc.)
- Request URL
- Status code (color-coded: green for 2xx, red for 4xx/5xx)
- Duration (milliseconds)

**Additional Info:**
- IP Address
- Request ID (for tracing)
- User Agent (browser/client info)
- Tags (categorization badges)
- Details (formatted JSON with all metadata)

## Common Use Cases

### 1. Security Monitoring

**View Failed Login Attempts**
```
1. Set Action filter to "login_failed"
2. Set Level filter to "warn" or "error"
3. Look for patterns (same IP, multiple users, etc.)
```

**View Unauthorized Access Attempts**
```
1. Set Action filter to "unauthorized_access"
2. Set Level filter to "warn"
3. Check IP addresses and user patterns
```

**View All Security Events**
```
1. Search for "security" in message box
2. Or filter by tag "security" (future enhancement)
```

### 2. User Activity Tracking

**View Specific User Activity**
```
1. Search for user email in search box
2. Or filter by userId (requires knowing user ID)
3. Review all actions performed by user
```

**View Document Changes**
```
1. Set Resource filter to "documents"
2. Set Action filter to "update" or "delete"
3. Review who changed what and when
```

### 3. Performance Monitoring

**View Slow Operations**
```
1. Set Level filter to "warn"
2. Search for "slow" in message box
3. Check duration field in details
```

**View Error Logs**
```
1. Set Level filter to "error"
2. Review error messages and stack traces
3. Identify patterns and common issues
```

### 4. Compliance Auditing

**View Last 30 Days Activity**
```
1. Set Start Date to 30 days ago
2. Leave End Date empty (defaults to now)
3. Export results (future enhancement)
```

**View Organization Activity (org_admin)**
```
1. All logs automatically filtered to your organization
2. Use date range to review specific period
3. Filter by resource for specific operations
```

## Testing the Logs Viewer

### Test as super_admin

1. **Login as super_admin**
   ```
   Email: your-super-admin@example.com
   Password: your-password
   ```

2. **Navigate to logs**
   ```
   URL: https://your-domain.com/admin/logs
   ```

3. **Verify you see:**
   - Badge showing "Super Admin"
   - Message: "Viewing all logs across all organizations"
   - Organization column in table
   - Logs from multiple organizations (if available)

4. **Test filters:**
   - Try each filter option
   - Verify results update correctly
   - Check pagination works

5. **Test modal:**
   - Click any log row
   - Verify all details displayed
   - Check JSON formatting in details section

### Test as org_admin

1. **Login as org_admin**
   ```
   Email: your-org-admin@example.com
   Password: your-password
   ```

2. **Navigate to logs**
   ```
   URL: https://your-domain.com/admin/logs
   ```

3. **Verify you see:**
   - Badge showing "Organization Admin"
   - Message: "Viewing logs for your organization only"
   - NO Organization column in table
   - ONLY logs from your organization

4. **Test filters:**
   - Verify you only see your org's data in filters
   - Confirm you cannot see other organizations' logs

5. **Verify isolation:**
   - Compare log count with super_admin view
   - Confirm numbers are different (fewer for org_admin)
   - Check specific logs to ensure all belong to your org

### Test as other roles

1. **Login as viewer, editor, or atc**

2. **Try to access logs**
   ```
   URL: https://your-domain.com/admin/logs
   ```

3. **Verify:**
   - You get 403 Forbidden error
   - Or redirected to unauthorized page
   - Cannot access logs at all

## API Endpoint

**Endpoint:** `GET /api/admin/logs`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Logs per page (default: 50)
- `level` - Filter by level (error, warn, info, debug)
- `action` - Filter by action
- `resource` - Filter by resource
- `userId` - Filter by user ID
- `startDate` - Filter logs after this date (ISO 8601)
- `endDate` - Filter logs before this date (ISO 8601)
- `search` - Search in message field

**Example Request:**
```bash
curl -X GET 'https://your-domain.com/api/admin/logs?level=error&page=1&limit=10' \
  -H 'Cookie: your-session-cookie'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "timestamp": "2025-01-11T10:30:45.123Z",
        "level": "error",
        "message": "Database connection failed",
        "action": "connect",
        "resource": "database",
        "userId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "org_admin"
        },
        "organizationId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "ACME Corp",
          "domain": "acme.example.com"
        },
        "ipAddress": "192.168.1.100",
        "duration": 5000,
        "tags": ["database", "error"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 234,
      "pages": 24
    },
    "filters": {
      "levels": ["error", "warn", "info", "debug"],
      "actions": ["login", "create", "update", "delete", "connect"],
      "resources": ["users", "documents", "database", "auth"]
    },
    "userRole": "super_admin"
  }
}
```

## Performance Considerations

**Database Indexes:**
- Logs are indexed on `timestamp`, `organizationId`, `level`, `action`, `resource`
- Compound index on `organizationId + timestamp` for org_admin queries
- Queries are optimized for fast retrieval

**Pagination:**
- Default 50 logs per page to balance performance and usability
- Can be adjusted via limit parameter (max recommended: 100)

**Retention:**
- Logs older than 90 days are automatically deleted (configurable)
- TTL index removes old logs without manual intervention

## Troubleshooting

### No logs appearing

**Check:**
1. Winston is configured correctly (`MONGODB_URI` in .env)
2. Application is writing logs (check MongoDB collection)
3. Your user role is super_admin or org_admin
4. Date filters aren't excluding all logs
5. Search filters aren't too restrictive

**Verify logs exist:**
```bash
mongo eaip --eval "db.auditlogs.count()"
```

### org_admin sees too many/few logs

**Check:**
1. User's organization ID is set correctly
2. Logs have organizationId field populated
3. No duplicate organizations in database

**Verify user organization:**
```bash
mongo eaip --eval "db.users.findOne({email: 'user@example.com'}, {organization: 1})"
```

### Filters not working

**Check:**
1. Browser console for JavaScript errors
2. Network tab for API errors
3. Filter values match actual log data
4. Try resetting filters

### Modal not opening

**Check:**
1. JavaScript is enabled
2. No console errors
3. Log object has _id field
4. Try refreshing page

## Future Enhancements

Planned features for future releases:

1. **Export Logs**
   - Export to CSV
   - Export to JSON
   - Export filtered results only

2. **Real-time Streaming**
   - WebSocket connection for live logs
   - Auto-refresh every N seconds
   - Push notifications for critical logs

3. **Advanced Analytics**
   - Log volume charts
   - Error rate trends
   - Most active users/resources
   - Performance metrics dashboard

4. **Saved Filters**
   - Save filter combinations
   - Quick filter presets
   - Share filters with team

5. **Alerts & Notifications**
   - Email alerts for critical logs
   - Slack/Teams integration
   - Custom alert rules

6. **Log Aggregation**
   - Group by action/resource/user
   - Count and statistics
   - Time-based aggregations

## Support

For questions or issues:
- Check this documentation
- Review Security Audit Report (Finding C-003)
- Test with different filters
- Check browser console for errors
- Verify user role permissions

---

*Last Updated: 2025-01-11*
*Version: 1.0*
*Status: Production Ready*
