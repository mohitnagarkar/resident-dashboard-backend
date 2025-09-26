const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const auth = require('../utils/auth');
const audit = require('../utils/audit');
const notify = require('../utils/notify');

router.post('/', auth.verifyIdToken, async (req,res)=>{
  try {
    const { title, description } = req.body;
    const doc = await db.collection('complaints').add({ title, description, createdBy: req.user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp(), status:'open' });
    await audit.appendEvent('complaint_create', req.user.uid, doc.id, { title });
    await notify.sendToTopic('admins', { title:'New complaint', body: title });
    res.json({ok:true, id:doc.id});
  } catch(e){ console.error(e); res.status(500).json({error:e.message}); }
});

module.exports = router;
