import { createClient } from '@supabase/supabase-js';

// Read configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid and not placeholders
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

// Default mock data seed definitions
const DEFAULT_PROFILES = [
  {
    id: 'mock-teacher-id-1',
    email: 'teacher@mindmerge.ai',
    name: 'Dr. Anjali Sharma',
    avatar: '/avatars/anjali.svg',
    role: 'teacher',
    coins: 120,
    upload_count: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-student-id-1',
    email: 'student@mindmerge.ai',
    name: 'Rahul Kumar',
    avatar: '/avatars/rahul.svg',
    role: 'student',
    coins: 40,
    upload_count: 1,
    created_at: new Date().toISOString(),
  }
];

const DEFAULT_SUBJECTS = [
  { id: 'cs-ai', name: 'Artificial Intelligence', icon: '🤖' },
  { id: 'cs-ml', name: 'Machine Learning', icon: '🧠' },
  { id: 'cs-ds', name: 'Data Structures', icon: '🌲' },
  { id: 'math-la', name: 'Linear Algebra', icon: '📐' },
  { id: 'phy-qm', name: 'Quantum Mechanics', icon: '⚛️' },
];

const DEFAULT_NOTES = [
  {
    id: 'n1',
    title: 'Introduction to Neural Networks',
    content: `Core Concepts\n• ANNs are computing systems inspired by biological neural networks.\n• Each artificial neuron receives inputs, applies learned weights, adds a bias term, and passes through an activation function.\n• ANNs excel at pattern recognition — image classification, NLP, forecasting, and recommendation systems.\n\nPerceptron Structure\n• A perceptron is the simplest decision-making unit in a neural network.\n• It combines weighted inputs into a single value and determines activation.\n• Stacking perceptrons across hidden layers enables complex decision boundaries.\n\nActivation Functions\n• Sigmoid: maps input to (0, 1). Useful for probability outputs.\n• ReLU: f(x) = max(0, x). Most popular for hidden layers.\n• Tanh: maps input to (-1, 1). Zero-centred alternative to Sigmoid.`,
    subject_id: 'cs-ai',
    author_name: 'Dr. Anjali Sharma',
    author_role: 'teacher',
    author_avatar: '/avatars/anjali.svg',
    type: 'raw',
    ai_rating: 4.5,
    student_ratings: [5, 4, 4, 5, 5],
    keywords: ['neural networks', 'perceptron', 'activation function', 'ANN', 'deep learning'],
    created_at: '2026-03-28T10:00:00Z',
  },
  {
    id: 'n2',
    title: 'Backpropagation & Gradient Descent',
    content: `Backpropagation\n• Algorithm for computing gradients of the loss function w.r.t. weights.\n• Uses the chain rule of calculus to propagate error backward.\n\nGradient Descent\n• Optimisation algorithm that iteratively adjusts weights to minimise loss.\n• Learning rate (α) controls step size.\n• Variants: SGD, Mini-Batch, Adam optimiser.`,
    subject_id: 'cs-ai',
    author_name: 'Prof. Raghav Mehta',
    author_role: 'teacher',
    author_avatar: '/avatars/raghav.svg',
    type: 'raw',
    ai_rating: 4.0,
    student_ratings: [4, 3, 5, 4],
    keywords: ['backpropagation', 'gradient descent', 'chain rule', 'optimisation', 'learning rate', 'adam'],
    created_at: '2026-03-29T14:30:00Z',
  },
  {
    id: 'n3',
    title: 'Supervised Learning Overview',
    content: `What is Supervised Learning?\n• A type of ML where the model is trained on labelled data.\n• The algorithm learns a mapping from inputs to outputs.\n\nKey Algorithms\n• Linear Regression, Logistic Regression, Decision Trees, SVMs, k-NN.\n\nEvaluation Metrics\n• Accuracy, Precision, Recall, F1 Score, ROC-AUC.`,
    subject_id: 'cs-ml',
    author_name: 'Dr. Anjali Sharma',
    author_role: 'teacher',
    author_avatar: '/avatars/anjali.svg',
    type: 'raw',
    ai_rating: 3.8,
    student_ratings: [4, 4, 3],
    keywords: ['supervised learning', 'regression', 'classification', 'accuracy', 'precision', 'recall'],
    created_at: '2026-03-30T09:00:00Z',
  },
  {
    id: 'n4',
    title: 'Binary Trees & Traversals',
    content: `Binary Trees\n• A tree data structure where each node has at most two children.\n\nTraversal Methods\n• In-order (Left, Root, Right)\n• Pre-order (Root, Left, Right)\n• Post-order (Left, Right, Root)\n• Level-order (BFS using a queue)\n\nApplications\n• Expression evaluation, Huffman encoding, BSTs for searching.`,
    subject_id: 'cs-ds',
    author_name: 'Rahul Kumar',
    author_role: 'student',
    author_avatar: '/avatars/rahul.svg',
    type: 'raw',
    ai_rating: 3.5,
    student_ratings: [4, 5, 3, 4],
    keywords: ['binary tree', 'traversal', 'in-order', 'pre-order', 'post-order', 'BST'],
    created_at: '2026-03-31T11:00:00Z',
  },
  {
    id: 'n5',
    title: 'Master Note — Artificial Intelligence',
    content: `🏆 MASTER NOTE — Artificial Intelligence\n\nThis note synthesises contributions from all teachers for the AI subject.\n\n1. Core Concepts\n• ANNs are computing systems inspired by biological neural networks.\n• Each artificial neuron receives inputs, applies weights, and passes through an activation function.\n• ANNs are suited for pattern recognition — image classification, NLP, forecasting.\n\n2. Perceptron & Architecture\n• Perceptron: simplest decision unit; combines weighted inputs.\n• Networks: Input Layer → Hidden Layers → Output Layer.\n• Stacking perceptrons enables complex decision boundaries.\n\n3. Backpropagation & Optimisation\n• Backpropagation computes gradients using the chain rule.\n• Gradient Descent minimises loss iteratively.\n• Popular optimisers: SGD, Adam, RMSProp.\n\n4. Activation Functions\n• Sigmoid: range (0, 1). Great for probability.\n• ReLU: max(0, x). Default for hidden layers.\n• Tanh: range (-1, 1). Zero-centred.\n\n5. Applications\n• Self-driving cars, medical imaging, language translation, recommendation engines.`,
    subject_id: 'cs-ai',
    author_name: 'MindMerge AI',
    author_role: 'teacher',
    author_avatar: '',
    type: 'master',
    ai_rating: 5,
    student_ratings: [5, 5, 5, 4, 5],
    keywords: ['neural networks', 'perceptron', 'activation function', 'backpropagation', 'gradient descent', 'AI', 'deep learning', 'optimisation'],
    created_at: '2026-03-31T18:00:00Z',
  },
];

