import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Artist, CollectionItem, View, Category, Artwork } from './types';
import { Box, Button, DrawerTab, IconButton, Tag } from './components/MemphisUI';
import { ArtistCard } from './components/ArtistCard';
import { ComparisonMode } from './components/ComparisonMode';
import { CollectionView } from './components/CollectionView';
import { askGemini, enrichArtistProfile } from './services/gemini';
import { performRealSearch } from './services/googleSearch';
import { signIn, logout, auth, syncUserData, fetchUserData } from './services/firebase';
import { cacheImage } from './services/offline';

const MEMPHIS_PALETTE = ['#FFDE59', '#5454FF', '#FF1694', '#00D1FF', '#00FF41', '#FF7F00', '#B026FF', '#FF3131'];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Painting (油画)', color: '#FFDE59' },
  { id: 'cat2', name: 'Installation (装置)', color: '#5454FF' },
  { id: 'cat3', name: 'Surrealism (超现实)', color: '#FF1694' },
  { id: 'cat4', name: 'Pop Art (波普)', color: '#00D1FF' }
];

const SUGGESTED_STYLES = [
  "Cyberpunk Art", "Art Nouveau", "Minimalism", "Baroque", 
  "Street Art", "Ukiyo-e", "Expressionism", "Futurism"
];

// === 🚫 BLACKLIST ===
const BAD_TAGS = [
  "ARTIST", "VARIOUS", "REAL-TIME", "LIVE DISCOVERY", "SEARCH RESULT", 
  "GOOGLE", "IMAGES", "UNKNOWN", "N/A", "UNDEFINED", "PROFILE", "BIOGRAPHY"
];

