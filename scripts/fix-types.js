const path = require('path');
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp, cert, getApps } = require('firebase-admin/app');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
if (!getApps().length) {
  initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
}
const db = getFirestore();

// Type detection based on file title/description patterns
function detectCorrectType(title, description, currentType) {
  const combined = (title + ' ' + description).toUpperCase();
  
  // If file has FINAL_EXAM or END_SEM in title, it should be 'pyq'
  if (combined.includes('FINAL_EXAM') || combined.includes('FINAL EXAM') || 
      combined.includes('END SEM') || combined.includes('ENDSEM') ||
      combined.includes('END_SEM') || combined.includes('END-SEM')) {
    return 'pyq';
  }
  
  // If file has CT in title pattern like "CT#1", "CT#2", it should be 'ct'
  if (/CT#\d/.test(combined) || combined.includes('CLASS TEST')) {
    return 'ct';
  }
  
  return currentType; // keep unchanged
}

async function fixTypes() {
  console.log('Fetching all resources from Firestore...');
  const snap = await db.collection('resources').get();
  
  let fixed = 0;
  let checked = 0;
  
  for (const doc of snap.docs) {
    const data = doc.data();
    checked++;
    
    const correctType = detectCorrectType(data.title || '', data.description || '', data.type);
    
    if (correctType !== data.type) {
      console.log(`Fixing "${data.title}": type "${data.type}" -> "${correctType}"`);
      await doc.ref.update({ type: correctType });
      fixed++;
    }
  }
  
  console.log(`\nChecked ${checked} resources. Fixed ${fixed} wrong types!`);
}

fixTypes().catch(console.error);
