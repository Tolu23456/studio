
const admin = require('firebase-admin');
const fs = require('fs');
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
    console.log("👋 Welcome to the Admin User setup script.");
    console.log("This script will give a user admin privileges in your app.");
    console.log("\n------------------------------------------------------------------");
    console.log("STEP 1: Get your Firebase Service Account JSON file");
    console.log("------------------------------------------------------------------");
    console.log("1. Go to your Firebase project console: https://console.firebase.google.com/");
    console.log("2. Select your project ('adsener-app').");
    console.log("3. Click the gear icon ⚙️ next to 'Project Overview' and select 'Project settings'.");
    console.log("4. Go to the 'Service accounts' tab.");
    console.log("5. Click the 'Generate new private key' button. A JSON file will be downloaded.");
    console.log("   This file contains secret credentials. Keep it safe!");
    console.log("6. The file is likely in your 'Downloads' folder.\n");


    const email = await askQuestion("Enter the email address of the user you want to make an admin: ");
    if (!email) {
      console.error("\n❌ Email is required. Please restart the script.");
      return;
    }

    console.log("\n------------------------------------------------------------------");
    console.log("STEP 2: Provide the path to the downloaded file");
    console.log("------------------------------------------------------------------");
    console.log("The 'path' is the full location of the file on your computer.");
    console.log("Examples:");
    console.log("  - on macOS/Linux: /Users/your-name/Downloads/your-project-id-firebase-adminsdk.json");
    console.log("  - on Windows:      C:\\Users\\your-name\\Downloads\\your-project-id-firebase-adminsdk.json\n");
    
    const serviceAccountPath = await askQuestion("Now, please enter the full path to your service account JSON file: ");
    if (!serviceAccountPath) {
      console.error("\n❌ Path to service account file is required. Please restart the script.");
      return;
    }
    
    let serviceAccount;
    try {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    } catch (e) {
        console.error("\n❌ Error reading or parsing the service account file.");
        console.error(`   Details: ${e.message}`);
        console.error("\n   Hint: Please double-check that the path you entered is correct and that the file is not corrupted.");
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
    
    console.log(`\n✅ Success! User '${email}' has been made an admin.`);
    console.log("👉 The user must log out and log back in for the changes to apply.");

  } catch (error) {
    console.error("\n❌ An error occurred:");
    if (error.code === 'auth/user-not-found') {
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
