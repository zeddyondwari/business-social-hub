import { v4 as uuidv4 } from 'uuid';

export const mockState = {
  users: [
    {
      id: 'u1',
      name: 'Aisha Bello',
      role: 'admin',
      email: 'admin@hub.local',
      password: 'admin123',
      followerCount: 1280,
      followingCount: 420,
      friends: ['u2', 'u3'],
      bio: 'Scaling commerce communities with data-first operations.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'u2',
      name: 'Marcus Lee',
      role: 'moderator',
      email: 'mod@hub.local',
      password: 'mod123',
      followerCount: 540,
      followingCount: 210,
      friends: ['u1', 'u4'],
      bio: 'Community growth, moderation, and trust systems.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'u3',
      name: 'Nia Sol',
      role: 'member',
      email: 'nia@hub.local',
      password: 'nia123',
      followerCount: 260,
      followingCount: 150,
      friends: ['u1', 'u5'],
      bio: 'Trader and retail seller focused on supply chain trust.',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'u4',
      name: 'Kofi Mensah',
      role: 'member',
      email: 'kofi@hub.local',
      password: 'kofi123',
      followerCount: 900,
      followingCount: 180,
      friends: ['u2', 'u5'],
      bio: 'Connecting buyers with vetted product sources.',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'u5',
      name: 'Sofia Hart',
      role: 'member',
      email: 'sofia@hub.local',
      password: 'sofia123',
      followerCount: 730,
      followingCount: 260,
      friends: ['u3', 'u4'],
      bio: 'Digital supplier and buyer engagement specialist.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
    }
  ],
  posts: [
    {
      id: 'p1',
      userId: 'u3',
      content: 'Launching a new crop harvest deal with flexible payment terms. Interested buyers can message me directly.',
      likes: 89,
      comments: 12,
      createdAt: new Date().toISOString(),
      image: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'p2',
      userId: 'u4',
      content: 'B2B procurement update: verified vendor supply is rising. I am comparing cost, shipping, and settlement speed.',
      likes: 154,
      comments: 34,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      image: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'p3',
      userId: 'u5',
      content: 'Private group discussion on market pricing for local manufacturing supply. Let us align on fair pricing before negotiation.',
      likes: 63,
      comments: 20,
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'
    }
  ],
  products: [
    {
      id: 'prod1',
      name: 'Premium Smart Sensor Kit',
      sellerId: 'u3',
      price: 2500,
      status: 'open',
      listingType: 'product',
      description: 'A sensor bundle for office and production efficiency monitoring.',
      tags: ['iot', 'b2b', 'hardware'],
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'prod2',
      name: 'Wholesale Packaging Set',
      sellerId: 'u4',
      price: 1800,
      status: 'negotiation',
      listingType: 'product',
      description: 'Bulk packaging materials for export-ready sellers.',
      tags: ['logistics', 'wholesale'],
      image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'prod3',
      name: 'Video Studio Starter Pack',
      sellerId: 'u5',
      price: 3200,
      status: 'closed',
      listingType: 'product',
      description: 'Production kit for creators and business product demos.',
      tags: ['content', 'video'],
      image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80'
    }
  ],
  groups: [
    {
      id: 'g1',
      name: 'Export Negotiators',
      isPrivate: false,
      members: ['u1', 'u2', 'u3', 'u5'],
      description: 'Open discussion room for price strategy and trade flow.'
    },
    {
      id: 'g2',
      name: 'Vendor Quality Circle',
      isPrivate: true,
      members: ['u1', 'u4'],
      description: 'Private room for vendor quality checks and exception handling.'
    }
  ],
  messages: [
    {
      id: 'm1',
      groupId: 'g1',
      senderId: 'u3',
      text: 'We can negotiate a 7% rate adjustment if delivery is stabilized.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'm2',
      groupId: 'g1',
      senderId: 'u1',
      text: 'I agree. Let us capture the final quote in the shared board before launch.',
      createdAt: new Date(Date.now() - 60000).toISOString()
    }
  ],
  notifications: [
    { id: 'n1', type: 'challenge', message: 'A pricing challenge was raised on Product #prod2.', read: false },
    { id: 'n2', type: 'alert', message: 'Moderator review is required for one new report.', read: false },
    { id: 'n3', type: 'system', message: '5 new users joined this week.', read: true }
  ],
  activity: [
    { id: 'a1', label: 'New joins', value: 412 },
    { id: 'a2', label: 'Live negotiations', value: 28 },
    { id: 'a3', label: 'Flagged issues', value: 6 },
    { id: 'a4', label: 'Video views', value: 18420 }
  ]
};

export const createId = (prefix = 'item') => `${prefix}_${uuidv4()}`;

export const findUserByEmail = (email) => mockState.users.find((user) => user.email === email);

export const findUserById = (id) => mockState.users.find((user) => user.id === id);

export const resolveAuthor = (userId) => {
  const user = findUserById(userId);
  return user ? { id: user.id, name: user.name, avatar: user.avatar, role: user.role } : null;
};
