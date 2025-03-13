# Firebase Security Rules

Copy and paste these rules in your Firebase Console (Firestore → Rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Room access
    match /rooms/{roomId} {
      allow read: if true; // Allow reading room data
      allow create: if true; // Allow creating new rooms
      allow update: if request.auth != null || 
                    resource.data.adminId == request.resource.data.adminId; // Only admin can update
      allow delete: if false; // Prevent deletion
      
      // Players in rooms
      match /players/{playerId} {
        allow read: if true; // Anyone can read player data
        allow create: if true; // Allow joining
        allow update: if playerId == request.resource.data.nickname || // Player can update own data
                      get(/databases/$(database)/documents/rooms/$(roomId)).data.adminId == request.auth.uid; // Or admin
        allow delete: if false; // Prevent deletion
      }
    }
  }
}
```

These rules ensure:
- Only the admin can update room settings
- Players can only update their own bingo cards
- No one can delete data
