// Usage: node scripts/setRole.js <uid> <role>
const admin = require('firebase-admin');
const fs = require('fs');
if (!fs.existsSync('../backend/serviceAccountKey.json')) {
  console.error('Place your service account at backend/serviceAccountKey.json');
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(require('../backend/serviceAccountKey.json')) });
const uid = process.argv[2];
const role = process.argv[3];
if (!uid || !role) { console.error('Usage: node scripts/setRole.js <uid> <role>'); process.exit(1); }
admin.auth().setCustomUserClaims(uid, { roles: [role] }).then(()=>console.log('Claim set')).catch(e=>console.error(e));
