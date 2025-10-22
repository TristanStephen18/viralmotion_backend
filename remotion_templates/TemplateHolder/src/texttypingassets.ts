

// Premium Google Fonts optimized for text typing animation
export const FONTS = [
  // Monospace - Perfect for code/tech
  { id: 'roboto-mono', name: 'Roboto Mono', family: '"Roboto Mono", monospace', weight: 500, category: 'monospace' },
  { id: 'source-code-pro', name: 'Source Code Pro', family: '"Source Code Pro", monospace', weight: 600, category: 'monospace' },
  { id: 'jetbrains-mono', name: 'JetBrains Mono', family: '"JetBrains Mono", monospace', weight: 700, category: 'monospace' },
  { id: 'fira-code', name: 'Fira Code', family: '"Fira Code", monospace', weight: 500, category: 'monospace' },
  { id: 'ibm-plex-mono', name: 'IBM Plex Mono', family: '"IBM Plex Mono", monospace', weight: 600, category: 'monospace' },
  
  // Sans-serif - Modern and clean
  { id: 'inter', name: 'Inter', family: '"Inter", sans-serif', weight: 700, category: 'sans-serif' },
  { id: 'poppins', name: 'Poppins', family: '"Poppins", sans-serif', weight: 700, category: 'sans-serif' },
  { id: 'montserrat', name: 'Montserrat', family: '"Montserrat", sans-serif', weight: 800, category: 'sans-serif' },
  { id: 'raleway', name: 'Raleway', family: '"Raleway", sans-serif', weight: 700, category: 'sans-serif' },
  
  // Serif - Elegant and sophisticated
  { id: 'playfair-display', name: 'Playfair Display', family: '"Playfair Display", serif', weight: 700, category: 'serif' },
  { id: 'merriweather', name: 'Merriweather', family: '"Merriweather", serif', weight: 700, category: 'serif' },
  
  // Display - Bold and impactful
  { id: 'bebas-neue', name: 'Bebas Neue', family: '"Bebas Neue", cursive', weight: 400, category: 'display' },
  { id: 'anton', name: 'Anton', family: '"Anton", sans-serif', weight: 400, category: 'display' },
  { id: 'oswald', name: 'Oswald', family: '"Oswald", sans-serif', weight: 600, category: 'display' },
  { id: 'abril-fatface', name: 'Abril Fatface', family: '"Abril Fatface", cursive', weight: 400, category: 'display' },
  
  // Additional creative fonts
  { id: 'space-mono', name: 'Space Mono', family: '"Space Mono", monospace', weight: 700, category: 'monospace' },
  { id: 'courier-prime', name: 'Courier Prime', family: '"Courier Prime", monospace', weight: 400, category: 'monospace' },
  { id: 'ubuntu-mono', name: 'Ubuntu Mono', family: '"Ubuntu Mono", monospace', weight: 700, category: 'monospace' },
  { id: 'inconsolata', name: 'Inconsolata', family: '"Inconsolata", monospace', weight: 600, category: 'monospace' },
  { id: 'anonymous-pro', name: 'Anonymous Pro', family: '"Anonymous Pro", monospace', weight: 700, category: 'monospace' },
];

