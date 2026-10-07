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
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

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

const saveState = () => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(state, null, 2));
};

const getUserByEmail = (email) => state.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
const getUserById = (id) => state.users.find((user) => user.id === id);
const resolveAuthor = (userId) => {
  const user = getUserById(userId);
  if (!user) return null;
  return { id: user.id, name: user.name, avatar: user.avatar, role: user.role };
};

app.use(cors());
app.use(express.json());

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
  res.json({ status: 'ok', uptime: process.uptime() });
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
    followerCount: 0,
    followingCount: 0,
    friends: [],
    bio: 'New to the network.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
  };

  state.users.unshift(newUser);
  saveState();

  const token = makeToken(newUser);
  return res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      email: newUser.email,
      bio: newUser.bio,
      avatar: newUser.avatar,
      followerCount: newUser.followerCount,
      followingCount: newUser.followingCount,
      friends: newUser.friends
    }
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
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      friends: user.friends
    }
  });
});

app.get('/api/profile', authMiddleware, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

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
    friends: user.friends
  })));
});

app.get('/api/dashboard', authMiddleware, (_req, res) => {
  const summary = {
    totalUsers: state.users.length,
    activeGroups: state.groups.length,
    openDeals: state.products.filter((product) => product.status === 'open' || product.status === 'negotiation').length,
    alerts: state.notifications.filter((n) => !n.read).length,
    activity: state.activity,
    metrics: [
      { label: 'Jumps in joiners', value: '+18.2%' },
      { label: 'Avg. engagement', value: '76%' },
      { label: 'Deals under review', value: '14' },
      { label: 'Live room traffic', value: '9.4k' }
    ]
  };

  res.json(summary);
});

app.get('/api/feed', authMiddleware, (_req, res) => {
  const feed = state.posts.map((post) => ({
    ...post,
    author: resolveAuthor(post.userId)
  }));

  res.json(feed);
});

app.post('/api/feed', authMiddleware, (req, res) => {
  const { content, image } = req.body;
  const post = {
    id: createId('post'),
    userId: req.user.id,
    content,
    image,
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString()
  };

  state.posts.unshift(post);
  saveState();

  io.emit('feed:update', { post });
  res.status(201).json(post);
});

app.get('/api/products', authMiddleware, (_req, res) => {
  const products = state.products.map((product) => ({
    ...product,
    seller: resolveAuthor(product.sellerId)
  }));

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
    listingType: 'product',
    sellerId: req.user.id,
    tags: ['new', 'social-trade']
  };

  state.products.unshift(product);
  saveState();
  io.emit('products:update', { product });
  res.status(201).json(product);
});

app.post('/api/products/:id/negotiate', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { price } = req.body;
  const product = state.products.find((item) => item.id === id);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  product.price = Number(price);
  product.status = 'negotiation';

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
  const { groupId } = req.params;
  const messages = state.messages
    .filter((message) => message.groupId === groupId)
    .map((message) => ({ ...message, sender: resolveAuthor(message.senderId) }));

  res.json(messages);
});

app.post('/api/groups/:groupId/messages', authMiddleware, (req, res) => {
  const { groupId } = req.params;
  const { text } = req.body;

  const message = {
    id: createId('msg'),
    groupId,
    senderId: req.user.id,
    text,
    createdAt: new Date().toISOString()
  };

  state.messages.push(message);
  saveState();
  io.to(groupId).emit('chat:new-message', { ...message, sender: resolveAuthor(req.user.id) });
  res.status(201).json(message);
});

app.get('/api/notifications', authMiddleware, (_req, res) => {
  res.json(state.notifications);
});

app.get('/api/admin/overview', authMiddleware, (_req, res) => {
  const currentUser = getUserById(req.user.id);
  if (!currentUser || !['admin', 'moderator'].includes(currentUser.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  return res.json({
    overview: {
      activeUsers: state.users.length,
      issues: state.notifications.length,
      transactions: state.products.length,
      engagement: 87,
      insights: ['More buyers joining from search referrals', 'Pricing debates are increasing in B2B groups', 'Video content sees the largest retention']
    },
    users: state.users,
    alerts: state.notifications,
    activity: state.activity
  });
});

io.on('connection', (socket) => {
  socket.on('join-group', (groupId) => {
    socket.join(groupId);
  });

  socket.on('send-message', (payload) => {
    const { groupId, text, senderId } = payload;
    const message = {
      id: createId('msg'),
      groupId,
      senderId,
      text,
      createdAt: new Date().toISOString()
    };

    state.messages.push(message);
    saveState();
    io.to(groupId).emit('chat:new-message', { ...message, sender: resolveAuthor(senderId) });
  });
});

server.listen(PORT, () => {
  console.log(`Business Social Hub running on http://localhost:${PORT}`);
});
