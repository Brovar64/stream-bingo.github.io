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

## Setup and Configuration

### Firebase Setup

This application requires Firebase for authentication and database functionality. Follow these steps to set it up:

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Firestore Database and Authentication in your Firebase project
3. Create a file named `firebase-config.json` in the root directory with your Firebase credentials:

```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT_ID.appspot.com",
  "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
  "appId": "YOUR_APP_ID",
  "measurementId": "YOUR_MEASUREMENT_ID"
}
```

4. Add this file to your `.gitignore` if you're pushing to a public repository to keep your keys private

### Security Rules

For proper Firebase security, add the security rules from the `firebase-security-rules.md` file to your Firebase project's security rules.

## Local Development

To run the project locally:

1. Clone the repository
2. Create the `firebase-config.json` file with your credentials
3. Open `index.html` in your browser or use a local server

## Technologies Used

- HTML, CSS, JavaScript
- Firebase Firestore (realtime database)
- Firebase Authentication
- GitHub Pages
