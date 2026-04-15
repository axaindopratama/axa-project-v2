# Auth & RBAC Implementation Plan

## Overview
Dokumentasi ini menjelaskan rencana implementasi untuk memperbaiki sistem autentikasi dan RBAC (Role-Based Access Control) di project AXA.

## Current Problem
1. **User sync issue**: Supabase Auth adalah source of truth, tapi Turso tidak otomatis tersinkronisasi
2. **Manual signup via Dashboard** tidak memicu webhook, menyebabkan user tidak ada di Turso
3. **Role management** tidak berfungsi dengan baik

## Solution Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Supabase Auth  │────▶│   Next.js App   │────▶│  Turso (Turso)  │
│  (Source Truth) │     │   Middleware    │     │  (App Database) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │  On-Login Sync  │
        │               │  (Check & Create)│
        │               └─────────────────┘
        ▼
┌─────────────────┐
│    Webhook      │ (For auto-sync on signup)
└─────────────────┘
```

## Implementation Order

### Step 1: Create `user-sync.ts` utility
- **Location**: `src/lib/user-sync.ts`
- **Purpose**: Utility untuk sync user dari Supabase Auth ke Turso
- **Functions**:
  - `syncUserOnLogin(supabaseUser)`: Check if user exists in Turso, create if not
  - `getUserFromTurso(supabaseId)`: Get user by supabase_id

### Step 2: Update `middleware.ts`
- **Location**: `src/middleware.ts`
- **Changes**:
  - Panggil sync user setelah login berhasil
  - Enforce RBAC protection untuk protected routes
  - Redirect ke `/complete-profile` jika user baru

### Step 3: Create `/complete-profile` page
- **Location**: `src/app/(protected)/complete-profile/page.tsx`
- **Purpose**: Untuk user baru melengkapi profil mereka
- **Fields**:
  - Full name
  - Company name (optional)
  - Phone number (optional)

### Step 4: Update `SettingsPageClient.tsx`
- **Location**: `src/app/(protected)/settings/SettingsPageClient.tsx`
- **Enhancements**:
  - Tampilkan current profile info
  - Form untuk edit full_name, phone_number
  - Tampilkan role saat ini (read-only)
  - Link ke password change

### Step 5: Create password change API
- **Location**: `src/app/api/auth/change-password/route.ts`
- **Method**: POST
- **Purpose**: Handle password change via Supabase Auth
- **Security**: Requires authenticated user

### Step 6: Create user management API (admin only)
- **Location**: `src/app/api/admin/users/route.ts`
- **Methods**: GET (list all users), PATCH (update role)
- **Security**: Admin role required
- **RBAC**: Only `admin` role can access

### Step 7: Create `/admin/users` page
- **Location**: `src/app/(protected)/admin/users/page.tsx`
- **Purpose**: Admin interface untuk manage users
- **Features**:
  - List all users dengan role
  - Change role dropdown (viewer, editor, admin)
  - User status indicator

### Step 8: Update `rbac.ts`
- **Location**: `src/lib/rbac.ts`
- **Changes**:
  - Tambahkan `getUserRole(supabaseId)` function
  - Lookup role dari Turso database
  - Cache role untuk performance

## Database Schema (Existing)

```sql
-- users table (di Turso)
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (uuid4()),
  supabase_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  company_id TEXT,
  role TEXT DEFAULT 'viewer', -- 'viewer' | 'editor' | 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Role Definitions

| Role | Permissions |
|------|-------------|
| `viewer` | Read-only access to entities, transactions, projects |
| `editor` | Can create/edit entities, transactions |
| `admin` | Full access + user management + settings |

## File Changes Summary

| File | Action | Priority |
|------|--------|----------|
| `src/lib/user-sync.ts` | Create | High |
| `src/middleware.ts` | Update | High |
| `src/app/(protected)/complete-profile/page.tsx` | Create | High |
| `src/app/(protected)/settings/SettingsPageClient.tsx` | Update | Medium |
| `src/app/api/auth/change-password/route.ts` | Create | Medium |
| `src/app/api/admin/users/route.ts` | Create | Medium |
| `src/app/(protected)/admin/users/page.tsx` | Create | Medium |
| `src/lib/rbac.ts` | Update | Medium |

## Environment Variables Required

```env
# Already exist
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# New (optional - for webhook validation)
SUPABASE_WEBHOOK_SECRET=
```

## Testing Checklist

- [ ] User signup flow → user created in Turso
- [ ] Login flow → user synced to Turso
- [ ] RBAC middleware → blocks unauthorized access
- [ ] Complete profile page → saves data correctly
- [ ] Settings page → displays and updates profile
- [ ] Password change → updates Supabase Auth
- [ ] Admin users page → lists and updates roles
- [ ] Role-based access → correct permissions enforced

## Notes

1. **Supabase Auth = Source of Truth**: Untuk autentikasi, Supabase Auth adalah yang utama
2. **Turso = App Database**: Untuk data aplikasi (profile, role, dll)
3. **Webhook**: Untuk auto-sync saat signup via Supabase Dashboard
4. **On-Login Sync**: Fallback untuk handle manual user creation
5. **Role is NOT self-service**: Hanya admin yang bisa mengubah role

## Status

- [x] Plan created
- [ ] Step 1: Create user-sync.ts
- [ ] Step 2: Update middleware.ts
- [ ] Step 3: Create complete-profile page
- [ ] Step 4: Update SettingsPageClient.tsx
- [ ] Step 5: Create password change API
- [ ] Step 6: Create admin users API
- [ ] Step 7: Create admin users page
- [ ] Step 8: Update rbac.ts
- [ ] Testing

---

Created: 2026-04-15
Last Updated: 2026-04-15