const TRANSLATIONS = {
  en: {
    search: "Search",
    archives: "Archives",
    vs: "VS",
    placeholder: "SEARCH ARTIST (E.G. BASQUIAT)...",
    quickAdd: "Quick Add:",
    dailyRec: "Daily Recommendation",
    explore: "Explore Profile",
    museum: "Your Personal Museum",
    startJourney: "Enter an artist above to start your journey.",
    aiHistorian: "AI Art Historian",
    expand: "EXPAND ▲",
    minimize: "MINIMIZE ▼",
    send: "SEND",
    expert: "ASK THE EXPERT...",
    newDrawer: "New Drawer",
    archiveTitle: "Archive",
    emptyArchive: "Empty Archive.",
    deleteDrawer: "Delete Drawer",
    promptNewDrawer: "Name your new archive drawer:",
    promptRename: "New name for this drawer?",
    confirmDelete: "Delete this drawer and all items inside?",
    langToggle: "中文",
    resources: "External Resources",
    addToCollection: "Collect to Archive",
    selectDrawer: "Choose a drawer for this artist:",
    createDrawer: "+ Create New Drawer",
    close: "Close",
    createTitle: "Craft New Archive",
    editTitle: "Edit Archive Drawer",
    drawerName: "Drawer Name",
    pickColor: "Pick a Vibe",
    cancel: "Cancel",
    confirmCreate: "Create Drawer",
    confirmUpdate: "Update Drawer",
    edit: "EDIT",
    login: "Login / Sync",
    logout: "Logout",
    syncing: "Syncing...",
    offlineMode: "OFFLINE MODE - VIEWING CACHED COLLECTION"
  },
  cn: {
    search: "搜索",
    archives: "收藏库",
    vs: "对比",
    placeholder: "搜索艺术家 (如：草间弥生)...",
    quickAdd: "快速添加:",
    dailyRec: "今日推荐",
    explore: "查看详情",
    museum: "你的私人美术馆",
    startJourney: "在上方输入艺术家开启探索旅程。",
    aiHistorian: "AI 艺术史家",
    expand: "展开 ▲",
    minimize: "缩小 ▼",
    send: "发送",
    expert: "咨询艺术专家...",
    newDrawer: "新建抽屉",
    archiveTitle: "收藏抽屉",
    emptyArchive: "暂无收藏。",
    deleteDrawer: "删除抽屉",
    promptNewDrawer: "输入新抽屉名称：",
    promptRename: "重命名抽屉：",
    confirmDelete: "确定要删除此抽屉及其所有内容吗？",
    langToggle: "EN",
    resources: "相关资源链接",
    addToCollection: "加入收藏档案",
    selectDrawer: "为这位艺术家选择一个抽屉：",
    createDrawer: "+ 新建抽屉",
    close: "关闭",
    createTitle: "创建新收藏抽屉",
    editTitle: "编辑收藏抽屉",
    drawerName: "抽屉名称",
    pickColor: "选择主题颜色",
    cancel: "取消",
    confirmCreate: "立即创建",
    confirmUpdate: "更新设置",
    edit: "编辑",
    login: "登录 / 同步",
    logout: "退出登录",
    syncing: "同步中...",
    offlineMode: "离线模式 - 仅显示已收藏内容"
  }
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'cn'>('en');
  const [view, setView] = useState<View>(View.SEARCH);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<CollectionItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<Artist[]>([]);
  
  const [artistRegistry, setArtistRegistry] = useState<Record<string, Artist>>({});
  
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dailyRec, setDailyRec] = useState<Artist | null>(null);

  const [collectingArtist, setCollectingArtist] = useState<Artist | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [isNewDrawerModalOpen, setIsNewDrawerModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newDrawerName, setNewDrawerName] = useState('');
  const [newDrawerColor, setNewDrawerColor] = useState(MEMPHIS_PALETTE[0]);

  const t = TRANSLATIONS[language];

  // ... (Effects for Online/Offline/Storage/Auth same as before) ...
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const savedFavs = localStorage.getItem('artist_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    const savedCats = localStorage.getItem('artist_categories');
    if (savedCats) setCategories(JSON.parse(savedCats));
    const savedRegistry = localStorage.getItem('artist_registry');
    if (savedRegistry) setArtistRegistry(JSON.parse(savedRegistry));
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (currentUser: any) => {
      setUser(currentUser);
      if (currentUser) {
        const cloudData = await fetchUserData(currentUser.uid);
        if (cloudData) {
          if (cloudData.categories) setCategories(cloudData.categories);
          if (cloudData.favorites) setFavorites(cloudData.favorites);
          if (cloudData.registry) {
             setArtistRegistry(prev => ({...prev, ...cloudData.registry}));
          }
        } else {
          syncUserData(currentUser.uid, { categories, favorites, registry: artistRegistry });
        }
      }
    });
    return () => unsubscribe();
  }, []); 

  useEffect(() => {
    localStorage.setItem('artist_favorites', JSON.stringify(favorites));
    if (user) syncUserData(user.uid, { favorites });
  }, [favorites, user]);

  useEffect(() => {
    localStorage.setItem('artist_categories', JSON.stringify(categories));
    if (user) syncUserData(user.uid, { categories });
  }, [categories, user]);

  useEffect(() => {
    localStorage.setItem('artist_registry', JSON.stringify(artistRegistry));
    if (user) syncUserData(user.uid, { registry: artistRegistry });
  }, [artistRegistry, user]);

  useEffect(() => {
    if (isOnline) {
      const fetchDaily = async () => {
        const famous = ["Yayoi Kusama", "Jean-Michel Basquiat", "Frida Kahlo", "Banksy", "Salvador Dali"];
        const random = famous[Math.floor(Math.random() * famous.length)];
        const result = await performRealSearch(random);
        if (result) {
          const artist = await constructArtist(random, result);
          setDailyRec(artist);
          setSearchResults([artist]);
          setArtistRegistry(prev => ({ ...prev, [artist.id]: artist }));
        }
      };
      fetchDaily();
    }
  }, [isOnline]);

  const handleLogin = async () => {
    const u = await signIn();
    if (u) setUser(u);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || isLoadingChat) return;
    setIsLoadingChat(true);
    const response = await askGemini(chatMessage);
    setChatResponse(response || '');
    setChatMessage('');
    setIsLoadingChat(false);
  };

  // === 🚀 UPGRADED TAG LOGIC ===
  const constructArtist = async (query: string, searchResult: any): Promise<Artist> => {
    const artworkTitles = searchResult.artworks.map((a: Artwork) => a.title);
    
    // 1. Get raw data from Gemini (Now includes Materials, Themes, Movements)
    const enriched = await enrichArtistProfile(query, searchResult.snippet, artworkTitles);
    
    // 2. Gather tags from ALL categories
    let rawTags: string[] = [];
    if (enriched) {
        // Combine Movements, Materials, and Themes
        rawTags = [
            ...(enriched.movements || []), 
            ...(enriched.materials || []), 
            ...(enriched.themes || [])
        ];
        
        // Fallback to genreTags/styleTags if old Gemini response format
        if (rawTags.length === 0) {
            rawTags = [...(enriched.genreTags || []), ...(enriched.styleTags || [])];
        }
    } else {
        rawTags = ["Modern Art"]; 
    }

    // 3. Strict Filter (Blacklist + Duplicates)
    const uniqueTags = Array.from(new Set(rawTags)); // Remove duplicates first
    const cleanTags = uniqueTags.filter(tag => {
        const upperTag = tag.toUpperCase().trim();
        const upperQuery = query.toUpperCase().trim();

        if (BAD_TAGS.includes(upperTag)) return false;
        if (upperTag === upperQuery) return false;
        if (upperQuery.includes(upperTag) && upperTag.length > 3) return false; 
        if (upperTag.includes("WIKIPEDIA")) return false;

        return true;
    });

    const finalTags = cleanTags.length > 0 ? cleanTags : ["Visual Art"];

    // 4. Merge Metadata
    const mergedArtworks = searchResult.artworks.map((art: Artwork, index: number) => {
      if (enriched?.artworksMetadata && enriched.artworksMetadata[index]) {
        return {
          ...art,
          title: enriched.artworksMetadata[index].title || art.title,
          year: enriched.artworksMetadata[index].year || art.year,
          media: enriched.artworksMetadata[index].media || art.media
        };
      }
      return art;
    });

    return {
      id: searchResult.id,
      name: {
        en: searchResult.name.en,
        cn: enriched?.nameCN || searchResult.name.cn
      },
      intro: {
        en: enriched?.introEN || searchResult.intro.en,
        cn: enriched?.introCN || searchResult.intro.cn
      },
      artworks: mergedArtworks,
      style: finalTags.slice(0, 10), // Increased limit to 10 tags
      media: enriched?.mediaTags || ["Various"],
      links: searchResult.links,
      visualElements: enriched?.visualElements || ["Vibrant Colors", "Bold Outlines"],
      culturalBackground: { en: searchResult.snippet, cn: "实时数据获取中" },
      techniques: { 
        en: enriched?.techniquesEN || "Extracted via Search", 
        cn: enriched?.techniquesCN || "采用实时 API 数据流" 
      }
    };
  };

  // ... (Rest of functions: triggerSearch, addCategory, etc. remain the same) ...
  const triggerSearch = async (q: string) => {
    if (!isOnline) {
      alert("You are offline. Only your collection is available.");
      return;
    }
    if (!q.trim() || q.length < 2) return;
    setIsSearching(true);
    setView(View.SEARCH);
    
    const result = await performRealSearch(q);
    if (result) {
      const newArtist = await constructArtist(q, result);
      setSearchResults(prev => {
        const filtered = prev.filter(a => a.id !== newArtist.id);
        return [newArtist, ...filtered].slice(0, 10);
      });
      setArtistRegistry(prev => ({ ...prev, [newArtist.id]: newArtist }));
    }
    setIsSearching(false);
  };

  const addCategory = useCallback((name: string, color: string) => {
    const cleanName = name.trim();
    if (!cleanName) return null;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: cleanName,
      color: color
    };
    
    setCategories(prev => [...prev, newCat]);
    return newCat;
  }, []);

  const updateCategory = useCallback((id: string, name: string, color: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, name: cleanName, color: color } : cat
    ));
  }, []);

  const toggleFavoriteInSpecificCategory = async (artist: Artist, categoryId: string) => {
    let artistToSave = { ...artist };
    
    if (!artistToSave.offlineImage && artist.artworks.length > 0) {
       const base64 = await cacheImage(artist.artworks[0].url);
       if (base64) {
         artistToSave.offlineImage = base64;
       }
    }

    setArtistRegistry(prev => ({ ...prev, [artist.id]: artistToSave }));
    
    setFavorites(prev => {
      const exists = prev.find(f => f.artistId === artist.id && f.category === categoryId);
      if (exists) {
        return prev.filter(f => !(f.artistId === artist.id && f.category === categoryId));
      } else {
        return [...prev, { id: Date.now().toString(), artistId: artist.id, category: categoryId }];
      }
    });
  };

  const handleCompare = (artist: Artist) => {
    setCompareList(prev => {
      const exists = prev.find(a => a.id === artist.id);
      if (exists) return prev.filter(a => a.id !== artist.id);
      if (prev.length < 2) return [...prev, artist];
      return prev;
    });
  };

  const deleteCategory = (id: string) => {
    if (confirm(t.confirmDelete)) {
      setCategories(categories.filter(c => c.id !== id));
      setFavorites(favorites.filter(f => f.category !== id));
      if (activeDrawer === id) setActiveDrawer(null);
    }
  };

  const getDrawerItems = (catId: string) => {
    return favorites
      .filter(f => f.category === catId)
      .map(f => {
        const artist = artistRegistry[f.artistId] || searchResults.find(a => a.id === f.artistId);
        return artist || { id: f.artistId, name: { en: 'Saved Artist', cn: '已收藏' } };
      });
  };

  const randomStyles = useMemo(() => {
    return SUGGESTED_STYLES.sort(() => Math.random() - 0.5).slice(0, 5);
  }, []);

  const handleOpenNewDrawerModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewDrawerName('');
    setNewDrawerColor(MEMPHIS_PALETTE[Math.floor(Math.random() * MEMPHIS_PALETTE.length)]);
    setEditingCategory(null);
    setIsNewDrawerModalOpen(true);
  };

  const handleOpenEditDrawerModal = (category: Category) => {
    setNewDrawerName(category.name);
    setNewDrawerColor(category.color);
    setEditingCategory(category);
    setIsNewDrawerModalOpen(true);
  };

  const handleSaveDrawer = () => {
    if (newDrawerName.trim()) {
      if (editingCategory) {
        updateCategory(editingCategory.id, newDrawerName, newDrawerColor);
      } else {
        addCategory(newDrawerName, newDrawerColor);
      }
      setIsNewDrawerModalOpen(false);
      setEditingCategory(null);
      setNewDrawerName('');
    }
  };
  
  const handleCreateDrawerFromTag = (tagName: string) => {
    const randomColor = MEMPHIS_PALETTE[Math.floor(Math.random() * MEMPHIS_PALETTE.length)];
    const newCat = addCategory(tagName, randomColor);
    if (newCat) {
      setActiveDrawer(newCat.id); 
    }
  };

  return (
    <div className="min-h-screen relative memphis-pattern pb-48 overflow-x-hidden">
      <header className="p-6 border-b-[5px] border-black bg-white sticky top-0 z-40 flex justify-between items-center shadow-[0_5px_0_0_rgba(0,0,0,1)]">
        <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter cursor-pointer" onClick={() => setView(View.SEARCH)}>
          ARTIST COLLECTOR <span className="text-[#FF1694]">©</span>
        </h1>
        <div className="flex space-x-4 md:space-x-6 font-black uppercase text-xs md:text-sm items-center">
          <button className={`hover:underline ${view === View.SEARCH ? 'underline decoration-4' : ''}`} onClick={() => setView(View.SEARCH)}>{t.search}</button>
          <button className={`hover:underline ${view === View.COLLECTION_LIST ? 'underline decoration-4' : ''}`} onClick={() => setView(View.COLLECTION_LIST)}>{t.archives}</button>
          <button className={`hover:underline ${view === View.COMPARISON ? 'underline decoration-4' : ''}`} onClick={() => setView(View.COMPARISON)}>{t.vs} ({compareList.length})</button>
          
          <div className="flex items-center space-x-2 border-l-[3px] border-black pl-4 ml-2">
            {user ? (
               <div className="flex items-center space-x-2">
                  <img src={user.photoURL} alt="user" className="w-8 h-8 rounded-full border-[2px] border-black" />
                  <button onClick={handleLogout} className="text-[10px] font-black hover:underline text-red-600">{t.logout}</button>
               </div>
            ) : (
               <button onClick={handleLogin} className="text-[10px] font-black bg-black text-white px-2 py-1 hover:bg-[#FF1694] transition-colors">{t.login}</button>
            )}
            
            <IconButton 
              icon={t.langToggle} 
              onClick={() => setLanguage(language === 'en' ? 'cn' : 'en')}
              className="!px-3 !py-1 text-[10px]"
              color="bg-black text-white"
            />
          </div>
        </div>
      </header>
      
      {!isOnline && (
        <div className="w-full bg-[#FF3131] text-white text-center font-black text-xs py-1 uppercase tracking-widest border-b-[3px] border-black">
          {t.offlineMode}
        </div>
      )}

      {/* Side Drawer System */}
      <div className="fixed left-0 top-[120px] z-[50] flex flex-col pointer-events-none">
        <div className="relative pointer-events-auto">
          {categories.map((cat, idx) => (
            <DrawerTab 
              key={cat.id}
              index={idx}
              isOpen={activeDrawer === cat.id}
              color={cat.color}
              label={cat.name}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveDrawer(activeDrawer === cat.id ? null : cat.id);
              }}
            />
          ))}
          <DrawerTab 
            index={categories.length}
            isOpen={false}
            color="#FFFFFF"
            label={t.newDrawer}
            isPlus
            onClick={handleOpenNewDrawerModal}
          />
        </div>
      </div>

      {/* New/Edit Drawer Custom Modal */}
      {isNewDrawerModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black bg-opacity-80 flex items-center justify-center p-4 backdrop-blur-md">
          <Box color="bg-white" className="w-full max-w-md p-8 relative animate-item-bouncy">
            <h2 className="text-3xl font-black uppercase italic mb-6 tracking-tighter underline decoration-[6px] decoration-[#5454FF] underline-offset-4">
              {editingCategory ? t.editTitle : t.createTitle}
            </h2>
            
            <div className="mb-6">
              <label className="block text-xs font-black uppercase mb-2 tracking-widest">{t.drawerName}</label>
              <input 
                type="text" 
                autoFocus
                value={newDrawerName}
                onChange={(e) => setNewDrawerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveDrawer()}
                className="w-full p-4 border-[4px] border-black font-black uppercase text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
                placeholder="..."
              />
            </div>

            <div className="mb-10">
              <label className="block text-xs font-black uppercase mb-3 tracking-widest">{t.pickColor}</label>
              <div className="grid grid-cols-4 gap-4">
                {MEMPHIS_PALETTE.map(color => (
                  <button 
                    key={color}
                    onClick={() => setNewDrawerColor(color)}
                    className={`h-12 border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${newDrawerColor === color ? 'scale-110 translate-x-1 translate-y-1 shadow-none ring-4 ring-black ring-offset-2' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <Button onClick={() => setIsNewDrawerModalOpen(false)} className="flex-1" color="bg-white text-black">
                {t.cancel}
              </Button>
              <Button 
                onClick={handleSaveDrawer} 
                className={`flex-1 ${!newDrawerName.trim() ? 'opacity-50 grayscale' : ''}`} 
                color="bg-black text-white"
              >
                {editingCategory ? t.confirmUpdate : t.confirmCreate}
              </Button>
            </div>
          </Box>
        </div>
      )}

      {/* Collect Modal */}
      {collectingArtist && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-70 flex items-center justify-center p-4 backdrop-blur-sm">
          <Box color="bg-white" className="w-full max-w-md p-8 relative animate-item-bouncy">
            <h2 className="text-3xl font-black uppercase italic mb-2 tracking-tighter">{t.addToCollection}</h2>
            <p className="font-bold text-sm mb-6 opacity-60">{t.selectDrawer}</p>
            
            <div className="space-y-3 mb-8 max-h-64 overflow-y-auto pr-2 no-scrollbar">
              {categories.map(cat => {
                const isSelected = favorites.some(f => f.artistId === collectingArtist.id && f.category === cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleFavoriteInSpecificCategory(collectingArtist, cat.id)}
                    className={`w-full p-4 border-[3px] border-black font-black uppercase text-left transition-all flex justify-between items-center ${isSelected ? 'bg-black text-white' : 'bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full border-[2px] border-black" style={{ backgroundColor: cat.color }}></div>
                      <span>{cat.name}</span>
                    </div>
                    {isSelected && <span className="text-xl">✓</span>}
                  </button>
                );
              })}
              <button
                onClick={handleOpenNewDrawerModal}
                className="w-full p-4 border-[3px] border-black border-dashed font-black uppercase text-center bg-gray-50 hover:bg-white transition-colors"
              >
                {t.createDrawer}
              </button>
            </div>
            
            <Button onClick={() => setCollectingArtist(null)} className="w-full" color="bg-black text-white">
              {t.close}
            </Button>
          </Box>
        </div>
      )}

      {/* Active Drawer View Overlay */}
      {activeDrawer && (
        <div className="fixed inset-y-0 left-12 w-80 bg-white border-r-[5px] border-black z-40 p-6 pt-24 shadow-[10px_0_0_0_rgba(0,0,0,1)] overflow-y-auto">
           {(() => {
             const currentCategory = categories.find(c => c.id === activeDrawer);
             return (
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-[3px] border-black rounded-full" style={{backgroundColor: currentCategory?.color || '#000'}}></div>
                    <h2 className="text-xl font-black uppercase tracking-tighter truncate max-w-[150px]">
                      {currentCategory?.name || t.archiveTitle}
                    </h2>
                    {currentCategory && (
                      <IconButton 
                        icon="✎" 
                        onClick={() => handleOpenEditDrawerModal(currentCategory)} 
                        className="!p-1 text-xs scale-75"
                        color="bg-[#F0F0F0] hover:bg-[#FF1694] hover:text-white"
                      />
                    )}
                  </div>
                  <IconButton icon="✕" onClick={() => setActiveDrawer(null)} />
               </div>
             );
           })()}
           
           <div className="space-y-4">
             {getDrawerItems(activeDrawer).map((a: any) => {
               const name = a.name[language] || a.name.en;
               return (
                 <div 
                   key={a.id} 
                   className="p-3 border-[3px] border-black bg-[#F0F0F0] font-bold text-xs hover:bg-black hover:text-white cursor-pointer transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none flex justify-between group"
                   onClick={() => { 
                     setSearchQuery(name); 
                     triggerSearch(name); 
                     setActiveDrawer(null); 
                   }}
                 >
                   {name}
                   <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                 </div>
               );
             })}
             {getDrawerItems(activeDrawer).length === 0 && <p className="text-xs italic opacity-50">{t.emptyArchive}</p>}
           </div>
        </div>
      )}

      <main className="p-6 md:p-12 md:pl-32 relative z-0 min-h-screen">
        {view === View.SEARCH ? (
          <div className="flex flex-col space-y-12">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-2xl relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && triggerSearch(searchQuery)}
                  placeholder={t.placeholder}
                  disabled={!isOnline}
                  className="w-full p-6 border-[5px] border-black text-2xl font-black uppercase shadow-[10px_10px_0_0_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[4px] focus:translate-y-[4px] focus:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button 
                  onClick={() => triggerSearch(searchQuery)}
                  disabled={!isOnline}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white p-3 font-black text-sm uppercase hover:bg-white hover:text-black border-2 border-black transition-all disabled:opacity-50"
                >
                  {t.search}
                </button>
              </div>
              
              <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl">
                <span className="text-xs font-black uppercase self-center mr-2">{t.quickAdd}</span>
                {randomStyles.map(s => (
                  <Tag key={s} label={s} onClick={(tag) => {
                    setSearchQuery(tag);
                    triggerSearch(tag);
                  }} color="bg-white" />
                ))}
              </div>
            </div>

            {isSearching && (
              <div className="flex flex-col items-center py-20">
                 <div className="animate-spin text-6xl mb-4">🌀</div>
                 <p className="font-black uppercase italic animate-pulse">Scanning the archives...</p>
              </div>
            )}

            {!isSearching && !searchQuery && dailyRec && isOnline && (
              <div className="flex flex-col items-center">
                <Box className="w-full max-w-4xl p-0 overflow-hidden flex flex-col md:flex-row mb-10" color="bg-[#FFDE59]">
                   <div className="md:w-1/3 h-64 md:h-auto">
                     <img src={dailyRec.artworks[0].url} className="w-full h-full object-cover border-b-[3px] md:border-b-0 md:border-r-[3px] border-black" alt="daily" />
                   </div>
                   <div className="flex-1 p-8 flex flex-col justify-center">
                     <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-1 inline-block mb-4 self-start">{t.dailyRec}</span>
                     <h2 className="text-4xl font-black uppercase mb-2">{dailyRec.name[language]}</h2>
                     <p className="font-bold text-sm mb-6 line-clamp-3">{dailyRec.intro[language]}</p>
                     <Button onClick={() => triggerSearch(dailyRec.name[language])} className="self-start">{t.explore}</Button>
                   </div>
                </Box>
              </div>
            )}

            {!isSearching && (
              <div className={`flex overflow-x-auto py-10 space-x-12 snap-x snap-mandatory no-scrollbar ${searchResults.length <= 2 ? 'md:justify-center' : ''}`}>
                {searchResults.length > 0 ? (
                  searchResults.map(artist => (
                    <ArtistCard 
                      key={artist.id}
                      artist={artist}
                      language={language}
                      onTagClick={(tag) => { setSearchQuery(tag); triggerSearch(tag); }}
                      onCollect={setCollectingArtist}
                      onCompare={handleCompare}
                      onCreateDrawer={handleCreateDrawerFromTag}
                      isFavorite={favorites.some(f => f.artistId === artist.id)}
                      isComparing={compareList.some(a => a.id === artist.id)}
                      resourcesLabel={t.resources}
                    />
                  ))
                ) : !dailyRec && !isSearching && isOnline && (
                  <div className="w-full flex justify-center py-20">
                    <Box className="p-12 text-center rotate-3" color="bg-[#FFDE59]">
                      <h3 className="text-3xl font-black uppercase">{t.museum}</h3>
                      <p className="font-bold">{t.startJourney}</p>
                    </Box>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : view === View.COMPARISON ? (
          <ComparisonMode artists={compareList} language={language} onClear={() => setCompareList([])} />
        ) : (
          <CollectionView 
            categories={categories} 
            favorites={favorites} 
            searchResults={searchResults} 
            artistRegistry={artistRegistry}
            language={language}
            onSelectArtist={(name) => { 
                if (!isOnline && !artistRegistry[searchResults.find(a => a.name.en === name || a.name.cn === name)?.id || '']) {
                   // Safe check
                }
                setView(View.SEARCH); 
                setSearchQuery(name); 
                triggerSearch(name); 
            }}
            onDeleteCategory={deleteCategory}
          />
        )}
      </main>

      {/* AI Chatbox Overlay */}
      <div className={`fixed bottom-0 right-0 z-50 p-6 transition-all duration-300 ${isChatMinimized ? 'w-auto' : 'w-full md:w-[450px]'}`}>
        <Box color="bg-white" className={`flex flex-col ${isChatMinimized ? 'h-auto' : 'h-[500px]'}`}>
          <div 
            className="p-4 border-b-[3px] border-black bg-black text-white flex justify-between items-center cursor-pointer"
            onClick={() => setIsChatMinimized(!isChatMinimized)}
          >
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-[#FF1694] animate-pulse" />
              <h4 className="font-black uppercase tracking-tight text-sm">{t.aiHistorian}</h4>
            </div>
            <div className="flex items-center">
               {isChatMinimized ? <span className="text-xs font-black">{t.expand}</span> : <span className="text-xs font-black">{t.minimize}</span>}
            </div>
          </div>
          
          {!isChatMinimized && (
            <>
              <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#F0F0F0] font-bold text-sm">
                {chatResponse ? (
                  <div className="p-4 border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-xs leading-relaxed whitespace-pre-wrap">
                    {chatResponse}
                  </div>
                ) : (
                  <div className="text-center py-20 opacity-40 italic">
                    <p>{t.expert}</p>
                  </div>
                )}
                {isLoadingChat && <div className="text-center animate-bounce text-2xl">⏳</div>}
              </div>

              <div className="p-4 border-t-[3px] border-black flex bg-white">
                <input 
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder={t.expert}
                  className="flex-grow p-3 border-[3px] border-black font-black uppercase text-xs focus:outline-none"
                />
                <Button onClick={sendChatMessage} className="ml-3 !px-6 !py-2 text-xs" color="bg-black text-white">{t.send}</Button>
              </div>
            </>
          )}
        </Box>
      </div>
    </div>
  );
};

export default App;
