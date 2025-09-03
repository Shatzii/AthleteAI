const express = require('express');
const cors = require('cors');
const rankingRoutes = require('./routes/rankingRoutes');

const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());
app.use('/api/rankings', rankingRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Ranking API available at http://localhost:${PORT}/api/rankings`);
});