// Initialize localStorage helpers for mock environment
function getStoredData<T>(key: string, defaultValue: T): T {
  const value = localStorage.getItem(key);
  if (!value) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

function setStoredData<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Emulate a subscription broker for Auth changes
type AuthChangeCallback = (event: string, session: any) => void;
const authListeners = new Set<AuthChangeCallback>();

// Build the mock database tables lazily in localStorage
const mockDb = {
  get profiles() { return getStoredData('mindmerge_db_profiles', DEFAULT_PROFILES); },
  set profiles(val) { setStoredData('mindmerge_db_profiles', val); },

  get notes() { return getStoredData('mindmerge_db_notes', DEFAULT_NOTES); },
  set notes(val) { setStoredData('mindmerge_db_notes', val); },

  get subjects() { return getStoredData('mindmerge_db_subjects', DEFAULT_SUBJECTS); },
  set subjects(val) { setStoredData('mindmerge_db_subjects', val); }
};

// Create a robust Mock client for local development
const mockSupabaseClient = {
  auth: {
    signUp: async ({ email, password, options }: any) => {
      const role = options?.data?.role || 'student';
      const name = options?.data?.name || email.split('@')[0];
      const avatar = options?.data?.avatar || `/avatars/${role === 'teacher' ? 'anjali' : 'rahul'}.svg`;

      const profiles = mockDb.profiles;
      const existingUser = profiles.find((p) => p.email === email);

      if (existingUser) {
        return { data: { user: null }, error: { message: 'User already exists' } };
      }

      const userId = `mock-user-${Date.now()}`;
      const newProfile = {
        id: userId,
        email,
        name,
        avatar,
        role,
        coins: role === 'teacher' ? 120 : 40,
        upload_count: 0,
        created_at: new Date().toISOString(),
      };

      profiles.push(newProfile);
      mockDb.profiles = profiles;

      const session = {
        user: {
          id: userId,
          email,
          user_metadata: { name, avatar, role },
        },
      };

      localStorage.setItem('mindmerge_mock_session', JSON.stringify(session));
      authListeners.forEach((l) => l('SIGNED_IN', session));

      return { data: { user: session.user }, error: null };
    },

    signInWithPassword: async ({ email, password }: any) => {
      const profiles = mockDb.profiles;
      const profile = profiles.find((p) => p.email === email);

      if (!profile) {
        return { data: { session: null }, error: { message: 'Invalid login credentials' } };
      }

      const session = {
        user: {
          id: profile.id,
          email: profile.email,
          user_metadata: {
            name: profile.name,
            avatar: profile.avatar,
            role: profile.role,
          },
        },
      };

      localStorage.setItem('mindmerge_mock_session', JSON.stringify(session));
      authListeners.forEach((l) => l('SIGNED_IN', session));

      return { data: { session, user: session.user }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('mindmerge_mock_session');
      authListeners.forEach((l) => l('SIGNED_OUT', null));
      return { error: null };
    },

    getSession: async () => {
      const val = localStorage.getItem('mindmerge_mock_session');
      if (val) {
        try {
          const session = JSON.parse(val);
          // Sync with profile stats dynamically
          const profiles = mockDb.profiles;
          const profile = profiles.find((p) => p.id === session.user.id);
          if (profile) {
            session.user.user_metadata = {
              name: profile.name,
              avatar: profile.avatar,
              role: profile.role,
            };
          }
          return { data: { session }, error: null };
        } catch {
          return { data: { session: null }, error: null };
        }
      }
      return { data: { session: null }, error: null };
    },

    onAuthStateChange: (callback: AuthChangeCallback) => {
      authListeners.add(callback);
      // Trigger initial callback asynchronously to match real behavior
      setTimeout(async () => {
        const { data: { session } } = await mockSupabaseClient.auth.getSession();
        callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);
      }, 0);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            },
          },
        },
      };
    },
  },

  from: (table: string) => {
    let currentData = [...(mockDb as any)[table]];

    const builder = {
      data: currentData,
      error: null as any,

      select: function (columns: string = '*') {
        return this;
      },

      eq: function (column: string, value: any) {
        this.data = this.data.filter((item: any) => item[column] === value);
        return this;
      },

      order: function (column: string, { ascending = true } = {}) {
        this.data.sort((a: any, b: any) => {
          if (a[column] < b[column]) return ascending ? -1 : 1;
          if (a[column] > b[column]) return ascending ? 1 : -1;
          return 0;
        });
        return this;
      },

      insert: async function (rowOrRows: any) {
        const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
        const newRows = rows.map((r: any) => ({
          ...r,
          id: r.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: r.created_at || new Date().toISOString(),
        }));

        const allRows = [...(mockDb as any)[table], ...newRows];
        (mockDb as any)[table] = allRows;

        return { data: newRows, error: null };
      },

      update: async function (updates: any) {
        const filterIds = this.data.map((item: any) => item.id);
        const allRows = (mockDb as any)[table].map((item: any) => {
          if (filterIds.includes(item.id)) {
            return { ...item, ...updates };
          }
          return item;
        });
        (mockDb as any)[table] = allRows;

        return { data: updates, error: null };
      },

      upsert: async function (rowOrRows: any) {
        const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
        const currentTable = (mockDb as any)[table];

        const updatedRows = rows.map((row: any) => {
          const index = currentTable.findIndex((item: any) => item.id === row.id || (row.email && item.email === row.email));
          if (index !== -1) {
            currentTable[index] = { ...currentTable[index], ...row };
            return currentTable[index];
          } else {
            const newRow = {
              ...row,
              id: row.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              created_at: row.created_at || new Date().toISOString(),
            };
            currentTable.push(newRow);
            return newRow;
          }
        });

        (mockDb as any)[table] = currentTable;
        return { data: updatedRows, error: null };
      },

      delete: async function () {
        const filterIds = this.data.map((item: any) => item.id);
        const remainingRows = (mockDb as any)[table].filter((item: any) => !filterIds.includes(item.id));
        (mockDb as any)[table] = remainingRows;
        return { data: this.data, error: null };
      },

      single: async function () {
        return { data: this.data[0] || null, error: this.data[0] ? null : { message: 'No rows found' } };
      },

      then: function (onfulfilled: any) {
        return Promise.resolve({ data: this.data, error: this.error }).then(onfulfilled);
      }
    };

    return builder;
  }
};

// Create real client or use mock client based on config
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (mockSupabaseClient as any);