// 25 Professional animated backgrounds - Simple, aesthetic, minimal with edge glows
export const BACKGROUNDS = [
  // Core Gradient Animations
  { 
    id: 'ambient-flow', 
    name: 'Ambient Flow',
    type: 'animated',
    backgroundColor: 'linear-gradient(45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
    textColor: '#FFFFFF',
    animation: 'ambient-flow',
    mood: 'calm',
    category: 'gradient'
  },
  { 
    id: 'color-drift', 
    name: 'Color Drift',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #4158D0 0%, #C850C0 100%)',
    textColor: '#FFFFFF',
    animation: 'color-drift',
    mood: 'mystical',
    category: 'gradient'
  },
  { 
    id: 'star-field', 
    name: 'Star Field',
    type: 'animated',
    backgroundColor: 'linear-gradient(180deg, #0a0e27 0%, #1a237e 100%)',
    textColor: '#FFFFFF',
    animation: 'star-field',
    mood: 'cosmic',
    category: 'particles'
  },
  { 
    id: 'ocean-waves', 
    name: 'Ocean Waves',
    type: 'animated',
    backgroundColor: 'linear-gradient(180deg, #0077be 0%, #00a8cc 100%)',
    textColor: '#FFFFFF',
    animation: 'ocean-waves',
    mood: 'flowing',
    category: 'waves'
  },
  { 
    id: 'ambient-spheres', 
    name: 'Ambient Spheres',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#FFFFFF',
    animation: 'ambient-spheres',
    mood: 'soft',
    category: 'organic'
  },
  { 
    id: 'animated-mesh', 
    name: 'Animated Mesh',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    textColor: '#FFFFFF',
    animation: 'animated-mesh',
    mood: 'technical',
    category: 'geometric'
  },

  // Aesthetic Gradient Themes
  { 
    id: 'sunset-gradient', 
    name: 'Sunset Gradient',
    type: 'animated',
    backgroundColor: 'linear-gradient(180deg, #FF6B6B 0%, #FFD700 100%)',
    textColor: '#FFFFFF',
    animation: 'sunset-gradient',
    mood: 'warm',
    category: 'gradient'
  },
  { 
    id: 'night-gradient', 
    name: 'Night Gradient',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)',
    textColor: '#FFFFFF',
    animation: 'night-gradient',
    mood: 'peaceful',
    category: 'gradient'
  },
  { 
    id: 'storm-gradient', 
    name: 'Storm Gradient',
    type: 'animated',
    backgroundColor: 'linear-gradient(180deg, #2C3E50 0%, #34495E 100%)',
    textColor: '#FFFFFF',
    animation: 'storm-gradient',
    mood: 'dramatic',
    category: 'gradient'
  },
  { 
    id: 'nature-gradient', 
    name: 'Nature Gradient',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
    textColor: '#FFFFFF',
    animation: 'nature-gradient',
    mood: 'fresh',
    category: 'gradient'
  },

  // Minimal Animations
  { 
    id: 'gradient-pulse', 
    name: 'Gradient Pulse',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#FFFFFF',
    animation: 'gradient-pulse',
    mood: 'rhythmic',
    category: 'minimal'
  },
  { 
    id: 'fluid-motion', 
    name: 'Fluid Motion',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    textColor: '#FFFFFF',
    animation: 'fluid-motion',
    mood: 'smooth',
    category: 'organic'
  },
  { 
    id: 'particle-flow', 
    name: 'Particle Flow',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    textColor: '#FFFFFF',
    animation: 'particle-flow',
    mood: 'dynamic',
    category: 'particles'
  },
  { 
    id: 'minimal-waves', 
    name: 'Minimal Waves',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    textColor: '#2D3436',
    animation: 'minimal-waves',
    mood: 'gentle',
    category: 'waves'
  },
  { 
    id: 'soft-glow', 
    name: 'Soft Glow',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    textColor: '#2D3436',
    animation: 'soft-glow',
    mood: 'warm',
    category: 'minimal'
  },

  // Aesthetic Effects
  { 
    id: 'geometric-flow', 
    name: 'Geometric Flow',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #3f2b96 0%, #a8c0ff 100%)',
    textColor: '#FFFFFF',
    animation: 'geometric-flow',
    mood: 'structured',
    category: 'geometric'
  },
  { 
    id: 'color-waves', 
    name: 'Color Waves',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 100%)',
    textColor: '#FFFFFF',
    animation: 'color-waves',
    mood: 'vibrant',
    category: 'waves'
  },
  { 
    id: 'ambient-dots', 
    name: 'Ambient Dots',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)',
    textColor: '#2D3436',
    animation: 'ambient-dots',
    mood: 'playful',
    category: 'particles'
  },
  { 
    id: 'gradient-shift', 
    name: 'Gradient Shift',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
    textColor: '#FFFFFF',
    animation: 'gradient-shift',
    mood: 'dynamic',
    category: 'gradient'
  },
  { 
    id: 'ethereal-mist', 
    name: 'Ethereal Mist',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #c2e9fb 0%, #a1c4fd 100%)',
    textColor: '#2D3436',
    animation: 'ethereal-mist',
    mood: 'dreamy',
    category: 'minimal'
  },

  // Edge Glow Animations
  { 
    id: 'pulse-edge-glow', 
    name: 'Pulse Edge Glow',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    textColor: '#FFFFFF',
    animation: 'pulse-edge-glow',
    mood: 'electric',
    category: 'edge-glow'
  },
  { 
    id: 'rotating-edge-glow', 
    name: 'Rotating Edge Glow',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
    textColor: '#FFFFFF',
    animation: 'rotating-edge-glow',
    mood: 'dynamic',
    category: 'edge-glow'
  },
  { 
    id: 'corner-sweep-glow', 
    name: 'Corner Sweep Glow',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #0a0a0a 0%, #1e1e1e 100%)',
    textColor: '#FFFFFF',
    animation: 'corner-sweep-glow',
    mood: 'sleek',
    category: 'edge-glow'
  },
  { 
    id: 'edge-wave-glow', 
    name: 'Edge Wave Glow',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)',
    textColor: '#FFFFFF',
    animation: 'edge-wave-glow',
    mood: 'fluid',
    category: 'edge-glow'
  },
  { 
    id: 'neon-border-glow', 
    name: 'Neon Border Glow',
    type: 'animated',
    backgroundColor: 'linear-gradient(135deg, #0a0a0a 0%, #1a0033 100%)',
    textColor: '#FFFFFF',
    animation: 'neon-border-glow',
    mood: 'vibrant',
    category: 'edge-glow'
  }
];

