const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/save', (req, res) => {
  const { filename, base64data } = req.body;
  const base64Data = base64data.replace(/^data:image\/png;base64,/, "");
  const savePath = path.join(__dirname, 'public', 'assets', 'buildings', filename);
  fs.writeFileSync(savePath, base64Data, 'base64');
  console.log('Saved', filename);
  res.send('ok');
});

app.listen(4000, () => console.log('Uploader running on 4000'));
