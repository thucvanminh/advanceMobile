const https = require('https');
const fs = require('fs');

// Config from google-services.json
const PROJECT_ID = 'vanminhthuclab4';
const API_KEY = 'AIzaSyAC_zEg3NA9mvFp5IdwYwMw6y6I0cH3OOw';
const TARGET_USER_ID = 'DhCweDwrnAaUjuYzYEPyxsw05M22';

function httpsRequest(url, options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function signIn(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const data = JSON.stringify({ email, password, returnSecureToken: true });
  const result = await httpsRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
  }, data);
  return result.idToken;
}

async function listNotes(idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/notes`;
  const result = await httpsRequest(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  return result.documents || [];
}

async function updateNote(idToken, docName, fields) {
  const url = `https://firestore.googleapis.com/v1/${docName}`;
  const data = JSON.stringify({ fields });
  const result = await httpsRequest(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  }, data);
  return result;
}

async function main() {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const question = (q) => new Promise(resolve => rl.question(q, resolve));

  const email = await question('Email: ');
  const password = await question('Password: ');

  console.log('\nSigning in...');
  const idToken = await signIn(email, password);
  if (!idToken) {
    console.error('Sign in failed!');
    rl.close();
    return;
  }
  console.log('Signed in successfully!');

  console.log('\nFetching notes...');
  const notes = await listNotes(idToken);
  console.log(`Found ${notes.length} notes`);

  let updated = 0;
  for (const note of notes) {
    const docName = note.name;
    const fields = note.fields || {};

    // Add userId field
    fields['userId'] = { stringValue: TARGET_USER_ID };

    await updateNote(idToken, docName, fields);
    updated++;
    const name = docName.split('/').pop();
    console.log(`  Updated: ${name}`);
  }

  console.log(`\nDone! Updated ${updated} notes with userId: ${TARGET_USER_ID}`);
  rl.close();
}

main().catch(console.error);
