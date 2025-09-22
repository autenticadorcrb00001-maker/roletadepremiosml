
const express = require('express');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PROJECT_ROOT = __dirname;
const PUBLIC = path.join(PROJECT_ROOT, 'public');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'config.json');
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(fileUpload());
app.use(session({secret: 'roleta_secret_123', resave:false, saveUninitialized:true}));

// serve static
app.use('/public', express.static(PUBLIC));
app.use('/', express.static(PUBLIC));

// Load config
function loadConfig(){
  try{
    const raw = fs.readFileSync(CONFIG_PATH);
    return JSON.parse(raw);
  }catch(e){ return {}; }
}

// Save config
function saveConfig(cfg){
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}

// Middleware simple auth for /admin
function requireAuth(req,res,next){
  if (req.session && req.session.user) return next();
  return res.redirect('/admin/login');
}

// Admin pages
app.get('/admin/login', (req,res)=>{
  res.sendFile(path.join(PUBLIC, 'admin_login.html'));
});
app.post('/admin/login', (req,res)=>{
  const {username, password} = req.body;
  const cfg = loadConfig();
  const auth = cfg.auth || {username:'admin', password:'admin'};
  if (username === auth.username && password === auth.password){
    req.session.user = username;
    return res.redirect('/admin');
  } else {
    return res.send('Credenciais inválidas. <a href="/admin/login">Voltar</a>');
  }
});
app.get('/admin/logout', (req,res)=>{ req.session.destroy(()=>res.redirect('/admin/login')); });

app.get('/admin', requireAuth, (req,res)=>{
  res.sendFile(path.join(PUBLIC, 'admin.html'));
});

// API to get config (for client)
app.get('/config.json', (req,res)=>{
  const cfg = loadConfig();
  res.json(cfg);
});

// API to save config (admin)
app.post('/admin/save', requireAuth, (req,res)=>{
  const body = req.body || {};
  const cfg = loadConfig();
  // merge body fields into cfg (simple)
  Object.assign(cfg, body);
  // special handling for nested JSON passed as strings
  try {
    if (typeof body.popup === 'string') cfg.popup = JSON.parse(body.popup);
    if (typeof body.girar === 'string') cfg.girar = JSON.parse(body.girar);
    if (typeof body.background === 'string') cfg.background = JSON.parse(body.background);
  } catch(e){}
  saveConfig(cfg);
  res.json({ok:true, cfg});
});

// upload logo
app.post('/admin/upload', requireAuth, (req,res)=>{
  if (!req.files) return res.status(400).send('No files uploaded');
  const cfg = loadConfig();
  const uploadsDir = path.join(PUBLIC, 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  const saved = {};
  for (const key in req.files){
    const file = req.files[key];
    const dest = path.join(uploadsDir, file.name);
    file.mv(dest);
    saved[key] = '/uploads/' + file.name;
    // update cfg mapping
    if (key === 'logoTopo') cfg.logoTopo = saved[key];
    if (key === 'logoCentro') cfg.logoCentro = saved[key];
    if (key === 'setaImg') cfg.setaImg = saved[key];
  }
  saveConfig(cfg);
  res.json({ok:true, saved, cfg});
});

// serve a small config script for client to consume on window.ROULETTE_CONFIG
app.get('/config.js', (req,res)=>{
  const cfg = loadConfig();
  res.type('application/javascript');
  res.send('window.ROULETTE_CONFIG = ' + JSON.stringify(cfg) + ';');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server running on port', PORT));
