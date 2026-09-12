const fs = require('fs');
const https = require('https');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/users`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    if(json.documents) {
      json.documents.forEach(doc => {
        console.log(doc.name);
        console.log("writeAccessGranted:", doc.fields.writeAccessGranted);
      });
    } else {
      console.log(json);
    }
  });
}).on('error', console.error);
