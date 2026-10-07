import express from 'express';
import http from 'http';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { mockState, createId, findUserByEmail, findUserById, resolveAuthor } from './data/mockData.js';

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

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(email);

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

app.get('/api/dashboard', authMiddleware, (_req, res) => {
  const summary = {
    totalUsers: mockState.users.length,
    activeGroups: mockState.groups.length,
    openDeals: mockState.products.filter((product) => product.status === 'open' || product.status === 'negotiation').length,
    alerts: mockState.notifications.filter((n) => !n.read).length,
    activity: mockState.activity,
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
  const feed = mockState.posts.map((post) => ({
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

  mockState.posts.unshift(post);

  io.emit('feed:update', { post });
  res.status(201).json(post);
});

app.get('/api/products', authMiddleware, (_req, res) => {
  const products = mockState.products.map((product) => ({
    ...product,
    seller: resolveAuthor(product.sellerId)
  }));

  res.json(products);
});

app.post('/api/products', authMiddleware, (req, res) => {
  const { name, description, price, image } = req.body;
  const product = {
    id: createId('prod'),
    name,
    description,
    price,
    image,
    status: 'open',
    listingType: 'product',
    sellerId: req.user.id,
    tags: ['new', 'social-trade']
  };

  mockState.products.unshift(product);
  io.emit('products:update', { product });
  res.status(201).json(product);
});

app.post('/api/products/:id/negotiate', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { price } = req.body;
  const product = mockState.products.find((item) => item.id === id);

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

  mockState.notifications.unshift(notification);
  io.emit('notification:new', { notification });

  return res.json(product);
});

app.get('/api/groups', authMiddleware, (_req, res) => {
  res.json(mockState.groups);
});

app.get('/api/groups/:groupId/messages', authMiddleware, (req, res) => {
  const { groupId } = req.params;
  const messages = mockState.messages
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

  mockState.messages.push(message);
  io.to(groupId).emit('chat:new-message', { ...message, sender: resolveAuthor(req.user.id) });
  res.status(201).json(message);
});

app.get('/api/notifications', authMiddleware, (_req, res) => {
  res.json(mockState.notifications);
});

app.get('/api/admin/overview', authMiddleware, (_req, res) => {
  const currentUser = findUserById(req.user.id);
  if (!currentUser || !['admin', 'moderator'].includes(currentUser.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  return res.json({
    overview: {
      activeUsers: mockState.users.length,
      issues: mockState.notifications.length,
      transactions: mockState.products.length,
      engagement: 87,
      insights: ['More buyers joining from search referrals', 'Pricing debates are increasing in B2B groups', 'Video content sees the largest retention']
    },
    users: mockState.users,
    alerts: mockState.notifications,
    activity: mockState.activity
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

    mockState.messages.push(message);
    io.to(groupId).emit('chat:new-message', { ...message, sender: resolveAuthor(senderId) });
  });
});

server.listen(PORT, () => {
  console.log(`Business Social Hub running on http://localhost:${PORT}`);
});
