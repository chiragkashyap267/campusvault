#!/usr/bin/env node
/**
 * CampusVault Bulk Import Script
 * ================================
 * Uploads an entire local folder of study materials to CampusVault.
 *
 * SETUP (do this once):
 * 1. Download your Google Drive MCA folder to your PC (right-click → Download As ZIP → Extract)
 * 2. Get your Firebase Service Account key:
 *    Firebase Console → Project Settings → Service Accounts → Generate new private key
 *    Save it as: campusvault/scripts/service-account.json
 * 3. Run the script:
 *    node scripts/bulk-import.js "C:\Users\Chirag\Downloads\MCA" --branch=mca --uploader-uid=YOUR_UID --uploader-name="Chirag Kashyap"
 *
 * FLAGS:
 *   --dry-run          Preview what will be uploaded without actually uploading
 *   --branch=mca       Override branch for all files (default: mca)
 *   --uploader-uid     Your Firebase UID (found in Firebase Console → Authentication)
 *   --uploader-name    Your display name
 *   --skip-existing    Skip files already uploaded (checks by title)
 *   --approved         Mark resources as approved directly (default: true)
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// ─── Cloudinary ───────────────────────────────────────────────
const { v2: cloudinary } = require('cloudinary');
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Firebase Admin ───────────────────────────────────────────
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`\n❌ Service account key not found at: ${SERVICE_ACCOUNT_PATH}`);
  console.error('\nTo fix this:');
  console.error('1. Go to Firebase Console → Project Settings → Service Accounts');
  console.error('2. Click "Generate new private key" → Download the JSON');
  console.error(`3. Save it as: ${SERVICE_ACCOUNT_PATH}\n`);
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
}
const db = getFirestore();

// ─── Argument Parsing ─────────────────────────────────────────
const args = process.argv.slice(2);
const folderPath = args.find(a => !a.startsWith('--'));
const flags = Object.fromEntries(
  args.filter(a => a.startsWith('--')).map(a => {
    const [k, v] = a.slice(2).split('=');
    return [k, v ?? true];
  })
);

const DRY_RUN = !!flags['dry-run'];
const DEFAULT_BRANCH = flags['branch'] || 'mca';
const UPLOADER_UID = flags['uploader-uid'] || 'admin';
const UPLOADER_NAME = flags['uploader-name'] || 'CampusVault Admin';
const SKIP_EXISTING = !!flags['skip-existing'];
const AUTO_APPROVE = flags['approved'] !== 'false'; // default true

// ─── Allowed file types ───────────────────────────────────────
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.zip', '.doc', '.docx'];

// ─── Semester Detection ───────────────────────────────────────
function detectSemester(folderName) {
  const n = folderName.toUpperCase();
  if (n.includes('1ST') || n.includes('FIRST') || n.includes('SEM 1') || n.includes('SEM1')) return 1;
  if (n.includes('2ND') || n.includes('SEM 2') || n.includes('SEM2') || n.includes('SECOND')) return 2;
  if (n.includes('3RD') || n.includes('SEM 3') || n.includes('SEM3') || n.includes('THIRD')) return 3;
  if (n.includes('4TH') || n.includes('SEM 4') || n.includes('SEM4') || n.includes('FOURTH')) return 4;
  if (n.includes('5TH') || n.includes('SEM 5') || n.includes('SEM5') || n.includes('FIFTH')) return 5;
  if (n.includes('6TH') || n.includes('SEM 6') || n.includes('SEM6') || n.includes('SIXTH')) return 6;
  if (n.includes('7TH') || n.includes('SEM 7') || n.includes('SEM7')) return 7;
  if (n.includes('8TH') || n.includes('SEM 8') || n.includes('SEM8')) return 8;
  return 1; // default
}

// ─── Resource Type Detection ──────────────────────────────────
function detectType(folderName, fileName) {
  const n = (folderName + ' ' + fileName).toUpperCase();
  // Check FINAL EXAM / PYQ first (higher priority)
  if (n.includes('FINAL EXAM') || n.includes('FINAL_EXAM') || n.includes('END SEM') || 
      n.includes('END-SEM') || n.includes('ENDSEM') || n.includes('PYQ') || 
      n.includes('PREVIOUS YEAR') || n.includes('OLD QUESTION') || n.includes('END TERM')) return 'pyq';
  // CT must be a standalone word (e.g. /CT/, " CT ", "CT#") not inside longer words like CBNST
  if (/\bCT\b|CT#\d|CLASS TEST|CLASS-TEST|\bMID TERM\b/.test(n)) return 'ct';
  if (n.includes('ASSIGNMENT') || n.includes('ASSGN')) return 'assignment';
  if (n.includes('LAB') || n.includes('PRACTICAL')) return 'lab_manual';
  if (n.includes('PROJECT')) return 'project';
  if (n.includes('SOFTWARE') || n.includes('TOOL') || n.includes('EXE') || n.includes('.zip')) return 'software';
  if (n.includes('BOOK') || n.includes('REFERENCE') || n.includes('MATERIAL')) return 'study_material';
  if (n.includes('NOTE') || n.includes('HANDWRITTEN') || n.includes('HANDOUT')) return 'notes';
  return 'pdf'; // default
}

// ─── File Format Detection ────────────────────────────────────
function detectFormat(ext) {
  if (ext === '.pdf') return 'pdf';
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'image';
  if (ext === '.zip') return 'zip';
  if (['.doc', '.docx'].includes(ext)) return 'doc';
  return 'other';
}

// ─── Subject Detection from folder name ───────────────────────
function detectSubject(folderName) {
  // Clean up common suffixes and numbers
  return folderName
    .replace(/^(SEM|SEMESTER)\s*\d+\s*/i, '')
    .replace(/\s*(CT|PYQ|EXAM|NOTES|ASSIGNMENT|LAB)\s*$/i, '')
    .replace(/[_\-]+/g, ' ')
    .trim()
    || folderName;
}

