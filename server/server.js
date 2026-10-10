import { useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const APP_NAME = 'Zeddy Pal Singh';
const socket = io(API);

const demoUsers = [
  { id: 'u1', name: 'Zeddy Pal Singh', role: 'admin', email: 'admin@zeddy-pal-singh.local', password: 'admin123', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', accountType: 'business', isPrivate: false },
  { id: 'u2', name: 'Maya Ford', role: 'moderator', email: 'mod@zeddy-pal-singh.local', password: 'mod123', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', accountType: 'customer', isPrivate: true },
  { id: 'u3', name: 'Nia Sol', role: 'member', email: 'nia@zeddy-pal-singh.local', password: 'nia123', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80', accountType: 'ordinary', isPrivate: false }
];

const demoFeed = [
  { id: 'p1', content: 'Launching a new premium import bundle for verified buyers. Message me for fast negotiation.', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80', likes: 120, comments: 18, createdAt: new Date().toISOString(), author: demoUsers[0] },
  { id: 'p2', content: 'Private business buyer network is active today. Let\'s align on pricing before committing.', image: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80', likes: 84, comments: 12, createdAt: new Date(Date.now() - 3600000).toISOString(), author: demoUsers[2] }
];

const demoProducts = [
  { id: 'prod1', name: 'Smart Sensor Kit', description: 'Business-ready sensor setup for offices and production floors.', price: 2500, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80', status: 'open', seller: demoUsers[0] },
  { id: 'prod2', name: 'Wholesale Packaging Set', description: 'Bulk packaging bundle for export-ready sellers.', price: 1800, image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1000&q=80', status: 'negotiation', seller: demoUsers[2] }
];

const demoGroups = [
  { id: 'g1', name: 'Export Negotiators', description: 'Open trade strategy room', isPrivate: false },
  { id: 'g2', name: 'Vendor Quality Circle', description: 'Private quality assurance room', isPrivate: true }
];

const demoMessages = [
  { id: 'm1', groupId: 'g1', text: 'We can negotiate a 7% rate adjustment if delivery is stabilized.', sender: demoUsers[2], createdAt: new Date().toISOString() },
  { id: 'm2', groupId: 'g1', text: 'I agree. Let us capture the final quote before launch.', sender: demoUsers[0], createdAt: new Date(Date.now() - 60000).toISOString() }
];

const demoNotifications = [
  { id: 'n1', message: 'A pricing challenge was raised for Smart Sensor Kit.', read: false },
  { id: 'n2', message: 'Moderator review requested for one new report.', read: false },
  { id: 'n3', message: '5 new users joined this week.', read: true }
];

const demoDashboard = {
  metrics: [
    { label: 'New joins', value: '+18.2%' },
    { label: 'Engagement', value: '76%' },
    { label: 'Open deals', value: '14' },
    { label: 'Live traffic', value: '9.4k' }
  ],
  activity: [
    { id: 'a1', label: 'New joins', value: 412 },
    { id: 'a2', label: 'Live negotiations', value: 28 },
    { id: 'a3', label: 'Flagged issues', value: 6 },
    { id: 'a4', label: 'Video views', value: 18420 }
  ]
};

const demoSettings = {
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  accountType: 'business',
  isPrivate: false,
  notifications: true,
  backupMode: 'manual'
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value || 0);

function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(demoUsers[0]);
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: 'admin@zeddy-pal-singh.local', password: 'admin123' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', accountType: 'ordinary', isPrivate: false, avatar: '' });
  const [settingsForm, setSettingsForm] = useState(demoSettings);
  const [profile, setProfile] = useState({ ...demoUsers[0], bio: 'Business-first network member', followerCount: 1280, followingCount: 420, connectedCount: 6 });
  const [feed, setFeed] = useState(demoFeed);
  const [products, setProducts] = useState(demoProducts);
  const [groups, setGroups] = useState(demoGroups);
  const [dashboard, setDashboard] = useState(demoDashboard);
  const [notifications, setNotifications] = useState(demoNotifications);
  const [selectedGroup, setSelectedGroup] = useState('g1');
  const [messages, setMessages] = useState(demoMessages);
  const [newPost, setNewPost] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [draftImage, setDraftImage] = useState('');
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', image: '' });

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }), [token]);

  const loadAll = async () => {
    if (!token) return;

    try {
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

      if (Array.isArray(feedData)) setFeed(feedData);
      if (Array.isArray(productData)) setProducts(productData);
      if (Array.isArray(groupsData)) setGroups(groupsData);
      if (dashboardData) setDashboard(dashboardData);
      if (Array.isArray(notificationsData)) setNotifications(notificationsData);
      if (profileData) setProfile(profileData);
      if (Array.isArray(usersData)) setUser(usersData.find((item) => item.email === user.email) || user);
      if (settingsData) setSettingsForm(settingsData);
    } catch (error) {
      setFeed(demoFeed);
      setProducts(demoProducts);
      setGroups(demoGroups);
      setDashboard(demoDashboard);
      setNotifications(demoNotifications);
      setProfile({ ...demoUsers[0], bio: 'Business-first network member', followerCount: 1280, followingCount: 420, connectedCount: 6 });
      setSettingsForm(demoSettings);
    }
  };

  const loadChat = async (groupId) => {
    if (!token || !groupId) return;
    try {
      const res = await fetch(`${API}/api/groups/${groupId}/messages`, { headers: authHeaders });
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (error) {
      setMessages(demoMessages);
    }
  };

  useEffect(() => {
    if (token) {
      loadAll();
    }
  }, [token]);

  useEffect(() => {
    if (selectedGroup) loadChat(selectedGroup);
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

    const known = demoUsers.find((u) => u.email === loginForm.email && u.password === loginForm.password);
    if (known) {
      setUser(known);
      setToken('demo-token');
      setProfile({ ...known, bio: 'Business-first network member', followerCount: 1280, followingCount: 420, connectedCount: 6 });
      setSettingsForm(demoSettings);
      return;
    }

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Login failed');
      setUser(result.user);
      setToken(result.token);
      setProfile(result.user);
    } catch (error) {
      alert(error.message || 'Login failed');
    }
  };

  const createAccount = async (event) => {
    event.preventDefault();

    const nextUser = {
      id: `u_${Date.now()}`,
      name: signupForm.name,
      role: 'member',
      email: signupForm.email,
      password: signupForm.password,
      avatar: signupForm.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      accountType: signupForm.accountType,
      isPrivate: signupForm.isPrivate
    };

    try {
      const response = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...signupForm, name: signupForm.name, email: signupForm.email, password: signupForm.password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Signup failed');
      setUser(result.user);
      setToken(result.token);
      setMode('login');
    } catch (error) {
      demoUsers.push(nextUser);
      setUser(nextUser);
      setToken('demo-token');
      setMode('login');
      alert('Demo signup complete.');
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    const post = { id: `post_${Date.now()}`, content: newPost, image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80', likes: 0, comments: 0, createdAt: new Date().toISOString(), author: user };
    try {
      const response = await fetch(`${API}/api/feed`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content: newPost, image: post.image })
      });
      if (response.ok) {
        setFeed((prev) => [post, ...prev]);
      }
    } catch (error) {
      setFeed((prev) => [post, ...prev]);
    }
    setNewPost('');
  };

  const handleCreateProduct = async () => {
    if (!productForm.name.trim() || !productForm.description.trim() || !productForm.price) return;
    const product = { id: `prod_${Date.now()}`, name: productForm.name, description: productForm.description, price: Number(productForm.price), image: productForm.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80', status: 'open', seller: user };
    try {
      const response = await fetch(`${API}/api/products`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(product)
      });
      if (response.ok) {
        setProducts((prev) => [product, ...prev]);
      }
    } catch (error) {
      setProducts((prev) => [product, ...prev]);
    }
    setProductForm({ name: '', description: '', price: '', image: '' });
  };

  const handleSendMessage = async () => {
    if (!draftMessage.trim() && !draftImage.trim()) return;
    const message = { id: `msg_${Date.now()}`, groupId: selectedGroup, text: draftMessage, image: draftImage || null, sender: user, createdAt: new Date().toISOString() };
    try {
      const response = await fetch(`${API}/api/groups/${selectedGroup}/messages`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ text: draftMessage, image: draftImage || null })
      });
      if (response.ok) {
        setMessages((prev) => [...prev, message]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, message]);
    }
    setDraftMessage('');
    setDraftImage('');
  };

  const handleNegotiate = async (productId, price) => {
    try {
      await fetch(`${API}/api/products/${productId}/negotiate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ price })
      });
    } catch (error) {
      // ignored for demo mode
    }
    setProducts((prev) => prev.map((item) => item.id === productId ? { ...item, price, status: 'negotiation' } : item));
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch(`${API}/api/settings`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(settingsForm)
      });
      if (response.ok) {
        const result = await response.json();
        setUser((prev) => ({ ...prev, ...result.user }));
      }
    } catch (error) {
      // ignored for demo mode
    }
    alert('Settings saved.');
  };

  const handleBackup = async () => {
    try {
      await fetch(`${API}/api/backup`, {
        method: 'POST',
        headers: authHeaders
      });
    } catch (error) {
      // ignored for demo mode
    }
    alert('Backup complete.');
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
                <input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
              </label>
              <label>
                Password
                <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
              </label>
              <button type="submit">Login</button>
            </form>
          ) : (
            <form onSubmit={createAccount} className="auth-form">
              <label>
                Full name
                <input type="text" value={signupForm.name} onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} />
              </label>
              <label>
                Email
                <input type="email" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
              </label>
              <label>
                Password
                <input type="password" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
              </label>
              <label>
                Account type
                <select value={signupForm.accountType} onChange={(e) => setSignupForm({ ...signupForm, accountType: e.target.value })}>
                  <option value="ordinary">Ordinary</option>
                  <option value="customer">Customer</option>
                  <option value="business">Business</option>
                </select>
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={signupForm.isPrivate} onChange={(e) => setSignupForm({ ...signupForm, isPrivate: e.target.checked })} />
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
            <small>admin@zeddy-pal-singh.local / admin123</small>
            <small>mod@zeddy-pal-singh.local / mod123</small>
            <small>nia@zeddy-pal-singh.local / nia123</small>
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
                <span className="account-pill">{profile?.accountType || 'business'}</span>
              </div>
            </div>
            <div className="profile-stats">
              <div><strong>{profile?.followerCount ?? 0}</strong><span>Followers</span></div>
              <div><strong>{profile?.followingCount ?? 0}</strong><span>Following</span></div>
              <div><strong>{profile?.connectedCount ?? 0}</strong><span>Friends</span></div>
            </div>
          </div>

          <div className="panel post-box">
            <h3>Share a business update</h3>
            <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Post product progress, pricing insight, or sourcing update..." />
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
              {demoUsers.slice(0, 4).map((person) => (
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
                <input value={settingsForm.avatar} onChange={(e) => setSettingsForm({ ...settingsForm, avatar: e.target.value })} placeholder="https://..." />
              </label>
              <label>
                Account type
                <select value={settingsForm.accountType} onChange={(e) => setSettingsForm({ ...settingsForm, accountType: e.target.value })}>
                  <option value="ordinary">Ordinary</option>
                  <option value="customer">Customer</option>
                  <option value="business">Business</option>
                </select>
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={settingsForm.isPrivate} onChange={(e) => setSettingsForm({ ...settingsForm, isPrivate: e.target.checked })} />
                Private profile
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={settingsForm.notifications} onChange={(e) => setSettingsForm({ ...settingsForm, notifications: e.target.checked })} />
                Notifications on
              </label>
              <label>
                Backup mode
                <select value={settingsForm.backupMode} onChange={(e) => setSettingsForm({ ...settingsForm, backupMode: e.target.value })}>
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
            <input placeholder="Product name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
            <textarea placeholder="Describe the product" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
            <div className="field-row">
              <input placeholder="Price" type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
              <input placeholder="Image URL" value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} />
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
                  <button onClick={() => handleNegotiate(product.id, Number(product.price) - 150)}>Counter offer</button>
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
              <button key={group.id} className={selectedGroup === group.id ? 'active' : ''} onClick={() => setSelectedGroup(group.id)}>
                {group.name}
              </button>
            ))}
          </div>

          <div className="chat-window">
            {messages.filter((message) => message.groupId === selectedGroup).map((message) => (
              <div key={message.id} className="chat-bubble">
                <strong>{message.sender?.name || 'User'}</strong>
                <p>{message.text}</p>
                {message.image && <img src={message.image} alt="chat media" className="chat-image" />}
              </div>
            ))}
          </div>

          <div className="compose-row">
            <input value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} placeholder="Write a message..." />
            <input value={draftImage} onChange={(e) => setDraftImage(e.target.value)} placeholder="Image URL (optional)" />
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
