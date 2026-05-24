const path = require('path');
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp, cert, getApps } = require('firebase-admin/app');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
if (!getApps().length) {
  initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
}
const db = getFirestore();

async function diagnose() {
  const snap = await db.collection('resources').get();
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Total resources: ${docs.length}\n`);

  // 1. Count PDFs with /image/upload/ URLs (should be /raw/upload/)
  const imageUploadPdfs = docs.filter(d => d.fileFormat === 'pdf' && d.fileUrl && d.fileUrl.includes('/image/upload/'));
  console.log(`[PDF URL ISSUE] PDFs served via /image/upload/ (wrong, causes "can't open"): ${imageUploadPdfs.length}`);

  // 2. Find STQA papers
  const stqa = docs.filter(d => (d.subject || '').toLowerCase().includes('stqa') || (d.subject || '').toLowerCase().includes('software testing') || (d.title || '').toLowerCase().includes('stqa'));
  console.log(`\n[STQA] Records found: ${stqa.length}`);
  stqa.forEach(d => console.log(`  - "${d.title}" | subject="${d.subject}" | type=${d.type} | sem=${d.semester}`));

  // 3. Find Data Science in sem 4
  const ds4 = docs.filter(d => d.semester === 4 && ((d.subject || '').toLowerCase().includes('data science') || (d.subject || '').toLowerCase().includes('ds')));
  console.log(`\n[DATA SCIENCE SEM 4] Records: ${ds4.length}`);
  ds4.forEach(d => console.log(`  - "${d.title}" | subject="${d.subject}" | type=${d.type}`));

  // 4. All unique sem 4 subjects
  const sem4subjects = [...new Set(docs.filter(d => d.semester === 4).map(d => d.subject))];
  console.log(`\n[SEM 4 SUBJECTS] Found ${sem4subjects.length} unique subjects:`);
  sem4subjects.sort().forEach(s => console.log(`  - "${s}"`));

  // 5. Check type breakdown for notes vs ct/pyq in search
  const typeBreakdown = {};
  for (const d of docs) {
    typeBreakdown[d.type] = (typeBreakdown[d.type] || 0) + 1;
  }
  console.log('\n[TYPE BREAKDOWN]:');
  Object.entries(typeBreakdown).sort((a,b) => b[1]-a[1]).forEach(([t, c]) => console.log(`  ${t}: ${c}`));

  // 6. Show the first 5 pdf URLs so we can see the format
  console.log('\n[SAMPLE PDF URLS]:');
  docs.filter(d => d.fileFormat === 'pdf').slice(0, 5).forEach(d => console.log(`  ${d.fileUrl}`));
}

diagnose().catch(console.error);
