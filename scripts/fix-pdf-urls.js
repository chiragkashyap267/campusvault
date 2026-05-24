// Fix all /image/upload/ PDF URLs to /raw/upload/ in Firestore
const path = require('path');
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp, cert, getApps } = require('firebase-admin/app');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
if (!getApps().length) {
  initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
}
const db = getFirestore();

async function fixPdfUrls() {
  const snap = await db.collection('resources').get();
  let fixed = 0;

  const BATCH_SIZE = 400;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.fileFormat === 'pdf' && data.fileUrl && data.fileUrl.includes('/image/upload/')) {
      const newUrl = data.fileUrl.replace('/image/upload/', '/raw/upload/');
      console.log(`Fixing: ...${newUrl.slice(-50)}`);
      batch.update(doc.ref, { fileUrl: newUrl });
      fixed++;
      batchCount++;

      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
        console.log(`Committed batch of ${BATCH_SIZE}...`);
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`\n✅ Fixed ${fixed} PDF URLs (/image/upload/ → /raw/upload/)`);
}

fixPdfUrls().catch(console.error);
