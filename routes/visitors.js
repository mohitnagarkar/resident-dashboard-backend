const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const auth = require('../utils/auth');
const notify = require('../utils/notify');
const audit = require('../utils/audit');

// Create visitor (resident)
router.post('/visitors', auth.verifyIdToken, async (req,res)=>{
  try {
    const { name, phone, purpose, scheduledAt } = req.body;
    const hostHouseholdId = req.user.householdId;
    if (!hostHouseholdId) return res.status(400).json({error:'no_household'});
    const doc = await db.collection('visitors').add({
      name, phone, purpose, hostHouseholdId, status:'pending', createdAt: admin.firestore.FieldValue.serverTimestamp(), scheduledAt: scheduledAt || null
    });
    await audit.appendEvent('visitor_created', req.user.uid, doc.id, { name, phone });
    // notify guards and household topic
    await notify.sendToTopic(`household_${hostHouseholdId}`, { title:'Visitor requested', body:`${name} for ${purpose}` });
    await notify.sendToTopic('guards', { title:'New visitor pending', body:`${name} -> ${hostHouseholdId}` });
    res.json({ok:true, id:doc.id});
  } catch (e) { console.error(e); res.status(500).json({error:e.message}); }
});

// Approve visitor
router.post('/approveVisitor', auth.verifyIdToken, async (req,res)=>{
  try {
    const { visitorId } = req.body;
    const vRef = db.collection('visitors').doc(visitorId);
    const doc = await vRef.get();
    if (!doc.exists) return res.status(404).json({error:'not_found'});
    const visitor = doc.data();
    const roles = req.user.roles || [];
    if (!(roles.includes('admin') || (roles.includes('resident') && req.user.householdId === visitor.hostHouseholdId))) {
      return res.status(403).json({error:'not_authorized'});
    }
    if (visitor.status !== 'pending') return res.status(400).json({error:'invalid_state'});
    await vRef.update({ status:'approved', approvedBy:req.user.uid, approvedAt: admin.firestore.FieldValue.serverTimestamp() });
    await audit.appendEvent('approval', req.user.uid, visitorId, {});
    await notify.sendToTopic(`household_${visitor.hostHouseholdId}`, { title:'Visitor approved', body:`${visitor.name} approved` });
    res.json({ok:true});
  } catch (e) { console.error(e); res.status(500).json({error:e.message}); }
});

// Deny visitor
router.post('/denyVisitor', auth.verifyIdToken, async (req,res)=>{
  try {
    const { visitorId, reason } = req.body;
    const vRef = db.collection('visitors').doc(visitorId);
    const doc = await vRef.get();
    if (!doc.exists) return res.status(404).json({error:'not_found'});
    const visitor = doc.data();
    const roles = req.user.roles || [];
    if (!(roles.includes('admin') || (roles.includes('resident') && req.user.householdId === visitor.hostHouseholdId))) {
      return res.status(403).json({error:'not_authorized'});
    }
    if (visitor.status !== 'pending') return res.status(400).json({error:'invalid_state'});
    await vRef.update({ status:'denied', deniedBy:req.user.uid, deniedAt: admin.firestore.FieldValue.serverTimestamp(), denyReason: reason || null });
    await audit.appendEvent('denial', req.user.uid, visitorId, { reason: reason || null });
    await notify.sendToTopic(`household_${visitor.hostHouseholdId}`, { title:'Visitor denied', body:`${visitor.name} denied` });
    res.json({ok:true});
  } catch (e) { console.error(e); res.status(500).json({error:e.message}); }
});

// Checkin
router.post('/checkin', auth.verifyIdToken, async (req,res)=>{
  try {
    const { visitorId } = req.body;
    const roles = req.user.roles || [];
    if (!roles.includes('guard') && !roles.includes('admin')) return res.status(403).json({error:'not_authorized'});
    const vRef = db.collection('visitors').doc(visitorId);
    const doc = await vRef.get();
    if (!doc.exists) return res.status(404).json({error:'not_found'});
    const visitor = doc.data();
    if (visitor.status !== 'approved') return res.status(400).json({error:'invalid_state'});
    await vRef.update({ status:'checked_in', checkedInBy:req.user.uid, checkedInAt: admin.firestore.FieldValue.serverTimestamp() });
    await audit.appendEvent('checkin', req.user.uid, visitorId, {});
    await notify.sendToTopic(`household_${visitor.hostHouseholdId}`, { title:'Visitor checked in', body:`${visitor.name} has arrived` });
    res.json({ok:true});
  } catch (e) { console.error(e); res.status(500).json({error:e.message}); }
});

// Checkout
router.post('/checkout', auth.verifyIdToken, async (req,res)=>{
  try {
    const { visitorId } = req.body;
    const roles = req.user.roles || [];
    if (!roles.includes('guard') && !roles.includes('admin')) return res.status(403).json({error:'not_authorized'});
    const vRef = db.collection('visitors').doc(visitorId);
    const doc = await vRef.get();
    if (!doc.exists) return res.status(404).json({error:'not_found'});
    const visitor = doc.data();
    if (visitor.status !== 'checked_in') return res.status(400).json({error:'invalid_state'});
    await vRef.update({ status:'checked_out', checkedOutBy:req.user.uid, checkedOutAt: admin.firestore.FieldValue.serverTimestamp() });
    await audit.appendEvent('checkout', req.user.uid, visitorId, {});
    await notify.sendToTopic(`household_${visitor.hostHouseholdId}`, { title:'Visitor checked out', body:`${visitor.name} has left` });
    res.json({ok:true});
  } catch (e) { console.error(e); res.status(500).json({error:e.message}); }
});

module.exports = router;
