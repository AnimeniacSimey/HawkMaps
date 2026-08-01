# HawkMaps 🦅📍

HawkMaps is a mobile navigation app built for the Wilfrid Laurier University Waterloo campus. It combines an interactive campus map, study space availability, club events, restaurant reviews, goose reporting, and the GoldenHawk AI assistant into a single application.

## Tech Stack

* React Native
* Expo
* Expo Router
* FastAPI
* Python
* Leaflet (via WebView)
* SQLite

---

## Prerequisites

Before getting started, install:

* Node.js
* Python 3.10+
* Visual Studio Code (recommended)
* Expo Go SDK Version 56 (Android or iOS)

---

## Installation

Clone the repository:

```bash
git clone https://github.com/AnimeniacSimey/HawkMaps.git
cd HawkMaps
```

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

---

## Running the Project

### 1. Start the frontend

From the project root:

```bash
npx expo start
```

Scan the QR code using the Expo Go app. If prompted to sign into Expo, select **Proceed anonymously**.

### 2. Start the backend

In a separate terminal:

```bash
cd backend
python main.py
```

The app is now ready to use.

---

## Test Account

Club Executive account:

```
Email: exec1234@mylaurier.ca
Password: hawkmaps
```

You can also create your own account using a valid `@mylaurier.ca` or `@wlu.ca` email address.

---
---
## Troubleshooting
Q: Scanned QR code but it's stuck loading  
A: Pay close attention to your VSCode/IDE terminal when you run the app; before it starts building, it will prompt you to either log into an Expo account or 'Proceed Anonymously'
* You may do whichever you wish, although Proceeding will be immediate

Q: Java Fetch Error  
A: If accessing on school wifi, you will need to add the --tunnel flag when you're starting the app. Simply close the connection in your terminal by pressing Ctrl + C, then enter the following command:
```bash
npx expo start --tunnel
```

---
## Features

* 🗺️ Interactive campus map
* 🤖 GoldenHawk AI assistant
* 📚 Live study space availability
* 📅 Club event discovery and creation
* ⭐ Restaurant ratings and reviews
* 🪿 Community goose reporting
* ♿ Accessibility information and building hours

---

## Project Structure

```
HawkMaps/
├── app/              # React Native screens
├── components/       # Reusable UI components
├── backend/          # FastAPI server
├── src/data/         # Campus datasets
├── scripts/          # Data generation utilities
└── assets/           # Images and icons
```

---

Developed as the final group project for **CP317 – Software Engineering** at Wilfrid Laurier University.
