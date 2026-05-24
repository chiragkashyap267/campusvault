const path = require('path');
const fs = require('fs');
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp, cert, getApps } = require('firebase-admin/app');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
if (!getApps().length) {
  initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
}
const db = getFirestore();

const MCA_ROOT = 'C:\\Users\\Chirag Kashyap\\Downloads\\MCA';
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.zip', '.doc', '.docx'];

// Walk the local folder and build a map: filename_stem -> { subject, semester, type }
function walkFolder(dir, sem, subject, depth) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return []; }

  const dirName = path.basename(dir);
  const files = [];

  // Depth 1 = semester folder
  if (depth === 1) {
    const n = dirName.toUpperCase();
    if (n.includes('1ST')) sem = 1;
    else if (n.includes('2ND')) sem = 2;
    else if (n.includes('3RD')) sem = 3;
    else if (n.includes('4TH')) sem = 4;
    else if (n.includes('BRIDGE')) sem = 0;
  }
  // Depth 2 = subject folder
  if (depth === 2) subject = dirName;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFolder(fullPath, sem, subject, depth + 1));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) continue;
      const stem = path.basename(entry.name, ext);
      const typeFolder = depth >= 3 ? dirName.toUpperCase() : 'ROOT';
      files.push({ stem, subject, sem, typeFolder, name: entry.name });
    }
  }
  return files;
}

const localFiles = walkFolder(MCA_ROOT, null, null, 0);
console.log(`Indexed ${localFiles.length} local files\n`);

// Build stem lookup
const stemMap = {};
for (const lf of localFiles) {
  const cleanStem = lf.stem.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  stemMap[cleanStem] = lf;
}

async function fixNotesSubjects() {
  const snap = await db.collection('resources').get();
  const badSubjects = ['NOTES', 'CT', 'END SEM', 'FINAL', 'PYQ', 'BOOKS', 'ROOT', 'FIRST SEM'];
  
  let fixed = 0;
  let couldntFix = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!badSubjects.includes(data.subject)) continue;

    // Try to match by URL stem
    const urlStem = (data.fileUrl || '').split('/').pop().split('.')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    let match = null;
    // Try exact stem match first
    if (urlStem && stemMap[urlStem]) {
      match = stemMap[urlStem];
    } else {
      // Try partial match - url stem must contain local file stem (min 5 chars)
      for (const [stem, lf] of Object.entries(stemMap)) {
        if (stem.length >= 5 && urlStem.includes(stem)) {
          match = lf;
          break;
        }
      }
    }

    if (match && match.subject && match.subject !== data.subject) {
      const updates = {
        subject: match.subject,
        tags: [data.branch || 'mca', `sem${data.semester}`, data.type, match.subject.toLowerCase()].filter(Boolean),
        description: `${match.subject} — ${data.type.toUpperCase()} material for MCA Semester ${data.semester}`,
      };
      console.log(`[FIX] "${data.title}": subject "${data.subject}" -> "${match.subject}"`);
      await doc.ref.update(updates);
      fixed++;
    } else {
      console.log(`[SKIP] "${data.title}" (subject: "${data.subject}") — no local match found for URL: ...${urlStem.slice(-30)}`);
      couldntFix++;
    }
  }

  console.log(`\n✅ Fixed: ${fixed}`);
  console.log(`⚠️  Could not auto-fix: ${couldntFix} (these need manual review)`);
}

fixNotesSubjects().catch(console.error);
