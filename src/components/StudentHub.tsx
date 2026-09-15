import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Sparkles, BookOpen, HelpCircle, Target, Layers, ChevronRight, CheckCircle2, X, Send, Menu, LogOut, Search, Star, Upload, UploadCloud, Crown, Bot, FileText, ChevronDown, Filter, Sun, Moon, Sunrise } from 'lucide-react';
import { useAppContext, Note, extractJsonArray } from '../context/AppContext';
import { useFocusTrap } from '../lib/useFocusTrap';
import { trackEvent } from '../lib/analytics';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { generateContent } from '../lib/api';


interface StudentHubProps {
  onLogout?: () => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', icon: Sunrise, emoji: '🌅' };
  if (h < 17) return { text: 'Good afternoon', icon: Sun, emoji: '☀️' };
  return { text: 'Good evening', icon: Moon, emoji: '🌙' };
}

const SUBJECT_ACCENT: Record<string, string> = {
  'cs-ai': 'accent-ai',
  'cs-ml': 'accent-ml',
  'cs-ds': 'accent-ds',
  'math-la': 'accent-math',
  'phy-qm': 'accent-phy',
};

export default function StudentHub({ onLogout }: StudentHubProps) {
  const { subjects, notes, rateNote, addNote, getAiRating, profile } = useAppContext();
  const studentName = profile?.name || 'Rahul Kumar';
  const studentFirstName = studentName.split(' ')[0];
  const studentAvatar = profile?.avatar || '/avatars/rahul.svg';

  const greeting = getGreeting();

  const [activeTab, setActiveTab] = useState('explore');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  useFocusTrap(isAiChatOpen, chatRef);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');

  // Note detail view
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [detailTab, setDetailTab] = useState<'content' | 'questions' | 'quiz' | 'flashcards'>('content');
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [flashIndex, setFlashIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Student upload state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState(subjects[0]?.id ?? '');
  const [uploadKeywords, setUploadKeywords] = useState('');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<string>('');
  const [extractedPdfText, setExtractedPdfText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (file.type !== 'application/pdf') {
      showToast('Only PDF files are supported currently');
      return;
    }

    setSelectedFile(file);
    setIsExtracting(true);
    showToast('Reading PDF...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = await extractTextFromPdf(arrayBuffer);
      setExtractedPdfText(text);

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPdfData(base64);
        showToast('PDF loaded successfully!');
        setIsExtracting(false);
      };
      reader.readAsDataURL(file);

      if (!uploadTitle.trim()) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setUploadTitle(nameWithoutExt);
      }
    } catch (err) {
      console.error(err);
      showToast('Error processing PDF file');
      setIsExtracting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Chat
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAiTyping]);

  // Update AI study assistant greeting when selectedNote or studentName changes
  useEffect(() => {
    if (selectedNote) {
      setChatHistory([
        {
          role: 'ai',
          content: `👋 Hi ${studentFirstName}! I am your AI Study Assistant for **"${selectedNote.title}"**. \n\nI've analyzed this note's concepts (${selectedNote.keywords.join(', ')}). \n\nFeel free to ask me anything about it, or click one of the quick study chips below to get started! 🚀`
        }
      ]);
      setDetailTab('content');
      setQuizIndex(0);
      setSelectedOpt(null);
      setQuizScore(0);
      setIsQuizSubmitted(false);
      setQuizFinished(false);
      setFlashIndex(0);
      setIsFlipped(false);
    } else {
      setChatHistory([
        {
          role: 'ai',
          content: `👋 Hi ${studentFirstName}! I am your AI study assistant. Select any note from the **Explore Notes** or **Master Notes** tab to get focused study help, or ask me a general question below!`
        }
      ]);
    }
    setQuizAnswer(null); // Reset active quiz state when note changes
  }, [selectedNote, studentFirstName]);

  // Track active tab view
  useEffect(() => {
    trackEvent('student_view_tab', { tab: activeTab });
  }, [activeTab]);

  // Track note selection
  useEffect(() => {
    if (selectedNote) {
      trackEvent('student_select_note', {
        noteId: selectedNote.id,
        noteTitle: selectedNote.title,
        noteType: selectedNote.type
      });
    }
  }, [selectedNote]);

  // Get active suggestion chips based on active note context
  const chips = useMemo(() => {
    if (selectedNote) {
      return ['📝 Summarize Note', '💡 Real-world Analogy', '🧠 Memory Mnemonics', '❓ Quiz Me'];
    }
    return ['🤖 What is MindMerge AI?', '🧠 Intro to Neural Networks', '🌲 About Binary Trees'];
  }, [selectedNote]);

  // Context-aware smart AI responder
  const getSmartAiResponse = (query: string, note: Note | null): string => {
    const q = query.toLowerCase().trim();

    // Check if answering an active quiz
    if (quizAnswer) {
      const expected = quizAnswer;
      setQuizAnswer(null); // clear state immediately

      const userAns = q.match(/^[a-d]/)?.[0] || q.match(/\b[a-d]\b/)?.[0] || '';
      if (userAns.toUpperCase() === expected) {
        return `🎉 **Spot on! That is absolutely correct.**

Excellent deduction. You've understood the core concepts perfectly! 

What would you like to explore next? Feel free to ask another question or generate a new quiz.`;
      } else {
        const explanations: Record<string, string> = {
          'n1': 'Sigmoid maps outputs to a range of (0, 1), which is ideal for representing binary classification probabilities.',
          'n2': 'The Learning Rate (represented by Alpha α) controls the step size the optimizer takes along the slope of the loss function.',
          'n3': 'Precision is the ratio of true positives to total predicted positives (TP / (TP + FP)).',
          'n4': 'An In-order traversal visits nodes in the sequence: Left-subtree, Root-node, Right-subtree. For a Binary Search Tree (BST), this always yields elements in strictly ascending sorted order.',
          'n5': 'The Tanh (Hyperbolic Tangent) activation function is zero-centered and maps inputs to the range (-1, 1).',
        };
        const activeNoteId = note?.id ?? 'n1';
        const exp = explanations[activeNoteId] || 'Please review the note structure to see how details match up.';
        return `❌ **Not quite!**

The correct answer was **${expected}**.

**Explanation:**
${exp}

Don't worry, failure is the best teacher! Let's try another topic or ask for a real-world analogy to solidify your understanding.`;
      }
    }

    // Check pre-configured prompt patterns
    if (q.includes('summarize note') || q.includes('summarise note')) {
      if (!note) return 'Please open a study note in the main workspace so I can summarize it for you!';
      if (note.id === 'n1') {
        return `### 📝 Study Summary: ${note.title}
        
Here are the core takeaways from this note:
- **Artificial Neural Networks (ANNs)** are model networks inspired by biology that stack weighted input nodes and biases through activation functions.
- **Perceptrons** act as the basic decision-making unit. Multilayer perceptrons allow complex, non-linear decision boundaries.
- **Activation Functions** introduce crucial non-linearity. 
  - *Sigmoid*: (0, 1) range, good for final layer probabilities.
  - *ReLU*: max(0, x), most common choice to solve gradient issues.
  - *Tanh*: (-1, 1) range, zero-centered.`;
      }
      if (note.id === 'n2') {
        return `### 📝 Study Summary: ${note.title}
        
Core takeaways for Optimization:
- **Backpropagation**: An elegant application of the **calculus chain rule** to calculate how errors change with respect to each weight, traversing backward from output to input.
- **Gradient Descent**: An iterative optimizer that steps down the loss curve.
- **Learning Rate (α)**: Controls step size. Too high causes overshoot; too low takes forever to converge.
- **Optimizers**: Adam, SGD, and RMSProp help navigate complex multi-dimensional loss landscapes efficiently.`;
      }
      if (note.id === 'n3') {
        return `### 📝 Study Summary: ${note.title}
        
Key elements of Supervised learning:
- **Concept**: Training mapping functions using inputs and pre-labelled target values.
- **Algorithms**: Core models include Linear & Logistic Regression, Decision Trees, Support Vector Machines (SVM), and k-Nearest Neighbors.
- **Evaluation**: 
  - *Accuracy*: Total correct ratio.
  - *Precision*: True positive ratio over predicted positive.
  - *Recall*: True positive ratio over actual positive.
  - *F1*: Harmonic mean of precision and recall.`;
      }
      if (note.id === 'n4') {
        return `### 📝 Study Summary: ${note.title}
        
Key tree concepts covered:
- **Binary Trees**: Hierarchical tree node structures with up to 2 children (left and right).
- **Depth-First Search (DFS) Traversals**:
  - *In-order*: Left → Root → Right (returns sorted elements in BSTs).
  - *Pre-order*: Root → Left → Right (useful to clone a tree).
  - *Post-order*: Left → Right → Root (useful for deletion).
- **Breadth-First Search (BFS) Traversal**:
  - *Level-order*: Explores node levels iteratively using a FIFO Queue.`;
      }
      // Fallback summary
      return `### 📝 Quick Summary: ${note.title}

Here is a summary of the uploaded document:
- **Focus Topic**: ${subjects.find(s => s.id === note.subjectId)?.name ?? 'General Study'}
- **Author**: Created by ${note.authorName} (${note.authorRole === 'teacher' ? 'Faculty' : 'Student'}).
- **Key Concepts**: ${note.keywords.join(', ')}.
- **Content Overview**:
  ${note.content.split('\n').slice(0, 4).join('\n')}...`;
    }

    if (q.includes('real-world analogy') || q.includes('analogy')) {
      if (!note) return 'Please open a study note in the workspace so I can formulate a customized real-world analogy for you!';
      if (note.subjectId === 'cs-ai' || note.keywords.includes('neural networks')) {
        return `💡 **Real-world Analogy: Neural Networks & Backpropagation**

Imagine you are learning to play a song on the piano:
1. **Feedforward**: You press a series of keys (inputs) with different pressures (weights). The sound comes out.
2. **Loss Assessment**: A teacher listens and says: *"That note was too loud, and that one was flat!"* (Error calculation).
3. **Backpropagation**: You trace the mistake back up your fingers. You realize: *"Ah, my pinky finger pressed too hard on key 3, and my index finger was too slow."* (Calculus Chain Rule).
4. **Gradient Descent**: Next time, you adjust your finger pressures slightly (small step scaled by the **Learning Rate**). 
5. **Epochs**: You practice the song 100 times until it sounds perfect!`;
      }
      if (note.subjectId === 'cs-ml') {
        return `💡 **Real-world Analogy: Supervised Learning**

Think of **Supervised Learning** like a toddler learning to identify shapes:
- The parent shows blocks to the child and says *"This is a triangle"*, *"This is a circle"* (these are the **Labels**).
- The child looks at the attributes — number of sides, sharp corners (these are the **Features**).
- If the child points to a square and says *"triangle!"*, the parent corrects them: *"No, that has 4 sides, it is a square!"* (Gradient Feedback).
- Through hundreds of examples, the child builds an internal formula (mapping function) to accurately recognize shapes independently later!`;
      }
      if (note.subjectId === 'cs-ds' || note.keywords.includes('binary tree')) {
        return `💡 **Real-world Analogy: Binary Trees & Traversals**

Think of a **Binary Tree** as a high-security corporate phone directory:
- The CEO is the **Root Node**.
- The CEO has two Vice Presidents (Left and Right branches). Each VP has two managers, and so on.
- **In-order traversal (Left, Root, Right)** is like visiting managers in strict alphabetical order.
- **Pre-order traversal (Root, Left, Right)** is like passing a memo down the line: the CEO reads it first, then passes it to the left wing, who passes it down, then the right wing.
- **Post-order traversal (Left, Right, Root)** is like performance reviews: VPs review their managers, then report back to the CEO last.`;
      }
      return `💡 **Real-world Analogy**

Think of this topic as a **smart sorting warehouse**:
- Raw materials enter from one end (Inputs).
- Sorters classify them into boxes based on distinct labels (Features).
- Quality checkers verify accuracy (Evaluation) and refine the conveyor belt speed so no items get misplaced!`;
    }

    if (q.includes('memory mnemonics') || q.includes('mnemonic') || q.includes('mnemonics')) {
      if (!note) return 'Please open a study note so I can generate tailored mnemonics for you!';
      if (note.id === 'n1' || note.keywords.includes('activation')) {
        return `🧠 **Memory Aid: Activation Functions Mnemonic**

To remember the three main activation functions, think of: **"Smart Robots Think"**
- **S** = **S**igmoid (maps between **0 and 1**; Sigmoid is **S**hape of S)
- **R** = **R**eLU (max of **0 or x**; Rectifier **R**ejecting negative values)
- **T** = **T**anh (Two-sided from **-1 to 1**; Tanh is **T**ruly **T**ero-centered)

*Pro-tip:* ReLU is f(x) = max(0, x). It's like a bouncers filter: negative values are stopped, positive values go straight through!`;
      }
      if (note.id === 'n2' || note.keywords.includes('gradient')) {
        return `🧠 **Memory Aid: Optimisation & Descent**

Remember the core parts of Gradient Descent with: **"Lazy Hikers Step Down"**
- **L** = **L**earning Rate (controls size of **L**eaps or steps)
- **H** = **H**ill/Loss function (the terrain you are trying to descend)
- **S** = **S**lope/Gradient (direction pointing towards the steepest ascent; we go **opposite**!)
- **D** = **D**irection to adjust weights to reach the valley floor (**D**escent)`;
      }
      if (note.id === 'n4' || note.keywords.includes('traversal')) {
        return `🧠 **Memory Aid: Tree Traversals**

Remember where the **Root** node goes during Depth-First Search:
- **IN-order**: Left ➔ **ROOT** ➔ Right. (The Root is **IN** the middle!)
- **PRE-order**: **ROOT** ➔ Left ➔ Right. (The Root is **PRE**-fixed / comes first!)
- **POST-order**: Left ➔ Right ➔ **ROOT**. (The Root is **POST**-fixed / comes last!)`;
      }
      return `🧠 **Memory Aid: Study Mnemonic**

Remember the core terms using **"C.A.T.S."**:
- **C** = **C**oncepts (identify the basic blocks)
- **A** = **A**nalogies (map it to what you know)
- **T** = **T**est yourself (quizzes and practice questions)
- **S** = **S**ummarize (explain it in your own words)`;
    }

    if (q.includes('quiz me') || q.includes('quiz')) {
      if (!note) return 'Please open a study note so I can generate a contextual quiz for you!';
      if (note.id === 'n1') {
        setQuizAnswer('B');
        return `❓ **AI Practice Quiz: ${note.title}**

Here is a multiple-choice question from your active note:

*Which activation function outputs values in the range (0, 1), making it highly suitable for final layers in binary classification tasks?*

**A) ReLU**
**B) Sigmoid**
**C) Tanh**
**D) Linear**

*Reply with A, B, C, or D!*`;
      }
      if (note.id === 'n2') {
        setQuizAnswer('C');
        return `❓ **AI Practice Quiz: ${note.title}**

Here is a multiple-choice question from your active note:

*What parameter regulates the step size taken during each iteration of optimization in Gradient Descent?*

**A) The Loss Value**
**B) The Chain Rule**
**C) The Learning Rate (Alpha)**
**D) The Activation Threshold**

*Reply with A, B, C, or D!*`;
      }
      if (note.id === 'n3') {
        setQuizAnswer('C');
        return `❓ **AI Practice Quiz: ${note.title}**

Here is a multiple-choice question from your active note:

*Which evaluation metric measures the ratio of true positives to total predicted positives (TP / [TP + FP])?*

**A) Accuracy**
**B) Recall**
**C) Precision**
**D) F1 Score**

*Reply with A, B, C, or D!*`;
      }
      if (note.id === 'n4') {
        setQuizAnswer('C');
        return `❓ **AI Practice Quiz: ${note.title}**

Here is a multiple-choice question from your active note:

*If you perform an In-order traversal on a Binary Search Tree (BST), what will be the ordering of the output keys?*

**A) Reversed order**
**B) Random order**
**C) Sorted ascending order**
**D) Alternating order**

*Reply with A, B, C, or D!*`;
      }
      // Fallback quiz
      setQuizAnswer('A');
      return `❓ **AI Practice Quiz: ${note.title}**

Here is a quick question about this topic:

*What is the author role of the creator of this note ("${note.title}")?*

**A) ${note.authorRole === 'teacher' ? 'Teacher/Faculty' : 'Student'}**
**B) Administrator**
**C) Guest Guest**
**D) External Evaluator**

*Reply with A, B, C, or D!*`;
    }

    // General prompt matching
    if (q.includes('what is mindmerge ai') || q.includes('mindmerge')) {
      return `🤖 **What is MindMerge AI?**

MindMerge AI is an AI-powered academic learning repository. 
- **For Teachers**: It helps consolidate different study notes into unified, comprehensive **"Master Notes"** using Generative AI.
- **For Students**: It offers a high-fidelity learning experience. You can read consolidated master guides, share your own notes, test your comprehension with interactive quizzes/flashcards, and get answers from this **AI Study Assistant** in real-time!`;
    }

    if (q.includes('intro to neural networks') || q.includes('neural network')) {
      return `🧠 **Introduction to Neural Networks**

An **Artificial Neural Network (ANN)** is a set of stacked layers:
1. **Input Layer**: Receives features (e.g. pixels of an image).
2. **Hidden Layer(s)**: Processes attributes using nodes that apply weights and biases, passed through non-linear activation functions (like **ReLU** or **Tanh**).
3. **Output Layer**: Yields a prediction (e.g. "Cat" vs "Dog").

*Tip:* Stacking more hidden layers creates **Deep Learning**, allowing the network to extract abstract high-level patterns automatically!`;
    }

    if (q.includes('binary trees') || q.includes('binary tree')) {
      return `🌲 **About Binary Trees**

A **Binary Tree** is a node-based data structure where:
- Each node has a maximum of **two children** (Left and Right).
- The top node is the **Root**.
- Nodes with no children are called **Leaf Nodes**.

*Key Application*: **Binary Search Trees (BST)** maintain sorting, where for any node, all left descendants are smaller, and all right descendants are larger. This allows search, insertion, and deletion in $O(\\log n)$ average time!`;
    }

    // Keyword matching in custom user inputs
    if (q.includes('sigmoid') || q.includes('relu') || q.includes('tanh') || q.includes('activation')) {
      return `🧠 **Deep Dive: Activation Functions**

Activation functions decide if a neuron should fire by transforming inputs to outputs:
1. **Sigmoid**:
   - Formula: $\\sigma(x) = \\frac{1}{1 + e^{-x}}$
   - Range: $(0, 1)$
   - Good for probabilities, but suffers from **vanishing gradients** for deep layers.
2. **ReLU (Rectified Linear Unit)**:
   - Formula: $f(x) = \\max(0, x)$
   - Range: $[0, \\infty)$
   - Avoids vanishing gradients and is computationally efficient.
3. **Tanh (Hyperbolic Tangent)**:
   - Formula: $\\tanh(x) = \\frac{e^x - e^{-x}}{e^x + e^{-x}}$
   - Range: $(-1, 1)$
   - Zero-centered, generally outperforming Sigmoid in hidden layers.`;
    }

    if (q.includes('backprop') || q.includes('gradient') || q.includes('descent') || q.includes('chain rule')) {
      return `📈 **Deep Dive: Optimization & Training**

How do models actually *learn*?
- **Loss Function**: Measures how wrong the prediction is.
- **Backpropagation**: Calculates how the loss changes when we adjust any weight in the network. It uses the **Calculus Chain Rule** to pass the errors backward from output to inputs.
- **Gradient Descent**: Subtracts a fraction of the gradient from the weights to step "downhill" towards minimum error:
  $$W \\leftarrow W - \\alpha \\frac{\\partial L}{\\partial W}$$
  where $\\alpha$ is the **Learning Rate**.`;
    }

    if (q.includes('traversal') || q.includes('in-order') || q.includes('pre-order') || q.includes('post-order')) {
      return `🌲 **Deep Dive: Binary Tree Traversals**

To traverse a binary tree means to visit every node once:
1. **In-order (Left, Root, Right)**:
   - *Result on BST*: Elements are printed in sorted ascending order!
2. **Pre-order (Root, Left, Right)**:
   - *Result*: Helpful when you want to duplicate or serialize the tree hierarchy.
3. **Post-order (Left, Right, Root)**:
   - *Result*: Helpful for bottom-up algorithms, such as calculating node sizes or deleting the tree.`;
    }

    if (q.includes('supervised')) {
      return `📊 **Deep Dive: Supervised Learning**

In **Supervised Learning**, a model is given inputs $X$ alongside exact labels $Y$. 
- The model makes a prediction $\\hat{Y}$.
- The loss function compares $\\hat{Y}$ to $Y$ and penalizes discrepancies.
- Key algorithms:
  - **Linear/Logistic Regression** (predict continuous values / binary classes)
  - **Decision Trees & Random Forests** (branching criteria)
  - **Support Vector Machines (SVM)** (finding maximum margin hyperplanes)
  - **k-Nearest Neighbors (k-NN)** (majority vote of nearest samples)`;
    }

    // Default response
    return `🤔 **Interesting question!**

While I don't have a specific pre-compiled answer for that precise phrase, here are some helpful steps to analyze this note:
1. Review the **Keywords** at the top of the card.
2. Read the **Core Takeaways** section.
3. Use the **Quiz Me** chip to test your current understanding!

If you have a general computer science or study question, try asking about **activation functions**, **backpropagation**, **supervised learning**, or **tree traversals**!`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isAiTyping) return;

    const userMsg = chatMessage.trim();
    setChatHistory((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatMessage('');
    setIsAiTyping(true);

    trackEvent('student_chat_message', {
      noteId: selectedNote?.id || 'general',
      noteTitle: selectedNote?.title || 'None',
      messageLength: userMsg.length,
    });

    setTimeout(() => {
      const response = getSmartAiResponse(userMsg, selectedNote);
      setChatHistory((prev) => [...prev, { role: 'ai', content: response }]);
      setIsAiTyping(false);
    }, 1000);
  };

  const handleChipClick = (chipText: string) => {
    if (isAiTyping) return;

    // Extract actual search keyword or prompt
    const cleanedText = chipText.replace(/^[^\s]+\s+/, ''); // strip prefix emoji
    setChatHistory((prev) => [...prev, { role: 'user', content: chipText }]);
    setIsAiTyping(true);

    trackEvent('student_chat_chip_click', {
      noteId: selectedNote?.id || 'general',
      chipText: cleanedText,
    });

    setTimeout(() => {
      const response = getSmartAiResponse(cleanedText, selectedNote);
      setChatHistory((prev) => [...prev, { role: 'ai', content: response }]);
      setIsAiTyping(false);
    }, 1000);
  };

  // ─── Search & Sort Logic ──────────────────────────────────────
  const searchResults = useMemo(() => {
    let filtered = notes;

    // Filter by subject
    if (filterSubject !== 'all') {
      filtered = filtered.filter((n) => n.subjectId === filterSubject);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.keywords.some((k) => k.toLowerCase().includes(query)) ||
          n.content.toLowerCase().includes(query),
      );
    }

    // Sort: Master notes first, then by rating
    return [...filtered].sort((a, b) => {
      // Master notes always on top
      if (a.type === 'master' && b.type !== 'master') return -1;
      if (a.type !== 'master' && b.type === 'master') return 1;

      // Then sort by combined rating (AI + student avg)
      const avgA = a.studentRatings.length > 0 ? a.studentRatings.reduce((x, y) => x + y, 0) / a.studentRatings.length : 0;
      const avgB = b.studentRatings.length > 0 ? b.studentRatings.reduce((x, y) => x + y, 0) / b.studentRatings.length : 0;
      const scoreA = a.aiRating * 0.4 + avgA * 0.6;
      const scoreB = b.aiRating * 0.4 + avgB * 0.6;
      return scoreB - scoreA;
    });
  }, [notes, searchQuery, filterSubject]);

  // ─── Handlers ─────────────────────────────────────────────────
  const handleRateNote = (noteId: string, rating: number) => {
    rateNote(noteId, rating);
    setUserRating(rating);
    trackEvent('student_rate_note', { noteId, rating });
    showToast(`Rated ${rating} stars — Thank you!`);
  };

  const handleStudentUpload = async () => {
    if (!uploadTitle.trim()) {
      showToast('Please enter a note title');
      return;
    }

    let finalContent = extractedPdfText || `Student-contributed note: "${uploadTitle}". This note was shared by a fellow student to help the community.`;
    let aiRating = getAiRating(); // fallback mock rating

    setIsAnalyzing(true);
    showToast('AI is analyzing PDF notes...');

    let parsedQuiz: any[] = [];
    let parsedFlashcards: any[] = [];
    let parsedQuestions: any[] = [];

    try {
      const aiResponse = await generateContent({
        prompt: `Analyze the notes from the document titled "${uploadTitle}". Provide a summary/study guide and rate its quality.`,
        context: finalContent,
        type: 'pdf-analysis'
      });

      if (aiResponse && aiResponse.content) {
        const ratingMatch = aiResponse.content.match(/RATING:\s*([0-5](?:\.\d+)?)/i);
        if (ratingMatch) {
          aiRating = parseFloat(ratingMatch[1]);
        }
        // Extract note content - remove the RATING line from the end if it's there
        finalContent = aiResponse.content.replace(/RATING:\s*[0-5](?:\.\d+)?/i, '').trim();
      }

      showToast('Generating practice quiz, flashcards & questions...');
      const [quizRes, flashRes, qRes] = await Promise.all([
        generateContent({
          prompt: `Generate a 5-question multiple-choice quiz based on this content:\n\n${finalContent}`,
          type: 'quiz'
        }),
        generateContent({
          prompt: `Generate 5 flashcards based on this content:\n\n${finalContent}`,
          type: 'flashcards'
        }),
        generateContent({
          prompt: `Generate 3-5 important questions with detailed answers based on this content:\n\n${finalContent}`,
          type: 'important-questions'
        })
      ]);

      parsedQuiz = extractJsonArray(quizRes.content, []);
      parsedFlashcards = extractJsonArray(flashRes.content, []);
      parsedQuestions = extractJsonArray(qRes.content, []);

    } catch (err) {
      console.error('AI Analysis/Generation failed, falling back:', err);
      showToast('AI Analysis failed. Uploading raw content instead.');
    } finally {
      setIsAnalyzing(false);
    }

    addNote({
      title: uploadTitle,
      content: finalContent,
      subjectId: uploadSubject,
      authorName: studentName,
      authorRole: 'student',
      authorAvatar: studentAvatar,
      type: 'raw',
      aiRating,
      studentRatings: [],
      keywords: uploadKeywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean),
      pdfData: pdfData || undefined,
      pdfName: selectedFile ? selectedFile.name : undefined,
      importantQuestions: parsedQuestions,
      quiz: parsedQuiz,
      flashcards: parsedFlashcards,
    });
    trackEvent('student_upload_note', { subjectId: uploadSubject, aiRating });
    showToast(`Note uploaded! AI rated it ${aiRating.toFixed(1)}/5`);
    setUploadTitle('');
    setUploadKeywords('');
    setSelectedFile(null);
    setPdfData('');
    setExtractedPdfText('');
    setShowUploadForm(false);
  };

  // ─── Render helpers ───────────────────────────────────────────
  const renderStars = (rating: number, interactive = false, noteId?: string) => {
    const display = interactive ? (hoverRating || userRating || 0) : rating;
    if (interactive) {
      return (
        <div className="flex items-center justify-center gap-1.5" role="radiogroup" aria-label="Rate this note">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={i < Math.round(display)}
              aria-label={`Rate ${i + 1} stars`}
              onClick={() => noteId && handleRateNote(noteId, i + 1)}
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              className="cursor-pointer hover:scale-125 transition-transform p-1 focus-visible:outline-none"
            >
              <Star
                className={`w-6 h-6 transition-colors ${i < Math.round(display) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
              />
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars`}>
        <div className="flex items-center gap-0.5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
            />
          ))}
        </div>
        <span className="ml-1.5 text-sm font-bold text-slate-700" aria-hidden="true">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getAvgStudentRating = (n: Note) =>
    n.studentRatings.length > 0
      ? Math.round((n.studentRatings.reduce((a, b) => a + b, 0) / n.studentRatings.length) * 10) / 10
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-shell flex flex-col h-screen font-sans text-slate-800"
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[60] bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3 md:gap-6">
          <button className="md:hidden text-slate-500 hover:text-slate-700" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-display text-xl font-black tracking-tight flex items-center gap-2">
            <span className="headline-gradient hidden sm:block">MindMerge</span>
            <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">AI</span>
          </h1>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <h2 className="text-base md:text-lg font-bold text-slate-800 hidden sm:block">Student Hub</h2>
        </div>
        <div className="flex items-center gap-3 md:gap-5">
          <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
          </button>
          <div className="flex items-center gap-3 pl-3 md:pl-5 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-none">{studentName}</p>
              <p className="text-xs font-semibold text-cyan-600 mt-1">Class 10-A · Scholar</p>
            </div>
            <img src={studentAvatar} alt="Profile" className="w-9 h-9 md:w-10 md:h-10 rounded-full ring-2 ring-cyan-500/20 shadow-sm" referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      {/* ─── Main ────────────────────────────────────────────── */}
      <main id="main-content" className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-slate-50/50">
        {/* Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 flex flex-col py-4 md:py-6 shrink-0 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-xl md:shadow-none`}
        >
          <div className="flex items-center justify-between px-4 mb-4 md:hidden">
            <h2 className="font-bold text-slate-800">Menu</h2>
            <button className="text-slate-500" onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
          </div>

          <nav className="flex flex-col gap-1.5 px-4">
            <button
              onClick={() => { setActiveTab('explore'); setSelectedNote(null); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl font-bold transition-all border ${activeTab === 'explore' ? 'text-cyan-800 bg-cyan-500/10 border-cyan-500/30 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent'}`}
            >
              <Search className={`w-5 h-5 ${activeTab === 'explore' ? 'text-cyan-600' : 'text-slate-400'}`} />
              <span>Explore Notes</span>
            </button>
            <button
              onClick={() => { setActiveTab('master-notes'); setSelectedNote(null); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl font-bold transition-all border ${activeTab === 'master-notes' ? 'text-amber-800 bg-amber-500/10 border-amber-500/30 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent'}`}
            >
              <Crown className={`w-5 h-5 ${activeTab === 'master-notes' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>Master Notes</span>
            </button>
            <button
              onClick={() => { setActiveTab('upload'); setSelectedNote(null); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl font-bold transition-all border ${activeTab === 'upload' ? 'text-cyan-800 bg-cyan-500/10 border-cyan-500/30 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent'}`}
            >
              <Upload className={`w-5 h-5 ${activeTab === 'upload' ? 'text-cyan-600' : 'text-slate-400'}`} />
              <span>Upload Notes</span>
            </button>
            <button
              onClick={() => { setActiveTab('practice-quiz'); setSelectedNote(null); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl font-bold transition-all border ${activeTab === 'practice-quiz' ? 'text-cyan-800 bg-cyan-500/10 border-cyan-500/30 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent'}`}
            >
              <Target className={`w-5 h-5 ${activeTab === 'practice-quiz' ? 'text-cyan-600' : 'text-slate-400'}`} />
              <span>Practice Quiz</span>
            </button>
            <button
              onClick={() => { setActiveTab('flashcards'); setSelectedNote(null); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl font-bold transition-all border ${activeTab === 'flashcards' ? 'text-cyan-800 bg-cyan-500/10 border-cyan-500/30 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent'}`}
            >
              <Layers className={`w-5 h-5 ${activeTab === 'flashcards' ? 'text-cyan-600' : 'text-slate-400'}`} />
              <span>Flashcards</span>
            </button>
          </nav>

          {/* Progress Card */}
          <div className="px-4 mt-auto pt-6">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-lg border border-slate-800 relative overflow-hidden mb-3">
              <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">Study Matrix</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full">Level 2</span>
              </div>
              <h4 className="font-bold text-base text-white mb-0.5 relative z-10">Your Progress</h4>
              <p className="text-slate-400 text-xs mb-3 relative z-10">{notes.length} notes active in catalog</p>
              
              <div className="w-full bg-slate-800 rounded-full h-2 mb-2 relative z-10 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 h-2 rounded-full w-[65%]" />
              </div>
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 relative z-10">
                <span>Mastery Rate</span>
                <span className="text-cyan-400 font-bold">65%</span>
              </div>
            </div>
            
            <button onClick={onLogout} className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl font-semibold transition-all text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ─── Content Panel ─────────────────────────────────── */}
        <section className="flex-1 overflow-y-auto relative">
          <div className="max-w-5xl mx-auto py-6 md:py-10 px-4 md:px-8 pb-40">
            <AnimatePresence mode="wait">

              {/* ════════════════════════════════════════════════
                   EXPLORE NOTES (with SEARCH)
                 ════════════════════════════════════════════════ */}
              {activeTab === 'explore' && !selectedNote && (
                <motion.div key="explore" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  {/* Welcome Cyberpunk Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden border border-slate-800 shadow-xl"
                  >
                    <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
                    <div className="absolute right-24 bottom-0 h-32 w-32 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
                    
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
                      <span>{greeting.emoji} {greeting.text}</span>
                    </div>

                    <h2 className="font-display text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                      {studentName}
                    </h2>
                    <p className="text-slate-300 text-sm max-w-xl leading-relaxed mb-6">
                      Pick up where you left off. Search across {notes.length} curated teacher and student notes, test yourself with practice quizzes, and master concepts with flashcards.
                    </p>

                    {/* Quick Action Shortcuts */}
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => setActiveTab('practice-quiz')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-bold text-cyan-300 hover:text-white transition-all cursor-pointer"
                      >
                        <Target className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Quick Quiz</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('flashcards')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-bold text-amber-300 hover:text-white transition-all cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>Flashcard Sprint</span>
                      </button>
                      <button
                        onClick={() => setIsAiChatOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 hover:text-white transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Ask AI Assistant</span>
                      </button>
                    </div>
                  </motion.div>

                  <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Explore Study Notes</h2>
                      <p className="text-slate-500 text-sm font-medium">Search verified classroom materials and AI-generated Master Guides.</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full self-start sm:self-auto">
                      {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by title, keywords, or topic…"
                        className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all text-slate-800 text-sm md:text-base shadow-sm font-medium"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="relative shrink-0">
                      <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                        className="pl-10 pr-10 py-4 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all text-slate-700 text-sm font-bold shadow-sm appearance-none w-full sm:w-auto cursor-pointer"
                      >
                        <option value="all">All Subjects</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Results */}
                  <div className="space-y-4">
                    {searchResults.length === 0 && (
                      <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white/60">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <Search className="w-7 h-7" />
                        </div>
                        <p className="font-bold text-slate-800 text-lg">No notes found</p>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto mb-5">Try adjusting your keyword search or switch the subject filter to view more materials.</p>
                        {filterSubject !== 'all' && (
                          <button
                            onClick={() => setFilterSubject('all')}
                            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            Reset Subject Filter
                          </button>
                        )}
                      </div>
                    )}
                    {searchResults.map((n) => {
                      const avgStudent = getAvgStudentRating(n);
                      return (
                        <motion.button
                          key={n.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => { setSelectedNote(n); setUserRating(0); }}
                          className={`w-full text-left bg-white rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 border border-slate-200/80 transition-all duration-300 group cursor-pointer ${n.type === 'master' ? 'ring-1 ring-amber-400/40 border-amber-300' : ''}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${n.type === 'master' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-300/50' : n.authorRole === 'student' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-cyan-500/10 text-cyan-600'}`}>
                                {n.type === 'master' ? <Crown className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  {n.type === 'master' && (
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">👑 Master Note</span>
                                  )}
                                  {n.authorRole === 'student' && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Student</span>
                                  )}
                                  <span className="text-[11px] font-bold text-slate-500">
                                    {subjects.find((s) => s.id === n.subjectId)?.icon} {subjects.find((s) => s.id === n.subjectId)?.name}
                                  </span>
                                </div>
                                <h3 className="font-bold text-slate-900 group-hover:text-cyan-700 transition-colors truncate text-lg tracking-tight">{n.title}</h3>
                                <p className="text-xs font-medium text-slate-400 mt-1">Uploaded by {n.authorName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-5 shrink-0">
                              <div className="text-center">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-center gap-1"><Bot className="w-3 h-3 text-cyan-500" /> AI Rating</p>
                                {renderStars(n.aiRating)}
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-center gap-1"><Star className="w-3 h-3 text-amber-500" /> Student Score</p>
                                {avgStudent > 0 ? renderStars(avgStudent) : <span className="text-xs font-medium text-slate-300">—</span>}
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-600 transition-colors group-hover:translate-x-1 duration-200" />
                            </div>
                          </div>
                          {/* Keywords */}
                          {n.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                              {n.keywords.slice(0, 5).map((kw) => (
                                <span key={kw} className="text-[10px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5">{kw}</span>
                              ))}
                              {n.keywords.length > 5 && <span className="text-[10px] font-semibold text-slate-400">+{n.keywords.length - 5} more</span>}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════
                   NOTE DETAIL VIEW
                 ════════════════════════════════════════════════ */}
              {selectedNote && (activeTab === 'explore' || activeTab === 'master-notes') && (
                <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  {/* Back button */}
                  <button
                    onClick={() => setSelectedNote(null)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 mb-6 transition-colors"
                  >
                    ← Back to {activeTab === 'master-notes' ? 'Master Notes' : 'Explore'}
                  </button>

                  {/* Note Header */}
                  <div className="mb-10 rounded-[2rem] mesh-card p-8 md:p-10 border border-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      {selectedNote.type === 'master' && (
                        <span className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-xs font-bold rounded-md uppercase tracking-wide border border-amber-200">👑 Master Note</span>
                      )}
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md uppercase tracking-wide">Published</span>
                      <span className="text-sm font-medium text-slate-500">
                        {subjects.find((s) => s.id === selectedNote.subjectId)?.icon} {subjects.find((s) => s.id === selectedNote.subjectId)?.name}
                      </span>
                    </div>
                    <h1 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">{selectedNote.title}</h1>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pb-6 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        {selectedNote.authorAvatar ? (
                          <img src={selectedNote.authorAvatar} alt={selectedNote.authorName} className="w-10 h-10 md:w-12 md:h-12 rounded-full ring-4 ring-white shadow-sm" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm ring-4 ring-white">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 text-base md:text-lg leading-none">{selectedNote.authorName}</p>
                          <p className="text-sm font-medium text-slate-500 mt-1">{selectedNote.authorRole === 'student' ? 'Student Contributor' : 'Faculty'}</p>
                        </div>
                      </div>

                      {/* Ratings side-by-side */}
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1 mb-1"><Bot className="w-3 h-3" /> AI Rating</p>
                          {renderStars(selectedNote.aiRating)}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1 mb-1"><Star className="w-3 h-3" /> Student Avg ({selectedNote.studentRatings.length})</p>
                          {getAvgStudentRating(selectedNote) > 0 ? renderStars(getAvgStudentRating(selectedNote)) : <span className="text-xs text-slate-300">No ratings yet</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedNote.pdfData && (
                    <div className="mb-6 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-800 text-sm md:text-base leading-tight">{selectedNote.pdfName || 'attachment.pdf'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">PDF Document Attachment</p>
                        </div>
                      </div>
                      <a
                        href={selectedNote.pdfData}
                        download={selectedNote.pdfName || 'attachment.pdf'}
                        onClick={(e) => e.stopPropagation()}
                        className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4 rotate-180" /> Download PDF
                      </a>
                    </div>
                  )}

                  {/* Detail Tab Navigation */}
                  <div className="flex border-b border-slate-200 mb-6 bg-slate-100/60 p-1 rounded-xl max-w-lg">
                    <button
                      onClick={() => setDetailTab('content')}
                      className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-colors ${detailTab === 'content' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      📚 Study Guide
                    </button>
                    <button
                      onClick={() => setDetailTab('questions')}
                      className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-colors ${detailTab === 'questions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      ❓ Questions
                    </button>
                    <button
                      onClick={() => setDetailTab('quiz')}
                      className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-colors ${detailTab === 'quiz' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      🧠 Quiz
                    </button>
                    <button
                      onClick={() => setDetailTab('flashcards')}
                      className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-colors ${detailTab === 'flashcards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      ⚡ Flashcards
                    </button>
                  </div>

                  {/* Render based on detailTab */}
                  {detailTab === 'content' && (
                    <div className="prose prose-lg md:prose-xl prose-slate max-w-none rounded-[2rem] bg-white/70 backdrop-blur-xl p-8 md:p-10 border border-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] mb-8">
                      {selectedNote.content.split('\n').map((line, i) => {
                        if (line.startsWith('🏆') || line.startsWith('──')) {
                          return <h3 key={i} className="text-xl font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-orange-500" />{line.replace(/^🏆\s*/, '').replace(/^──\s*/, '')}</h3>;
                        }
                        if (line.startsWith('•')) {
                          return <li key={i} className="text-slate-700 leading-relaxed ml-4 list-disc marker:text-orange-400">{line.replace(/^•\s*/, '')}</li>;
                        }
                        if (line.match(/^\d+\./)) {
                          return <h3 key={i} className="text-xl font-bold text-slate-800 mt-8 mb-3 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold shadow-sm">{line.match(/^\d+/)?.[0]}</div>{line.replace(/^\d+\.\s*/, '')}</h3>;
                        }
                        if (line.trim() === '') return <br key={i} />;
                        return <p key={i} className="text-slate-700 leading-relaxed mb-2">{line}</p>;
                      })}
                    </div>
                  )}

                  {detailTab === 'questions' && (
                    <div className="mb-8 space-y-6">
                      {(!selectedNote.importantQuestions || selectedNote.importantQuestions.length === 0) ? (
                        <div className="text-center py-12 text-slate-400 bg-white/50 rounded-[2rem] border border-slate-100 shadow-sm">
                          <HelpCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="font-medium">No important questions generated for this note.</p>
                        </div>
                      ) : (
                        selectedNote.importantQuestions.map((q, idx) => (
                          <div key={idx} className="p-6 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm space-y-3">
                            <h4 className="font-bold text-slate-800 text-lg flex items-start gap-3">
                              <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">Q{idx + 1}</span>
                              {q.question}
                            </h4>
                            <div className="pl-9 text-slate-600 leading-relaxed whitespace-pre-line text-sm">
                              <strong>Answer:</strong> {q.answer}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {detailTab === 'quiz' && (
                    <div className="mb-8">
                      {(!selectedNote.quiz || selectedNote.quiz.length === 0) ? (
                        <div className="text-center py-12 text-slate-400 bg-white/50 rounded-[2rem] border border-slate-100 shadow-sm">
                          <Bot className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="font-medium">No practice quiz generated for this note.</p>
                        </div>
                      ) : (
                        <div>
                          {quizFinished ? (
                            <div className="mesh-card border border-white/70 rounded-[2rem] p-8 md:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-6">
                              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">🏆</div>
                              <h3 className="text-2xl font-extrabold text-slate-800">Quiz Completed!</h3>
                              <p className="text-slate-600 font-medium text-lg text-center font-sans">
                                You scored <span className="font-bold text-blue-600">{quizScore}</span> out of <span className="font-bold">{selectedNote.quiz.length}</span>!
                              </p>
                              <div className="w-full bg-slate-100 rounded-full h-3">
                                <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${(quizScore / selectedNote.quiz.length) * 100}%` }}></div>
                              </div>
                              <button onClick={() => { setQuizIndex(0); setSelectedOpt(null); setQuizScore(0); setIsQuizSubmitted(false); setQuizFinished(false); }} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg active:scale-95">Restart Quiz</button>
                            </div>
                          ) : (
                            <div className="mesh-card border border-white/70 rounded-[2rem] p-6 md:p-8 shadow-sm">
                              <div className="flex items-center justify-between mb-6">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Question {quizIndex + 1} of {selectedNote.quiz.length}</span>
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">Practice</span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-xl mb-6">{selectedNote.quiz[quizIndex].question}</h4>
                              <div className="space-y-3">
                                {selectedNote.quiz[quizIndex].options.map((opt, i) => {
                                  let btnClass = "border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 text-slate-700";
                                  const isOptionSelected = selectedOpt === i;
                                  const optionText = opt;
                                  const correctText = selectedNote.quiz[quizIndex].answer;

                                  if (isQuizSubmitted) {
                                    if (optionText === correctText) {
                                      btnClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                                    } else if (isOptionSelected) {
                                      btnClass = "border-rose-500 bg-rose-50 text-rose-800 font-bold";
                                    } else {
                                      btnClass = "border-slate-100 opacity-60 text-slate-400";
                                    }
                                  } else if (isOptionSelected) {
                                    btnClass = "border-blue-500 bg-blue-50 text-blue-800 font-bold";
                                  }
                                  return (
                                    <button key={opt} disabled={isQuizSubmitted} onClick={() => setSelectedOpt(i)} className={`w-full text-left p-4 border-2 rounded-2xl transition-all font-medium flex items-center justify-between ${btnClass}`}>
                                      <span>{opt}</span>
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isOptionSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-200'}`}>{isOptionSelected && <CheckCircle2 className="w-4 h-4 text-white" />}</div>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                {!isQuizSubmitted ? (
                                  <button onClick={() => { if (selectedOpt === null) { showToast('Please select an option first'); return; } const correctText = selectedNote.quiz[quizIndex].answer; const chosenText = selectedNote.quiz[quizIndex].options[selectedOpt]; if (chosenText === correctText) setQuizScore(prev => prev + 1); setIsQuizSubmitted(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg active:scale-95">Submit Answer</button>
                                ) : (
                                  <button onClick={() => { if (quizIndex + 1 < selectedNote.quiz.length) { setQuizIndex(prev => prev + 1); setSelectedOpt(null); setIsQuizSubmitted(false); } else { setQuizFinished(true); } }} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                                    {quizIndex + 1 < selectedNote.quiz.length ? 'Next Question' : 'Finish Quiz'} <ChevronRight className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {detailTab === 'flashcards' && (
                    <div className="mb-8">
                      {(!selectedNote.flashcards || selectedNote.flashcards.length === 0) ? (
                        <div className="text-center py-12 text-slate-400 bg-white/50 rounded-[2rem] border border-slate-100 shadow-sm">
                          <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="font-medium">No flashcards generated for this note.</p>
                        </div>
                      ) : (
                        <div className="max-w-xl mx-auto space-y-6">
                          <div className="flex items-center justify-between px-2">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Card {flashIndex + 1} of {selectedNote.flashcards.length}</span>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Interactive</span>
                          </div>

                          <div onClick={() => setIsFlipped(!isFlipped)} className="relative w-full h-72 cursor-pointer perspective-1000">
                            <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full h-full relative transform-style-3d">
                              <div className={`absolute inset-0 backface-hidden rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg border border-white/10 bg-gradient-to-br from-indigo-500 to-blue-600 text-white ${isFlipped ? 'pointer-events-none' : ''}`}>
                                <span className="absolute top-6 left-6 text-xs font-bold text-white/60 uppercase tracking-wider">Question / Concept</span>
                                <h3 className="text-2xl font-bold leading-normal px-4">{selectedNote.flashcards[flashIndex].front}</h3>
                                <span className="absolute bottom-6 text-xs text-white/50">Click to flip</span>
                              </div>
                              <div className={`absolute inset-0 backface-hidden rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg border border-slate-200 bg-white text-slate-800 rotate-y-180 ${!isFlipped ? 'pointer-events-none' : ''}`}>
                                <span className="absolute top-6 left-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Answer / Explanation</span>
                                <p className="text-lg font-medium leading-relaxed text-slate-700 px-4">{selectedNote.flashcards[flashIndex].back}</p>
                                <span className="absolute bottom-6 text-xs text-slate-400">Click to flip back</span>
                              </div>
                            </motion.div>
                          </div>

                          <div className="flex items-center justify-between pt-4">
                            <button disabled={flashIndex === 0} onClick={() => { if (flashIndex > 0) { setFlashIndex(prev => prev - 1); setIsFlipped(false); } }} className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
                            <button onClick={() => setIsFlipped(!isFlipped)} className="px-6 py-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors">🔄 Flip Card</button>
                            <button disabled={flashIndex === selectedNote.flashcards.length - 1} onClick={() => { if (flashIndex < selectedNote.flashcards.length - 1) { setFlashIndex(prev => prev + 1); setIsFlipped(false); } }} className="px-5 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rate This Note */}
                  <div className="rounded-[2rem] mesh-card p-8 border border-white/70 shadow-sm text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Rate This Note</h3>
                    <p className="text-slate-500 text-sm mb-5">Help other students by sharing your opinion.</p>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      {renderStars(0, true, selectedNote.id)}
                    </div>
                    {userRating > 0 && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-600 font-bold text-sm">
                        ✓ You rated this {userRating}/5 — Thank you!
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════
                   MASTER NOTES ONLY
                 ════════════════════════════════════════════════ */}
              {activeTab === 'master-notes' && !selectedNote && (
                <motion.div key="masters" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">👑 Master Notes</h2>
                    <p className="text-slate-500 font-medium">AI-synthesized comprehensive notes combining all teacher contributions per subject.</p>
                  </div>
                  <div className="space-y-4">
                    {notes.filter((n) => n.type === 'master').length === 0 && (
                      <div className="text-center py-16 text-slate-400">
                        <Crown className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="font-medium text-lg">No master notes yet</p>
                        <p className="text-sm mt-1">Teachers need to generate them from the dashboard.</p>
                      </div>
                    )}
                    {notes
                      .filter((n) => n.type === 'master')
                      .map((n) => (
                        <motion.button
                          key={n.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => { setSelectedNote(n); setUserRating(0); }}
                          className="w-full text-left bg-gradient-to-r from-amber-50/80 to-orange-50/80 backdrop-blur-xl border-2 border-amber-200/60 rounded-[1.5rem] p-6 md:p-8 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-4 mb-3">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200/60 group-hover:scale-110 transition-transform">
                              <Crown className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{subjects.find((s) => s.id === n.subjectId)?.icon} {subjects.find((s) => s.id === n.subjectId)?.name}</span>
                              <h3 className="text-xl font-bold text-slate-800 group-hover:text-amber-700 transition-colors">{n.title}</h3>
                            </div>
                            <ChevronRight className="w-6 h-6 text-amber-300 group-hover:text-amber-500 transition-colors" />
                          </div>
                          <p className="text-sm text-slate-500">{n.content.slice(0, 120)}…</p>
                        </motion.button>
                      ))}
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════
                   STUDENT UPLOAD
                 ════════════════════════════════════════════════ */}
              {activeTab === 'upload' && (
                <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Share Your Notes</h2>
                    <p className="text-slate-500 font-medium">Help your fellow students by uploading your own study notes.</p>
                  </div>

                  <div className="mesh-card border border-white/70 rounded-[2rem] p-6 md:p-10 shadow-sm space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Note Title</label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="e.g., My Summary of Chapter 3: Graph Algorithms"
                        className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-slate-800 text-base md:text-lg shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Subject</label>
                      <div className="relative">
                        <select
                          value={uploadSubject}
                          onChange={(e) => setUploadSubject(e.target.value)}
                          className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-slate-800 text-base shadow-sm appearance-none"
                        >
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Keywords <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                      <input
                        type="text"
                        value={uploadKeywords}
                        onChange={(e) => setUploadKeywords(e.target.value)}
                        placeholder="e.g., graph, BFS, DFS, shortest path"
                        className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-slate-800 text-base shadow-sm"
                      />
                    </div>

                    {selectedFile ? (
                      <div className="p-5 border border-orange-500/20 rounded-2xl bg-orange-500/5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-slate-800 text-sm md:text-base leading-tight truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · {isExtracting ? 'Extracting text...' : 'Text extracted'}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedFile(null); setPdfData(''); setExtractedPdfText(''); }}
                          className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer group ${isDragging ? 'border-orange-500 bg-orange-500/5 animate-pulse' : 'border-slate-200 hover:border-orange-500/50 bg-slate-50 hover:bg-orange-50/5'}`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => e.target.files && e.target.files[0] && handleFileChange(e.target.files[0])}
                          accept="application/pdf"
                          className="hidden"
                        />
                        <div className="w-16 h-16 rounded-full bg-white shadow-sm group-hover:bg-orange-100 flex items-center justify-center transition-colors">
                          <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-orange-600 transition-colors" />
                        </div>
                        <div className="text-center">
                          <span className="text-base font-semibold text-slate-700 group-hover:text-orange-700 block mb-1">Drag & Drop your PDF here</span>
                          <span className="text-sm text-slate-500">Supports PDF format (Max 50MB)</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 gap-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Bot className="w-4 h-4 text-amber-500" />
                        <span>AI will automatically rate and categorise your notes</span>
                      </div>
                      <button
                        onClick={handleStudentUpload}
                        disabled={isAnalyzing || isExtracting}
                        className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-8 py-4 rounded-xl font-bold tracking-wide shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            AI Analyzing PDF…
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" /> Upload & Share
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════
                   PRACTICE QUIZ (kept from original)
                 ════════════════════════════════════════════════ */}
              {/* ════════════════════════════════════════════════
                   PRACTICE QUIZ
                 ════════════════════════════════════════════════ */}
              {activeTab === 'practice-quiz' && (
                <motion.div key="practice-quiz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-8">
                  <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">🧠 Practice Quiz</h2>
                    <p className="text-slate-500 font-medium">Test your knowledge with AI-generated multiple-choice questions.</p>
                  </div>

                  {selectedNote ? (
                    <div>
                      <button onClick={() => setSelectedNote(null)} className="mb-4 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1">← Select different note</button>

                      {(!selectedNote.quiz || selectedNote.quiz.length === 0) ? (
                        <div className="text-center py-12 text-slate-400 bg-white/50 rounded-[2rem] border border-slate-100 shadow-sm">
                          <Bot className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="font-medium">No practice quiz generated for this note.</p>
                        </div>
                      ) : (
                        <div>
                          {quizFinished ? (
                            <div className="mesh-card border border-white/70 rounded-[2rem] p-8 md:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-6">
                              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">🏆</div>
                              <h3 className="text-2xl font-extrabold text-slate-800">Quiz Completed!</h3>
                              <p className="text-slate-600 font-medium text-lg text-center font-sans">
                                You scored <span className="font-bold text-blue-600">{quizScore}</span> out of <span className="font-bold">{selectedNote.quiz.length}</span>!
                              </p>
                              <div className="w-full bg-slate-100 rounded-full h-3">
                                <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${(quizScore / selectedNote.quiz.length) * 100}%` }}></div>
                              </div>
                              <button onClick={() => { setQuizIndex(0); setSelectedOpt(null); setQuizScore(0); setIsQuizSubmitted(false); setQuizFinished(false); }} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg active:scale-95">Restart Quiz</button>
                            </div>
                          ) : (
                            <div className="mesh-card border border-white/70 rounded-[2rem] p-6 md:p-8 shadow-sm">
                              <div className="flex items-center justify-between mb-6">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Question {quizIndex + 1} of {selectedNote.quiz.length}</span>
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">Practice: {selectedNote.title}</span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-xl mb-6">{selectedNote.quiz[quizIndex].question}</h4>
                              <div className="space-y-3">
                                {selectedNote.quiz[quizIndex].options.map((opt, i) => {
                                  let btnClass = "border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 text-slate-700";
                                  const isOptionSelected = selectedOpt === i;
                                  const optionText = opt;
                                  const correctText = selectedNote.quiz[quizIndex].answer;

                                  if (isQuizSubmitted) {
                                    if (optionText === correctText) {
                                      btnClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                                    } else if (isOptionSelected) {
                                      btnClass = "border-rose-500 bg-rose-50 text-rose-800 font-bold";
                                    } else {
                                      btnClass = "border-slate-100 opacity-60 text-slate-400";
                                    }
                                  } else if (isOptionSelected) {
                                    btnClass = "border-blue-500 bg-blue-50 text-blue-800 font-bold";
                                  }
                                  return (
                                    <button key={opt} disabled={isQuizSubmitted} onClick={() => setSelectedOpt(i)} className={`w-full text-left p-4 border-2 rounded-2xl transition-all font-medium flex items-center justify-between ${btnClass}`}>
                                      <span>{opt}</span>
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isOptionSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-200'}`}>{isOptionSelected && <CheckCircle2 className="w-4 h-4 text-white" />}</div>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                {!isQuizSubmitted ? (
                                  <button onClick={() => { if (selectedOpt === null) { showToast('Please select an option first'); return; } const correctText = selectedNote.quiz[quizIndex].answer; const chosenText = selectedNote.quiz[quizIndex].options[selectedOpt]; if (chosenText === correctText) setQuizScore(prev => prev + 1); setIsQuizSubmitted(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg active:scale-95">Submit Answer</button>
                                ) : (
                                  <button onClick={() => { if (quizIndex + 1 < selectedNote.quiz.length) { setQuizIndex(prev => prev + 1); setSelectedOpt(null); setIsQuizSubmitted(false); } else { setQuizFinished(true); } }} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                                    {quizIndex + 1 < selectedNote.quiz.length ? 'Next Question' : 'Finish Quiz'} <ChevronRight className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {notes.filter(n => n.quiz && n.quiz.length > 0).length === 0 ? (
                        <div className="col-span-full text-center py-16 text-slate-400 bg-white/50 rounded-[2rem] border border-slate-100 shadow-sm">
                          <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                          <p className="font-medium">No notes with practice quizzes available yet.</p>
                          <p className="text-sm mt-1">Upload a PDF note or generate master notes with AI to get started!</p>
                        </div>
                      ) : (
                        notes.filter(n => n.quiz && n.quiz.length > 0).map(n => (
                          <button key={n.id} onClick={() => { setSelectedNote(n); }} className="text-left bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group">
                            <div>
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                                {subjects.find((s) => s.id === n.subjectId)?.icon} {subjects.find((s) => s.id === n.subjectId)?.name}
                              </span>
                              <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{n.title}</h3>
                              <p className="text-xs text-slate-500 mt-1">{n.quiz.length} Questions · by {n.authorName}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════
                   FLASHCARDS
                 ════════════════════════════════════════════════ */}
              {activeTab === 'flashcards' && (
                <motion.div key="flashcards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-8">
                  <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">⚡ Flashcards</h2>
                    <p className="text-slate-500 font-medium">Click to flip and reveal the answers. Great for active recall.</p>
                  </div>

                  {selectedNote ? (
                    <div>
                      <button onClick={() => setSelectedNote(null)} className="mb-4 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1">← Select different note</button>

                      {(!selectedNote.flashcards || selectedNote.flashcards.length === 0) ? (
                        <div className="text-center py-12 text-slate-400 bg-white/50 rounded-[2rem] border border-slate-100 shadow-sm">
                          <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="font-medium">No flashcards generated for this note.</p>
                        </div>
                      ) : (
                        <div className="max-w-xl mx-auto space-y-6">
                          <div className="flex items-center justify-between px-2">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Card {flashIndex + 1} of {selectedNote.flashcards.length}</span>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Interactive: {selectedNote.title}</span>
                          </div>

                          <div onClick={() => setIsFlipped(!isFlipped)} className="relative w-full h-72 cursor-pointer perspective-1000">
                            <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full h-full relative transform-style-3d">
                              <div className={`absolute inset-0 backface-hidden rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg border border-white/10 bg-gradient-to-br from-indigo-500 to-blue-600 text-white ${isFlipped ? 'pointer-events-none' : ''}`}>
                                <span className="absolute top-6 left-6 text-xs font-bold text-white/60 uppercase tracking-wider">Question / Concept</span>
                                <h3 className="text-2xl font-bold leading-normal px-4">{selectedNote.flashcards[flashIndex].front}</h3>
                                <span className="absolute bottom-6 text-xs text-white/50">Click to flip</span>
                              </div>
                              <div className={`absolute inset-0 backface-hidden rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg border border-slate-200 bg-white text-slate-800 rotate-y-180 ${!isFlipped ? 'pointer-events-none' : ''}`}>
                                <span className="absolute top-6 left-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Answer / Explanation</span>
                                <p className="text-lg font-medium leading-relaxed text-slate-700 px-4">{selectedNote.flashcards[flashIndex].back}</p>
                                <span className="absolute bottom-6 text-xs text-slate-400">Click to flip back</span>
                              </div>
                            </motion.div>
                          </div>

                          <div className="flex items-center justify-between pt-4">
                            <button disabled={flashIndex === 0} onClick={() => { if (flashIndex > 0) { setFlashIndex(prev => prev - 1); setIsFlipped(false); } }} className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
                            <button onClick={() => setIsFlipped(!isFlipped)} className="px-6 py-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors">🔄 Flip Card</button>
                            <button disabled={flashIndex === selectedNote.flashcards.length - 1} onClick={() => { if (flashIndex < selectedNote.flashcards.length - 1) { setFlashIndex(prev => prev + 1); setIsFlipped(false); } }} className="px-5 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {notes.filter(n => n.flashcards && n.flashcards.length > 0).length === 0 ? (
                        <div className="col-span-full text-center py-16 text-slate-400 bg-white/50 rounded-[2rem] border border-slate-100 shadow-sm">
                          <Layers className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                          <p className="font-medium">No notes with flashcards available yet.</p>
                          <p className="text-sm mt-1">Upload a PDF note or generate master notes with AI to get started!</p>
                        </div>
                      ) : (
                        notes.filter(n => n.flashcards && n.flashcards.length > 0).map(n => (
                          <button key={n.id} onClick={() => { setSelectedNote(n); }} className="text-left bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group">
                            <div>
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                                {subjects.find((s) => s.id === n.subjectId)?.icon} {subjects.find((s) => s.id === n.subjectId)?.name}
                              </span>
                              <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{n.title}</h3>
                              <p className="text-xs text-slate-500 mt-1">{n.flashcards.length} Cards · by {n.authorName}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ─── Floating Ask AI Button ──────────────────────── */}
          <div className="fixed bottom-6 md:bottom-8 right-6 md:right-8 z-20 w-[90%] md:w-auto">
            <AnimatePresence>
              {isAiChatOpen ? (
                <motion.div
                  ref={chatRef}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="mesh-card rounded-[2rem] shadow-2xl border border-white/70 w-full md:w-[400px] overflow-hidden flex flex-col h-[500px] max-h-[80vh]"
                >
                  <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-1.5 rounded-full"><Sparkles className="w-4 h-4 text-white" /></div>
                      <span className="font-bold">AI Study Assistant</span>
                    </div>
                    <button onClick={() => setIsAiChatOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'}`}>
                          <div className="text-sm leading-relaxed whitespace-pre-line space-y-1">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isAiTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 text-slate-700 p-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Suggestion Chips */}
                  <div className="px-3 py-2 bg-slate-100 border-t border-slate-200/60 flex gap-2 overflow-x-auto hide-scrollbar shrink-0">
                    {chips.map((chipText) => (
                      <button
                        key={chipText}
                        type="button"
                        onClick={() => handleChipClick(chipText)}
                        disabled={isAiTyping}
                        className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {chipText}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                    <form onSubmit={handleSendMessage} className="relative">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder={isAiTyping ? "AI is typing..." : "Ask a question..."}
                        disabled={isAiTyping}
                        className="w-full bg-slate-100 border-none rounded-full py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={!chatMessage.trim() || isAiTyping}
                        className="absolute right-1.5 top-1.5 bottom-1.5 w-9 bg-blue-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-slate-400 transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={() => setIsAiChatOpen(true)}
                  className="w-full md:w-auto group flex items-center justify-center gap-3 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 hover:from-slate-900 hover:to-indigo-900 text-white px-6 md:px-7 py-3.5 rounded-full font-bold shadow-2xl shadow-cyan-950/40 transition-all hover:shadow-cyan-500/20 hover:-translate-y-1 active:translate-y-0 border border-cyan-500/30 cursor-pointer"
                >
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-7 h-7 rounded-full bg-cyan-500/30 animate-ping pointer-events-none" />
                    <div className="relative bg-gradient-to-r from-cyan-400 to-blue-600 p-2 rounded-full shadow-md shadow-cyan-500/40 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <span className="font-display font-bold text-sm tracking-wide bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Ask Neural AI Tutor</span>
                </button>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </motion.div>
  );
}
