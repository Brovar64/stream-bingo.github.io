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

### Important Notes
1. These DEVELOPMENT rules allow ALL access to your database
2. NEVER use these rules in a production environment
3. Always replace with more restrictive rules before deploying

### Deployment Steps
1. Go to Firebase Console
2. Select your project
3. Navigate to Firestore Database
4. Select "Rules" tab
5. Replace existing rules with the development rules above
6. Click "Publish"

### Security Warning
Keeping these open rules on a live project can expose your data to unauthorized access!