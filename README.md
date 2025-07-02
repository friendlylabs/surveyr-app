# Surveyr Collect

Collect data anytime, anywhere — even offline!

Collect is a companion to **Surveyr**, an open-source form builder designed for creating engaging surveys, questionnaires, quizzes, and polls.

This version is based on React Native built with Expo Router, where as the initial version was initially implemented with [cordova](https://github.com/friendlylabs/collect/tree/cordova)

## Features

- **QR Code Authentication**: Scan QR codes to automatically authenticate and access survey projects
- **Manual Login**: Enter server details, credentials, and project ID manually
- **Secure Storage**: User credentials and project data are stored securely using AsyncStorage
- **Camera Integration**: Built-in camera support for QR code scanning
- **Toast Notifications**: User-friendly feedback for all operations
- **Modern UI**: Clean, responsive design with proper loading states
- **Offline Support**: Continue collecting data without an internet connection

## Completion State

This app is a work in progress, with the following features implemented, so it is not yet ready for production use:

* [X] Authentication
* [X] Forms fetching and Caching
* [X] Native Form rendering, most questions are now support except for the questions involving
  * [ ] Select options from URL
  * [ ] Offline map support
* [X] Offline Data submission and Storage
* [ ] Data synchronization
* [ ] User settings and preferences
* [ ] Zones and Reusable Data

## Limitations

The main data collection functionality relies on SurveyJS, which currently lacks a native React Native implementation. As a result, survey forms are rendered within a WebView. This approach may not deliver the optimal user experience and requires additional effort to ensure the app functions as intended.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```
2. Start the app

   ```bash
   npx expo start
   ```
