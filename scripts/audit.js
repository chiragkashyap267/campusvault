const fs = require('fs');
const path = require('path');
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

function detectSemester(folderName) {
  const n = folderName.toUpperCase();
  if (n.includes('1ST') || n.includes('FIRST')) return 1;
  if (n.includes('2ND') || n.includes('SECOND')) return 2;
  if (n.includes('3RD') || n.includes('THIRD')) return 3;
  if (n.includes('4TH') || n.includes('FOURTH')) return 4;
  if (n.includes('BRIDGE')) return 0;
  return null;
}

function detectType(folderName) {
  const n = folderName.toUpperCase();
  if (n.includes('FINAL EXAM') || n.includes('FINAL_EXAM') || n.includes('END SEM')) return 'pyq';
  if (/\bCT\b/.test(n)) return 'ct';
  if (n.includes('NOTE')) return 'notes';
  if (n.includes('BOOK')) return 'study_material';
  if (n.includes('ASSIGNMENT')) return 'assignment';
  if (n.includes('LAB') || n.includes('PRACTICAL')) return 'lab_manual';
  return 'pdf';
}

// Walk and collect all local files
const localFiles = [];
function walk(dir, depth, sem, subject) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return; }

  const dirName = path.basename(dir);

  // Depth 1 = semester level
  if (depth === 1) sem = detectSemester(dirName);
  // Depth 2 = subject level
  if (depth === 2) subject = dirName;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, depth + 1, sem, subject);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) continue;
      const typeFolder = depth >= 3 ? path.basename(dir) : 'ROOT';
      const type = detectType(typeFolder);
      const stat = fs.statSync(fullPath);
      localFiles.push({
        sem,
        subject,
        typeFolder,
        type,
        name: entry.name,
        size: stat.size,
        fullPath,
      });
    }
  }
}

walk(MCA_ROOT, 0, null, null);

// Fetch all Firestore resources
async function audit() {
  console.log(`\n📁 LOCAL FILES FOUND: ${localFiles.length}\n`);
  console.log('SEM | SUBJECT                                      | TYPE_FOLDER   | FILENAME');
  console.log('─'.repeat(120));
  for (const f of localFiles) {
    const semLabel = f.sem === 0 ? 'BRG' : (f.sem ? `S${f.sem}  ` : '???');
    console.log(`${semLabel} | ${(f.subject || 'UNKNOWN').padEnd(50)} | ${f.typeFolder.padEnd(13)} | ${f.name}`);
  }

  console.log('\n\n🔥 CROSS-CHECKING WITH FIRESTORE...\n');
  const snap = await db.collection('resources').get();
  const firestoreDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Firestore has ${firestoreDocs.length} total resources.`);

  // Find local files NOT in Firestore (by matching file size or name stem)
  const missing = [];
  for (const lf of localFiles) {
    const nameStem = path.basename(lf.name, path.extname(lf.name)).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const found = firestoreDocs.some(fd => {
      if (!fd.fileUrl) return false;
      const urlStem = fd.fileUrl.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return urlStem.includes(nameStem) && nameStem.length > 4;
    });
    if (!found) missing.push(lf);
  }

  console.log(`\n❌ FILES NOT UPLOADED YET (${missing.length}):\n`);
  for (const f of missing) {
    const semLabel = f.sem === 0 ? 'BRIDGE' : (f.sem ? `Sem ${f.sem}` : '???');
    console.log(`  [${semLabel}] ${f.subject} / ${f.typeFolder} / ${f.name} (${(f.size/1024).toFixed(0)} KB)`);
  }

  // Find Firestore docs with wrong/generic subjects
  const badSubjects = firestoreDocs.filter(fd => 
    !fd.subject || fd.subject === 'PYQ' || fd.subject === 'CT' || 
    fd.subject === 'FINAL EXAM' || fd.subject === 'NOTES' ||
    fd.subject === 'BOOKS' || fd.subject === 'ROOT'
  );
  console.log(`\n⚠️  FIRESTORE DOCS WITH WRONG/MISSING SUBJECT (${badSubjects.length}):`);
  for (const fd of badSubjects) {
    console.log(`  [${fd.type}] "${fd.title}" — subject: "${fd.subject}"`);
  }

  // Type breakdown
  const typeCount = {};
  for (const fd of firestoreDocs) {
    typeCount[fd.type] = (typeCount[fd.type] || 0) + 1;
  }
  console.log('\n📊 FIRESTORE TYPE BREAKDOWN:');
  for (const [type, count] of Object.entries(typeCount).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${type.padEnd(15)}: ${count}`);
  }

  // Subject breakdown
  const subjectCount = {};
  for (const fd of firestoreDocs) {
    const key = fd.subject || 'UNKNOWN';
    subjectCount[key] = (subjectCount[key] || 0) + 1;
  }
  console.log('\n📚 FIRESTORE SUBJECT BREAKDOWN:');
  for (const [sub, count] of Object.entries(subjectCount).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${sub.padEnd(55)}: ${count}`);
  }
}

audit().catch(console.error);
