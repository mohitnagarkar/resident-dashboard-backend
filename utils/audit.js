const admin = require('firebase-admin');
const db = admin.firestore();
module.exports = {
  async appendEvent(type, actorUserId, subjectId, payload) {
    await db.collection('events').add({
      type, actorUserId, subjectId, payload, ts: admin.firestore.FieldValue.serverTimestamp()
    });
  }
};
