
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { chatService } from '../services/chatService';
import { leaderboardService } from '../services/supabase';
import { Eye, EyeOff, Search, Play, RotateCcw, Trophy, Image as ImageIcon, Trash2, Wand2, ChevronRight, ChevronLeft, LogOut, Home, Sparkles } from 'lucide-react';
import { ProAvatar } from './ProAvatar';

interface BlurGuessProps {
  channelConnected: boolean;
  onHome: () => void;
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";

const ENGLISH_WORDS = [
  "Lion", "Tiger", "Elephant", "Giraffe", "Zebra", "Monkey", "Kangaroo", "Panda", "Koala", "Leopard",
  "Cheetah", "Wolf", "Fox", "Bear", "Polar Bear", "Rabbit", "Squirrel", "Deer", "Horse", "Donkey",
  "Camel", "Cow", "Sheep", "Goat", "Pig", "Chicken", "Duck", "Goose", "Turkey", "Eagle",
  "Hawk", "Falcon", "Owl", "Parrot", "Penguin", "Flamingo", "Peacock", "Swan", "Sparrow", "Pigeon",
  "Crow", "Seagull", "Whale", "Dolphin", "Shark", "Octopus", "Jellyfish", "Crab", "Lobster", "Shrimp",
  "Starfish", "Seahorse", "Turtle", "Frog", "Toad", "Snake", "Lizard", "Crocodile", "Alligator", "Chameleon",
  "Butterfly", "Bee", "Ant", "Spider", "Scorpion", "Mosquito", "Fly", "Beetle", "Ladybug", "Dragonfly",
  "Grasshopper", "Cricket", "Snail", "Slug", "Worm", "Apple", "Banana", "Orange", "Grape", "Strawberry",
  "Blueberry", "Raspberry", "Blackberry", "Cherry", "Peach", "Pear", "Plum", "Apricot", "Pineapple", "Mango",
  "Papaya", "Watermelon", "Melon", "Kiwi", "Lemon", "Lime", "Coconut", "Pomegranate", "Fig", "Date",
  "Avocado", "Tomato", "Potato", "Carrot", "Onion", "Garlic", "Ginger", "Pepper", "Cucumber", "Zucchini",
  "Eggplant", "Broccoli", "Cauliflower", "Cabbage", "Lettuce", "Spinach", "Kale", "Corn", "Peas", "Beans",
  "Mushroom", "Pumpkin", "Radish", "Celery", "Asparagus", "Artichoke", "Okra", "Turnip", "Beet", "Yam",
  "Sweet Potato", "Rice", "Wheat", "Oats", "Barley", "Quinoa", "Bread", "Pasta", "Noodle", "Pizza",
  "Burger", "Sandwich", "Soup", "Salad", "Steak", "Chicken", "Fish", "Sushi", "Taco", "Burrito",
  "Curry", "Rice", "Egg", "Cheese", "Milk", "Yogurt", "Butter", "Cream", "Ice Cream", "Cake",
  "Cookie", "Pie", "Donut", "Muffin", "Pancake", "Waffle", "Chocolate", "Candy", "Honey", "Jam",
  "Tea", "Coffee", "Juice", "Water", "Soda", "Wine", "Beer", "Chair", "Table", "Sofa",
  "Bed", "Lamp", "Desk", "Cabinet", "Shelf", "Mirror", "Clock", "Rug", "Curtain", "Pillow",
  "Blanket", "Door", "Window", "Wall", "Floor", "Ceiling", "Roof", "Stairs", "Elevator", "House",
  "Apartment", "Building", "School", "Library", "Hospital", "Bank", "Post Office", "Police Station", "Fire Station", "Park",
  "Garden", "Zoo", "Museum", "Cinema", "Theater", "Restaurant", "Cafe", "Hotel", "Airport", "Station",
  "Car", "Bus", "Train", "Bicycle", "Motorcycle", "Truck", "Van", "Taxi", "Boat", "Ship",
  "Airplane", "Helicopter", "Rocket", "Spaceship", "Traffic Light", "Road", "Bridge", "Tunnel", "Map", "Compass",
  "Phone", "Computer", "Laptop", "Tablet", "Camera", "Television", "Radio", "Speaker", "Headphones", "Microphone",
  "Keyboard", "Mouse", "Screen", "Battery", "Charger", "Cable", "Light Bulb", "Fan", "Heater", "Air Conditioner",
  "Washing Machine", "Dryer", "Fridge", "Oven", "Stove", "Microwave", "Toaster", "Blender", "Mixer", "Iron",
  "Vacuum", "Broom", "Mop", "Bucket", "Sponge", "Soap", "Shampoo", "Toothbrush", "Toothpaste", "Towel",
  "Comb", "Brush", "Razor", "Scissors", "Knife", "Fork", "Spoon", "Plate", "Bowl", "Cup",
  "Glass", "Bottle", "Jar", "Can", "Box", "Bag", "Backpack", "Wallet", "Purse", "Key",
  "Lock", "Umbrella", "Raincoat", "Hat", "Cap", "Scarf", "Gloves", "Jacket", "Coat", "Shirt",
  "T-shirt", "Blouse", "Sweater", "Dress", "Skirt", "Pants", "Jeans", "Shorts", "Socks", "Shoes",
  "Boots", "Sandals", "Slippers", "Watch", "Ring", "Necklace", "Bracelet", "Earrings", "Glasses", "Sunglasses",
  "Book", "Notebook", "Pen", "Pencil", "Eraser", "Ruler", "Paper", "Envelope", "Stamp", "Card",
  "Gift", "Toy", "Doll", "Ball", "Bat", "Racket", "Net", "Goal", "Tent", "Sleeping Bag",
  "Fire", "Water", "Earth", "Air", "Sun", "Moon", "Star", "Cloud", "Rain", "Snow",
  "Wind", "Storm", "Lightning", "Thunder", "Rainbow", "Mountain", "Hill", "Valley", "River", "Lake",
  "Ocean", "Sea", "Beach", "Island", "Desert", "Forest", "Jungle", "Tree", "Flower", "Grass",
  "Leaf", "Root", "Seed", "Fruit", "Vegetable", "Meat", "Bone", "Skin", "Hair", "Eye",
  "Ear", "Nose", "Mouth", "Tooth", "Tongue", "Lip", "Hand", "Finger", "Thumb", "Palm",
  "Arm", "Elbow", "Shoulder", "Leg", "Knee", "Foot", "Toe", "Heel", "Ankle", "Body",
  "Head", "Neck", "Chest", "Back", "Stomach", "Heart", "Brain", "Blood", "Sweat", "Tears",
  "Smile", "Laugh", "Cry", "Shout", "Whisper", "Sing", "Dance", "Run", "Walk", "Jump",
  "Sit", "Stand", "Sleep", "Dream", "Wake", "Eat", "Drink", "Cook", "Wash", "Clean",
  "Read", "Write", "Draw", "Paint", "Listen", "Speak", "Think", "Learn", "Teach", "Work",
  "Play", "Win", "Lose", "Buy", "Sell", "Give", "Take", "Open", "Close", "Push",
  "Pull", "Cut", "Paste", "Copy", "Delete", "Save", "Search", "Find", "Help", "Love",
  "Hate", "Like", "Dislike", "Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Bored",
  "Tired", "Hungry", "Thirsty", "Sick", "Healthy", "Strong", "Weak", "Fast", "Slow", "Big",
  "Small", "Tall", "Short", "Fat", "Thin", "Old", "Young", "New", "Good", "Bad",
  "High", "Low", "Hot", "Cold", "Warm", "Cool", "Dry", "Wet", "Hard", "Soft",
  "Rough", "Smooth", "Heavy", "Light", "Dark", "Bright", "Clean", "Dirty", "Rich", "Poor",
  "Cheap", "Expensive", "Free", "Busy", "Lazy", "Smart", "Stupid", "Funny", "Serious", "Kind",
  "Cruel", "Brave", "Coward", "Calm", "Nervous", "Shy", "Friendly", "Rude", "Polite", "Honest",
  "Liar", "True", "False", "Right", "Wrong", "Easy", "Difficult", "Simple", "Complex", "Beautiful",
  "Ugly", "Cute", "Scary", "Funny", "Strange", "Normal", "Loud", "Quiet", "Sweet", "Sour",
  "Bitter", "Salty", "Spicy", "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink",
  "Brown", "Black", "White", "Gray", "Gold", "Silver", "One", "Two", "Three", "Four",
  "Five", "Six", "Seven", "Eight", "Nine", "Ten", "First", "Second", "Third", "Last",
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Day", "Night", "Morning",
  "Afternoon", "Evening", "Week", "Month", "Year", "Time", "Hour", "Minute", "Second", "Now",
  "Today", "Tomorrow", "Yesterday", "Future", "Past", "History", "Science", "Math", "Art", "Music"
];

const SidebarPortal = ({ children }: { children?: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  const el = document.getElementById('game-sidebar-portal');
  if (!mounted || !el) return null;
  return createPortal(children, el);
};

export const BlurGuess: React.FC<BlurGuessProps> = ({ channelConnected, onHome }) => {
  const [gameState, setGameState] = useState<'SETUP' | 'PLAYING' | 'WINNER'>('SETUP');
  const [arabicWord, setArabicWord] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [blurLevel, setBlurLevel] = useState(100);
  const [timer, setTimer] = useState(0);
  const [winner, setWinner] = useState<{ name: string, avatar?: string, color?: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [recentMessages, setRecentMessages] = useState<{ user: string, content: string, color?: string }[]>([]);

  const gameStateRef = useRef(gameState);
  const arabicWordRef = useRef(arabicWord);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { arabicWordRef.current = arabicWord; }, [arabicWord]);

  const [isImageLoading, setIsImageLoading] = useState(false);

  useEffect(() => {
    if (photos.length > 0 && photos[photoIndex]) {
      setIsImageLoading(true);
      // Use 'large' instead of 'large2x' for faster loading (approx 50% smaller file size but good quality)
      const src = photos[photoIndex].src.large;

      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageUrl(src);
        setIsImageLoading(false);
      };
      img.onerror = () => {
        // Fallback if large fails, though unlikely
        setIsImageLoading(false);
      }
    }
  }, [photos, photoIndex]);

  useEffect(() => {
    let interval: number;
    if (gameState === 'PLAYING') {
      interval = window.setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    // Stricter/Slower blur progression for more challenge
    if (timer < 10) setBlurLevel(100);
    else if (timer < 25) setBlurLevel(60);
    else if (timer < 45) setBlurLevel(30);
    else if (timer < 60) setBlurLevel(15);
    else setBlurLevel(0);
  }, [timer, gameState]);

  useEffect(() => {
    if (!channelConnected) return;
    const cleanup = chatService.onMessage(async (msg) => {
      if (gameStateRef.current !== 'PLAYING') return;
      setRecentMessages(prev => [{
        user: msg.user.username,
        content: msg.content,
        color: msg.user.color
      }, ...prev].slice(0, 5));

      if (msg.content.trim().toLowerCase() === arabicWordRef.current.trim().toLowerCase()) {
        const username = msg.user.username;
        const userWinner = { name: username, avatar: msg.user.avatar, color: msg.user.color };
        setWinner(userWinner);
        setGameState('WINNER');
        setBlurLevel(0);
        await leaderboardService.recordWin(userWinner.name, userWinner.avatar || '', 100);
      }
    });
    return cleanup;
  }, [channelConnected]);

  // Improved translation logic using Google Translate fallback
  const translateToArabic = async (text: string): Promise<string> => {
    if (!text) return '';
    try {
      // Use a more reliable translation mirror for Google Translate
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      return data[0][0][0] || text;
    } catch (e) {
      // Fallback to MyMemory if Google fails
      try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`);
        const data = await res.json();
        return data.responseData?.translatedText?.replace(/[.!?,]/g, '') || text;
      } catch (err) { return text; }
    }
  };

  const handleArabicChange = async (val: string) => {
    setArabicWord(val);
    if (val.length > 2) {
      setIsTranslating(true);
      const translated = await translateToArabic(val);
      setSearchQuery(translated);
      setIsTranslating(false);

      // Auto-fetch images behind the scenes
      if (translated) {
        setIsSearching(true);
        try {
          const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(translated)}&per_page=30`, {
            headers: { Authorization: PEXELS_API_KEY }
          });
          const data = await res.json();
          if (data.photos?.length > 0) {
            setPhotos(data.photos);
            setPhotoIndex(0);
          }
        } catch (e) { } finally { setIsSearching(false); }
      }
    }
  };

  const handleRandomWord = async () => {
    setIsTranslating(true);
    setIsSearching(true);
    setPhotos([]);
    setImageUrl(null);
    setPhotoIndex(0);

    const randomEnglish = ENGLISH_WORDS[Math.floor(Math.random() * ENGLISH_WORDS.length)];

    // Translate English -> Arabic for the "Answer"
    const arabicRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(randomEnglish)}`);
    const arabicData = await arabicRes.json();
    const arabicTranslation = arabicData[0][0][0];

    setArabicWord(arabicTranslation);
    setSearchQuery(randomEnglish); // Use English for Pexels search (Better results)

    // Fetch Images using English word
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(randomEnglish)}&per_page=30`, {
        headers: { Authorization: PEXELS_API_KEY }
      });
      const data = await res.json();
      if (data.photos?.length > 0) {
        setPhotos(data.photos);
        setPhotoIndex(0);
      }
    } catch (e) { } finally {
      setIsSearching(false);
      setIsTranslating(false);
    }
  };

  // Auto-advance slideshow during SETUP
  useEffect(() => {
    if (gameState !== 'SETUP' || photos.length < 2) return;
    const interval = setInterval(() => {
      setPhotoIndex(p => (p + 1) % photos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [gameState, photos.length]);

  const resetGame = () => { setGameState('SETUP'); setWinner(null); setBlurLevel(100); setTimer(0); setPhotos([]); setImageUrl(null); setArabicWord(''); setSearchQuery(''); };

  return (
    <>
      <SidebarPortal>
        <div className="bg-[#080808] p-4 rounded-[1.5rem] border border-white/5 space-y-4 shadow-2xl animate-in slide-in-from-right duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>

          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-red-600" /> مـحرك الـتخمين الـذكي
            </h4>
          </div>

          {gameState === 'SETUP' ? (
            <div className="space-y-4">
              {/* Single Input: Only Arabic solution */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                  ادخـل الـكلمة بـالعربية
                </label>
                <div className="relative">
                  <input
                    value={arabicWord}
                    onChange={(e) => handleArabicChange(e.target.value)}
                    placeholder="مثال: أسد، سيارة، برج..."
                    className="w-full bg-black/60 border-2 border-white/5 rounded-xl py-4 px-8 text-white font-black text-lg outline-none focus:border-red-600 focus:shadow-[0_0_20px_rgba(255,0,0,0.15)] transition-all shadow-inner text-center"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    {(isTranslating || isSearching) && <div className="w-5 h-5 border-3 border-red-600/20 border-t-red-600 rounded-full animate-spin" />}
                    {!(isTranslating || isSearching) && arabicWord && (
                      <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.6)]"></div>
                      </div>
                    )}
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-600">
                    <Sparkles size={16} className="animate-pulse" />
                  </div>
                </div>
                {arabicWord && searchQuery && (
                  <div className="bg-white/5 rounded-lg px-3 py-1.5 border border-white/5 flex items-center gap-2">
                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">EN:</span>
                    <span className="text-[10px] text-gray-400 italic font-bold">{searchQuery}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleRandomWord}
                disabled={isTranslating || isSearching}
                className="w-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-blue-400 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all border border-blue-500/20 hover:border-blue-400/40 text-[10px] group"
              >
                <Wand2 size={16} className={`${isTranslating ? "animate-spin" : "group-hover:rotate-45 transition-transform"} drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]`} />
                {isTranslating ? 'جاري السحر...' : 'كلمة عشوائية'}
              </button>

              {/* Preview Image Only in Sidebar for Privacy */}
              <div className="relative h-36 rounded-[1.25rem] overflow-hidden border border-white/5 group shadow-2xl animate-in zoom-in bg-black/50">
                {isImageLoading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                  </div>
                )}
                {imageUrl && (
                  <>
                    <img src={imageUrl} className={`w-full h-full object-cover transition-all duration-700 ${isImageLoading ? 'opacity-50' : 'opacity-100'}`} alt="preview" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-sm px-2 py-2 flex items-center justify-between">
                      <button onClick={() => setPhotoIndex(p => (p - 1 + photos.length) % photos.length)} className="p-1.5 bg-white/10 hover:bg-red-600 rounded-lg transition-all hover:scale-110 active:scale-90"><ChevronRight size={14} className="text-white" /></button>
                      <span className="text-[9px] font-black text-white/80 italic tracking-wide">{photoIndex + 1} / {photos.length}</span>
                      <button onClick={() => setPhotoIndex(p => (p + 1) % photos.length)} className="p-1.5 bg-white/10 hover:bg-red-600 rounded-lg transition-all hover:scale-110 active:scale-90"><ChevronLeft size={14} className="text-white" /></button>
                    </div>
                    <div className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-sm text-white text-[8px] font-black px-2 py-0.5 rounded-md shadow-lg italic">للمشرف فقط</div>
                  </>
                )}
                {!imageUrl && !isImageLoading && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon size={24} className="text-white/10 mx-auto mb-1" />
                      <p className="text-[9px] text-white/10 font-black italic">انتظر الصور...</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setGameState('PLAYING')}
                disabled={!imageUrl || !arabicWord}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-4 rounded-[1.25rem] text-base shadow-[0_12px_30px_rgba(220,38,38,0.3)] hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-10 italic border-t-2 border-white/20 flex items-center justify-center gap-3"
              >
                <Play fill="currentColor" size={16} /> بـدء الـتحدي الآن
              </button>

              <button
                onClick={onHome}
                className="w-full bg-white/5 py-3 rounded-[1rem] text-[10px] font-black text-gray-500 hover:text-white hover:bg-white/10 border border-white/5 transition-all flex items-center justify-center gap-2 uppercase tracking-widest italic"
              >
                <Home size={12} /> الـعودة للـقائمة الـرئيسـية
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Answer reveal */}
              <div className="bg-white/5 p-4 rounded-[1.25rem] border border-white/5 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest">الإجـابة هـي</div>
                  <button onClick={() => setShowSolution(!showSolution)} className="w-7 h-7 flex items-center justify-center bg-red-600/10 text-red-500 rounded-full hover:bg-red-600 hover:text-white transition-all">
                    {showSolution ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="text-lg font-black text-white italic tracking-wide">{showSolution ? arabicWord : '••••••••'}</div>
              </div>

              {/* Timer and blur status */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 p-3 rounded-[1rem] border border-white/5 text-center">
                  <div className="text-[8px] text-gray-500 font-black uppercase tracking-wider">الوقت</div>
                  <div className="text-lg font-black text-white font-mono">{timer}s</div>
                </div>
                <div className="bg-white/5 p-3 rounded-[1rem] border border-white/5 text-center">
                  <div className="text-[8px] text-gray-500 font-black uppercase tracking-wider">الضباب</div>
                  <div className="text-lg font-black text-emerald-400 font-mono">{blurLevel}%</div>
                </div>
              </div>

              {/* Recent guesses live */}
              {recentMessages.length > 0 && (
                <div className="bg-white/5 p-3 rounded-[1rem] border border-white/5">
                  <div className="text-[8px] text-gray-500 font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    آخر التخمينات
                  </div>
                  <div className="space-y-1 max-h-[120px] overflow-y-auto custom-scrollbar">
                    {recentMessages.map((msg, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] bg-black/20 rounded-lg px-2 py-1">
                        <span className="font-bold truncate max-w-[70px]" style={{color: msg.color || '#fff'}}>{msg.user}</span>
                        <span className="text-gray-600">:</span>
                        <span className="text-gray-400 italic truncate max-w-[90px]">{msg.content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <button onClick={resetGame} className="w-full bg-gradient-to-r from-emerald-600/20 to-emerald-700/10 hover:from-emerald-600/30 hover:to-emerald-700/20 text-emerald-400 font-black py-3 rounded-[1rem] text-xs border border-emerald-500/20 transition-all flex items-center justify-center gap-2 group">
                <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> جـولة جـديـدة
              </button>
              <button onClick={onHome} className="w-full bg-red-600/10 py-3 rounded-[1rem] text-xs font-black text-red-500 hover:bg-red-600/20 border border-red-500/20 transition-all flex items-center justify-center gap-2">
                <Home size={12} /> خـروج
              </button>
            </div>
          )}
        </div>
      </SidebarPortal>

      <div className="w-full h-full flex flex-col items-center justify-center p-5 relative overflow-hidden bg-black select-none">
        {/* Main Display: Static Info during Setup, Hidden image for privacy */}
        {gameState === 'SETUP' && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 animate-in fade-in duration-700 px-4">
            {/* Image display area - shows actual images when available */}
            {photos.length > 0 && imageUrl ? (
              <div className="relative w-full max-w-5xl aspect-video rounded-[2.5rem] overflow-hidden border-[6px] border-[#16161a] shadow-[0_0_80px_rgba(0,0,0,0.9)] bg-zinc-900 group">
                {/* Auto-advancing slideshow */}
                {isImageLoading && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={imageUrl}
                  className={`w-full h-full object-cover transition-all duration-700 ${isImageLoading ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
                />
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>

                {/* Top badge */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 flex items-center gap-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                  <span className="text-white/80 font-black text-xs tracking-wider italic">معاينة الصور — {photoIndex + 1}/{photos.length}</span>
                </div>

                {/* Image navigation arrows */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button onClick={() => setPhotoIndex(p => (p - 1 + photos.length) % photos.length)}
                    className="w-12 h-12 bg-black/60 backdrop-blur-xl hover:bg-red-600 rounded-full flex items-center justify-center transition-all border border-white/10 shadow-xl active:scale-90">
                    <ChevronRight size={20} className="text-white" />
                  </button>
                  <button onClick={() => setPhotoIndex(p => (p + 1) % photos.length)}
                    className="w-12 h-12 bg-black/60 backdrop-blur-xl hover:bg-red-600 rounded-full flex items-center justify-center transition-all border border-white/10 shadow-xl active:scale-90">
                    <ChevronLeft size={20} className="text-white" />
                  </button>
                </div>

                {/* Bottom info bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-1.5 bg-red-600/20 backdrop-blur-xl rounded-full border border-red-500/30">
                        <span className="text-red-400 font-black text-xs tracking-wider italic">الكلمة: {arabicWord || '—'}</span>
                      </div>
                    </div>
                    {photos[photoIndex]?.photographer && (
                      <div className="text-white/40 text-[10px] font-bold italic">
                        📷 {photos[photoIndex].photographer}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Placeholder when no images yet */
              <div className="w-full max-w-5xl aspect-video rounded-[2.5rem] border-[6px] border-[#16161a] bg-zinc-900/80 flex flex-col items-center justify-center gap-4 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-600 blur-[60px] opacity-20 animate-pulse"></div>
                  <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-900 rounded-[2rem] flex items-center justify-center shadow-2xl border-2 border-white/10 rotate-12">
                    <ImageIcon size={36} className="text-white drop-shadow-lg" />
                  </div>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-[0_12px_36px_rgba(255,255,255,0.1)]">تـخمين الـصورة</h1>
                <div className="flex items-center justify-center gap-5">
                  <div className="h-px w-12 bg-gradient-to-l from-transparent via-red-600 to-transparent"></div>
                  <p className="text-red-500 font-black tracking-[0.6em] text-xs uppercase italic">ARENA GUESS ENGINE</p>
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
                </div>
                <p className="text-white/20 font-black text-sm italic mt-2">اكتب كلمة أو اختر عشوائي لبدء المعاينة</p>
              </div>
            )}
          </div>
        )}

        {/* PLAYING MODE: Image is shown (Blurred) */}
        {gameState === 'PLAYING' && imageUrl && (
          <div className="relative w-full h-[90vh] flex flex-col items-center justify-center gap-6 animate-in fade-in slide-in-from-top-10 duration-700 p-4">
            <div className="relative group w-full max-w-5xl aspect-video rounded-[2.5rem] overflow-hidden border-[10px] border-[#16161a] shadow-[0_0_80px_rgba(0,0,0,0.9)] bg-zinc-900">
              {isImageLoading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                  <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mb-4" />
                  <span className="text-white font-black tracking-widest animate-pulse">جاري تحميل الصورة...</span>
                </div>
              )}
              <img
                src={imageUrl}
                className={`w-full h-full object-cover transition-all duration-1000 ${isImageLoading ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
                style={{ filter: `blur(${blurLevel}px)` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10"></div>

              {/* HUD Overlays */}
              <div className="absolute top-6 inset-x-0 flex justify-center px-6 pointer-events-none z-10">
                <div className="bg-red-600/90 backdrop-blur-xl text-white px-12 py-3 rounded-[1.5rem] font-black italic text-2xl shadow-[0_18px_36px_rgba(220,38,38,0.5)] border-t-2 border-white/20 animate-bounce tracking-tight">
                  خـمن الـصـورة!
                </div>
              </div>

              {/* Sleek Bottom HUD Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 flex items-end justify-between z-10">
                <div className="flex gap-4">
                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-[1rem] flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 font-black uppercase mb-0.5 tracking-wider">الـوقت</span>
                    <span className="text-2xl font-black text-white font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{timer}s</span>
                  </div>
                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-[1rem] flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 font-black uppercase mb-0.5 tracking-wider">الـضباب</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{blurLevel}%</span>
                  </div>
                </div>

                {/* Recent guesses ticker */}
                {recentMessages.length > 0 && (
                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-[1rem] max-w-[200px]">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block mb-1">آخر التخمينات</span>
                    <div className="space-y-0.5">
                      {recentMessages.slice(0, 3).map((msg, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-white/80 font-bold truncate max-w-[80px]" style={{color: msg.color || '#fff'}}>{msg.user}</span>
                          <span className="text-gray-500">:</span>
                          <span className="text-gray-400 italic truncate max-w-[80px]">{msg.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar for blur */}
            <div className="w-full max-w-5xl h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-red-500 to-transparent rounded-full transition-all duration-1000"
                style={{ width: `${100 - blurLevel}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* WINNER DISPLAY */}
        {gameState === 'WINNER' && winner && (
          <div className="flex flex-col items-center justify-center w-full h-full animate-in zoom-in duration-700 z-10 p-6">
            {/* Background celebration effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-amber-500/20 blur-[100px] rounded-full animate-pulse"></div>
              <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-red-600/15 blur-[80px] rounded-full animate-pulse" style={{animationDelay:'1s'}}></div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="absolute w-1.5 h-1.5 bg-amber-400/60 rounded-full" style={{
                  left: `${10 + i * 15}%`,
                  top: `${10 + (i * 7) % 80}%`,
                  animation: `particle-drift ${4 + i % 3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                  '--dx': `${(i % 2 === 0 ? 1 : -1) * 50}px`,
                  '--dy': `${-60 - i * 15}px`,
                  '--r': `${i * 60}deg`,
                } as React.CSSProperties}></div>
              ))}
            </div>

            <div className="relative flex flex-col items-center">
              <div className="absolute inset-0 bg-amber-500 blur-[100px] opacity-15"></div>
              <Trophy size={120} className="text-[#FFD700] mb-6 animate-bounce drop-shadow-[0_0_60px_rgba(255,215,0,0.7)]" fill="currentColor" />
            </div>

            {/* The answer word */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-600/20 blur-[60px] rounded-full"></div>
              <h1 className="relative text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_12px_50px_rgba(0,0,0,1)] leading-none animate-in slide-in-from-bottom duration-700">
                {arabicWord}
              </h1>
            </div>

            {/* Winner card */}
            <div className="bg-[#050505]/80 backdrop-blur-3xl px-10 md:px-16 py-8 rounded-[3rem] border-2 border-amber-500/50 shadow-[0_0_90px_rgba(255,215,0,0.2)] relative overflow-hidden group animate-in slide-in-from-bottom duration-700" style={{animationDelay:'200ms'}}>
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-shine-sweep"></div>
              <div className="text-amber-500 font-black uppercase tracking-[0.8em] text-sm mb-4 italic">الفائز</div>

              <div className="flex items-center gap-6">
                <ProAvatar
                  url={winner.avatar}
                  username={winner.name}
                  size="w-20 h-20"
                  className="rounded-[1.5rem] shadow-2xl transition-transform hover:scale-110 ring-2 ring-amber-500/30"
                />
                <div className="text-4xl md:text-5xl font-black text-white italic tracking-tighter drop-shadow-lg">{winner.name}</div>
              </div>
            </div>

            <div className="mt-8 flex gap-5 justify-center animate-in slide-in-from-bottom duration-700" style={{animationDelay:'400ms'}}>
              <button onClick={resetGame} className="px-10 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black text-xl rounded-xl hover:scale-110 active:scale-95 transition-all italic shadow-[0_0_30px_rgba(255,215,0,0.3)] flex items-center gap-2 border-t-2 border-white/20"><RotateCcw size={20} /> جـولة جـديـدة</button>
              <button onClick={onHome} className="px-10 py-4 bg-white/5 border border-white/10 text-white/70 font-black text-xl rounded-xl hover:bg-white/10 hover:text-white transition-all italic shadow-2xl backdrop-blur-sm">خـروج</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 50px rgba(220, 38, 38, 0.4); }
          50% { box-shadow: 0 0 80px rgba(220, 38, 38, 0.6); }
        }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
      `}</style>
    </>
  );
};
