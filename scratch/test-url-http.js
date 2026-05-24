const https = require('https');

const url = 'https://res.cloudinary.com/ds6xwzglf/image/upload/v1779609901/campusvault/forms/FRONT_PAGE_SEM_3_n4irik.jpg';

https.request(url, { method: 'HEAD' }, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  process.exit(0);
}).on('error', (e) => {
  console.error(e);
  process.exit(1);
}).end();
