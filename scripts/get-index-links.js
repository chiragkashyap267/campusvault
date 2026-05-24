const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

initializeApp({
  credential: cert(require(path.join(__dirname, 'service-account.json')))
});
const db = getFirestore();

async function getIndexLinks() {
  console.log("Checking for missing indexes...\n");
  
  const queries = [
    { name: "Recent", q: db.collection('resources').where("status", "==", "approved").orderBy("createdAt", "desc").limit(1) },
    { name: "Trending", q: db.collection('resources').where("status", "==", "approved").orderBy("downloads", "desc").limit(1) },
    { name: "Likes", q: db.collection('resources').where("status", "==", "approved").orderBy("likes", "desc").limit(1) }
  ];

  for (const query of queries) {
    try {
      await query.q.get();
      console.log(`✅ [${query.name}] query works fine.`);
    } catch (e) {
      console.log(`❌ [${query.name}] missing index!`);
      const linkMatch = e.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
      if (linkMatch) {
        console.log(`👉 Link: ${linkMatch[0]}\n`);
      } else {
        console.log(`Error: ${e.message}\n`);
      }
    }
  }
}

getIndexLinks();
