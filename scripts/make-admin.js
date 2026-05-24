const path = require('path');
const fs = require('fs');
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp, cert, getApps } = require('firebase-admin/app');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`\n❌ Firebase Service Account key not found at: ${SERVICE_ACCOUNT_PATH}`);
  console.error('\nPlease download your service-account.json and place it in the scripts/ folder.\n');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
}
const db = getFirestore();

async function makeAdmin(uid) {
  if (!uid) {
    console.error('❌ Error: Please provide a User UID.');
    console.log('Usage: node scripts/make-admin.js YOUR_USER_UID');
    process.exit(1);
  }

  console.log(`\n🚀 Elevating user ${uid} to Admin...\n`);

  // 1. Set the user document role to 'admin' in 'users' collection
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  
  if (!userSnap.exists) {
    console.log(`⚠️  Warning: User profile document not found in "users" collection.`);
    console.log(`   We will create a placeholder profile for them.`);
    await userRef.set({
      uid: uid,
      role: 'admin',
      uploadCount: 0,
      createdAt: new Date().toISOString()
    }, { merge: true });
  } else {
    await userRef.update({ role: 'admin' });
    console.log(`✅ Updated user profile role to "admin"`);
  }

  // 2. Create the document in 'admins' collection to pass checkIsAdmin()
  const adminRef = db.collection('admins').doc(uid);
  await adminRef.set({
    uid: uid,
    enabled: true,
    promotedAt: new Date().toISOString()
  });
  
  console.log(`✅ Created authorization token in "admins" collection`);
  console.log(`\n🎉 Success! User ${uid} is now a full CampusVault Administrator!`);
  console.log(`Please log out and log back in on the website for the changes to take effect.\n`);
}

const args = process.argv.slice(2);
const uid = args[0];

makeAdmin(uid).catch(err => {
  console.error('❌ Error executing script:', err.message);
  process.exit(1);
});
