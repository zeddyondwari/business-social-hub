import { useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';

const API = 'http://localhost:4000';
const socket = io(API);

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value || 0);

const defaultUser = {
  id: 'u1',
  name: 'Aisha Bello',
  role: 'admin',
  email: 'admin@hub.local',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'
};

function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(defaultUser);
  const [loginForm, setLoginForm] = useState({ email: 'admin@hub.local', password: 'admin123' });
  const [feed, setFeed] = useState([]);
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [dashboard, setDashboard] = useState({ activity: [], metrics: [] });
  const [notifications, setNotifications] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('g1');
  const [messages, setMessages] = useState([]);
  const [draftMessage, setDraftMessage] = useState('');
  const [newPost, setNewPost] = useState('');

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }),
    [token]
  );

  const loadAll = async () => {
    if (!token) return;

    const [feedRes, productsRes, groupsRes, dashboardRes, notificationsRes] = await Promise.all([
      fetch(`${API}/api/feed`, { headers: authHeaders }),
      fetch(`${API}/api/products`, { headers: authHeaders }),
      fetch(`${API}/api/groups`, { headers: authHeaders }),
      fetch(`${API}/api/dashboard`, { headers: authHeaders }),
      fetch(`${API}/api/notifications`, { headers: authHeaders })
    ]);

    const feedData = await feedRes.json();
    const productData = await productsRes.json();
    const groupsData = await groupsRes.json();
    const dashboardData = await dashboardRes.json();
    const notificationsData = await notificationsRes.json();

    setFeed(feedData || []);
    setProducts(productData || []);
    setGroups(groupsData || []);
    setDashboard(dashboardData || { activity: [], metrics: [] });
    setNotifications(notificationsData || []);

    if (groupsData[0]) {
      setSelectedGroup(groupsData[0].id);
    }
  };

  const loadChat = async (groupId) => {
    if (!token || !groupId) return;
    const res = await fetch(`${API}/api/groups/${groupId}/messages`, { headers: authHeaders });
    const data = await res.json();
    setMessages(data || []);
  };

  useEffect(() => {
    loadAll();
  }, [token]);

  useEffect(() => {
    loadChat(selectedGroup);
    if (selectedGroup) {
      socket.emit('join-group', selectedGroup);
    }
  }, [selectedGroup, token]);

  useEffect(() => {
    socket.on('chat:new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('feed:update', ({ post }) => {
      setFeed((prev) => [post, ...prev]);
    });

    socket.on('products:update', ({ product }) => {
      setProducts((prev) => [product, ...prev]);
    });

    socket.on('notification:new', ({ notification }) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.off('chat:new-message');
      socket.off('feed:update');
      socket.off('products:update');
      socket.off('notification:new');
    };
  }, []);

  const signIn = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    });

    const result = await response.json();
    if (!response.ok) {
      alert(result.message || 'Login failed');
      return;
    }

    setUser(result.user);
    setToken(result.token);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;

    await fetch(`${API}/api/feed`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ content: newPost, image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80' })
    });
    setNewPost('');
    loadAll();
  };

  const handleSendMessage = async () => {
    if (!draftMessage.trim()) return;

    await fetch(`${API}/api/groups/${selectedGroup}/messages`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text: draftMessage })
    });
    setDraftMessage('');
    loadChat(selectedGroup);
  };

  const handleNegotiate = async (productId, price) => {
    await fetch(`${API}/api/products/${productId}/negotiate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ price })
    });
    loadAll();
  };

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="badge">Business Social Hub</div>
          <h1>Business network and marketplace</h1>
          <p>Connect, negotiate, trade, and manage communities in real time.</p>

          <form onSubmit={signIn} className="auth-form">
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </label>
            <button type="submit">Login</button>
          </form>

          <div className="demo-accounts">
            <span>Demo accounts:</span>
            <small>admin@hub.local / admin123</small>
            <small>mod@hub.local / mod123</small>
            <small>nia@hub.local / nia123</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">PulseMarket</div>
          <small>Social commerce operating layer</small>
        </div>

        <nav>
          <span>Feed</span>
          <span>Marketplace</span>
          <span>Groups</span>
          <span>Admin</span>
        </nav>

        <div className="user-strip">
          <img src={user.avatar} alt={user.name} />
          <div>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
        </div>
      </header>

      <main className="content-grid">
        <section className="main-panel">
          <div className="panel post-box">
            <h3>Share a business update</h3>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Post product progress, pricing insight, or a sourcing update..."
            />
            <div className="actions-row">
              <button className="secondary">Attach media</button>
              <button onClick={handleCreatePost}>Publish</button>
            </div>
          </div>

          <div className="feed-list">
            {feed.map((post) => (
              <article key={post.id} className="panel feed-item">
                <div className="feed-head">
                  <img src={post.author?.avatar || user.avatar} alt={post.author?.name || user.name} />
                  <div>
                    <strong>{post.author?.name || 'Unknown user'}</strong>
                    <small>{new Date(post.createdAt).toLocaleString()}</small>
                  </div>
                </div>
                <p>{post.content}</p>
                {post.image && <img className="feed-image" src={post.image} alt="post media" />}
                <div className="meta-row">
                  <span>♡ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                  <span>↗ share</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="side-panel">
          <div className="panel stat-panel">
            <h3>Metrics</h3>
            {dashboard.metrics.map((item) => (
              <div key={item.label} className="metric-row">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className="panel notifications">
            <h3>Notifications</h3>
            {notifications.map((item) => (
              <div key={item.id} className={`notice ${item.read ? 'read' : ''}`}>
                {item.message}
              </div>
            ))}
          </div>
        </aside>
      </main>

      <section className="lower-grid">
        <div className="panel marketplace">
          <div className="section-head">
            <h3>Marketplace</h3>
            <button className="secondary">Add product</button>
          </div>

          <div className="product-list">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <img src={product.image} alt={product.name} />
                <div>
                  <h4>{product.name}</h4>
                  <p>{product.description}</p>
                  <div className="price-row">
                    <strong>{formatCurrency(product.price)}</strong>
                    <span>{product.status}</span>
                  </div>
                  <button onClick={() => handleNegotiate(product.id, Number(product.price) - 150)}>
                    Counter offer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel chat-panel">
          <div className="section-head">
            <h3>Groups</h3>
          </div>

          <div className="group-tabs">
            {groups.map((group) => (
              <button
                key={group.id}
                className={selectedGroup === group.id ? 'active' : ''}
                onClick={() => setSelectedGroup(group.id)}
              >
                {group.name}
              </button>
            ))}
          </div>

          <div className="chat-window">
            {messages.map((message) => (
              <div key={message.id} className="chat-bubble">
                <strong>{message.sender?.name || 'User'}</strong>
                <p>{message.text}</p>
              </div>
            ))}
          </div>

          <div className="compose-row">
            <input
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              placeholder="Write a message..."
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      </section>

      <section className="admin-grid">
        <div className="panel matrix-panel">
          <h3>Admin overview</h3>
          <div className="matrix-grid">
            {dashboard.activity.map((item) => (
              <div key={item.id} className="matrix-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel moderator-panel">
          <h3>Moderation</h3>
          <ul>
            <li>Escalated disputes: 7</li>
            <li>Pending content reviews: 4</li>
            <li>Group reports: 2</li>
            <li>Meeting host queue: 1</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default App;
