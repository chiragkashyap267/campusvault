const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'scripts', 'service-account.json');
if (!getApps().length) {
  initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
}
const db = getFirestore();

async function main() {
  const snap = await db.collection('resources').where('type', '==', 'form').limit(5).get();
  console.log(`Found ${snap.size} forms:`);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}`);
    console.log(`  Title: ${data.title}`);
    console.log(`  fileUrl: ${data.fileUrl}`);
    console.log(`  fileFormat: ${data.fileFormat}`);
  });
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
