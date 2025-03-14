## Firebase Security Rules

These security rules should be configured in your Firebase project to ensure proper operation of the Stream Bingo app.

### Firestore Rules

For testing purposes, you can start with these permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // WARNING: Only for testing!
    }
  }
}
```

### Production Rules (Recommended for later)

For production, use more restrictive rules like:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow test connections
    match /_connection_test/{document} {
      allow read, write: if true;
    }
    
    // Room data
    match /rooms/{roomId} {
      allow read: if true;  // Anyone can view room details
      allow create: if request.auth != null;  // Only authenticated users can create
      allow update, delete: if request.auth != null && 
        (resource.data.creatorId == request.auth.uid || resource.data.admins[request.auth.uid] == true);
      
      // Player data within rooms
      match /players/{playerId} {
        allow read: if true;
        allow write: if request.auth != null && 
          (playerId == request.auth.uid || 
           get(/databases/$(database)/documents/rooms/$(roomId)).data.admins[request.auth.uid] == true);
      }
      
      // Bingo words within rooms
      match /words/{wordId} {
        allow read: if true;
        allow write: if request.auth != null && 
          get(/databases/$(database)/documents/rooms/$(roomId)).data.admins[request.auth.uid] == true;
      }
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Instructions for Applying Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on "Firestore Database" in the left sidebar
4. Select the "Rules" tab
5. Replace the content with one of the rule sets above
6. Click "Publish"

### Important Security Considerations

- The testing rules allow anyone to read and write to your database
- Only use the testing rules in development
- Switch to the production rules before making your app public
