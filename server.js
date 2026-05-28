require('dotenv').config();

const express = require('express');
const qrcode = require('qrcode-terminal');

const {
  Client,
  LocalAuth
} = require('whatsapp-web.js');

const app = express();

app.use(express.json());

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'crm-engine'
  }),
  puppeteer: {
    headless: "new",
    handleSIGINT: false,
handleSIGTERM: false,
handleSIGHUP: false,
    args: [
    '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  '--window-size=1920,1080'
    ]
  }
});

client.on('qr', qr => {
  console.log('\n================ QR CODE ================\n');

  qrcode.generate(qr, {
    small: true
  });

  console.log('\n=========================================\n');
});

client.on('ready', () => {
  console.log('WhatsApp Browser Engine ONLINE');
});

client.on('authenticated', () => {
  console.log('WhatsApp autenticado');
});

client.on('auth_failure', msg => {
  console.log('Erro autenticação:', msg);
});

client.on('disconnected', reason => {
  console.log('WhatsApp desconectado:', reason);
});

setTimeout(() => {
  client.initialize();
}, 5000);

app.get('/', async (req, res) => {
  res.send({
    status: 'online',
    engine: 'browser',
    whatsapp: 'connected'
  });
});

app.post('/send-browser', async (req, res) => {
  try {

    const {
      number,
      message
    } = req.body;

    if (!number || !message) {
      return res.status(400).send({
        error: 'number e message obrigatórios'
      });
    }

    const chatId = `${number}@c.us`;

    console.log('Abrindo thread...');

    const chat = await client.getChatById(chatId);

    await chat.sendStateTyping();

    await new Promise(resolve =>
      setTimeout(resolve, 3000)
    );

    console.log('Enviando mensagem...');

    const response = await client.sendMessage(
      chatId,
      message
    );

    await chat.clearState();

    console.log('Mensagem enviada');

    return res.send({
      success: true,
      id: response.id.id
    });

  } catch (err) {

    console.error(err);

    return res.status(500).send({
      success: false,
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
