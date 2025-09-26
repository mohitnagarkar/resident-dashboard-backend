const admin = require('firebase-admin');
module.exports = {
  async sendToTopic(topic, payload) {
    try {
      const message = { topic, notification: { title: payload.title, body: payload.body }, data: payload.data || {} };
      const resp = await admin.messaging().send(message);
      return resp;
    } catch (e) {
      console.error('FCM error', e);
      throw e;
    }
  },
  async sendToToken(token, payload) {
    try {
      const message = { token, notification: { title: payload.title, body: payload.body }, data: payload.data || {} };
      const resp = await admin.messaging().send(message);
      return resp;
    } catch (e) {
      console.error('FCM token send error', e);
      throw e;
    }
  }
};
