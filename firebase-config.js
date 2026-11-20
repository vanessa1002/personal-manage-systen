// Firebase Web app settings (Firebase Console > Project settings > Your apps).
// These values identify your Firebase app; Firebase API keys are not server secrets.
export const firebaseConfig = {
  apiKey: "AIzaSyCyfVKhe9U1p1k8kLbYYLQtjQFRwff5jv8",
  authDomain: "date-calendar-9cc6a.firebaseapp.com",
  projectId: "date-calendar-9cc6a",
  appId: "1:1016533480069:web:a932c29dbc9c5934ccafec",
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => value && !value.startsWith("YOUR_")
);
