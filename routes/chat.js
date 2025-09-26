const express = require('express');
const router = express.Router();
const auth = require('../utils/auth');
const ai = require('../utils/ai');
const visitorsRouter = require('./visitors'); // to reuse handlers by forwarding (hacky but simple)

router.post('/', auth.verifyIdToken, async (req,res)=>{
  try {
    const { message } = req.body;
    const parsed = await ai.parseActionFromMessage(message);
    if (!parsed || !parsed.action) return res.json({reply:'No action parsed', parsed});
    // Attach args to req body and forward to appropriate route by path
    const action = parsed.action;
    req.body = req.body || {};
    Object.assign(req.body, parsed.args || {});
    if (action === 'approve_visitor') return visitorsRouter.handle(req, res, () => {}, '/approveVisitor', 'POST');
    if (action === 'deny_visitor') return visitorsRouter.handle(req, res, () => {}, '/denyVisitor', 'POST');
    if (action === 'checkin_visitor') return visitorsRouter.handle(req, res, () => {}, '/checkin', 'POST');
    return res.json({reply:'Action not supported on server', action});
  } catch(e){ console.error(e); res.status(500).json({error:e.message}); }
});

module.exports = router;
