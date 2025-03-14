## Firebase Security Rules for Stream Bingo

### Development Rules (VERY PERMISSIVE - FOR TESTING ONLY)
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all read and write operations during development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Recommended Production Rules
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rooms collection
    match /rooms/{roomId} {
      // Anyone can read room details
      allow read: if true;
      
      // Create rooms with some basic validation
      allow create: if request.auth != null 
                    && request.resource.data.keys().hasAll(['createdAt', 'gridSize', 'creatorId', 'active'])
                    && request.resource.data.gridSize is int
                    && request.resource.data.gridSize >= 3 
                    && request.resource.data.gridSize <= 5;
      
      // Update rules: Only creator can modify
      allow update: if request.auth != null 
                    && resource.data.creatorId == request.auth.uid;
    }
  }
}
```

### Deployment Instructions
1. Go to Firebase Console
2. Select your project
3. Go to Firestore Database
4. Select "Rules" tab
5. Replace existing rules with one of the above sets
6. Click "Publish"

### Security Considerations
- Development rules allow ALL access - NEVER use in production
- Production rules add basic validation and access control
- Always test thoroughly before deploying to production
