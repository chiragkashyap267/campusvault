const path = require('path');
const { v2: cloudinary } = require('cloudinary');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
  const publicId = 'campusvault/mca/sem1/pyq/TCS_FINAL_EXAM_1_gec3ad';
  
  console.log('Testing Admin API details fetching...');
  try {
    const res = await cloudinary.api.resource(publicId, { resource_type: 'image' });
    console.log('Admin API Success! Resource format:', res.format);
  } catch (err) {
    console.error('Admin API Error:', err.message);
  }

  console.log('\nTesting signed URL...');
  try {
    const signedUrl = cloudinary.url(publicId, {
      resource_type: 'image',
      sign_url: true
    });
    console.log('Signed URL:', signedUrl);
    
    const resp = await fetch(signedUrl);
    console.log('Fetch signed URL status:', resp.status);
    if (!resp.ok) {
      console.log('Error headers:', Object.fromEntries(resp.headers.entries()));
    }
  } catch (err) {
    console.error('Signed URL Error:', err.message);
  }
}

run().catch(console.error);
