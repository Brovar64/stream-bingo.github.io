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

### Firebase Setup and Deployment

The app uses GitHub Actions to securely deploy your Firebase configuration to GitHub Pages.

1. **Firebase Setup**:
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Firestore Database and Authentication
   - Get your Firebase configuration values

2. **GitHub Secrets**:
   - The following GitHub secrets should be set up in your repository:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID`

3. **Deployment**:
   - After updating any GitHub secrets, manually trigger the "Build and Deploy" GitHub Action in the Actions tab
   - This will securely deploy your app with the Firebase configuration

### Security Rules

Set up your Firebase security rules as specified in the `firebase-security-rules.md` file in your Firebase project.

## Technologies Used

- HTML, CSS, JavaScript
- Firebase Firestore (realtime database)
- Firebase Authentication
- GitHub Pages
- GitHub Actions (for secure deployment)
