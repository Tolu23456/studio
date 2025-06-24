
// Load environment variables from .env file
require('dotenv').config();
const admin = require('firebase-admin');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setAdminClaim() {
  try {
    // Initialize Firebase Admin SDK from environment variables
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        console.error("\n❌ Firebase admin credentials are not set in your .env file.");
        console.error("   Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.");
        return;
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        if (error.code !== 'app/duplicate-app') {
            throw error;
        }
    }

    console.log("👋 Welcome to the Admin User setup script.");
    const email = await askQuestion("Enter the email address of the user you want to make an admin: ");
    if (!email) {
      console.error("\n❌ Email is required. Please restart the script.");
      return;
    }

    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    console.log(`\n✅ Success! User '${email}' has been made an admin.`);
    console.log("👉 The user must log out and log back in for the changes to apply.");

  } catch (error) {
    console.error("\n❌ An error occurred:");
    if (error.code === 'auth/user-not-found') {
        const email = error.customData?.email || 'the one you entered';
        console.error(`   Could not find a user with the email: "${email}"`);
        console.error("   Hint: Make sure the user has already signed up in your application.");
    } else {
        console.error(`   Details: ${error.message}`);
    }
  } finally {
    rl.close();
  }
}

setAdminClaim();
