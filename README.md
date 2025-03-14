# Stream Bingo

An interactive bingo game for streamers and their audience. Streamers can create custom bingo cards that viewers can fill out during streams.

## Features

- Create bingo rooms with unique access codes
- Generate random bingo cards for players (3x3, 4x4, or 5x5)
- Real-time updates using Firebase
- Admin interface to monitor and confirm player actions
- Player interface to mark bingo items

## How to Use

### For Streamers (Admins)

1. Create a new bingo room
2. Choose the grid size (3x3, 4x4, or 5x5)
3. Add your bingo items
4. Share the access code with your viewers
5. Monitor player progress and confirm/reject marked items

### For Viewers (Players)

1. Enter the access code provided by the streamer
2. Enter your nickname
3. Play bingo by marking items as they occur during the stream
4. Wait for admin confirmation of your marked items

## Production Setup

### Firebase Setup (Important for App to Work!)

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Firestore Database and Authentication in your Firebase project
3. Get your Firebase configuration (Project Settings > General > Your apps > Firebase SDK snippet)
4. **DIRECT EDIT REQUIRED:** Open the file `js/firebase-config.js` and replace the placeholder values with your actual Firebase credentials

```javascript
// REPLACE THESE VALUES with your actual Firebase project values
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_ACTUAL_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_ACTUAL_PROJECT_ID",
    storageBucket: "YOUR_ACTUAL_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
    appId: "YOUR_ACTUAL_APP_ID",
    measurementId: "YOUR_ACTUAL_MEASUREMENT_ID"
};
```

5. Commit this change to your repository

### Security Rules

For proper Firebase security, add the security rules from the `firebase-security-rules.md` file to your Firebase project's security rules.

## Technologies Used

- HTML, CSS, JavaScript
- Firebase Firestore (realtime database)
- Firebase Authentication
- GitHub Pages
