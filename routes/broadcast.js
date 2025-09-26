const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const auth = require('../utils/auth');
const audit = require('../utils/audit');
const notify = require('../utils/notify');

router.post('/send', auth.verifyIdToken, async (req,res)=>{
  try {
    // Only admin
    const roles = req.user.roles || [];
    if (!roles.includes('admin')) return res.status(403).json({error:'not_authorized'});
    const { title, message } = req.body;
    await db.collection('broadcasts').add({ title, message, createdBy: req.user.uid, ts: admin.firestore.FieldValue.serverTimestamp() });
    await audit.appendEvent('broadcast', req.user.uid, null, { title, message });
    await notify.sendToTopic('all', { title, body: message });
    res.json({ok:true});
  } catch(e){ console.error(e); res.status(500).json({error:e.message}); }
});

module.exports = router;
