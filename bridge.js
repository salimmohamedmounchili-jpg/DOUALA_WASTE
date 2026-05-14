const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

let capteurs = {};

const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

mqttClient.on('connect', () => {
  console.log('✅ Connecté au broker MQTT');
  mqttClient.subscribe('douala/dechets/+/data');
});

mqttClient.on('message', (topic, message) => {
  const parts = topic.split('/');
  const capteurId = parts[2];
  try {
    const data = JSON.parse(message.toString());
    capteurs[capteurId] = {
      id: capteurId,
      niveau: data.niveau,
      batterie: data.batterie,
      lastUpdate: Date.now()
    };
    console.log(`📥 Données reçues de ${capteurId}: niveau ${data.niveau}%`);
  } catch (e) {
    console.error('❌ Erreur parsing JSON:', e);
  }
});

app.get('/api/capteurs', (req, res) => {
  res.json(Object.keys(capteurs));
});

app.get('/api/capteur/:id', (req, res) => {
  const id = req.params.id;
  if (capteurs[id]) {
    res.json(capteurs[id]);
  } else {
    res.status(404).json({ error: 'Capteur inconnu' });
  }
});

app.post('/api/capteur/:id', (req, res) => {
  const id = req.params.id;
  if (!capteurs[id]) {
    capteurs[id] = {
      id: id,
      niveau: 0,
      batterie: 0,
      lastUpdate: Date.now()
    };
    console.log(`📝 Nouveau capteur enregistré: ${id}`);
  }
  res.json(capteurs[id]);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bridge API sur http://localhost:${PORT}`);
});