const admin = require('firebase-admin');
const fs = require('fs');
const readline = require('readline');

// This script will guide you to set an admin user.
// You will need two things:
// 1. The email address of the user you want to make an admin.
// 2. The path to your Firebase service account JSON file.
// You can download this file from your Firebase project settings:
// Project Settings > Service Accounts > Generate new private key

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setAdminClaim() {
  try {
    console.log("👋 Welcome to the Admin User setup script.");
    
    const email = await askQuestion("Enter the email of the user to make admin: ");
    if (!email) {
      console.error("❌ Email is required.");
      return;
    }

    const serviceAccountPath = await askQuestion("Enter the full path to your Firebase service account JSON file: ");
    if (!serviceAccountPath) {
      console.error("❌ Path to service account file is required.");
      return;
    }
    
    let serviceAccount;
    try {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    } catch (e) {
        console.error("❌ Error reading or parsing the service account file.");
        console.error(e.message);
        return;
    }

    // Initialize Firebase Admin SDK
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        if (error.code !== 'app/duplicate-app') {
            throw error;
        }
    }

    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    console.log(`\n✅ Success! ${email} has been made an admin.`);
    console.log("👉 The user must log out and log back in for the changes to apply.");

  } catch (error) {
    console.error("\n❌ An error occurred:");
    if (error.code === 'auth/user-not-found') {
        console.error(`Hint: Make sure the user with email "${error.email}" has already signed up.`);
    } else {
        console.error(error.message);
    }
  } finally {
    rl.close();
  }
}

setAdminClaim();
