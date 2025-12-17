# Firebase Unauthenticated Access Setup

## Overview
SignCraft is configured to work with Firebase **without authentication**. All data operations use a default user ID for unauthenticated sessions.

## Current Configuration

### Default User Credentials
- **User ID**: `local_user`
- **Email**: `local@signcraft.dev`
- **Fallback**: Used when no authenticated user is present

### Key Services

#### 1. **designService.ts**
- Handles all design CRUD operations
- Functions:
  - `saveDesignToFirestore()` - Saves new designs
  - `updateDesignInFirestore()` - Updates existing designs
  - `getDesignById()` - Fetches a single design
  - `getUserDesigns()` - Gets designs for current user (filters by userId)
  - `getAllDesigns()` - Gets all designs (no user filter)
  - `deleteDesignFromFirestore()` - Deletes designs

#### 2. **responsiveFirestoreService.ts**
- Handles responsive designs with normalized coordinates
- Uses same default user credentials as designService

#### 3. **AuthContext.tsx**
- Provides default guest user if not authenticated
- Default guest user:
  ```javascript
  {
    id: 'guest-user-123',
    name: 'Guest Designer',
    email: 'guest@signcraft.dev'
  }
  ```

## Database Structure

### Collections
- `designs` - Main design documents
- `designs_responsive` - Responsive design documents

### Document Fields
Each design document contains:
```javascript
{
  id: string,              // Document ID
  userId: string,          // Owner ID (defaults to 'local_user')
  userEmail: string,       // Owner email
  isPublic: boolean,       // Public/Private flag
  metadata: {
    title: string,
    description: string,
    canvasWidth: number,
    canvasHeight: number,
    canvasColor: string,
    createdAt: string,     // ISO 8601
    updatedAt: string,     // ISO 8601
    createdBy: string,
    tags: string[],
    version: number
  },
  designJSON: {
    elements: Array,       // Design elements
    totalElements: number,
    version: string
  }
}
```

## Firebase Firestore Rules (Required)

To enable unauthenticated access, update your Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all read/write for unauthenticated users
    match /designs/{document=**} {
      allow read, write: if true;
    }
    
    match /designs_responsive/{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Security Note**: These rules allow anyone to read and write to your database. For production, consider implementing:
- Authentication-based rules
- Rate limiting
- Data validation
- Field-level security

## Setup Steps

### 1. **Firebase Console Configuration**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database
4. Go to **Rules** tab
5. Replace rules with the ones shown above
6. Click **Publish**

### 2. **Environment Variables**
Ensure your `.env.local` file has:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. **Data Flow**
1. User creates/edits design in editor
2. `useDesignSave()` hook handles save operation
3. Data is sent to `saveDesignToFirestore()` or `updateDesignInFirestore()`
4. Current user info obtained via `getCurrentUser()` (uses default if not authenticated)
5. Document saved to Firestore with userId field
6. Dashboard fetches user's designs via `getUserDesigns()`

## Page-Specific Configuration

### Dashboard (`/dashboard`)
- Uses `getUserDesigns()` - Shows only current user's designs
- Filters by `userId` field
- Works with default user credentials

### Playlist (`/playlist`)
- Uses `getAllDesigns()` - Shows all designs
- No user filtering

### Editor (`/editor`)
- Saves new designs with default user ID
- Saves to `designs` collection

### Modify Editor (`/modify/:designId`)
- Updates existing designs
- Preserves original `userId` from document

### Preview (`/preview/:designId`)
- Reads design data
- No write operations

## Data Access Flow

```
┌─────────────┐
│   Browser   │
│   (User)    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│   AuthContext.tsx       │
│ ┌─────────────────────┐ │
│ │ Default User:       │ │
│ │ id: guest-user-123  │ │
│ └─────────────────────┘ │
└──────┬──────────────────┘
       │
       ▼
┌──────────────────────────┐
│   designService.ts       │
│   responsiveFirestore... │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│   Firebase Firestore     │
│   (Unauthenticated)      │
└──────────────────────────┘
```

## Troubleshooting

### Issue: "Permission denied" errors
**Solution**: Update Firestore rules to allow unauthenticated access

### Issue: Designs not appearing in Dashboard
**Solution**: Ensure designs have matching `userId` field (should be `local_user`)

### Issue: Can't save designs
**Solution**: 
1. Check Firestore rules allow write
2. Verify API key is valid
3. Check browser console for error messages

### Issue: Firebase config not loading
**Solution**: 
1. Verify all environment variables are set
2. Restart development server after changing `.env.local`
3. Check `.env.local` file exists and is not in `.gitignore`

## Additional Notes

- All timestamps are stored in ISO 8601 format
- User ID defaults to `local_user` for consistency across sessions
- Designs are automatically versioned
- No authentication check required on any page
- Works offline-first with proper error handling

## Next Steps

1. Update Firebase Firestore rules as shown above
2. Verify environment variables are set correctly
3. Test design creation and editing
4. Check browser console for any Firebase errors
5. Verify data appears in Firebase Console -> Firestore

---

**Last Updated**: December 17, 2025
**Status**: Ready for unauthenticated Firebase access