// ─── Clean title from filename ─────────────────────────────────
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

// ─── Walk folder recursively ──────────────────────────────────
// Structure expected:  ROOT / <SEM FOLDER> / <SUBJECT FOLDER> / files
// e.g. MCA / 4TH SEM / DATA SCIENCE / file.pdf
function walkFolder(dirPath, inheritedSem = null, inheritedSubject = null, depth = 0) {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  const currentDirName = path.basename(dirPath);

  // Detect semester from this folder name (take priority over inherited)
  const detectedSem = detectSemester(currentDirName);
  const sem = detectedSem !== 1 || currentDirName.toUpperCase().includes('FIRST') || currentDirName.toUpperCase().includes('SEM 1') || currentDirName.toUpperCase().includes('1ST')
    ? detectedSem
    : (inheritedSem ?? detectedSem);

  // Subject: at depth=2 (inside a sem folder), the current dir IS the subject
  // e.g. depth 0=MCA, depth 1=4TH SEM, depth 2=DATA SCIENCE ← subject
  const isSubjectLevel = depth === 2;
  const subject = isSubjectLevel
    ? detectSubject(currentDirName)
    : (inheritedSubject || null);

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      // Pass down the detected semester; pass down subject if we found it
      files.push(...walkFolder(
        fullPath,
        sem,
        isSubjectLevel ? detectSubject(currentDirName) : inheritedSubject,
        depth + 1
      ));
    } else {
      const ext = path.extname(item.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) continue;
      const stat = fs.statSync(fullPath);

      const effectiveSubject = subject || inheritedSubject || currentDirName;
      const type = detectType(currentDirName + ' ' + (inheritedSubject || ''), item.name);
      const format = detectFormat(ext);
      const title = cleanTitle(item.name, ext, effectiveSubject);

      files.push({
        localPath: fullPath,
        fileName: item.name,
        title,
        branch: DEFAULT_BRANCH,
        semester: sem,
        subject: effectiveSubject,
        type,
        format,
        size: stat.size,
        folderName: currentDirName,
      });
    }
  }
  return files;
}

