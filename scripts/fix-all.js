const path = require('path');
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp, cert, getApps } = require('firebase-admin/app');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
if (!getApps().length) {
  initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
}
const db = getFirestore();

// ─── Master subject alias map ─────────────────────────────────
// Maps every variation found in DB -> canonical subject name
const SUBJECT_MAP = {
  // Discrete Structures
  'DISCREET STRUCTURES': 'Discrete Structures',
  'DISCRETE MATHEMATICS': 'Discrete Structures',
  'DISCREET': 'Discrete Structures',

  // DBMS
  'DBMS': 'Data base management system',
  'DATA BASE': 'Data base management system',

  // Operating System
  'OS': 'Operating System',
  'OPERATING SYSTEM': 'Operating System',

  // Computer Organization
  'CO': 'Computer Organization',
  'COMPUTER ORGANIZATION': 'Computer Organization',

  // Technical Communication Skills
  'TCS': 'Technical Communication Skills',
  'TECHNICAL COMMUNICATION': 'Technical Communication Skills',

  // Python Programming
  'PYTHON PROGRAMMING': 'Python Programming',
  'PYTHON': 'Python Programming',

  // CBNST
  'CBNST': 'Computer based numerical and statistical techniques',
  'COMPUTER BASED NUMERICAL & STATISTICAL TECHNIQUE': 'Computer based numerical and statistical techniques',

  // DSA
  'DSA': 'Data Structures and analysis of algorithm',
  'DATA STRUCTURES': 'Data Structures and analysis of algorithm',
  'DATA STRUCTURE': 'Data Structures and analysis of algorithm',
  'DATA STRUCTURE AND ANALYSIS OF ALGORITHMS': 'Data Structures and analysis of algorithm',

  // Java
  'JAVA': 'Object oriented programming with Java',
  'OOPS WITH JAVA': 'Object oriented programming with Java',

  // Computer Networks
  'CN': 'Computer networks',
  'COMPUTER NETWORKS': 'Computer networks',

  // AI
  'ARTIFICIAL INTELLIGENCE': 'Artificial intelligence',
  'AI': 'Artificial intelligence',

  // AFM
  'AFM': 'Accounting and Financial Management',
  'ACCOUNTING AND FINANCIAL MANAGEMENT': 'Accounting and Financial Management',

  // Graph Theory
  'GRAPH THEORY': 'Graph Theory',
  'GT': 'Graph Theory',

  // Software Engineering
  'SOFTWARE ENGINEERING': 'Software Engineering',
  'SOFTWARE ENGNEERING': 'Software Engineering',

  // UHV
  'UNIVERSAL HUMAN VALUES': 'Universal Human Values',
  'UHV': 'Universal Human Values',

  // Cloud Computing
  'CLOUD COMPUTING': 'Cloud Computing',

  // Principal of Management
  'PRINCIPLE OF MANAGEMENT': 'Principal of Management',
  'POP': 'Principal of Management',

  // Network Security
  'NETWORK SECURITY': 'Network Security',
  'NS': 'Network Security',

  // Software Testing
  'STQA': 'Software Testing & Quality Assurance',

  // Data Science
  'DATA SCIENCE': 'Data Science',
  'DS': 'Data Science',

  // Digital Marketing
  'DIGITAL MARKETING': 'Digital Marketing',
  'DM': 'Digital Marketing',

  // Bridge subjects
  'INTRODUCTION TO INFORMATION TECHNOLOGY': 'Introduction of Information Technology',
  'WEB TECHNOLOGY': 'Fundamental of Web Technology',
  'PROGRAMMING IN C': 'Programming Fundamentals With C',
};

// ─── Helper to detect type from title ────────────────────────
function detectType(title, description) {
  const n = (title + ' ' + description).toUpperCase();
  if (n.includes('FINAL EXAM') || n.includes('FINAL_EXAM') || n.includes('END SEM') ||
      n.includes('ENDSEM') || n.includes('END-SEM')) return 'pyq';
  if (/CT#\d|\bCT\b|CLASS TEST/.test(n)) return 'ct';
  return null; // no change
}

async function fixAll() {
  console.log('Fetching all Firestore resources...\n');
  const snap = await db.collection('resources').get();
  const docs = snap.docs;
  console.log(`Total: ${docs.length} resources\n`);

  let subjectFixed = 0;
  let typeFixed = 0;
  let descFixed = 0;

  for (const doc of docs) {
    const data = doc.data();
    const updates = {};

    // 1. Fix subject
    const rawSubject = (data.subject || '').trim().toUpperCase();
    const canonicalSubject = SUBJECT_MAP[rawSubject];
    if (canonicalSubject && canonicalSubject !== data.subject) {
      console.log(`[SUBJECT] "${data.title}": "${data.subject}" -> "${canonicalSubject}"`);
      updates.subject = canonicalSubject;
      subjectFixed++;
    }

    // 2. Fix type based on title if still wrong
    const correctType = detectType(data.title || '', data.description || '');
    if (correctType && correctType !== data.type) {
      console.log(`[TYPE]    "${data.title}": "${data.type}" -> "${correctType}"`);
      updates.type = correctType;
      typeFixed++;
    }

    // 3. Fix description if it still says "PYQ — PYQ material" or "NOTES — NOTES material"
    const effectiveSubject = updates.subject || data.subject || '';
    const effectiveType = updates.type || data.type || '';

    if (data.description && (
      data.description.includes('PYQ —') ||
      data.description.includes('CT —') ||
      data.description.includes('NOTES —') ||
      data.description.includes('END SEM —') ||
      data.description.includes('FINAL —')
    )) {
      const newDesc = `${effectiveSubject} — ${effectiveType.toUpperCase()} material for MCA Semester ${data.semester}`;
      updates.description = newDesc;
      descFixed++;
    }

    // 4. Fix tags - rebuild from correct data
    if (Object.keys(updates).length > 0) {
      const sub = updates.subject || data.subject || '';
      const sem = data.semester;
      const branch = data.branch || 'mca';
      updates.tags = [branch, `sem${sem}`, updates.type || data.type, sub.toLowerCase()].filter(Boolean);
      await doc.ref.update(updates);
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Subject fixes: ${subjectFixed}`);
  console.log(`   Type fixes:    ${typeFixed}`);
  console.log(`   Desc fixes:    ${descFixed}`);
}

fixAll().catch(console.error);
