// Revert /raw/upload/ back to /image/upload/ in Firestore
// The files are physically stored under image/upload - that's what Cloudinary used
const path = require('path');
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp, cert, getApps } = require('firebase-admin/app');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
if (!getApps().length) {
  initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
}
const db = getFirestore();

async function revertPdfUrls() {
  const snap = await db.collection('resources').get();
  let fixed = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.fileUrl && data.fileUrl.includes('/raw/upload/')) {
      const revertedUrl = data.fileUrl.replace('/raw/upload/', '/image/upload/');
      batch.update(doc.ref, { fileUrl: revertedUrl });
      fixed++;
      batchCount++;
      if (batchCount >= 400) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
  }
  if (batchCount > 0) await batch.commit();
  console.log(`✅ Reverted ${fixed} URLs back to /image/upload/`);
}

revertPdfUrls().catch(console.error);
