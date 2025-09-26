const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const auth = require('../utils/auth');

// SLA: time from visitor created -> approved (in seconds)
router.get('/sla', auth.verifyIdToken, async (req,res)=>{
  try {
    // admin only
    const roles = req.user.roles || [];
    if (!roles.includes('admin')) return res.status(403).json({error:'not_authorized'});
    const snap = await db.collection('events').where('type','==','approval').get();
    const slaRecords = [];
    for (const doc of snap.docs) {
      const ev = doc.data();
      const visitorId = ev.subjectId;
      const vDoc = await db.collection('visitors').doc(visitorId).get();
      if (!vDoc.exists) continue;
      const v = vDoc.data();
      const createdAt = v.createdAt ? v.createdAt.toDate() : null;
      const approvedAt = v.approvedAt ? v.approvedAt.toDate() : null;
      if (createdAt && approvedAt) {
        slaRecords.push({visitorId, seconds: (approvedAt - createdAt)/1000});
      }
    }
    res.json({count: slaRecords.length, records: slaRecords});
  } catch(e){ console.error(e); res.status(500).json({error:e.message}); }
});

module.exports = router;
