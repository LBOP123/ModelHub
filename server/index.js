require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const modelRoutes = require('./routes/models');
const assetRoutes = require('./routes/assets');
const docRoutes = require('./routes/docs');
const userRoutes = require('./routes/users');
const feedbackRoutes = require('./routes/feedback');
const adminUserRoutes = require('./routes/admin/users');
const adminModelRoutes = require('./routes/admin/models');
const adminDocRoutes = require('./routes/admin/docs');
const adminFeedbackRoutes = require('./routes/admin/feedback');
const auth = require('./middleware/auth');
const admin = require('./middleware/admin');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/users', userRoutes);
app.use('/api/feedbacks', auth, feedbackRoutes);

// Admin routes
app.use('/api/admin/users', auth, admin, adminUserRoutes);
app.use('/api/admin/models', auth, admin, adminModelRoutes);
app.use('/api/admin/docs', auth, admin, adminDocRoutes);
app.use('/api/admin/feedbacks', auth, admin, adminFeedbackRoutes);

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback: non-API routes serve index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ code: 404, msg: '接口不存在' });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ModelHub server running on http://localhost:${PORT}`);
});
