# EpiCircle Scrap Pickup App

A comprehensive React Native application for scrap pickup management, featuring separate, fully dynamic interfaces for customers and partners. This app was built to demonstrate a complete, end-to-end workflow from request to completion.

<img width="1206" height="2622" alt="Image" src="https://github.com/user-attachments/assets/a614c667-ef83-45c0-99f8-e76a0df8752b" />
<img width="1206" height="2622" alt="Image" src="https://github.com/user-attachments/assets/53d4d657-9a01-41e3-9c35-10c80ff69a4c" />
<img width="1206" height="2622" alt="Image" src="https://github.com/user-attachments/assets/9bfa8034-2dd1-4b45-a8e6-e90db6ad95e3" />
<img width="1206" height="2622" alt="Image" src="https://github.com/user-attachments/assets/892f8eb7-1d8e-4db4-ad37-6bb389f43310" />
<img width="1206" height="2622" alt="Image" src="https://github.com/user-attachments/assets/621057bb-65ee-4779-93ce-14660332eca3" />
<img width="1206" height="2622" alt="Image" src="https://github.com/user-attachments/assets/d18f87ae-e92d-4325-a15b-2563c0f2c0a8" />
<img width="1206" height="2622" alt="Image" src="https://github.com/user-attachments/assets/4f255acf-f8ab-40b6-b91c-ab8a3a963c73" />
<img width="1206" height="2622" alt="Image" src="https://github.com/user-attachments/assets/d29056ba-4291-469d-a1e4-7b6a96cf53c7" />

## App Workflow

The application supports a full, state-managed pickup lifecycle:

1.  **Customer Login**: A user logs in with their phone number. The app persists their session, so they don't lose their data.
2.  **Schedule Pickup**: The customer schedules a new pickup, which appears as "Pending" in their dashboard.
3.  **Partner Login**: A partner logs in and sees the new request in their "Available Pickups" list.
4.  **Accept Pickup**: The partner accepts the request. The status changes to "Accepted," and a unique `pickupCode` is generated and shown to the customer.
5.  **Start Pickup**: The partner arrives, gets the code from the customer, and enters it to start the pickup. The status changes to "In-Process."
6.  **Add Items**: The partner weighs the scrap items and adds their details (name, quantity, price) in the app.
7.  **Submit for Approval**: The partner submits the item list. The status changes to "Pending for Approval," and the customer gets a notification to review the items.
8.  **Customer Approval**: The customer reviews the dynamic list of items in a modal and approves the transaction.
9.  **Completed**: The status changes to "Completed" for both users, finalizing the workflow.

## Mock Backend Explained

This application operates without a traditional server-side backend. Instead, it simulates a backend environment locally on the device using the following approach:

-   **State Management with React Context API**:
    -   `DataContext.tsx`: Acts as the central "database" for the application. It holds all pickup requests and provides functions to Create, Read, and Update them (e.g., `createPickupRequest`, `approvePickup`). It uses React's `useState` hook to manage the application's data state.
    -   `AuthContext.tsx`: Manages user authentication and session persistence. It handles login, logout, and user creation.

-   **Data Persistence with AsyncStorage**:
    -   To ensure data is not lost when the app closes, the contexts use `@react-native-async-storage/async-storage`.
    -   `pickupRequests`: All pickup requests created in `DataContext` are serialized into a JSON string and saved to AsyncStorage, then loaded back into the context when the app starts.
    -   `userDatabase`: The `AuthContext` maintains a list of users in AsyncStorage. This allows the app to "remember" users by their phone number, creating persistent accounts and ensuring a consistent user experience across multiple sessions.

This setup effectively mimics the behavior of a real backend, allowing for a fully functional, dynamic, and stateful application that works entirely offline.

## Technology Stack

- **React Native** with TypeScript
- **Expo** for development and build
- **React Navigation** for all screen transitions
- **Context API** for centralized state management
- **AsyncStorage** for local data persistence and mock backend
- **Expo Linear Gradient** for premium UI gradients
- **Ionicons** for iconography

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your iOS or Android device

### Installation

1.  **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ScrapPickupApp
   ```

2.  **Install dependencies**
   ```bash
   npm install
   ```
   *If you encounter any dependency mismatches, run `npx expo install --fix` to resolve them.*

3.  **Start the development server**
   ```bash
   npx expo start
   ```

4.  **Run on your device**
   - A QR code will appear in your terminal.
   - Open the **Expo Go** app on your phone and scan the QR code to launch the application.

## Usage Guide

### First-Time Use

The app starts with no data. You must create users and requests to test the workflow.

**Demo OTP:** The app uses a mock OTP system for simplicity. Use `123456` to log in.

### Testing the Full Workflow

1.  **Login as Customer**: Select "Customer" and enter any phone number.
2.  **Create a Request**: From the dashboard, schedule a new pickup.
3.  **Logout**.
4.  **Login as Partner**: Select "Partner" and enter a *different* phone number.
5.  **Accept Request**: You will see the customer's request. Accept it.
6.  **Start Pickup**: Get the `pickupCode` from the customer's app screen and enter it.
7.  **Add Items**: Add a few scrap items.
8.  **Submit for Approval**.
9.  **Logout**.
10. **Login as Customer**: Use the original customer phone number.
11. **Approve the Order**: Tap the request, review the items in the modal, and approve it. The pickup is now "Completed." 
