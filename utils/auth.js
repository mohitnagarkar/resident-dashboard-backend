const admin = require('firebase-admin');
module.exports = {
  async verifyIdToken(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({error:'Missing token'});
    const idToken = auth.split('Bearer ')[1];
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      req.user = decoded;
      return next();
    } catch (err) {
      console.error('token verify error', err);
      return res.status(401).json({error:'Invalid token'});
    }
  }
};
