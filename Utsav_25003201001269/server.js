const express = require('express');

const app = express();
const PORT = 3000;

app.use(express.json());

let registrations = [
  { id: 501, participantName: "Riya Sharma", eventName: "Tech Fest", department: "CSE", ticketCount: 2, paymentStatus: "Paid" },
  { id: 502, participantName: "Arjun Mehta", eventName: "Code Sprint", department: "IT", ticketCount: 1, paymentStatus: "Pending" },
  { id: 503, participantName: "Neha Verma", eventName: "Tech Fest", department: "ECE", ticketCount: 3, paymentStatus: "Paid" }
];

function validatePayload(body) {
  const { participantName, eventName, department, ticketCount, paymentStatus } = body;
  if (!participantName || typeof participantName !== 'string' || !participantName.trim()) {
    return false;
  }
  if (!eventName || typeof eventName !== 'string' || !eventName.trim()) {
    return false;
  }
  if (!department || typeof department !== 'string' || !department.trim()) {
    return false;
  }
  if (ticketCount === undefined || typeof ticketCount !== 'number' || !Number.isInteger(ticketCount) || ticketCount <= 0) {
    return false;
  }
  if (paymentStatus !== 'Paid' && paymentStatus !== 'Pending') {
    return false;
  }
  return true;
}

app.get('/api/registrations', (req, res) => {
  res.status(200).json(registrations);
});

app.get('/api/registrations/filter', (req, res) => {
  const { department } = req.query;
  if (!department) {
    return res.status(200).json([]);
  }
  const filtered = registrations.filter(
    r => r.department.toLowerCase() === department.trim().toLowerCase()
  );
  res.status(200).json(filtered);
});

app.get('/api/registrations/pending', (req, res) => {
  const pending = registrations.filter(r => r.paymentStatus === 'Pending');
  res.status(200).json(pending);
});

app.get('/api/registrations/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: 'Registration not found' });
  }
  const record = registrations.find(r => r.id === id);
  if (!record) {
    return res.status(404).json({ error: 'Registration not found' });
  }
  res.status(200).json(record);
});

app.post('/api/registrations', (req, res) => {
  if (!validatePayload(req.body)) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  const { participantName, eventName, department, ticketCount, paymentStatus } = req.body;
  const newId = registrations.length > 0 ? Math.max(...registrations.map(r => r.id)) + 1 : 501;

  const newRegistration = {
    id: newId,
    participantName: participantName.trim(),
    eventName: eventName.trim(),
    department: department.trim(),
    ticketCount,
    paymentStatus
  };

  registrations.push(newRegistration);
  res.status(201).json(newRegistration);
});

app.put('/api/registrations/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  const index = registrations.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  if (!validatePayload(req.body)) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  const { participantName, eventName, department, ticketCount, paymentStatus } = req.body;
  registrations[index] = {
    id,
    participantName: participantName.trim(),
    eventName: eventName.trim(),
    department: department.trim(),
    ticketCount,
    paymentStatus
  };

  res.status(200).json(registrations[index]);
});

app.delete('/api/registrations/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  const index = registrations.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  registrations.splice(index, 1);
  res.status(200).json({ message: 'Registration deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
