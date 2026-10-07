import { useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const APP_NAME = 'Zeddy Etono';
const socket = io(API);

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value || 0);

const defaultUser = {
  id: 'u1',
  name: APP_NAME,
  role: 'admin',
  email: 'admin@zeddy-etono.local',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'
};

function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(defaultUser);
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: 'admin@zeddy-etono.local', password: 'admin123' });
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    accountType: 'ordinary',
    isPrivate: false,
    avatar: ''
  });
  const [settingsForm, setSettingsForm] = useState({
    avatar: '',
    accountType: 'ordinary',
    isPrivate: false,
    notifications: true,
    backupMode: 'manual'
  });
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [feed, setFeed] = useState([]);
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [dashboard, setDashboard] = useState({ activity: [], metrics: [] });
  const [notifications, setNotifications] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('g1');
  const [messages, setMessages] = useState([]);
  const [draftMessage, setDraftMessage] = useState('');
  const [draftImage, setDraftImage] = useState('');
  const [newPost, setNewPost] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image: ''
  });

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }),
    [token]
  );

  const loadAll = async () => {
    if (!token) return;

    const [feedRes, productsRes, groupsRes, dashboardRes, notificationsRes, profileRes, usersRes, settingsRes] = await Promise.all([
      fetch(`${API}/api/feed`, { headers: authHeaders }),
      fetch(`${API}/api/products`, { headers: authHeaders }),
      fetch(`${API}/api/groups`, { headers: authHeaders }),
      fetch(`${API}/api/dashboard`, { headers: authHeaders }),
      fetch(`${API}/api/notifications`, { headers: authHeaders }),
      fetch(`${API}/api/profile`, { headers: authHeaders }),
      fetch(`${API}/api/users`, { headers: authHeaders }),
      fetch(`${API}/api/settings`, { headers: authHeaders })
    ]);

    const feedData = await feedRes.json();
    const productData = await productsRes.json();
    const groupsData = await groupsRes.json();
    const dashboardData = await dashboardRes.json();
    const notificationsData = await notificationsRes.json();
    const profileData = await profileRes.json();
    const usersData = await usersRes.json();
    const settingsData = await settingsRes.json();

    setFeed(feedData || []);
    setProducts(productData || []);
    setGroups(groupsData || []);
    setDashboard(dashboardData || { activity: [], metrics: [] });
    setNotifications(notificationsData || []);
    setProfile(profileData || null);
    setUsers(usersData || []);
    setSettingsForm(settingsData || { avatar: '', accountType: 'ordinary', isPrivate: false, notifications: true, backupMode: 'manual' });

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

  const createAccount = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupForm)
    });

    const result = await response.json();
    if (!response.ok) {
      alert(result.message || 'Signup failed');
      return;
    }

    setUser(result.user);
    setToken(result.token);
    setMode('login');
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

  const handleCreateProduct = async () => {
    if (!productForm.name.trim() || !productForm.description.trim() || !productForm.price) return;

    await fetch(`${API}/api/products`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(productForm)
    });

    setProductForm({ name: '', description: '', price: '', image: '' });
    loadAll();
  };

  const handleSendMessage = async () => {
    if (!draftMessage.trim() && !draftImage.trim()) return;

    await fetch(`${API}/api/groups/${selectedGroup}/messages`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text: draftMessage, image: draftImage || null })
    });
    setDraftMessage('');
    setDraftImage('');
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

  const handleSaveSettings = async () => {
    const response = await fetch(`${API}/api/settings`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(settingsForm)
    });

    const result = await response.json();
    if (!response.ok) {
      alert(result.message || 'Settings update failed');
      return;
    }

    setUser((prev) => ({ ...prev, avatar: result.user.avatar, name: prev.name }));
    setProfile((prev) => ({ ...prev, ...result.user }));
    alert('Settings saved.');
  };

  const handleBackup = async () => {
    const response = await fetch(`${API}/api/backup`, {
      method: 'POST',
      headers: authHeaders
    });
    const result = await response.json();
    if (!response.ok) {
      alert(result.message || 'Backup failed');
      return;
    }
    alert(`Backup saved: ${result.timestamp}`);
  };

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="badge">{APP_NAME}</div>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p>Connect, negotiate, trade, and manage communities in real time.</p>

          {mode === 'login' ? (
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
          ) : (
            <form onSubmit={createAccount} className="auth-form">
              <label>
                Full name
                <input
                  type="text"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                />
              </label>
              <label>
                Profile photo URL
                <input
                  type="url"
                  value={signupForm.avatar}
                  onChange={(e) => setSignupForm({ ...signupForm, avatar: e.target.value })}
                  placeholder="https://..."
                />
              </label>
              <label>
                Account type
                <select
                  value={signupForm.accountType}
                  onChange={(e) => setSignupForm({ ...signupForm, accountType: e.target.value })}
                >
                  <option value="ordinary">Ordinary</option>
                  <option value="customer">Customer</option>
                  <option value="business">Business</option>
                </select>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={signupForm.isPrivate}
                  onChange={(e) => setSignupForm({ ...signupForm, isPrivate: e.target.checked })}
                />
                Keep account private
              </label>
              <button type="submit">Create account</button>
            </form>
          )}

          <div className="auth-toggle">
            <button className="secondary" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Create account' : 'Back to login'}
            </button>
          </div>

          <div className="demo-accounts">
            <span>Demo accounts:</span>
            <small>admin@zeddy-etono.local / admin123</small>
            <small>mod@zeddy-etono.local / mod123</small>
            <small>nia@zeddy-etono.local / nia123</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">{APP_NAME}</div>
          <small>Business social commerce network</small>
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
          <div className="panel profile-card">
            <div className="profile-head">
              <img src={profile?.avatar || user.avatar} alt={user.name} />
              <div>
                <h3>{user.name}</h3>
                <p>{profile?.bio || 'Business-first network member'}</p>
                <span className="account-pill">{profile?.accountType || 'ordinary'}</span>
              </div>
            </div>
            <div className="profile-stats">
              <div>
                <strong>{profile?.followerCount ?? 0}</strong>
                <span>Followers</span>
              </div>
              <div>
                <strong>{profile?.followingCount ?? 0}</strong>
                <span>Following</span>
              </div>
              <div>
                <strong>{profile?.connectedCount ?? 0}</strong>
                <span>Friends</span>
              </div>
            </div>
          </div>

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

          <div className="panel people-panel">
            <h3>People network</h3>
            <div className="people-list">
              {users.slice(0, 4).map((person) => (
                <div key={person.id} className="person-row">
                  <img src={person.avatar} alt={person.name} />
                  <div>
                    <strong>{person.name}</strong>
                    <small>{person.accountType || 'ordinary'}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel settings-panel">
            <h3>Account settings</h3>
            <div className="settings-grid">
              <label>
                Profile photo URL
                <input
                  value={settingsForm.avatar}
                  onChange={(e) => setSettingsForm({ ...settingsForm, avatar: e.target.value })}
                  placeholder="https://..."
                />
              </label>
              <label>
                Account type
                <select
                  value={settingsForm.accountType}
                  onChange={(e) => setSettingsForm({ ...settingsForm, accountType: e.target.value })}
                >
                  <option value="ordinary">Ordinary</option>
                  <option value="customer">Customer</option>
                  <option value="business">Business</option>
                </select>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={settingsForm.isPrivate}
                  onChange={(e) => setSettingsForm({ ...settingsForm, isPrivate: e.target.checked })}
                />
                Private profile
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={settingsForm.notifications}
                  onChange={(e) => setSettingsForm({ ...settingsForm, notifications: e.target.checked })}
                />
                Notifications on
              </label>
              <label>
                Backup mode
                <select
                  value={settingsForm.backupMode}
                  onChange={(e) => setSettingsForm({ ...settingsForm, backupMode: e.target.value })}
                >
                  <option value="manual">Manual</option>
                  <option value="auto">Auto</option>
                </select>
              </label>
              <button onClick={handleSaveSettings}>Save settings</button>
              <button className="secondary" onClick={handleBackup}>Backup now</button>
            </div>
          </div>
        </aside>
      </main>

      <section className="lower-grid">
        <div className="panel marketplace">
          <div className="section-head">
            <h3>Marketplace</h3>
            <button className="secondary">Add product</button>
          </div>

          <div className="product-form">
            <input
              placeholder="Product name"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            />
            <textarea
              placeholder="Describe the product"
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            />
            <div className="field-row">
              <input
                placeholder="Price"
                type="number"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              />
              <input
                placeholder="Image URL (optional)"
                value={productForm.image}
                onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
              />
            </div>
            <button onClick={handleCreateProduct}>List product</button>
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
                    <span className={`status-pill ${product.status}`}>{product.status}</span>
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
                {message.image && <img src={message.image} alt="chat media" className="chat-image" />}
              </div>
            ))}
          </div>

          <div className="compose-row">
            <input
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              placeholder="Write a message..."
            />
            <input
              value={draftImage}
              onChange={(e) => setDraftImage(e.target.value)}
              placeholder="Image URL (optional)"
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
