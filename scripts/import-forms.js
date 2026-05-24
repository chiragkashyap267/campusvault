const path = require('path');
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const os = require('os');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// ─── Cloudinary Config ─────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Firebase Config ───────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
if (!getApps().length) {
  initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
}
const db = getFirestore();

// ─── Categories Mapping ────────────────────────────────────────
function getCategoryName(relPath) {
  const parts = relPath.split(path.sep);
  // Example: GENERAL RESOURCES \ FRONT PAGES \ FRONT PAGE SEM 1.pdf
  if (parts.includes('FRONT PAGES')) return 'Front Pages';
  if (parts.includes('MCA SYLLABUS')) return 'MCA Syllabus';
  if (parts.includes('INDEX PAGE')) return 'Index Page';
  if (parts.includes('IMPORTANT DOCUMENTS')) return 'Hostel & Library Forms';
  return 'General Forms';
}

async function uploadFile(localPath, relPath) {
  console.log(`☁️  Uploading ${path.basename(localPath)}...`);
  const result = await cloudinary.uploader.upload(localPath, {
    folder: 'campusvault/forms',
    resource_type: 'image', // Upload as image so we get first-page JPG previews on home cards!
    use_filename: true,
    unique_filename: true,
  });
  return {
    url: result.secure_url,
    bytes: result.bytes,
  };
}

async function saveToFirestore(title, category, url, bytes) {
  const docRef = db.collection('resources').doc();
  const data = {
    id: docRef.id,
    title,
    description: `${category} — Academic document for GBPIET students`,
    subject: category, // Group by category using the subject field!
    branch: 'other',
    semester: 1,
    type: 'form', // Resource type is form!
    fileUrl: url,
    fileFormat: 'pdf',
    uploadedBy: 'admin',
    uploaderName: 'CampusVault Admin',
    status: 'approved', // Auto-approved!
    downloads: 0,
    likes: 0,
    likedBy: [],
    tags: ['form', category.toLowerCase().replace(/[^a-z0-9]/g, '')],
    size: bytes,
    featured: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await docRef.set(data);
  console.log(`✅ Registered in Firestore under ID: ${docRef.id}`);
}

async function main() {
  const baseDir = path.join(os.homedir(), 'Downloads', 'FORMS');
  if (!fs.existsSync(baseDir)) {
    console.error(`❌ Forms folder not found at: ${baseDir}`);
    process.exit(1);
  }

  // Recursive scan helper
  function scan(dir) {
    let files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const p = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...scan(p));
      } else if (item.name.toLowerCase().endsWith('.pdf')) {
        files.push(p);
      }
    }
    return files;
  }

  const allFiles = scan(baseDir);
  console.log(`\n📂 Found ${allFiles.length} forms to process in Downloads/FORMS\n`);

  console.log('🧹 Cleaning up old duplicate forms from Firestore...');
  const oldDocs = await db.collection('resources').where('type', '==', 'form').get();
  if (oldDocs.size > 0) {
    const batch = db.batch();
    oldDocs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`🧹 Deleted ${oldDocs.size} old form records successfully.`);
  } else {
    console.log('🧹 No old form records found. Skipping cleanup.');
  }
  console.log('');

  for (const localPath of allFiles) {
    const relPath = path.relative(baseDir, localPath);
    const category = getCategoryName(relPath);
    const title = path.basename(localPath, '.pdf')
      .replace(/[_\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    try {
      const uploadResult = await uploadFile(localPath, relPath);
      await saveToFirestore(title, category, uploadResult.url, uploadResult.bytes);
      console.log(`✨ Processed "${title}" successfully!\n`);
    } catch (err) {
      console.error(`❌ Failed to process "${title}":`, err.message);
    }
  }

  console.log('🎉 All forms successfully uploaded and imported to CampusVault!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
