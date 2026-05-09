import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAPI } from '../utils/api';

const translations = {
  en: {
    nav: { home: 'Home', categories: 'Categories', about: 'About', stories: 'Stories', volunteer: 'Volunteer', dashboard: 'Dashboard', login: 'Login', donate: 'Donate Now' },
    hero: { tagline: 'Your small contribution can change someone\'s life', sub: 'Join thousands of compassionate hearts making a difference every day', donateBtn: 'Donate Now', volunteerBtn: 'Join as Volunteer' },
    impact: { title: 'Our Impact So Far', meals: 'Meals Served', people: 'People Helped', trees: 'Trees Planted', donations: 'Donations Made' },
    categories: { title: 'How Would You Like to Help?', sub: 'Choose a category that resonates with your heart', food: 'Food', clothes: 'Clothes', books: 'Books', money: 'Money', trees: 'Trees', gift: 'Gifts', foodDesc: 'Help feed families in need with nutritious meals', clothesDesc: 'Provide warmth and dignity through clothing', booksDesc: 'Empower minds through education materials', moneyDesc: 'Your financial support drives all our programs', treesDesc: 'Plant hope for a greener tomorrow', giftDesc: 'Spread joy with thoughtful gifts for children', foodImpact: '₹500 feeds 5 people', clothesImpact: '10 clothes help 1 family', booksImpact: '5 books educate 1 child', moneyImpact: '₹1000 supports 1 family/month', treesImpact: '₹200 plants 1 tree', giftImpact: '₹300 brings a smile to 1 child' },
    about: { title: 'About Seva Marg', mission: 'Our Mission', missionText: 'To bridge the gap between those who can give and those who need, creating a seamless channel of compassion and support.', vision: 'Our Vision', visionText: 'A world where no one goes hungry, every child has access to education, and communities thrive together in harmony.', story: 'Our Story', storyText: 'Seva Marg was born from a simple idea — that technology can amplify kindness. What started as a small group of friends collecting food for the homeless has grown into a movement touching thousands of lives across India.' },
    volunteer: { title: 'Become a Volunteer', sub: 'Join our family of changemakers', roles: 'Select Role', teaching: 'Teaching', distribution: 'Distribution', awareness: 'Awareness Campaigns', submit: 'Join Now' },
    dashboard: { title: 'Your Dashboard', welcome: 'Welcome back', impact: 'Your Impact Summary', helped: 'You\'ve helped', people: 'people so far!', history: 'Donation History', profile: 'Profile Details', addresses: 'Saved Addresses', receipts: 'Download Receipts', notifications: 'Notifications' },
    donate: { title: 'Make a Donation', step1: 'Donation Details', step2: 'Pickup Details', step3: 'Location', step4: 'Consent & Review', next: 'Continue', prev: 'Back', submit: 'Submit Donation', type: 'Donation Type', quantity: 'Quantity', description: 'Description', image: 'Upload Image (Optional)', address: 'Full Address', city: 'City', state: 'State', pincode: 'Pincode', landmark: 'Landmark', phone: 'Alternate Contact', date: 'Preferred Date', time: 'Preferred Time', useLocation: 'Use My Current Location', manualAddress: 'Enter Address Manually', consent: 'I agree to share my location and contact details for donation pickup', success: 'Thank you! Your donation has been submitted successfully.' },
    auth: { login: 'Welcome Back', signup: 'Create Account', name: 'Full Name', email: 'Email Address', phone: 'Phone Number', city: 'City', password: 'Password', loginBtn: 'Sign In', signupBtn: 'Create Account', google: 'Continue with Google', noAccount: 'Don\'t have an account?', hasAccount: 'Already have an account?', signupLink: 'Sign Up', loginLink: 'Sign In' },
    stories: { title: 'Stories of Impact', sub: 'Real lives, real change — see how your donations transform communities' },
    whereGoes: { title: 'Where Your Donation Goes', sub: 'Transparency in every step — see exactly how your contribution creates impact' },
    footer: { tagline: 'Bridging hearts, changing lives — one donation at a time.', quickLinks: 'Quick Links', contact: 'Contact Us', rights: '© 2025 Seva Marg. All rights reserved.', madeWith: 'Made with ❤️ for a better world' }
  },
  hi: {
    nav: { home: 'होम', categories: 'श्रेणियाँ', about: 'हमारे बारे में', stories: 'कहानियाँ', volunteer: 'स्वयंसेवक', dashboard: 'डैशबोर्ड', login: 'लॉगिन', donate: 'अभी दान करें' },
    hero: { tagline: 'आपका छोटा सा योगदान किसी की ज़िंदगी बदल सकता है', sub: 'हजारों दयालु दिलों के साथ जुड़ें जो हर दिन बदलाव ला रहे हैं', donateBtn: 'अभी दान करें', volunteerBtn: 'स्वयंसेवक बनें' },
    impact: { title: 'अब तक का हमारा प्रभाव', meals: 'भोजन परोसे गए', people: 'लोगों की मदद', trees: 'पेड़ लगाए', donations: 'दान किए गए' },
    categories: { title: 'आप कैसे मदद करना चाहेंगे?', sub: 'वह श्रेणी चुनें जो आपके दिल को छूती है', food: 'भोजन दान', clothes: 'कपड़े दान', books: 'पुस्तकें और शिक्षा', money: 'आर्थिक दान', trees: 'वृक्षारोपण', gift: 'उपहार दान', foodDesc: 'जरूरतमंद परिवारों को पौष्टिक भोजन दें', clothesDesc: 'कपड़ों से गरमाहट और सम्मान दें', booksDesc: 'शिक्षा सामग्री से मन को सशक्त करें', moneyDesc: 'आपका आर्थिक सहयोग हमारे कार्यक्रमों को चलाता है', treesDesc: 'हरित कल के लिए उम्मीद लगाएँ', giftDesc: 'बच्चों के लिए उपहारों के साथ खुशियाँ फैलाएँ', foodImpact: '₹500 से 5 लोगों का भोजन', clothesImpact: '10 कपड़ों से 1 परिवार की मदद', booksImpact: '5 पुस्तकों से 1 बच्चे की शिक्षा', moneyImpact: '₹1000 से 1 परिवार/माह', treesImpact: '₹200 से 1 पेड़', giftImpact: '₹300 से 1 बच्चे के चेहरे पर मुस्कान' },
    about: { title: 'सेवा मार्ग के बारे में', mission: 'हमारा मिशन', missionText: 'देने वालों और जरूरतमंदों के बीच की दूरी को पाटना, करुणा और सहयोग का एक सहज माध्यम बनाना।', vision: 'हमारा विज़न', visionText: 'एक ऐसी दुनिया जहाँ कोई भूखा न रहे, हर बच्चे को शिक्षा मिले, और समुदाय मिलकर फलें-फूलें।', story: 'हमारी कहानी', storyText: 'सेवा मार्ग एक सरल विचार से जन्मा — कि तकनीक दयालुता को बढ़ा सकती है। दोस्तों के एक छोटे समूह से शुरू हुई यात्रा आज भारत भर में हजारों जीवन बदल रही है।' },
    volunteer: { title: 'स्वयंसेवक बनें', sub: 'बदलाव लाने वालों के परिवार से जुड़ें', roles: 'भूमिका चुनें', teaching: 'शिक्षण', distribution: 'वितरण', awareness: 'जागरूकता अभियान', submit: 'अभी जुड़ें' },
    dashboard: { title: 'आपका डैशबोर्ड', welcome: 'वापसी पर स्वागत', impact: 'आपका प्रभाव सारांश', helped: 'आपने अब तक', people: 'लोगों की मदद की!', history: 'दान इतिहास', profile: 'प्रोफ़ाइल विवरण', addresses: 'सहेजे गए पते', receipts: 'रसीदें डाउनलोड करें', notifications: 'सूचनाएँ' },
    donate: { title: 'दान करें', step1: 'दान विवरण', step2: 'पिकअप विवरण', step3: 'स्थान', step4: 'सहमति और समीक्षा', next: 'आगे बढ़ें', prev: 'पीछे', submit: 'दान जमा करें', type: 'दान का प्रकार', quantity: 'मात्रा', description: 'विवरण', image: 'चित्र अपलोड करें (वैकल्पिक)', address: 'पूरा पता', city: 'शहर', state: 'राज्य', pincode: 'पिनकोड', landmark: 'लैंडमार्क', phone: 'वैकल्पिक संपर्क', date: 'पसंदीदा तारीख', time: 'पसंदीदा समय', useLocation: 'मेरा वर्तमान स्थान उपयोग करें', manualAddress: 'पता दर्ज करें', consent: 'मैं दान पिकअप के लिए अपना स्थान और संपर्क विवरण साझा करने से सहमत हूँ', success: 'धन्यवाद! आपका दान सफलतापूर्वक जमा किया गया।' },
    auth: { login: 'वापसी पर स्वागत', signup: 'खाता बनाएँ', name: 'पूरा नाम', email: 'ईमेल', phone: 'फ़ोन नंबर', city: 'शहर', password: 'पासवर्ड', loginBtn: 'साइन इन', signupBtn: 'खाता बनाएँ', google: 'Google से जारी रखें', noAccount: 'खाता नहीं है?', hasAccount: 'पहले से खाता है?', signupLink: 'साइन अप करें', loginLink: 'साइन इन करें' },
    stories: { title: 'प्रभाव की कहानियाँ', sub: 'असली जीवन, असली बदलाव — देखें कैसे आपके दान समुदायों को बदलते हैं' },
    whereGoes: { title: 'आपका दान कहाँ जाता है', sub: 'हर कदम में पारदर्शिता — देखें कैसे आपका योगदान प्रभाव बनाता है' },
    footer: { tagline: 'दिलों को जोड़ना, जीवन बदलना — एक दान एक समय पर।', quickLinks: 'त्वरित लिंक', contact: 'संपर्क करें', rights: '© 2025 सेवा मार्ग। सर्वाधिकार सुरक्षित।', madeWith: '❤️ के साथ एक बेहतर दुनिया के लिए' }
  }
};