async function uploadToCloudinary(localPath, folder) {
  const ext = path.extname(localPath).toLowerCase();
  const resourceType = ext === '.pdf' ? 'raw' : 'auto';
  const result = await cloudinary.uploader.upload_large(localPath, {
    folder: `campusvault/${folder}`,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
    chunk_size: 6000000,
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes,
  };
}

// ─── Save to Firestore ────────────────────────────────────────
async function saveToFirestore(file, cloudinaryResult) {
  const docRef = db.collection('resources').doc();
  await docRef.set({
    id: docRef.id,
    title: file.title,
    description: `${file.subject} — ${file.type.toUpperCase()} material for ${file.branch.toUpperCase()} Semester ${file.semester}`,
    subject: file.subject,
    branch: file.branch,
    semester: file.semester,
    type: file.type,
    fileUrl: cloudinaryResult.url,
    fileFormat: file.format,
    uploadedBy: UPLOADER_UID,
    uploaderName: UPLOADER_NAME,
    status: AUTO_APPROVE ? 'approved' : 'pending',
    downloads: 0,
    likes: 0,
    likedBy: [],
    tags: [file.branch, `sem${file.semester}`, file.type, file.subject.toLowerCase()].filter(Boolean),
    size: cloudinaryResult.bytes,
    featured: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Update uploader's upload count
  if (AUTO_APPROVE && UPLOADER_UID !== 'admin') {
    try {
      await db.collection('users').doc(UPLOADER_UID).update({
        uploadCount: FieldValue.increment(1),
      });
    } catch (e) { /* user doc may not exist yet */ }
  }

  return docRef.id;
}

// ─── Check for existing resource ─────────────────────────────
async function existsInFirestore(title) {
  const snap = await db.collection('resources')
    .where('title', '==', title)
    .limit(1)
    .get();
  return !snap.empty;
}

// ─── Progress Bar ─────────────────────────────────────────────
function progressBar(current, total, label) {
  const pct = Math.floor((current / total) * 100);
  const filled = Math.floor(pct / 5);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
  process.stdout.write(`\r  [${bar}] ${pct}% (${current}/${total}) ${label.slice(0, 40).padEnd(40)}`);
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║        CampusVault Bulk Import Script             ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  if (!folderPath) {
    console.error('❌ No folder specified.\n');
    console.error('Usage: node scripts/bulk-import.js "C:\\Users\\Chirag\\Downloads\\MCA" --branch=mca --uploader-uid=abc123 --uploader-name="Chirag Kashyap"');
    process.exit(1);
  }

  if (!fs.existsSync(folderPath)) {
    console.error(`❌ Folder not found: ${folderPath}`);
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.error('❌ Missing Cloudinary credentials in .env.local');
    process.exit(1);
  }

  console.log(`📁 Source folder:  ${folderPath}`);
  console.log(`🎓 Branch:         ${DEFAULT_BRANCH.toUpperCase()}`);
  console.log(`👤 Uploader:       ${UPLOADER_NAME} (${UPLOADER_UID})`);
  console.log(`✅ Auto-approve:   ${AUTO_APPROVE}`);
  console.log(`🔍 Dry run:        ${DRY_RUN}`);
  console.log('');

  // Walk the folder
  console.log('🔍 Scanning folder...');
  const files = walkFolder(folderPath);
  console.log(`\n📄 Found ${files.length} files to process\n`);

  if (files.length === 0) {
    console.log('No supported files found. Supported types: PDF, JPG, PNG, ZIP, DOC, DOCX');
    process.exit(0);
  }

  // Preview table
  console.log('Files to be uploaded:\n');
  console.log('  ' + ['Title'.padEnd(35), 'Branch', 'Sem', 'Type'.padEnd(12), 'Subject'.padEnd(20)].join(' │ '));
  console.log('  ' + '─'.repeat(90));
  for (const f of files.slice(0, 20)) {
    console.log('  ' + [
      f.title.slice(0, 34).padEnd(35),
      f.branch.toUpperCase().padEnd(6),
      String(f.semester).padEnd(3),
      f.type.padEnd(12),
      f.subject.slice(0, 19).padEnd(20),
    ].join(' │ '));
  }
  if (files.length > 20) {
    console.log(`  ... and ${files.length - 20} more files`);
  }

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete. No files were uploaded.');
    console.log('Remove --dry-run flag to start the actual upload.\n');
    process.exit(0);
  }

  // Confirm
  console.log(`\n⚠️  About to upload ${files.length} files to CampusVault.`);
  console.log('   Press ENTER to continue or CTRL+C to cancel...');
  await new Promise(r => process.stdin.once('data', r));
  process.stdin.destroy();

  // Upload loop
  let success = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];

  console.log('\n🚀 Starting upload...\n');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    progressBar(i + 1, files.length, file.title);

    try {
      // Skip existing
      if (SKIP_EXISTING) {
        const exists = await existsInFirestore(file.title);
        if (exists) { skipped++; continue; }
      }

      // Upload to Cloudinary
      const cloudResult = await uploadToCloudinary(
        file.localPath,
        `${file.branch}/sem${file.semester}/${file.type}`
      );

      // Save to Firestore
      const docId = await saveToFirestore(file, cloudResult);

      success++;
    } catch (err) {
      failed++;
      errors.push({ file: file.title, error: err.message });
    }
  }

  // Summary
  console.log('\n\n╔══════════════════════════════════════════╗');
  console.log('║              Import Complete              ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`\n  ✅ Uploaded:  ${success} files`);
  console.log(`  ⏭️  Skipped:   ${skipped} files (already exist)`);
  console.log(`  ❌ Failed:    ${failed} files`);

  if (errors.length > 0) {
    console.log('\n  Failed files:');
    errors.forEach(e => console.log(`    • ${e.file}: ${e.error}`));

    // Write error log
    const logPath = path.join(__dirname, 'import-errors.log');
    fs.writeFileSync(logPath, errors.map(e => `${e.file}: ${e.error}`).join('\n'));
    console.log(`\n  Error log saved to: ${logPath}`);
  }

  console.log('\n🎉 Done! Your resources are now live on CampusVault.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