export const AUDIO_FILES = [
  { 
    id: 'typing-1', 
    filename: 'https://rsnemknhybirnaxoffur.supabase.co/storage/v1/object/public/Remotion%20Web%20App%20file%20bucket/keyboard_sounds/typing-sound-1.mp3', 
    name: 'Mechanical Keyboard',
    mood: 'sharp',
    bestWith: ['monospace', 'tech']
  },
  { 
    id: 'typing-2', 
    filename: 'https://rsnemknhybirnaxoffur.supabase.co/storage/v1/object/public/Remotion%20Web%20App%20file%20bucket/keyboard_sounds/typing-sound-2.mp3', 
    name: 'Typewriter',
    mood: 'gentle',
    bestWith: ['serif', 'elegant']
  },
  { 
    id: 'typing-3', 
    filename: 'https://rsnemknhybirnaxoffur.supabase.co/storage/v1/object/public/Remotion%20Web%20App%20file%20bucket/keyboard_sounds/typing-sound-3.mp3', 
    name: 'Soft Keys',
    mood: 'vintage',
    bestWith: ['display', 'classic']
  },
];
// Enhanced phrases with categories and moods
export const PHRASES = [
  {
    lines: ['Dream big, start small', 'but start today'],
    category: 'motivation',
    mood: 'professional'
  },
  {
    lines: ['Innovation distinguishes', 'between a leader', 'and a follower'],
    category: 'business',
    mood: 'professional'
  },
  {
    lines: ['The future belongs to those', 'who believe in the beauty', 'of their dreams'],
    category: 'dreams',
    mood: 'hopeful'
  },
  {
    lines: ['Code is poetry written', 'for machines to perform', 'and humans to read'],
    category: 'tech',
    mood: 'artistic'
  },
  {
    lines: ['Design is not just', 'what it looks like,', 'it\'s how it works'],
    category: 'design',
    mood: 'thoughtful'
  },
  {
    lines: ['Every moment is a', 'fresh beginning'],
    category: 'mindfulness',
    mood: 'peaceful'
  },
  {
    lines: ['Your limitation is', 'only your imagination'],
    category: 'creativity',
    mood: 'empowering'
  },
  {
    lines: ['Great things never come', 'from comfort zones'],
    category: 'growth',
    mood: 'challenging'
  },
  {
    lines: ['Stay hungry,', 'stay foolish'],
    category: 'wisdom',
    mood: 'iconic'
  },
  {
    lines: ['Think different,', 'build extraordinary'],
    category: 'innovation',
    mood: 'bold'
  },
  {
    lines: ['Creativity is intelligence', 'having fun'],
    category: 'creativity',
    mood: 'playful'
  },
  {
    lines: ['The only way to do', 'great work is to love', 'what you do'],
    category: 'passion',
    mood: 'authentic'
  },
  {
    lines: ['Progress is impossible', 'without change'],
    category: 'change',
    mood: 'direct'
  },
  {
    lines: ['Don\'t wait for opportunity.', 'Create it.'],
    category: 'action',
    mood: 'urgent'
  },
  {
    lines: ['Be yourself;', 'everyone else is', 'already taken'],
    category: 'authenticity',
    mood: 'wise'
  },
  {
    lines: ['Perfection is achieved', 'not when there is nothing', 'more to add, but to remove'],
    category: 'simplicity',
    mood: 'minimalist'
  },
  {
    lines: ['The journey of a', 'thousand miles begins', 'with a single step'],
    category: 'journey',
    mood: 'encouraging'
  },
  {
    lines: ['Success is not final,', 'failure is not fatal'],
    category: 'resilience',
    mood: 'balanced'
  },
  {
    lines: ['The best time to plant', 'a tree was 20 years ago.', 'The second best time is now'],
    category: 'action',
    mood: 'practical'
  },
  {
    lines: ['The only impossible thing', 'is the thing you', 'don\'t begin'],
    category: 'possibility',
    mood: 'motivating'
  }
];

