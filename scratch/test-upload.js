const path = require('path');
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
  // Find any small pdf in the folder or create a dummy one
  const tempPdfPath = path.join(__dirname, 'dummy.pdf');
  fs.writeFileSync(tempPdfPath, '%PDF-1.4 dummy pdf content');

  console.log('Uploading dummy.pdf as resource_type: raw...');
  try {
    const resultRaw = await cloudinary.uploader.upload(tempPdfPath, {
      folder: 'campusvault/test',
      resource_type: 'raw',
    });
    console.log('Upload Raw Success! URL:', resultRaw.secure_url);
    
    // Now let's fetch it
    const resp = await fetch(resultRaw.secure_url);
    console.log('Fetch Raw URL status:', resp.status);
    if (!resp.ok) {
      console.log('Error headers:', Object.fromEntries(resp.headers.entries()));
    }
  } catch (err) {
    console.error('Upload Raw Error:', err);
  }

  console.log('\nUploading dummy.pdf as resource_type: image...');
  try {
    const resultImage = await cloudinary.uploader.upload(tempPdfPath, {
      folder: 'campusvault/test',
      resource_type: 'image',
    });
    console.log('Upload Image Success! URL:', resultImage.secure_url);
    
    // Now let's fetch it
    const resp = await fetch(resultImage.secure_url);
    console.log('Fetch Image URL status:', resp.status);
    if (!resp.ok) {
      console.log('Error headers:', Object.fromEntries(resp.headers.entries()));
    }
  } catch (err) {
    console.error('Upload Image Error:', err);
  }

  // Clean up
  try { fs.unlinkSync(tempPdfPath); } catch {}
}

run().catch(console.error);
