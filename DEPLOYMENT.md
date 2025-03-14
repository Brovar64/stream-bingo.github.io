# Deployment Guide for Stream Bingo

This guide explains how to securely deploy your Stream Bingo application.

## Local Development Setup

1. **Create your local Firebase config file**:
   
   Copy the sample config file to create your actual config:
   ```
   cp firebase-config.sample.json firebase-config.json
   ```

2. **Add your actual Firebase credentials** to `firebase-config.json`:
   ```json
   {
     "apiKey": "AIzaSyC6HO0LPJwI4tlWYlYSxw2IEGUu6Fu-fOU",
     "authDomain": "stream-bingo-ecb40.firebaseapp.com",
     "projectId": "stream-bingo-ecb40",
     "storageBucket": "stream-bingo-ecb40.firebasestorage.app",
     "messagingSenderId": "814141306111",
     "appId": "1:814141306111:web:319ac02de11210186408ca",
     "measurementId": "G-1DYM2MTE10"
   }
   ```

3. **Test locally** by opening index.html in your browser

## GitHub Pages Deployment

For deploying to GitHub Pages:

1. **Make your repository private** in GitHub Settings

2. **Set up Firebase security rules**:
   - Copy rules from `firebase-security-rules.md` into your Firebase Console

3. **Enable Firebase App Check** (Optional but recommended):
   - In Firebase Console, go to Project Settings > App Check
   - Register a reCAPTCHA v3 site key
   - Update `js/firebase-app-check.js` with your site key

4. **Create a GitHub Actions workflow for secure deployment**:
   - The workflow `.github/workflows/pages.yml` is already set up
   - Add your Firebase credentials as GitHub Secrets (optional for enhanced security)

## Managing Firebase Configuration

As a security best practice, never commit `firebase-config.json` to your repository. The `.gitignore` file is already configured to exclude this file.

## Access Restriction Options

For additional security:

1. **Implement domain restrictions** in the Firebase Console
2. **Set API key restrictions** in the Google Cloud Console 
3. **Enable Firebase Authentication** for more controlled access

## Monitoring Usage

Monitor your Firebase usage to detect any unusual activity:
- Set up budget alerts in the Firebase Console
- Check the Firebase usage dashboard regularly
