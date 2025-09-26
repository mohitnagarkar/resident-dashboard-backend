require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  })
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Root route — to test backend
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// --- POST route: Add a visitor ---
app.post("/visitors", async (req, res) => {
  try {
    const { name, phone, purpose } = req.body;
    if (!name || !phone || !purpose) {
      return res.status(400).json({ status: "error", message: "All fields are required" });
    }
    const docRef = await db.collection("visitors").add({
      name,
      phone,
      purpose,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({
      status: "success",
      message: `Visitor ${name} created ✅`,
      data: { id: docRef.id, name, phone, purpose },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// --- GET route: Fetch all visitors ---
app.get("/visitors", async (req, res) => {
  try {
    const snapshot = await db.collection("visitors").orderBy("createdAt", "desc").get();
    const visitors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({
      status: "success",
      data: visitors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// --- DELETE route: Delete a visitor ---
app.delete("/visitors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("visitors").doc(id).delete();
    res.status(200).json({ status: "success", message: "Visitor deleted ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// --- PUT route: Update a visitor ---
app.put("/visitors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, purpose } = req.body;
    if (!name || !phone || !purpose) {
      return res.status(400).json({ status: "error", message: "All fields are required" });
    }
    await db.collection("visitors").doc(id).update({
      name,
      phone,
      purpose,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ status: "success", message: "Visitor updated ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