type Lang = 'en' | 'hi';

interface AppContextType {
  dark: boolean;
  toggleDark: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: typeof translations.en;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  logout: () => void;
  user: { id: any; name: string; email: string; phone: string; city: string; role: string };
  setUser: (u: { id: any; name: string; email: string; phone: string; city: string; role: string }) => void;
  notifications: { id: number; title: string; text: string; time: string; read: boolean; message?: string; timestamp?: string }[];
  markRead: (id: number) => void;
  setNotifications: (n: any[]) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  // Initialize from localStorage so page refreshes preserve auth state
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('access_token'));
  const [user, setUser] = useState({ id: null as any, name: '', email: '', phone: '', city: '', role: '' });
  const [notifications, setNotifications] = useState<any[]>([]);

  const toggleDark = () => setDark(p => !p);

  const markRead = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      if (localStorage.getItem('access_token')) {
        await fetchAPI(`/api/chat/notifications/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ read: true })
        });
      }
    } catch (err) { console.error('Failed to mark read', err); }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    setNotifications([]);
    setUser({ id: null, name: '', email: '', phone: '', city: '', role: '' });
  };

  // Fetch real user profile from DB on mount (and whenever login state changes)
  useEffect(() => {
    if (!localStorage.getItem('access_token')) return;
    fetchAPI('/api/users/profile/')
      .then((profile: any) => {
        setUser({
          id: profile.id,
          name: profile.first_name
            ? `${profile.first_name} ${profile.last_name || ''}`.trim()
            : profile.username || '',
          email: profile.email || '',
          phone: profile.phone_number || '',
          city: profile.city || '',
          role: profile.role || '',
        });
      })
      .catch(() => { /* token may be mid-refresh; poller will retry */ });
  }, [isLoggedIn]);

  // Fetch live notifications only when the user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    // Don't poll at all if there's no token — avoids 401 spam on the server
    if (!token) {
      setNotifications([]);
      return;
    }

    const fetchNotifs = async () => {
      if (!localStorage.getItem('access_token')) { setNotifications([]); return; }
      try {
        // Use fetchAPI so expired tokens are silently auto-refreshed
        const data = await fetchAPI('/api/chat/notifications/');
        const results = data.results || data || [];
        
        const notifs = Array.isArray(results) ? results.map((n: any) => ({
          id: n.id,
          title: n.title || '',
          text: n.message || n.text || n.title || '',
          time: n.timestamp ? new Date(n.timestamp).toLocaleString() : '',
          read: n.read ?? false,
          message: n.message,
          timestamp: n.timestamp,
        })) : [];
        setNotifications(notifs);
      } catch (err) { console.error('Failed to load notifications', err); }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const t = translations[lang];

  return (
    <AppContext.Provider value={{ dark, toggleDark, lang, setLang, t, isLoggedIn, setIsLoggedIn, logout, user, setUser, notifications, markRead, setNotifications }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
