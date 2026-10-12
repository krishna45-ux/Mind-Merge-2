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
      className="flex flex-col h-screen font-sans text-[#2C1A12] bg-[#FAF7F2]"
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
            className="fixed bottom-24 left-1/2 z-[60] bg-[#2C1A12] text-white px-6 py-3 rounded-full shadow-xl font-medium flex items-center gap-2 border border-[#3E261B]"
          >
            <CheckCircle2 className="w-5 h-5 text-[#C26D43]" />
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
            className="fixed inset-0 bg-[#2C1A12]/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-[#EDE4D8] flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3 md:gap-6">
          <button className="md:hidden text-[#8A7D73] hover:text-[#2C1A12]" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-serif text-xl font-bold tracking-tight flex items-center gap-2 text-[#2C1A12]">
            <span>MindMerge AI</span>
          </h1>
          <div className="h-5 w-px bg-[#EDE4D8] hidden sm:block"></div>
          <h2 className="text-sm font-semibold text-[#6D6056] hidden sm:block">Student Hub</h2>
        </div>
        <div className="flex items-center gap-3 md:gap-5">
          <button className="relative p-2 text-[#8A7D73] hover:text-[#2C1A12] hover:bg-[#FAF7F2] rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C26D43] rounded-full animate-pulse"></span>
          </button>
          <div className="flex items-center gap-3 pl-3 md:pl-5 border-l border-[#EDE4D8]">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#2C1A12] leading-none">{studentName}</p>
              <p className="text-xs font-medium text-[#8A7D73] mt-1">Class 10-A · Scholar</p>
            </div>
            <img src={studentAvatar} alt="Profile" className="w-9 h-9 md:w-10 md:h-10 rounded-full ring-2 ring-[#EDE4D8] shadow-sm" referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      {/* ─── Main ────────────────────────────────────────────── */}
      <main id="main-content" className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-[#FAF7F2]">
        {/* Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-72 bg-white border-r border-[#EDE4D8] flex flex-col py-4 md:py-6 shrink-0 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-xl md:shadow-none`}
        >
          <div className="flex items-center justify-between px-4 mb-4 md:hidden">
            <h2 className="font-bold text-[#2C1A12]">Menu</h2>
            <button className="text-[#8A7D73]" onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
          </div>

          <nav className="flex flex-col gap-1.5 px-4">
            <button
              onClick={() => { setActiveTab('explore'); setSelectedNote(null); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 text-left px-4 py-3 rounded-2xl font-bold transition-all border ${activeTab === 'explore' ? 'text-[#2C1A12] bg-[#F5EFE6] border-[#E5DACB] shadow-sm' : 'text-[#6D6056] hover:bg-[#FAF7F2] hover:text-[#2C1A12] border-transparent'}`}
            >
              <Search className={`w-5 h-5 ${activeTab === 'explore' ? 'text-[#C26D43]' : 'text-[#8A7D73]'}`} />
              <span>Explore Notes</span>
            </button>
            <button
              onClick={() => { setActiveTab('master-notes'); setSelectedNote(null); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 text-left px-4 py-3 rounded-2xl font-bold transition-all border ${activeTab === 'master-notes' ? 'text-[#2C1A12] bg-[#F5EFE6] border-[#E5DACB] shadow-sm' : 'text-[#6D6056] hover:bg-[#FAF7F2] hover:text-[#2C1A12] border-transparent'}`}
            >
              <Crown className={`w-5 h-5 ${activeTab === 'master-notes' ? 'text-[#C26D43]' : 'text-[#8A7D73]'}`} />
              <span>Master Notes</span>
            </button>
            <button
              onClick={() => { setActiveTab('upload'); setSelectedNote(null); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 text-left px-4 py-3 rounded-2xl font-bold transition-all border ${activeTab === 'upload' ? 'text-[#2C1A12] bg-[#F5EFE6] border-[#E5DACB] shadow-sm' : 'text-[#6D6056] hover:bg-[#FAF7F2] hover:text-[#2C1A12] border-transparent'}`}
            >
              <Upload className={`w-5 h-5 ${activeTab === 'upload' ? 'text-[#C26D43]' : 'text-[#8A7D73]'}`} />
              <span>Upload Notes</span>
            </button>
            <button
              onClick={() => { setActiveTab('practice-quiz'); setSelectedNote(null); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 text-left px-4 py-3 rounded-2xl font-bold transition-all border ${activeTab === 'practice-quiz' ? 'text-[#2C1A12] bg-[#F5EFE6] border-[#E5DACB] shadow-sm' : 'text-[#6D6056] hover:bg-[#FAF7F2] hover:text-[#2C1A12] border-transparent'}`}
            >
              <Target className={`w-5 h-5 ${activeTab === 'practice-quiz' ? 'text-[#C26D43]' : 'text-[#8A7D73]'}`} />
              <span>Practice Quiz</span>
            </button>
            <button
              onClick={() => { setActiveTab('flashcards'); setSelectedNote(null); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 text-left px-4 py-3 rounded-2xl font-bold transition-all border ${activeTab === 'flashcards' ? 'text-[#2C1A12] bg-[#F5EFE6] border-[#E5DACB] shadow-sm' : 'text-[#6D6056] hover:bg-[#FAF7F2] hover:text-[#2C1A12] border-transparent'}`}
            >
              <Layers className={`w-5 h-5 ${activeTab === 'flashcards' ? 'text-[#C26D43]' : 'text-[#8A7D73]'}`} />
              <span>Flashcards</span>
            </button>
          </nav>

          {/* Progress Card */}
          <div className="px-4 mt-auto pt-6">
            <div className="bg-[#F5EFE6] border border-[#E5DACB] rounded-2xl p-4.5 shadow-sm text-[#2C1A12] relative overflow-hidden mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8A7D73]">Study Matrix</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#EDE4D8] text-[#2C1A12] rounded-full border border-[#DFD2C0]">Level 2</span>
              </div>
              <h4 className="font-serif font-bold text-base text-[#2C1A12] mb-0.5">Your Progress</h4>
              <p className="text-[#7A6E65] text-xs mb-3">{notes.length} notes active in catalog</p>
              
              <div className="w-full bg-[#EDE4D8] rounded-full h-2 mb-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#C26D43] to-[#A85832] h-2 rounded-full w-[65%]" />
              </div>
              <div className="flex justify-between items-center text-[11px] font-semibold text-[#7A6E65]">
                <span>Mastery Rate</span>
                <span className="text-[#C26D43] font-bold">65%</span>
              </div>
            </div>
            
            <button onClick={onLogout} className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl font-semibold transition-all text-[#6D6056] hover:bg-[#F5EFE6] hover:text-[#2C1A12] cursor-pointer">
              <LogOut className="w-4 h-4 text-[#8A7D73]" />
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
                  {/* Welcome Academic Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 bg-gradient-to-br from-[#684736] via-[#75503D] to-[#5A3C2D] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden border border-[#8A614A] shadow-xl shadow-[#5A3C2D]/15"
                  >
                    <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#C26D43]/20 blur-3xl pointer-events-none" />
                    <div className="absolute right-24 bottom-0 h-32 w-32 rounded-full bg-[#FAF7F2]/10 blur-3xl pointer-events-none" />
                    
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[#FAF7F2] text-xs font-semibold tracking-wider uppercase mb-3 backdrop-blur-sm">
                      <span>{greeting.emoji} {greeting.text}</span>
                    </div>

                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
                      {studentName}
                    </h2>
                    <p className="text-[#F5EDE4] text-sm max-w-xl leading-relaxed mb-6">
                      Pick up where you left off. Search across {notes.length} curated teacher and student notes, test yourself with practice quizzes, and master concepts with flashcards.
                    </p>

                    {/* Quick Action Shortcuts */}
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => setActiveTab('practice-quiz')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
                      >
                        <Target className="w-3.5 h-3.5 text-[#F6C2A7]" />
                        <span>Quick Quiz</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('flashcards')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#FDE68A]" />
                        <span>Flashcard Sprint</span>
                      </button>
                      <button
                        onClick={() => setIsAiChatOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C26D43] hover:bg-[#A85832] border border-[#D98256] text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-[#C26D43]/20"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        <span>Ask AI Assistant</span>
                      </button>
                    </div>
                  </motion.div>

                  <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C1A12] tracking-tight">Explore Study Notes</h2>
                      <p className="text-[#6D6056] text-sm font-medium">Search verified classroom materials and AI-generated Master Guides.</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-[#F5EFE6] text-[#6D6056] border border-[#EDE4D8] rounded-full self-start sm:self-auto">
                      {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A7D73]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by title, keywords, or topic…"
                        className="w-full pl-12 pr-5 py-4 rounded-2xl border border-[#EDE4D8] bg-white focus:outline-none focus:ring-4 focus:ring-[#C26D43]/15 focus:border-[#C26D43] transition-all text-[#2C1A12] placeholder:text-[#8A7D73] text-sm md:text-base shadow-xs font-medium"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A7D73] hover:text-[#2C1A12] p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="relative shrink-0">
                      <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7D73]" />
                      <select
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                        className="pl-10 pr-10 py-4 rounded-2xl border border-[#EDE4D8] bg-white focus:outline-none focus:ring-4 focus:ring-[#C26D43]/15 focus:border-[#C26D43] transition-all text-[#2C1A12] text-sm font-bold shadow-xs appearance-none w-full sm:w-auto cursor-pointer"
                      >
                        <option value="all">All Subjects</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7D73] pointer-events-none" />
                    </div>
                  </div>

                  {/* Results */}
                  <div className="space-y-4">
                    {searchResults.length === 0 && (
                      <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-[#EDE4D8] bg-[#F5EFE6]/50">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#F5EFE6] flex items-center justify-center text-[#8A7D73]">
                          <Search className="w-7 h-7" />
                        </div>
                        <p className="font-serif font-bold text-[#2C1A12] text-lg">No notes found</p>
                        <p className="text-sm text-[#6D6056] mt-1 max-w-sm mx-auto mb-5">Try adjusting your keyword search or switch the subject filter to view more materials.</p>
                        {filterSubject !== 'all' && (
                          <button
                            onClick={() => setFilterSubject('all')}
                            className="px-4 py-2 rounded-xl bg-[#684736] text-white text-xs font-bold hover:bg-[#5A3C2D] transition-colors cursor-pointer"
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
                          className={`w-full text-left bg-white rounded-3xl p-5 md:p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 border border-[#EDE4D8] transition-all duration-300 group cursor-pointer ${n.type === 'master' ? 'ring-1 ring-[#C26D43]/30 border-[#C26D43]/40' : ''}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${n.type === 'master' ? 'bg-gradient-to-br from-[#C26D43] to-[#A85832] text-white shadow-sm' : n.authorRole === 'student' ? 'bg-[#EAF3EB] text-[#2E6B3A]' : 'bg-[#F5EFE6] text-[#684736]'}`}>
                                {n.type === 'master' ? <Crown className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  {n.type === 'master' && (
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#C26D43] to-[#A85832] text-white shadow-xs">👑 Master Note</span>
                                  )}
                                  {n.authorRole === 'student' && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF3EB] text-[#2E6B3A] border border-[#D5E8D7]">Student</span>
                                  )}
                                  <span className="text-[11px] font-bold text-[#8A7D73]">
                                    {subjects.find((s) => s.id === n.subjectId)?.icon} {subjects.find((s) => s.id === n.subjectId)?.name}
                                  </span>
                                </div>
                                <h3 className="font-serif font-bold text-[#2C1A12] group-hover:text-[#C26D43] transition-colors truncate text-lg tracking-tight">{n.title}</h3>
                                <p className="text-xs font-medium text-[#8A7D73] mt-1">Uploaded by {n.authorName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-5 shrink-0">
                              <div className="text-center">
                                <p className="text-[10px] uppercase tracking-wider text-[#8A7D73] font-bold flex items-center justify-center gap-1"><Bot className="w-3 h-3 text-[#C26D43]" /> AI Rating</p>
                                {renderStars(n.aiRating)}
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] uppercase tracking-wider text-[#8A7D73] font-bold flex items-center justify-center gap-1"><Star className="w-3 h-3 text-amber-500" /> Student Score</p>
                                {avgStudent > 0 ? renderStars(avgStudent) : <span className="text-xs font-medium text-[#8A7D73]">—</span>}
                              </div>
                              <ChevronRight className="w-5 h-5 text-[#8A7D73] group-hover:text-[#C26D43] transition-colors group-hover:translate-x-1 duration-200" />
                            </div>
                          </div>
                          {/* Keywords */}
                          {n.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#EDE4D8]">
                              {n.keywords.slice(0, 5).map((kw) => (
                                <span key={kw} className="text-[10px] font-semibold text-[#6D6056] bg-[#F5EFE6] border border-[#EDE4D8] rounded-full px-2.5 py-0.5">{kw}</span>
                              ))}
                              {n.keywords.length > 5 && <span className="text-[10px] font-semibold text-[#8A7D73]">+{n.keywords.length - 5} more</span>}
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
                    className="flex items-center gap-2 text-sm font-bold text-[#6D6056] hover:text-[#C26D43] mb-6 transition-colors cursor-pointer"
                  >
                    ← Back to {activeTab === 'master-notes' ? 'Master Notes' : 'Explore'}
                  </button>

                  {/* Note Header */}
                  <div className="mb-10 rounded-[2rem] bg-white p-8 md:p-10 border border-[#EDE4D8] shadow-xs">
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      {selectedNote.type === 'master' && (
                        <span className="px-3 py-1 bg-gradient-to-r from-[#C26D43] to-[#A85832] text-white text-xs font-bold rounded-md uppercase tracking-wide shadow-xs">👑 Master Note</span>
                      )}
                      <span className="px-3 py-1 bg-[#EAF3EB] text-[#2E6B3A] border border-[#D5E8D7] text-xs font-bold rounded-md uppercase tracking-wide">Published</span>
                      <span className="text-sm font-medium text-[#8A7D73]">
                        {subjects.find((s) => s.id === selectedNote.subjectId)?.icon} {subjects.find((s) => s.id === selectedNote.subjectId)?.name}
                      </span>
                    </div>
                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#2C1A12] mb-6 tracking-tight leading-tight">{selectedNote.title}</h1>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pb-6 border-b border-[#EDE4D8]">
                      <div className="flex items-center gap-3">
                        {selectedNote.authorAvatar ? (
                          <img src={selectedNote.authorAvatar} alt={selectedNote.authorName} className="w-10 h-10 md:w-12 md:h-12 rounded-full ring-2 ring-[#EDE4D8] shadow-xs" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#684736] to-[#5A3C2D] flex items-center justify-center shadow-xs ring-2 ring-[#EDE4D8]">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-serif font-bold text-[#2C1A12] text-base md:text-lg leading-none">{selectedNote.authorName}</p>
                          <p className="text-sm font-medium text-[#8A7D73] mt-1">{selectedNote.authorRole === 'student' ? 'Student Contributor' : 'Faculty'}</p>
                        </div>
                      </div>

                      {/* Ratings side-by-side */}
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#8A7D73] font-bold flex items-center gap-1 mb-1"><Bot className="w-3 h-3 text-[#C26D43]" /> AI Rating</p>
                          {renderStars(selectedNote.aiRating)}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#8A7D73] font-bold flex items-center gap-1 mb-1"><Star className="w-3 h-3 text-amber-500" /> Student Avg ({selectedNote.studentRatings.length})</p>
                          {getAvgStudentRating(selectedNote) > 0 ? renderStars(getAvgStudentRating(selectedNote)) : <span className="text-xs text-[#8A7D73]">No ratings yet</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedNote.pdfData && (
                    <div className="mb-6 p-4 rounded-2xl bg-[#F5EFE6] border border-[#E5DACB] flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#684736] text-white flex items-center justify-center shadow-xs">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-[#2C1A12] text-sm md:text-base leading-tight">{selectedNote.pdfName || 'attachment.pdf'}</p>
                          <p className="text-xs text-[#8A7D73] mt-0.5">PDF Document Attachment</p>
                        </div>
                      </div>
                      <a
                        href={selectedNote.pdfData}
                        download={selectedNote.pdfName || 'attachment.pdf'}
                        onClick={(e) => e.stopPropagation()}
                        className="px-6 py-2.5 bg-[#C26D43] hover:bg-[#A85832] text-white rounded-xl text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4 rotate-180" /> Download PDF
                      </a>
                    </div>
                  )}

                  {/* Detail Tab Navigation */}
                  <div className="flex border border-[#EDE4D8] mb-6 bg-[#F5EFE6] p-1 rounded-xl max-w-lg">
                    <button
                      onClick={() => setDetailTab('content')}
                      className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab === 'content' ? 'bg-white text-[#2C1A12] shadow-xs' : 'text-[#6D6056] hover:text-[#2C1A12]'}`}
                    >
                      📚 Study Guide
                    </button>
                    <button
                      onClick={() => setDetailTab('questions')}
                      className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab === 'questions' ? 'bg-white text-[#2C1A12] shadow-xs' : 'text-[#6D6056] hover:text-[#2C1A12]'}`}
                    >
                      ❓ Questions
                    </button>
                    <button
                      onClick={() => setDetailTab('quiz')}
                      className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab === 'quiz' ? 'bg-white text-[#2C1A12] shadow-xs' : 'text-[#6D6056] hover:text-[#2C1A12]'}`}
                    >
                      🧠 Quiz
                    </button>
                    <button
                      onClick={() => setDetailTab('flashcards')}
                      className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab === 'flashcards' ? 'bg-white text-[#2C1A12] shadow-xs' : 'text-[#6D6056] hover:text-[#2C1A12]'}`}
                    >
                      ⚡ Flashcards
                    </button>
                  </div>

                  {/* Render based on detailTab */}
                  {detailTab === 'content' && (
                    <div className="prose prose-lg md:prose-xl prose-stone max-w-none rounded-[2rem] bg-white p-8 md:p-10 border border-[#EDE4D8] shadow-xs mb-8 text-[#2C1A12]">
                      {selectedNote.content.split('\n').map((line, i) => {
                        if (line.startsWith('🏆') || line.startsWith('──')) {
                          return <h3 key={i} className="font-serif text-xl font-bold text-[#2C1A12] mt-6 mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#C26D43]" />{line.replace(/^🏆\s*/, '').replace(/^──\s*/, '')}</h3>;
                        }
                        if (line.startsWith('•')) {
                          return <li key={i} className="text-[#4A3B32] leading-relaxed ml-4 list-disc marker:text-[#C26D43]">{line.replace(/^•\s*/, '')}</li>;
                        }
                        if (line.match(/^\d+\./)) {
                          return <h3 key={i} className="font-serif text-xl font-bold text-[#2C1A12] mt-8 mb-3 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[#F5EFE6] text-[#684736] border border-[#EDE4D8] flex items-center justify-center text-sm font-bold shadow-xs">{line.match(/^\d+/)?.[0]}</div>{line.replace(/^\d+\.\s*/, '')}</h3>;
                        }
                        if (line.trim() === '') return <br key={i} />;
                        return <p key={i} className="text-[#4A3B32] leading-relaxed mb-2">{line}</p>;
                      })}
                    </div>
                  )}

                  {detailTab === 'questions' && (
                    <div className="mb-8 space-y-6">
                      {(!selectedNote.importantQuestions || selectedNote.importantQuestions.length === 0) ? (
                        <div className="text-center py-12 text-[#8A7D73] bg-white rounded-[2rem] border border-[#EDE4D8] shadow-xs">
                          <HelpCircle className="w-12 h-12 mx-auto mb-3 text-[#8A7D73]" />
                          <p className="font-medium">No important questions generated for this note.</p>
                        </div>
                      ) : (
                        selectedNote.importantQuestions.map((q, idx) => (
                          <div key={idx} className="p-6 rounded-[1.5rem] bg-white border border-[#EDE4D8] shadow-xs space-y-3">
                            <h4 className="font-serif font-bold text-[#2C1A12] text-lg flex items-start gap-3">
                              <span className="w-6 h-6 rounded-md bg-[#F5EFE6] text-[#C26D43] border border-[#EDE4D8] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">Q{idx + 1}</span>
                              {q.question}
                            </h4>
                            <div className="pl-9 text-[#4A3B32] leading-relaxed whitespace-pre-line text-sm">
                              <strong className="text-[#2C1A12]">Answer:</strong> {q.answer}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {detailTab === 'quiz' && (
                    <div className="mb-8">
                      {(!selectedNote.quiz || selectedNote.quiz.length === 0) ? (
                        <div className="text-center py-12 text-[#8A7D73] bg-white rounded-[2rem] border border-[#EDE4D8] shadow-xs">
                          <Bot className="w-12 h-12 mx-auto mb-3 text-[#8A7D73]" />
                          <p className="font-medium">No practice quiz generated for this note.</p>
                        </div>
                      ) : (
                        <div>
                          {quizFinished ? (
                            <div className="bg-white border border-[#EDE4D8] rounded-[2rem] p-8 md:p-12 shadow-xs text-center max-w-2xl mx-auto space-y-6">
                              <div className="w-20 h-20 bg-[#EAF3EB] text-[#2E6B3A] rounded-full flex items-center justify-center mx-auto text-3xl">🏆</div>
                              <h3 className="font-serif text-2xl font-bold text-[#2C1A12]">Quiz Completed!</h3>
                              <p className="text-[#6D6056] font-medium text-lg text-center font-sans">
                                You scored <span className="font-bold text-[#C26D43]">{quizScore}</span> out of <span className="font-bold text-[#2C1A12]">{selectedNote.quiz.length}</span>!
                              </p>
                              <div className="w-full bg-[#F5EFE6] rounded-full h-3">
                                <div className="bg-[#C26D43] h-3 rounded-full transition-all duration-500" style={{ width: `${(quizScore / selectedNote.quiz.length) * 100}%` }}></div>
                              </div>
                              <button onClick={() => { setQuizIndex(0); setSelectedOpt(null); setQuizScore(0); setIsQuizSubmitted(false); setQuizFinished(false); }} className="px-6 py-3 bg-[#C26D43] text-white rounded-xl font-bold hover:bg-[#A85832] transition-colors shadow-xs cursor-pointer">Restart Quiz</button>
                            </div>
                          ) : (
                            <div className="bg-white border border-[#EDE4D8] rounded-[2rem] p-6 md:p-8 shadow-xs">
                              <div className="flex items-center justify-between mb-6">
                                <span className="text-sm font-bold text-[#8A7D73] uppercase tracking-wider">Question {quizIndex + 1} of {selectedNote.quiz.length}</span>
                                <span className="px-3 py-1 bg-[#F5EFE6] text-[#684736] text-xs font-bold rounded-full border border-[#EDE4D8]">Practice</span>
                              </div>
                              <h4 className="font-serif font-bold text-[#2C1A12] text-xl mb-6">{selectedNote.quiz[quizIndex].question}</h4>
                              <div className="space-y-3">
                                {selectedNote.quiz[quizIndex].options.map((opt, i) => {
                                  let btnClass = "border-[#EDE4D8] hover:border-[#C26D43]/40 hover:bg-[#F5EFE6]/40 text-[#2C1A12]";
                                  const isOptionSelected = selectedOpt === i;
                                  const optionText = opt;
                                  const correctText = selectedNote.quiz[quizIndex].answer;

                                  if (isQuizSubmitted) {
                                    if (optionText === correctText) {
                                      btnClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                                    } else if (isOptionSelected) {
                                      btnClass = "border-rose-500 bg-rose-50 text-rose-800 font-bold";
                                    } else {
                                      btnClass = "border-[#EDE4D8] opacity-60 text-[#8A7D73]";
                                    }
                                  } else if (isOptionSelected) {
                                    btnClass = "border-[#C26D43] bg-[#F5EFE6] text-[#2C1A12] font-bold";
                                  }
                                  return (
                                    <button key={opt} disabled={isQuizSubmitted} onClick={() => setSelectedOpt(i)} className={`w-full text-left p-4 border-2 rounded-2xl transition-all font-medium flex items-center justify-between cursor-pointer ${btnClass}`}>
                                      <span>{opt}</span>
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isOptionSelected ? 'border-[#C26D43] bg-[#C26D43]' : 'border-[#EDE4D8]'}`}>{isOptionSelected && <CheckCircle2 className="w-4 h-4 text-white" />}</div>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="mt-8 pt-6 border-t border-[#EDE4D8] flex justify-end">
                                {!isQuizSubmitted ? (
                                  <button onClick={() => { if (selectedOpt === null) { showToast('Please select an option first'); return; } const correctText = selectedNote.quiz[quizIndex].answer; const chosenText = selectedNote.quiz[quizIndex].options[selectedOpt]; if (chosenText === correctText) setQuizScore(prev => prev + 1); setIsQuizSubmitted(true); }} className="bg-[#C26D43] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#A85832] transition-colors shadow-xs cursor-pointer">Submit Answer</button>
                                ) : (
                                  <button onClick={() => { if (quizIndex + 1 < selectedNote.quiz.length) { setQuizIndex(prev => prev + 1); setSelectedOpt(null); setIsQuizSubmitted(false); } else { setQuizFinished(true); } }} className="flex items-center gap-2 bg-[#684736] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#5A3C2D] transition-colors cursor-pointer">
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
                        <div className="text-center py-12 text-[#8A7D73] bg-white rounded-[2rem] border border-[#EDE4D8] shadow-xs">
                          <Layers className="w-12 h-12 mx-auto mb-3 text-[#8A7D73]" />
                          <p className="font-medium">No flashcards generated for this note.</p>
                        </div>
                      ) : (
                        <div className="max-w-xl mx-auto space-y-6">
                          <div className="flex items-center justify-between px-2">
                            <span className="text-sm font-bold text-[#8A7D73] uppercase tracking-wider">Card {flashIndex + 1} of {selectedNote.flashcards.length}</span>
                            <span className="text-xs font-bold text-[#684736] bg-[#F5EFE6] border border-[#EDE4D8] px-2.5 py-1 rounded-full">Interactive</span>
                          </div>

                          <div onClick={() => setIsFlipped(!isFlipped)} className="relative w-full h-72 cursor-pointer perspective-1000">
                            <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full h-full relative transform-style-3d">
                              <div className={`absolute inset-0 backface-hidden rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg border border-white/10 bg-gradient-to-br from-[#684736] via-[#75503D] to-[#5A3C2D] text-white ${isFlipped ? 'pointer-events-none' : ''}`}>
                                <span className="absolute top-6 left-6 text-xs font-bold text-white/70 uppercase tracking-wider">Question / Concept</span>
                                <h3 className="font-serif text-2xl font-bold leading-normal px-4 text-white">{selectedNote.flashcards[flashIndex].front}</h3>
                                <span className="absolute bottom-6 text-xs text-white/60">Click to flip</span>
                              </div>
                              <div className={`absolute inset-0 backface-hidden rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg border border-[#EDE4D8] bg-white text-[#2C1A12] rotate-y-180 ${!isFlipped ? 'pointer-events-none' : ''}`}>
                                <span className="absolute top-6 left-6 text-xs font-bold text-[#8A7D73] uppercase tracking-wider">Answer / Explanation</span>
                                <p className="text-lg font-medium leading-relaxed text-[#4A3B32] px-4">{selectedNote.flashcards[flashIndex].back}</p>
                                <span className="absolute bottom-6 text-xs text-[#8A7D73]">Click to flip back</span>
                              </div>
                            </motion.div>
                          </div>

                          <div className="flex items-center justify-between pt-4">
                            <button disabled={flashIndex === 0} onClick={() => { if (flashIndex > 0) { setFlashIndex(prev => prev - 1); setIsFlipped(false); } }} className="px-5 py-3 rounded-xl bg-white border border-[#EDE4D8] text-[#2C1A12] font-bold hover:bg-[#F5EFE6] transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Previous</button>
                            <button onClick={() => setIsFlipped(!isFlipped)} className="px-6 py-3 rounded-xl bg-[#F5EFE6] text-[#2C1A12] font-bold hover:bg-[#E5DACB] transition-colors border border-[#EDE4D8] cursor-pointer">🔄 Flip Card</button>
                            <button disabled={flashIndex === selectedNote.flashcards.length - 1} onClick={() => { if (flashIndex < selectedNote.flashcards.length - 1) { setFlashIndex(prev => prev + 1); setIsFlipped(false); } }} className="px-5 py-3 rounded-xl bg-[#684736] text-white font-bold hover:bg-[#5A3C2D] transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Next</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rate This Note */}
                  <div className="rounded-[2rem] bg-white p-8 border border-[#EDE4D8] shadow-xs text-center">
                    <h3 className="font-serif text-xl font-bold text-[#2C1A12] mb-2">Rate This Note</h3>
                    <p className="text-[#6D6056] text-sm mb-5">Help other students by sharing your opinion.</p>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      {renderStars(0, true, selectedNote.id)}
                    </div>
                    {userRating > 0 && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#2E6B3A] font-bold text-sm">
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
                    <h2 className="text-3xl font-serif font-bold text-[#2C1A12] mb-2">👑 Master Notes</h2>
                    <p className="text-[#6D6056] font-medium">AI-synthesized comprehensive notes combining all teacher contributions per subject.</p>
                  </div>
                  <div className="space-y-4">
                    {notes.filter((n) => n.type === 'master').length === 0 && (
                      <div className="text-center py-16 text-[#8A7D73] bg-white rounded-[2rem] border border-[#EDE4D8] shadow-xs">
                        <Crown className="w-12 h-12 mx-auto mb-4 text-[#8A7D73]" />
                        <p className="font-serif font-bold text-lg text-[#2C1A12]">No master notes yet</p>
                        <p className="text-sm mt-1 text-[#6D6056]">Teachers need to generate them from the dashboard.</p>
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
                          className="w-full text-left bg-white border border-[#EDE4D8] rounded-[1.5rem] p-6 md:p-8 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
                        >
                          <div className="flex items-center gap-4 mb-3">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#C26D43] to-[#A85832] rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                              <Crown className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-[#C26D43] uppercase tracking-wider">{subjects.find((s) => s.id === n.subjectId)?.icon} {subjects.find((s) => s.id === n.subjectId)?.name}</span>
                              <h3 className="text-xl font-serif font-bold text-[#2C1A12] group-hover:text-[#C26D43] transition-colors">{n.title}</h3>
                            </div>
                            <ChevronRight className="w-6 h-6 text-[#8A7D73] group-hover:text-[#C26D43] transition-colors" />
                          </div>
                          <p className="text-sm text-[#6D6056]">{n.content.slice(0, 120)}…</p>
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
                    <h2 className="text-3xl font-serif font-bold text-[#2C1A12] mb-2">Share Your Notes</h2>
                    <p className="text-[#6D6056] font-medium">Help your fellow students by uploading your own study notes.</p>
                  </div>

                  <div className="bg-white border border-[#EDE4D8] rounded-[2rem] p-6 md:p-10 shadow-xs space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#2C1A12] mb-3">Note Title</label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="e.g., My Summary of Chapter 3: Graph Algorithms"
                        className="w-full px-5 py-4 rounded-xl border border-[#EDE4D8] focus:outline-none focus:ring-4 focus:ring-[#C26D43]/15 focus:border-[#C26D43] transition-all text-[#2C1A12] text-base md:text-lg shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#2C1A12] mb-3">Subject</label>
                      <div className="relative">
                        <select
                          value={uploadSubject}
                          onChange={(e) => setUploadSubject(e.target.value)}
                          className="w-full px-5 py-4 rounded-xl border border-[#EDE4D8] bg-white focus:outline-none focus:ring-4 focus:ring-[#C26D43]/15 focus:border-[#C26D43] transition-all text-[#2C1A12] text-base shadow-xs appearance-none cursor-pointer"
                        >
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A7D73] pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#2C1A12] mb-3">Keywords <span className="text-[#8A7D73] font-normal">(comma-separated)</span></label>
                      <input
                        type="text"
                        value={uploadKeywords}
                        onChange={(e) => setUploadKeywords(e.target.value)}
                        placeholder="e.g., graph, BFS, DFS, shortest path"
                        className="w-full px-5 py-4 rounded-xl border border-[#EDE4D8] focus:outline-none focus:ring-4 focus:ring-[#C26D43]/15 focus:border-[#C26D43] transition-all text-[#2C1A12] text-base shadow-xs"
                      />
                    </div>

                    {selectedFile ? (
                      <div className="p-5 border border-[#E5DACB] rounded-2xl bg-[#F5EFE6] flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#684736] text-white flex items-center justify-center shadow-xs">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-[#2C1A12] text-sm md:text-base leading-tight truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</p>
                            <p className="text-xs text-[#8A7D73] mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · {isExtracting ? 'Extracting text...' : 'Text extracted'}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedFile(null); setPdfData(''); setExtractedPdfText(''); }}
                          className="p-2 hover:bg-[#EDE4D8] rounded-lg text-[#8A7D73] hover:text-[#2C1A12] transition-colors cursor-pointer"
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
                        className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer group ${isDragging ? 'border-[#C26D43] bg-[#F5EFE6] animate-pulse' : 'border-[#EDE4D8] hover:border-[#C26D43]/50 bg-[#FAF7F2] hover:bg-[#F5EFE6]'}`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => e.target.files && e.target.files[0] && handleFileChange(e.target.files[0])}
                          accept="application/pdf"
                          className="hidden"
                        />
                        <div className="w-16 h-16 rounded-full bg-white shadow-xs group-hover:bg-[#F5EFE6] flex items-center justify-center transition-colors">
                          <UploadCloud className="w-8 h-8 text-[#8A7D73] group-hover:text-[#C26D43] transition-colors" />
                        </div>
                        <div className="text-center">
                          <span className="text-base font-semibold text-[#2C1A12] group-hover:text-[#C26D43] block mb-1">Drag & Drop your PDF here</span>
                          <span className="text-sm text-[#8A7D73]">Supports PDF format (Max 50MB)</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-[#EDE4D8] gap-4">
                      <div className="flex items-center gap-2 text-sm text-[#6D6056]">
                        <Bot className="w-4 h-4 text-[#C26D43]" />
                        <span>AI will automatically rate and categorise your notes</span>
                      </div>
                      <button
                        onClick={handleStudentUpload}
                        disabled={isAnalyzing || isExtracting}
                        className="w-full sm:w-auto bg-[#C26D43] hover:bg-[#A85832] text-white px-8 py-4 rounded-xl font-bold tracking-wide shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                   PRACTICE QUIZ
                 ════════════════════════════════════════════════ */}
              {activeTab === 'practice-quiz' && (
                <motion.div key="practice-quiz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-8">
                  <div className="mb-8">
                    <h2 className="text-3xl font-serif font-bold text-[#2C1A12] mb-2">🧠 Practice Quiz</h2>
                    <p className="text-[#6D6056] font-medium">Test your knowledge with AI-generated multiple-choice questions.</p>
                  </div>

                  {selectedNote ? (
                    <div>
                      <button onClick={() => setSelectedNote(null)} className="mb-4 text-sm font-bold text-[#6D6056] hover:text-[#C26D43] transition-colors flex items-center gap-1 cursor-pointer">← Select different note</button>

                      {(!selectedNote.quiz || selectedNote.quiz.length === 0) ? (
                        <div className="text-center py-12 text-[#8A7D73] bg-white rounded-[2rem] border border-[#EDE4D8] shadow-xs">
                          <Bot className="w-12 h-12 mx-auto mb-3 text-[#8A7D73]" />
                          <p className="font-medium">No practice quiz generated for this note.</p>
                        </div>
                      ) : (
                        <div>
                          {quizFinished ? (
                            <div className="bg-white border border-[#EDE4D8] rounded-[2rem] p-8 md:p-12 shadow-xs text-center max-w-2xl mx-auto space-y-6">
                              <div className="w-20 h-20 bg-[#EAF3EB] text-[#2E6B3A] rounded-full flex items-center justify-center mx-auto text-3xl">🏆</div>
                              <h3 className="font-serif text-2xl font-bold text-[#2C1A12]">Quiz Completed!</h3>
                              <p className="text-[#6D6056] font-medium text-lg text-center font-sans">
                                You scored <span className="font-bold text-[#C26D43]">{quizScore}</span> out of <span className="font-bold text-[#2C1A12]">{selectedNote.quiz.length}</span>!
                              </p>
                              <div className="w-full bg-[#F5EFE6] rounded-full h-3">
                                <div className="bg-[#C26D43] h-3 rounded-full transition-all duration-500" style={{ width: `${(quizScore / selectedNote.quiz.length) * 100}%` }}></div>
                              </div>
                              <button onClick={() => { setQuizIndex(0); setSelectedOpt(null); setQuizScore(0); setIsQuizSubmitted(false); setQuizFinished(false); }} className="px-6 py-3 bg-[#C26D43] text-white rounded-xl font-bold hover:bg-[#A85832] transition-colors shadow-xs cursor-pointer">Restart Quiz</button>
                            </div>
                          ) : (
                            <div className="bg-white border border-[#EDE4D8] rounded-[2rem] p-6 md:p-8 shadow-xs">
                              <div className="flex items-center justify-between mb-6">
                                <span className="text-sm font-bold text-[#8A7D73] uppercase tracking-wider">Question {quizIndex + 1} of {selectedNote.quiz.length}</span>
                                <span className="px-3 py-1 bg-[#F5EFE6] text-[#684736] text-xs font-bold rounded-full border border-[#EDE4D8]">Practice: {selectedNote.title}</span>
                              </div>
                              <h4 className="font-serif font-bold text-[#2C1A12] text-xl mb-6">{selectedNote.quiz[quizIndex].question}</h4>
                              <div className="space-y-3">
                                {selectedNote.quiz[quizIndex].options.map((opt, i) => {
                                  let btnClass = "border-[#EDE4D8] hover:border-[#C26D43]/40 hover:bg-[#F5EFE6]/40 text-[#2C1A12]";
                                  const isOptionSelected = selectedOpt === i;
                                  const optionText = opt;
                                  const correctText = selectedNote.quiz[quizIndex].answer;

                                  if (isQuizSubmitted) {
                                    if (optionText === correctText) {
                                      btnClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                                    } else if (isOptionSelected) {
                                      btnClass = "border-rose-500 bg-rose-50 text-rose-800 font-bold";
                                    } else {
                                      btnClass = "border-[#EDE4D8] opacity-60 text-[#8A7D73]";
                                    }
                                  } else if (isOptionSelected) {
                                    btnClass = "border-[#C26D43] bg-[#F5EFE6] text-[#2C1A12] font-bold";
                                  }
                                  return (
                                    <button key={opt} disabled={isQuizSubmitted} onClick={() => setSelectedOpt(i)} className={`w-full text-left p-4 border-2 rounded-2xl transition-all font-medium flex items-center justify-between cursor-pointer ${btnClass}`}>
                                      <span>{opt}</span>
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isOptionSelected ? 'border-[#C26D43] bg-[#C26D43]' : 'border-[#EDE4D8]'}`}>{isOptionSelected && <CheckCircle2 className="w-4 h-4 text-white" />}</div>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="mt-8 pt-6 border-t border-[#EDE4D8] flex justify-end">
                                {!isQuizSubmitted ? (
                                  <button onClick={() => { if (selectedOpt === null) { showToast('Please select an option first'); return; } const correctText = selectedNote.quiz[quizIndex].answer; const chosenText = selectedNote.quiz[quizIndex].options[selectedOpt]; if (chosenText === correctText) setQuizScore(prev => prev + 1); setIsQuizSubmitted(true); }} className="bg-[#C26D43] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#A85832] transition-colors shadow-xs cursor-pointer">Submit Answer</button>
                                ) : (
                                  <button onClick={() => { if (quizIndex + 1 < selectedNote.quiz.length) { setQuizIndex(prev => prev + 1); setSelectedOpt(null); setIsQuizSubmitted(false); } else { setQuizFinished(true); } }} className="flex items-center gap-2 bg-[#684736] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#5A3C2D] transition-colors cursor-pointer">
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
                        <div className="col-span-full text-center py-16 text-[#8A7D73] bg-white rounded-[2rem] border border-[#EDE4D8] shadow-xs">
                          <BookOpen className="w-12 h-12 mx-auto mb-4 text-[#8A7D73]" />
                          <p className="font-serif font-bold text-lg text-[#2C1A12]">No notes with practice quizzes available yet.</p>
                          <p className="text-sm mt-1 text-[#6D6056]">Upload a PDF note or generate master notes with AI to get started!</p>
                        </div>
                      ) : (
                        notes.filter(n => n.quiz && n.quiz.length > 0).map(n => (
                          <button key={n.id} onClick={() => { setSelectedNote(n); }} className="text-left bg-white border border-[#EDE4D8] rounded-3xl p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group cursor-pointer">
                            <div>
                              <span className="text-[10px] font-bold text-[#C26D43] uppercase tracking-wider block mb-1">
                                {subjects.find((s) => s.id === n.subjectId)?.icon} {subjects.find((s) => s.id === n.subjectId)?.name}
                              </span>
                              <h3 className="font-serif font-bold text-[#2C1A12] group-hover:text-[#C26D43] transition-colors">{n.title}</h3>
                              <p className="text-xs text-[#8A7D73] mt-1">{n.quiz.length} Questions · by {n.authorName}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[#8A7D73] group-hover:text-[#C26D43] transition-colors" />
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
                    <h2 className="text-3xl font-serif font-bold text-[#2C1A12] mb-2">⚡ Flashcards</h2>
                    <p className="text-[#6D6056] font-medium">Click to flip and reveal the answers. Great for active recall.</p>
                  </div>

                  {selectedNote ? (
                    <div>
                      <button onClick={() => setSelectedNote(null)} className="mb-4 text-sm font-bold text-[#6D6056] hover:text-[#C26D43] transition-colors flex items-center gap-1 cursor-pointer">← Select different note</button>

                      {(!selectedNote.flashcards || selectedNote.flashcards.length === 0) ? (
                        <div className="text-center py-12 text-[#8A7D73] bg-white rounded-[2rem] border border-[#EDE4D8] shadow-xs">
                          <Layers className="w-12 h-12 mx-auto mb-3 text-[#8A7D73]" />
                          <p className="font-medium">No flashcards generated for this note.</p>
                        </div>
                      ) : (
                        <div className="max-w-xl mx-auto space-y-6">
                          <div className="flex items-center justify-between px-2">
                            <span className="text-sm font-bold text-[#8A7D73] uppercase tracking-wider">Card {flashIndex + 1} of {selectedNote.flashcards.length}</span>
                            <span className="text-xs font-bold text-[#684736] bg-[#F5EFE6] border border-[#EDE4D8] px-2.5 py-1 rounded-full">Interactive: {selectedNote.title}</span>
                          </div>

                          <div onClick={() => setIsFlipped(!isFlipped)} className="relative w-full h-72 cursor-pointer perspective-1000">
                            <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full h-full relative transform-style-3d">
                              <div className={`absolute inset-0 backface-hidden rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg border border-white/10 bg-gradient-to-br from-[#684736] via-[#75503D] to-[#5A3C2D] text-white ${isFlipped ? 'pointer-events-none' : ''}`}>
                                <span className="absolute top-6 left-6 text-xs font-bold text-white/70 uppercase tracking-wider">Question / Concept</span>
                                <h3 className="font-serif text-2xl font-bold leading-normal px-4 text-white">{selectedNote.flashcards[flashIndex].front}</h3>
                                <span className="absolute bottom-6 text-xs text-white/60">Click to flip</span>
                              </div>
                              <div className={`absolute inset-0 backface-hidden rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg border border-[#EDE4D8] bg-white text-[#2C1A12] rotate-y-180 ${!isFlipped ? 'pointer-events-none' : ''}`}>
                                <span className="absolute top-6 left-6 text-xs font-bold text-[#8A7D73] uppercase tracking-wider">Answer / Explanation</span>
                                <p className="text-lg font-medium leading-relaxed text-[#4A3B32] px-4">{selectedNote.flashcards[flashIndex].back}</p>
                                <span className="absolute bottom-6 text-xs text-[#8A7D73]">Click to flip back</span>
                              </div>
                            </motion.div>
                          </div>

                          <div className="flex items-center justify-between pt-4">
                            <button disabled={flashIndex === 0} onClick={() => { if (flashIndex > 0) { setFlashIndex(prev => prev - 1); setIsFlipped(false); } }} className="px-5 py-3 rounded-xl bg-white border border-[#EDE4D8] text-[#2C1A12] font-bold hover:bg-[#F5EFE6] transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Previous</button>
                            <button onClick={() => setIsFlipped(!isFlipped)} className="px-6 py-3 rounded-xl bg-[#F5EFE6] text-[#2C1A12] font-bold hover:bg-[#E5DACB] transition-colors border border-[#EDE4D8] cursor-pointer">🔄 Flip Card</button>
                            <button disabled={flashIndex === selectedNote.flashcards.length - 1} onClick={() => { if (flashIndex < selectedNote.flashcards.length - 1) { setFlashIndex(prev => prev + 1); setIsFlipped(false); } }} className="px-5 py-3 rounded-xl bg-[#684736] text-white font-bold hover:bg-[#5A3C2D] transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Next</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {notes.filter(n => n.flashcards && n.flashcards.length > 0).length === 0 ? (
                        <div className="col-span-full text-center py-16 text-[#8A7D73] bg-white rounded-[2rem] border border-[#EDE4D8] shadow-xs">
                          <Layers className="w-12 h-12 mx-auto mb-4 text-[#8A7D73]" />
                          <p className="font-serif font-bold text-lg text-[#2C1A12]">No notes with flashcards available yet.</p>
                          <p className="text-sm mt-1 text-[#6D6056]">Upload a PDF note or generate master notes with AI to get started!</p>
                        </div>
                      ) : (
                        notes.filter(n => n.flashcards && n.flashcards.length > 0).map(n => (
                          <button key={n.id} onClick={() => { setSelectedNote(n); }} className="text-left bg-white border border-[#EDE4D8] rounded-3xl p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group cursor-pointer">
                            <div>
                              <span className="text-[10px] font-bold text-[#C26D43] uppercase tracking-wider block mb-1">
                                {subjects.find((s) => s.id === n.subjectId)?.icon} {subjects.find((s) => s.id === n.subjectId)?.name}
                              </span>
                              <h3 className="font-serif font-bold text-[#2C1A12] group-hover:text-[#C26D43] transition-colors">{n.title}</h3>
                              <p className="text-xs text-[#8A7D73] mt-1">{n.flashcards.length} Cards · by {n.authorName}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[#8A7D73] group-hover:text-[#C26D43] transition-colors" />
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
                  className="bg-white rounded-[2rem] shadow-2xl border border-[#EDE4D8] w-full md:w-[400px] overflow-hidden flex flex-col h-[500px] max-h-[80vh]"
                >
                  <div className="p-4 bg-gradient-to-r from-[#684736] to-[#5A3C2D] flex justify-between items-center text-white shrink-0 border-b border-[#8A614A]">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#C26D43] p-1.5 rounded-full"><Sparkles className="w-4 h-4 text-white" /></div>
                      <span className="font-serif font-bold text-white">AI Study Assistant</span>
                    </div>
                    <button onClick={() => setIsAiChatOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF7F2]">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-[#684736] text-white rounded-br-sm' : 'bg-white border border-[#EDE4D8] text-[#2C1A12] rounded-bl-sm shadow-xs'}`}>
                          <div className="text-sm leading-relaxed whitespace-pre-line space-y-1">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isAiTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-[#EDE4D8] text-[#8A7D73] p-3 rounded-2xl rounded-bl-sm shadow-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-[#8A7D73] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-[#8A7D73] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-[#8A7D73] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Suggestion Chips */}
                  <div className="px-3 py-2 bg-[#F5EFE6] border-t border-[#EDE4D8] flex gap-2 overflow-x-auto hide-scrollbar shrink-0">
                    {chips.map((chipText) => (
                      <button
                        key={chipText}
                        type="button"
                        onClick={() => handleChipClick(chipText)}
                        disabled={isAiTyping}
                        className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-[#EDE4D8] text-[#6D6056] hover:text-[#C26D43] hover:border-[#C26D43]/40 hover:bg-[#F5EFE6] shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {chipText}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 bg-white border-t border-[#EDE4D8] shrink-0">
                    <form onSubmit={handleSendMessage} className="relative">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder={isAiTyping ? "AI is typing..." : "Ask a question..."}
                        disabled={isAiTyping}
                        className="w-full bg-[#FAF7F2] border border-[#EDE4D8] rounded-full py-3 pl-4 pr-12 text-sm text-[#2C1A12] placeholder:text-[#8A7D73] focus:outline-none focus:ring-2 focus:ring-[#C26D43]/20 focus:border-[#C26D43] disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={!chatMessage.trim() || isAiTyping}
                        className="absolute right-1.5 top-1.5 bottom-1.5 w-9 bg-[#C26D43] hover:bg-[#A85832] text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-[#8A7D73] transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={() => setIsAiChatOpen(true)}
                  className="w-full md:w-auto group flex items-center justify-center gap-3 bg-gradient-to-r from-[#684736] via-[#75503D] to-[#5A3C2D] hover:from-[#5A3C2D] hover:to-[#4A3022] text-white px-6 md:px-7 py-3.5 rounded-full font-bold shadow-2xl shadow-[#5A3C2D]/25 transition-all hover:-translate-y-1 active:translate-y-0 border border-[#8A614A] cursor-pointer"
                >
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-7 h-7 rounded-full bg-[#C26D43]/30 animate-ping pointer-events-none" />
                    <div className="relative bg-[#C26D43] p-2 rounded-full shadow-md shadow-[#C26D43]/40 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <span className="font-serif font-bold text-sm tracking-wide text-white">Ask AI Study Tutor</span>
                </button>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </motion.div>
  );
}
