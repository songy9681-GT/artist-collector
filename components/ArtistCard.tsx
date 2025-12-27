import React, { useState } from 'react';
import { Artist } from '../types';
import { IconButton, Tag } from './MemphisUI';

interface ArtistCardProps {
  artist: Artist;
  onTagClick: (tag: string) => void;
  onCollect: (artist: Artist) => void;
  onCompare: (artist: Artist) => void;
  onCreateDrawer?: (tag: string) => void;
  isFavorite: boolean;
  language: 'en' | 'cn';
  resourcesLabel: string;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ 
  artist, 
  onTagClick, 
  onCollect, 
  onCompare, 
  onCreateDrawer,
  isFavorite, 
  language, 
  resourcesLabel 
}) => {
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Close menu on outside click
  React.useEffect(() => {
    const closeMenu = () => setActiveTag(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  return (
    <div className="snap-center shrink-0 w-[90vw] md:w-[600px] bg-white border-[4px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[75vh] overflow-hidden relative transition-transform hover:-translate-y-1">
      
      {/* Header */}
      <div className="p-6 border-b-[4px] border-black flex justify-between items-start bg-white z-10">
        <div>
          <h2 className="text-3xl md:text-5xl font-black uppercase leading-none mb-1 tracking-tighter">{artist.name.en}</h2>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{artist.name.cn}</p>
        </div>
        <div className="flex gap-2">
           <IconButton icon={isFavorite ? "★" : "☆"} onClick={() => onCollect(artist)} color={isFavorite ? "bg-[#FFDE59]" : "bg-white"} className="w-12 h-12 text-xl" />
           <IconButton icon="VS" onClick={() => onCompare(artist)} className="w-12 h-12 text-sm" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        
        {/* Bio Section */}
        <div 
            className="p-6 bg-[#F0F0F0] border-b-[4px] border-black cursor-pointer group hover:bg-gray-200 transition-colors"
            onClick={(e) => {
                e.stopPropagation(); // Stop bubble up
                setIsBioExpanded(!isBioExpanded);
            }}
        >
          <div className="flex justify-between items-center mb-2">
             <span className="text-xs font-black uppercase bg-black text-white px-2 py-1">Biography</span>
             <div className="flex items-center gap-1">
                 <span className="text-[10px] font-bold uppercase opacity-50 group-hover:opacity-100 transition-opacity">
                    {isBioExpanded ? "COLLAPSE" : "READ FULL"}
                 </span>
                 <span className="text-xs">{isBioExpanded ? "▲" : "▼"}</span>
             </div>
          </div>
          <p className={`text-sm font-bold leading-relaxed border-l-[4px] border-[#FF1694] pl-4 transition-all duration-300 ${isBioExpanded ? '' : 'line-clamp-3'}`}>
            {artist.intro[language]}
          </p>
        </div>
          
        {/* Tags Section */}
        <div className="p-6 border-b-[4px] border-black">
            <span className="text-xs font-black uppercase bg-[#5454FF] text-white px-2 py-1 mb-3 inline-block">Keywords & Styles</span>
            <div className="flex flex-wrap gap-2">
              {artist.style.map(tag => (
                <div key={tag} className="relative inline-block">
                    <div onClick={(e) => {
                        e.stopPropagation();
                        setActiveTag(activeTag === tag ? null : tag);
                    }}>
                        <Tag 
                            label={tag} 
                            onClick={() => {}} // Handle click in parent div
                            color={activeTag === tag ? "bg-black text-white" : "bg-white"} 
                        />
                    </div>
                    
                    {/* Pop-up Menu */}
                    {activeTag === tag && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-50 flex flex-col p-1 animate-item-bouncy">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTagClick(tag);
                                    setActiveTag(null);
                                }}
                                className="text-left px-3 py-3 font-bold text-xs hover:bg-[#FFDE59] border-b-[2px] border-black uppercase flex items-center gap-2"
                            >
                                <span>🔍</span> Search this
                            </button>
                            {onCreateDrawer && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCreateDrawer(tag);
                                        setActiveTag(null);
                                    }}
                                    className="text-left px-3 py-3 font-bold text-xs hover:bg-[#FF1694] hover:text-white uppercase flex items-center gap-2"
                                >
                                    <span>+</span> Create Drawer
                                </button>
                            )}
                        </div>
                    )}
                </div>
              ))}
            </div>
        </div>

        {/* Gallery */}
        <div className="p-6">
          <h3 className="font-black uppercase mb-4 underline decoration-[6px] decoration-[#5454FF] underline-offset-2">Gallery</h3>
          <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x">
            {artist.artworks.map((art, i) => (
              <div key={i} className="shrink-0 w-56 group relative snap-center">
                <div className="border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                  <img src={art.url} className="w-full h-48 object-cover border-b-[3px] border-black" onError={(e) => e.target.src = 'https://placehold.co/400x400?text=No+Image'} />
                  <div className="p-3 bg-white">
                    <p className="text-xs font-black truncate uppercase">{art.title}</p>
                    <p className="text-[10px] font-bold text-gray-500">{art.media}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
