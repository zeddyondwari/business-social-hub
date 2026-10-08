import express from 'express';
import http from 'http';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { mockState, createId } from './data/mockData.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const DATA_PATH = path.join(process.cwd(), 'data', 'store.json');

const ensureStore = () => {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(mockState, null, 2));
  }

  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(mockState, null, 2));
    return JSON.parse(JSON.stringify(mockState));
  }
};

let state = ensureStore();
if (!state.settings) state.settings = {};
if (!state.backups) state.backups = [];

const saveState = () => fs.writeFileSync(DATA_PATH, JSON.stringify(state, null, 2));
const getUserByEmail = (email) => state.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
const getUserById = (id) => state.users.find((user) => user.id === id);
const resolveAuthor = (userId) => {
  const user = getUserById(userId);
  return user ? { id: user.id, name: user.name, avatar: user.avatar, role: user.role } : null;
};

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const makeToken = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }
  if (getUserByEmail(email)) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  const newUser = {
    id: createId('u'),
    name,
    role: 'member',
    email,
    password,
    bio: 'New to the network.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    followerCount: 0,
    followingCount: 0,
    friends: [],
    accountType: req.body.accountType || 'ordinary',
    isPrivate: Boolean(req.body.isPrivate)
  };

  state.users.unshift(newUser);
  saveState();

  const token = makeToken(newUser);
  return res.status(201).json({
    token,
    user: { id: newUser.id, name: newUser.name, role: newUser.role, email: newUser.email, avatar: newUser.avatar, bio: newUser.bio, followerCount: newUser.followerCount, followingCount: newUser.followingCount, connectedCount: newUser.friends.length }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = makeToken(user);
  return res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role, email: user.email, avatar: user.avatar, bio: user.bio, followerCount: user.followerCount, followingCount: user.followingCount, connectedCount: user.friends.length }
  });
});

app.get('/api/profile', authMiddleware, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  return res.json({
    ...user,
    totalPosts: state.posts.filter((post) => post.userId === user.id).length,
    totalProducts: state.products.filter((product) => product.sellerId === user.id).length,
    connectedCount: user.friends.length
  });
});

app.get('/api/users', authMiddleware, (_req, res) => {
  res.json(state.users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    followerCount: user.followerCount,
    followingCount: user.followingCount,
    friendCount: user.friends.length,
    accountType: user.accountType || 'ordinary',
    isPrivate: Boolean(user.isPrivate)
  })));
});

app.get('/api/dashboard', authMiddleware, (_req, res) => {
  const summary = {
    totalUsers: state.users.length,
    activeGroups: state.groups.length,
    openDeals: state.products.filter((product) => product.status === 'open' || product.status === 'negotiation').length,
    alerts: state.notifications.filter((item) => !item.read).length,
    metrics: [
      { label: 'New joins', value: '+18.2%' },
      { label: 'Engagement', value: '76%' },
      { label: 'Open deals', value: String(state.products.length) },
      { label: 'Live traffic', value: '9.4k' }
    ],
    activity: state.activity
  };
  res.json(summary);
});

app.get('/api/feed', authMiddleware, (_req, res) => {
  const feed = state.posts.map((post) => ({ ...post, author: resolveAuthor(post.userId) }));
  res.json(feed);
});

app.post('/api/feed', authMiddleware, (req, res) => {
  const { content, image } = req.body;
  const post = {
    id: createId('post'),
    userId: req.user.id,
    content,
    image: image || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString()
  };

  state.posts.unshift(post);
  saveState();
  io.emit('feed:update', { post: { ...post, author: resolveAuthor(req.user.id) } });
  res.status(201).json(post);
});

app.get('/api/products', authMiddleware, (_req, res) => {
  const products = state.products.map((product) => ({ ...product, seller: resolveAuthor(product.sellerId) }));
  res.json(products);
});

app.post('/api/products', authMiddleware, (req, res) => {
  const { name, description, price, image } = req.body;
  if (!name || !description || !price) {
    return res.status(400).json({ message: 'Name, description and price are required.' });
  }

  const product = {
    id: createId('prod'),
    name,
    description,
    price: Number(price),
    image: image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80',
    status: 'open',
    sellerId: req.user.id,
    tags: ['new', 'social-trade']
  };

  state.products.unshift(product);
  saveState();
  io.emit('products:update', { product: { ...product, seller: resolveAuthor(req.user.id) } });
  res.status(201).json(product);
});

app.post('/api/products/:id/negotiate', authMiddleware, (req, res) => {
  const { id } = req.params;
  const product = state.products.find((item) => item.id === id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  product.price = Number(req.body.price);
  product.status = 'negotiation';
  saveState();

  const notification = {
    id: createId('notif'),
    type: 'challenge',
    message: `Price negotiation submitted for ${product.name}.`,
    read: false
  };

  state.notifications.unshift(notification);
  saveState();
  io.emit('notification:new', { notification });
  return res.json(product);
});

app.get('/api/groups', authMiddleware, (_req, res) => {
  res.json(state.groups);
});

app.get('/api/groups/:groupId/messages', authMiddleware, (req, res) => {
  const messages = state.messages.filter((message) => message.groupId === req.params.groupId).map((message) => ({ ...message, sender: resolveAuthor(message.senderId) }));
  res.json(messages);
});

app.post('/api/groups/:groupId/messages', authMiddleware, (req, res) => {
  const { text, image } = req.body;
  const message = {
    id: createId('msg'),
    groupId: req.params.groupId,
    senderId: req.user.id,
    text: text || '',
    image: image || null,
    createdAt: new Date().toISOString()
  };

  state.messages.push(message);
  saveState();
  io.to(req.params.groupId).emit('chat:new-message', { ...message, sender: resolveAuthor(req.user.id) });
  res.status(201).json(message);
});

app.get('/api/notifications', authMiddleware, (_req, res) => {
  res.json(state.notifications);
});

app.get('/api/settings', authMiddleware, (req, res) => {
  const user = getUserById(req.user.id);
  const settings = state.settings[req.user.id] || {
    avatar: user?.avatar || '',
    accountType: user?.accountType || 'ordinary',
    isPrivate: Boolean(user?.isPrivate),
    notifications: true,
    backupMode: 'manual'
  };
  res.json(settings);
});

app.post('/api/settings', authMiddleware, (req, res) => {
  const user = getUserById(req.user.id);
  state.settings[req.user.id] = {
    avatar: req.body.avatar || user?.avatar || '',
    accountType: req.body.accountType || user?.accountType || 'ordinary',
    isPrivate: Boolean(req.body.isPrivate),
    notifications: Boolean(req.body.notifications),
    backupMode: req.body.backupMode || 'manual'
  };

  if (user) {
    user.avatar = state.settings[req.user.id].avatar;
    user.accountType = state.settings[req.user.id].accountType;
    user.isPrivate = state.settings[req.user.id].isPrivate;
  }
  saveState();
  res.json({ user: { id: user.id, name: user.name, avatar: user.avatar, role: user.role, accountType: user.accountType, isPrivate: user.isPrivate } });
});

app.post('/api/backup', authMiddleware, (_req, res) => {
  const timestamp = new Date().toISOString();
  state.backups.unshift({ timestamp, snapshot: state });
  saveState();
  res.json({ timestamp, backups: state.backups.length });
});

io.on('connection', (socket) => {
  socket.on('join-group', (groupId) => socket.join(groupId));
});

server.listen(PORT, () => {
  console.log(`Business Social Hub running on http://localhost:${PORT}`);
});
