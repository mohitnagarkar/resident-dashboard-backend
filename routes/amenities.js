const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const auth = require('../utils/auth');
const audit = require('../utils/audit');
const notify = require('../utils/notify');

router.post('/book', auth.verifyIdToken, async (req,res)=>{
  try {
    const { amenity, start, end } = req.body;
    const booking = { amenity, start, end, bookedBy: req.user.uid, householdId: req.user.householdId, status:'confirmed', createdAt: admin.firestore.FieldValue.serverTimestamp() };
    const doc = await db.collection('amenities').add(booking);
    await audit.appendEvent('amenity_book', req.user.uid, doc.id, booking);
    await notify.sendToTopic('admins', { title:'Amenity booked', body: `${req.user.uid} booked ${amenity}` });
    res.json({ok:true, id: doc.id});
  } catch (e) { console.error(e); res.status(500).json({error:e.message}); }
});

router.get('/list', auth.verifyIdToken, async (req,res)=>{
  try {
    const snap = await db.collection('amenities').where('householdId','==',req.user.householdId).get();
    const items = snap.docs.map(d=>({id:d.id, ...d.data()}));
    res.json(items);
  } catch(e){ console.error(e); res.status(500).json({error:e.message}); }
});

module.exports = router;
