
// This is a one-time use script to grant admin privileges to a user.
// 1. Make sure your .env file at the root of the project is populated
//    with your Firebase Admin credentials. The Next.js app needs to be restarted
//    to pick up changes to the .env file.
// 2. Replace the placeholder email below with the email of the user
//    you want to make an admin.
// 3. Run this script from your terminal: `node scripts/set-admin.js`
// 4. After the script confirms success, the user must log out and log back in
//    to the application for the admin role to take effect.

const admin = require('firebase-admin');

// --- CONFIGURATION ---
// IMPORTANT: Replace this with the email of the user you want to make an admin.
const USER_EMAIL_TO_MAKE_ADMIN = "your-email@example.com";
// -------------------


// Initialize Firebase Admin SDK
try {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error(
      'Firebase admin credentials are not set in your .env file. Please check your configuration.'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

} catch (error) {
  if (error.code !== 'app/duplicate-app') {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    process.exit(1);
  }
}

async function setAdminClaim() {
  if (USER_EMAIL_TO_MAKE_ADMIN === "your-email@example.com") {
    console.error("❌ Please replace 'your-email@example.com' with a real user's email in the script.");
    return;
  }

  try {
    const user = await admin.auth().getUserByEmail(USER_EMAIL_TO_MAKE_ADMIN);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Success! ${USER_EMAIL_TO_MAKE_ADMIN} has been made an admin.`);
    console.log("👉 The user must log out and log back in for the changes to apply.");
  } catch (error) {
    console.error("❌ Error setting admin claim:", error.message);
    if (error.code === 'auth/user-not-found') {
        console.error(`Hint: Make sure the user "${USER_EMAIL_TO_MAKE_ADMIN}" has already signed up.`);
    }
  }
}

setAdminClaim().then(() => process.exit(0));
