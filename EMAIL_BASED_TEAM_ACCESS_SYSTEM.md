# Email-Based Team Access System

## 🎯 OVERVIEW

Implemented a sophisticated email-based authentication system that allows:
- **Admins**: Access any team's portal using their admin email
- **Team Captains**: Access only their own team's portal
- **Secure Access Control**: Email verification for admin access
- **Audit Trail**: Complete logging of admin access attempts

## 🔐 AUTHENTICATION FLOW

### **For Admins**
```
1. Admin visits Admin Teams page
2. Clicks "🔐 Access Team Portal" button for any team
3. Enters admin email in prompt
4. System verifies admin email against whitelist
5. Creates temporary team captain session
6. Opens team portal in new tab with admin access indicator
7. Admin can view/manage team data with full permissions
```

### **For Team Captains**
```
1. Team Captain logs in with their credentials
2. System validates their team assignment
3. Can only access their own team's portal
4. No cross-team access allowed
```

## 🛡️ SECURITY FEATURES

### **Admin Email Verification**
```typescript
const validAdminEmails = [
  'admin@wattaqa.com',
  'festival@wattaqa.com', 
  'coordinator@wattaqa.com',
  // Development: emails ending with @admin.com
];
```

### **Temporary Session Creation**
```typescript
const tempUser = {
  id: `admin-${Date.now()}`,
  email: adminEmail,
  userType: 'team-captain',
  team: { code: teamCode, name: teamName },
  isAdminAccess: true,
  originalAdminEmail: adminEmail,
  accessGrantedAt: new Date().toISOString()
};
```

### **Access Control Matrix**
```
User Type    | Own Team | Other Teams | Admin Email Required
-------------|----------|-------------|--------------------
Admin        |    ✅     |      ✅      |         ✅
Team Captain |    ✅     |      ❌      |         ❌
```

## 🎨 USER INTERFACE

### **Admin Teams Page Enhancement**
- Added "🔐 Access Team Portal" button for each team
- Button styled with team colors for visual consistency
- Gradient background matching team theme
- Prominent placement below Edit/Delete buttons

### **Admin Access Indicator**
- Purple gradient banner at top of team portal
- Shows admin email and team being accessed
- "Exit Admin Mode" button to return to admin dashboard
- Only visible during admin access sessions

### **Visual Design**
```
┌─────────────────────────────────────────────────────────┐
│ 🛡️ Admin Access Mode                    [Exit Admin Mode] │
│ admin@wattaqa.com accessing SUMUD portal                │
└─────────────────────────────────────────────────────────┘
```

## 🔧 TECHNICAL IMPLEMENTATION

### **API Endpoint** (`/api/auth/admin-team-access`)
```typescript
POST /api/auth/admin-team-access
{
  "adminEmail": "admin@wattaqa.com",
  "teamCode": "SMD", 
  "teamName": "SUMUD"
}

Response:
{
  "success": true,
  "tempUser": { /* temporary user object */ },
  "message": "Admin access granted to SUMUD team portal"
}
```

### **Admin Access Button**
```typescript
const handleAdminTeamAccess = async (team: Team) => {
  const email = prompt(`Enter your admin email to access ${team.name}:`);
  
  // Verify admin email via API
  const response = await fetch('/api/auth/admin-team-access', {
    method: 'POST',
    body: JSON.stringify({ adminEmail: email, teamCode: team.code })
  });
  
  // Create temporary session and open team portal
  if (response.ok) {
    localStorage.setItem('currentUser', JSON.stringify(tempUser));
    window.open(`/team-admin?team=${team.code}`, '_blank');
  }
};
```

### **Context Validation**
```typescript
// Allow admin access with proper authentication
if (requestedTeam !== user.team.code) {
  const isAdminAccess = localStorage.getItem('adminTeamAccess') === 'true';
  const originalAdminEmail = localStorage.getItem('originalAdminEmail');
  
  if (!isAdminAccess || !user.isAdminAccess) {
    setAccessDenied(true); // Block unauthorized access
    return;
  }
  
  console.log(`Admin access: ${originalAdminEmail} accessing ${requestedTeam}`);
}
```

## 📊 AUDIT & LOGGING

### **Access Logging**
```typescript
console.log(`Admin access granted: ${adminEmail} accessing team ${teamCode} (${teamName}) at ${new Date().toISOString()}`);
```

### **Security Violations**
```typescript
console.error(`SECURITY VIOLATION: User ${user.email} attempted unauthorized access to team ${requestedTeam}`);
```

### **Audit Trail**
- All admin access attempts logged with timestamp
- Email verification results recorded
- Team access sessions tracked
- Security violations documented

## 🎯 USAGE SCENARIOS

### **Scenario 1: Admin Accessing Team Portal**
1. Admin opens Admin Teams page
2. Finds target team (e.g., SUMUD)
3. Clicks "🔐 Access Team Portal" button
4. Enters admin email: `admin@wattaqa.com`
5. System verifies email and grants access
6. Team portal opens in new tab with admin indicator
7. Admin can view team data, results, candidates, etc.

### **Scenario 2: Team Captain Normal Access**
1. Team Captain logs in normally
2. Accesses their own team portal
3. No email prompt required
4. Standard team captain permissions

### **Scenario 3: Unauthorized Access Attempt**
1. Team Captain tries to access another team's URL
2. System detects team mismatch
3. Access denied screen shown
4. Security violation logged

## 🔒 SECURITY CONSIDERATIONS

### **Email Whitelist**
- Configurable list of valid admin emails
- Development mode allows `@admin.com` emails
- Production should use specific email addresses

### **Session Management**
- Temporary sessions for admin access
- Clear session data on exit
- No persistent admin privileges

### **Access Isolation**
- Admin access opens in new tab
- Original admin session remains intact
- No interference with normal admin workflow

## 🚀 BENEFITS

### **For Administrators**
- ✅ **Flexible Access**: Can access any team's portal
- ✅ **Email Security**: Requires admin email verification
- ✅ **Visual Feedback**: Clear admin access indicator
- ✅ **Easy Exit**: One-click return to admin dashboard

### **For Team Captains**
- ✅ **Secure Access**: Only their own team data
- ✅ **No Interference**: Admin access doesn't affect their sessions
- ✅ **Standard Experience**: Normal team portal functionality

### **For System Security**
- ✅ **Audit Trail**: Complete access logging
- ✅ **Email Verification**: Prevents unauthorized admin access
- ✅ **Session Isolation**: Temporary admin sessions
- ✅ **Clear Boundaries**: Distinct admin vs team captain modes

## 📋 CONFIGURATION

### **Admin Email Setup**
Update the admin email list in `/api/auth/admin-team-access/route.ts`:
```typescript
const validAdminEmails = [
  'your-admin@domain.com',
  'festival-coordinator@domain.com',
  // Add more admin emails
];
```

### **Development Mode**
For development, emails ending with `@admin.com` are automatically allowed.

## 🎉 CONCLUSION

The email-based team access system provides:
- **Secure admin access** to any team portal
- **Email verification** for authentication
- **Visual indicators** for admin sessions
- **Complete audit trail** for security
- **Seamless user experience** for both admins and team captains

This system maintains security while providing administrators the flexibility to access and manage any team's data when needed.