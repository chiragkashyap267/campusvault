const fs = require('fs');
const path = require('path');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { initializeApp, cert, getApps } = require('firebase-admin/app');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
if (!getApps().length) {
  initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
}
const db = getFirestore();

function detectSubject(folderName) {
  return folderName
    .replace(/^(SEM|SEMESTER)\s*\d+\s*/i, '')
    .replace(/\s*(CT|PYQ|EXAM|NOTES|ASSIGNMENT|LAB)\s*$/i, '')
    .replace(/[_\-]+/g, ' ')
    .trim() || folderName;
}

const titleCounters = {};
function cleanTitle(fileName, ext, subject) {
  const isWhatsApp = fileName.startsWith('WhatsApp') || /^IMG[\s_]/i.test(fileName) || fileName.startsWith('IMG_20');
  if (isWhatsApp && subject) {
    const key = subject.trim();
    titleCounters[key] = (titleCounters[key] || 0) + 1;
    return titleCounters[key] === 1 ? key : `${key} (${titleCounters[key]})`;
  }
  return path.basename(fileName, ext)
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.zip', '.doc', '.docx'];

function walkFolder(dirPath, inheritedSem = null, inheritedSubject = null, depth = 0) {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  const currentDirName = path.basename(dirPath);

  const subject = depth === 2 ? detectSubject(currentDirName) : (inheritedSubject || null);

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      files.push(...walkFolder(fullPath, null, subject, depth + 1));
    } else {
      const ext = path.extname(item.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) continue;
      const effectiveSubject = subject || inheritedSubject || currentDirName;
      const title = cleanTitle(item.name, ext, effectiveSubject);
      files.push({
        fileName: item.name,
        subject: effectiveSubject,
        title,
        baseName: path.basename(item.name, ext).replace(/[^a-zA-Z0-9]/g, '')
      });
    }
  }
  return files;
}

async function fixData() {
  console.log('Walking local folder...');
  const localFiles = walkFolder('C:\\Users\\Chirag Kashyap\\Downloads\\MCA');
  
  console.log('Fetching Firestore resources...');
  const snap = await db.collection('resources').get();
  
  let fixed = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.subject === 'PYQ' || data.subject === 'CT') {
      const match = localFiles.find(f => {
         const cleanBase = f.baseName;
         const urlBase = data.fileUrl.replace(/[^a-zA-Z0-9]/g, '');
         return urlBase.includes(cleanBase);
      });
      
      if (match) {
         console.log(`Fixing ${data.title} -> ${match.title} (Subject: ${match.subject})`);
         await doc.ref.update({
            subject: match.subject,
            title: match.title,
            tags: FieldValue.arrayRemove('pyq', 'ct'),
         });
         await doc.ref.update({
            tags: FieldValue.arrayUnion(match.subject.toLowerCase())
         });
         fixed++;
      }
    }
  }
  console.log(`Fixed ${fixed} resources!`);
}

fixData().catch(console.error);