// Animation settings optimized for quality
export const DEFAULT_SETTINGS = {
  typingSpeed: 15, // characters per second
  cursorBlinkSpeed: 2, // blinks per second
  fontSize: 72,
  holdDuration: 4, // seconds to hold completed text
  fps: 60,
  width: 1080,
  height: 1920,
  quality: {
    crf: 18, // Video quality (lower = better)
    audioBitrate: '128k',
    pixelFormat: 'yuv420p'
  }
};

// Curated combinations for showcase
export const SHOWCASE_COMBINATIONS = [
  {
    name: 'Sunset Dreams',
    phraseIndex: 2, // The future belongs
    fontIndex: 9, // Playfair Display
    backgroundIndex: 6, // Sunset Gradient
    audioIndex: 1 // Soft Keys
  },
  {
    name: 'Night Coding',
    phraseIndex: 3, // Code is poetry
    fontIndex: 2, // JetBrains Mono
    backgroundIndex: 7, // Night Gradient
    audioIndex: 0 // Mechanical Keyboard
  },
  {
    name: 'Storm Power',
    phraseIndex: 7, // Great things never come
    fontIndex: 11, // Bebas Neue
    backgroundIndex: 8, // Storm Gradient
    audioIndex: 0 // Mechanical
  },
  {
    name: 'Nature Peace',
    phraseIndex: 5, // Every moment
    fontIndex: 10, // Merriweather
    backgroundIndex: 9, // Nature Gradient
    audioIndex: 1 // Soft Keys
  },
  {
    name: 'Ocean Flow',
    phraseIndex: 16, // Journey of thousand miles
    fontIndex: 8, // Raleway
    backgroundIndex: 3, // Ocean Waves
    audioIndex: 1 // Soft Keys
  },
  {
    name: 'Geometric Mind',
    phraseIndex: 15, // Perfection is achieved
    fontIndex: 5, // Inter
    backgroundIndex: 15, // Geometric Flow
    audioIndex: 1 // Soft Keys
  },
  {
    name: 'Color Dreams',
    phraseIndex: 10, // Creativity is intelligence
    fontIndex: 6, // Poppins
    backgroundIndex: 16, // Color Waves
    audioIndex: 1 // Soft Keys
  },
  {
    name: 'Ethereal Thoughts',
    phraseIndex: 2, // The future belongs
    fontIndex: 9, // Playfair Display
    backgroundIndex: 19, // Ethereal Mist
    audioIndex: 1 // Soft Keys
  },
  {
    name: 'Electric Pulse',
    phraseIndex: 3, // Code is poetry
    fontIndex: 2, // JetBrains Mono
    backgroundIndex: 20, // Pulse Edge Glow
    audioIndex: 0 // Mechanical Keyboard
  },
  {
    name: 'Neon Dreams',
    phraseIndex: 9, // Think different
    fontIndex: 11, // Bebas Neue
    backgroundIndex: 24, // Neon Border Glow
    audioIndex: 0 // Mechanical Keyboard
  },
  {
    name: 'Edge Runner',
    phraseIndex: 13, // Don't wait for opportunity
    fontIndex: 5, // Inter
    backgroundIndex: 21, // Rotating Edge Glow
    audioIndex: 0 // Mechanical Keyboard
  }
];

// Export helper functions
export const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const getBestCombination = (mood: string) => {
  // Logic to return best font/background/audio combination based on mood
  const combinations: { [key: string]: { font: number, background: number, audio: number } } = {
    'warm': { font: 9, background: 6, audio: 1 }, // Playfair + Sunset Gradient + Soft
    'cosmic': { font: 5, background: 2, audio: 0 }, // Inter + Star Field + Mechanical
    'nature': { font: 10, background: 9, audio: 1 }, // Merriweather + Nature Gradient + Soft
    'minimal': { font: 8, background: 13, audio: 1 }, // Raleway + Minimal Waves + Soft
    'peaceful': { font: 8, background: 7, audio: 1 }, // Raleway + Night Gradient + Soft
  };
  
  return combinations[mood] || combinations['warm'];
};