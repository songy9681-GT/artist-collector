
import React, { useState } from 'react';
import { Artist } from '../types';
import { Box, Button, Tag } from './MemphisUI';

interface ArtistCardProps {
  artist: Artist;
  language: 'en' | 'cn';
  onTagClick: (label: string) => void;
  onCollect: (artist: Artist) => void;
  onCompare: (artist: Artist) => void;
  onCreateDrawer: (label: string) => void;
  isFavorite: boolean;
  isComparing: boolean;
  resourcesLabel?: string;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ 
  artist, language, onTagClick, onCollect, onCompare, onCreateDrawer, isFavorite, isComparing, resourcesLabel 
}) => {
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const t = {
    en: {
      inCollection: 'IN COLLECTION',
      collect: '★ COLLECT',
      selected: 'SELECTED',
      compare: 'VS COMPARE',
      visit: 'VISIT SITE'
    },
    cn: {
      inCollection: '已收藏',
      collect: '★ 收藏',
      selected: '已加入',
      compare: 'VS 对比',
      visit: '访问站点'
    }
  }[language];

  const handleTagClick = (label: string) => {
    setSelectedTag(label);
  };

  const handleTagAction = (action: 'search' | 'drawer') => {
    if (!selectedTag) return;
    if (action === 'search') {
      onTagClick(selectedTag);
    } else {
      onCreateDrawer(selectedTag);
    }
    setSelectedTag(null);
  };

  const mainImage = artist.offlineImage || artist.artworks[0]?.url;

  return (
    <Box className="w-[85vw] md:w-[500px] flex flex-col flex-shrink-0 snap-center min-h-[850px] overflow-hidden bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
      
      {/* Tag Action Overlay */}
      {selectedTag && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-item-bouncy">
          <Box className="w-full bg-white p-6 flex flex-col gap-4 text-center border-[5px]">
            <h3 className="text-xl font-black uppercase tracking-tighter">
              {language === 'en' ? 'TAG ACTION:' : '标签操作:'} <br/>
              <span className="text-[#5454FF] underline decoration-4 decoration-[#FFDE59]">{selectedTag}</span>
            </h3>
            <div className="flex flex-col gap-3 mt-4">
              <Button onClick={() => handleTagAction('search')} color="bg-[#FFDE59] hover:bg-black hover:text-white" className="w-full py-4 text-lg">
                {language === 'en' ? '🔍 Search This Tag' : '🔍 搜索此标签'}
              </Button>
              <Button onClick={() => handleTagAction('drawer')} color="bg-[#FF1694] text-white hover:bg-black" className="w-full py-4 text-lg">
                {language === 'en' ? '📂 Create Drawer' : '📂 以此新建抽屉'}
              </Button>
              <Button onClick={() => setSelectedTag(null)} color="bg-white hover:bg-red-500 hover:text-white" className="w-full mt-2">
                {language === 'en' ? 'Cancel' : '取消'}
              </Button>
            </div>
          </Box>
        </div>
      )}

      <div className="w-full p-6 border-b-[3px] border-black flex flex-col bg-[#F0F0F0] flex-shrink-0">
        <div className="flex items-start space-x-6 mb-4">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full border-[4px] border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
               <img 
                src={mainImage} 
                alt={artist.name.en} 
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as any).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.name.en}` }}
               />
            </div>
          </div>
          
          <div className="flex-grow">
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">{artist.name[language]}</h2>
            <h3 className="text-base font-bold opacity-60 mb-2">{language === 'en' ? artist.name.cn : artist.name.en}</h3>
            
            <div className="flex flex-wrap">
              {artist.style.map(s => (
                <Tag 
                  key={s} 
                  label={s} 
                  color="bg-[#5454FF] text-white" 
                  onClick={handleTagClick} 
                />
              ))}
              {artist.media.map(m => (
                <Tag 
                  key={m} 
                  label={m} 
                  color="bg-[#00D1FF] text-black" 
                  onClick={handleTagClick} 
                />
              ))}
            </div>
          </div>
        </div>

        <div 
          className="mb-6 bg-white border-[2px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group active:scale-[0.99]"
          onClick={(e) => {
             e.stopPropagation();
             setIsBioExpanded(!isBioExpanded);
          }}
          title={language === 'en' ? "Click to expand/collapse" : "点击展开/收起"}
        >
          <div className={`text-sm font-bold leading-tight ${isBioExpanded ? '' : 'line-clamp-4'}`}>
            {artist.intro[language]}
          </div>
          <div className="mt-2 text-[10px] font-black uppercase text-gray-400 group-hover:text-black text-right transition-colors select-none">
            {isBioExpanded ? (language === 'en' ? '▲ SHOW LESS' : '▲ 收起') : (language === 'en' ? '▼ READ MORE' : '▼ 展开阅读')}
          </div>
        </div>

        {/* Links Section */}
        <div className="mb-6">
          <h4 className="text-[10px] font-black uppercase mb-2 text-[#FF1694] tracking-widest">{resourcesLabel || "Resources"}</h4>
          <div className="flex flex-wrap gap-2">
            {artist.links.map((link, idx) => (
              <a 
                key={idx} 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-black text-white px-3 py-1.5 text-[10px] font-black uppercase border-[2px] border-black hover:bg-white hover:text-black transition-colors shadow-[3px_3px_0px_0px_rgba(255,22,148,1)] flex items-center"
              >
                {link.label} <span className="ml-1">↗</span>
              </a>
            ))}
          </div>
        </div>

        <div className="flex space-x-2 mt-auto">
          <Button 
            onClick={() => onCollect(artist)} 
            className="flex-1 text-xs"
            color={isFavorite ? "bg-black text-white" : "bg-[#FFDE59]"}
          >
            {isFavorite ? t.inCollection : t.collect}
          </Button>
          <Button 
            onClick={() => onCompare(artist)}
            className="flex-1 text-xs"
            color={isComparing ? "bg-[#FF1694] text-white" : "bg-white"}
          >
            {isComparing ? t.selected : t.compare}
          </Button>
        </div>
      </div>

      <div className="w-full flex flex-col flex-grow bg-white relative">
        <div className="flex-grow overflow-x-auto no-scrollbar flex flex-row snap-x snap-mandatory">
          {artist.artworks.map((art, i) => (
            <div key={i} className="flex-shrink-0 w-[300px] h-full snap-center bg-gray-100 border-r-[3px] border-black last:border-r-0 relative group flex flex-col">
              <div className="relative flex-grow overflow-hidden">
                <img 
                  src={i === 0 && artist.offlineImage ? artist.offlineImage : art.url} 
                  alt={art.title} 
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                  onError={(e) => { (e.target as any).src = `https://placehold.co/600x600/000/fff?text=${artist.name.en}+Work+${i+1}` }} 
                />
                <div className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                  WORK_0{i+1}
                </div>
              </div>
              
              <div className="p-4 bg-white border-t-[3px] border-black flex flex-col justify-center h-[100px]">
                <h4 className="font-black uppercase text-xs truncate leading-none mb-1" title={art.title}>{art.title}</h4>
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                  <span className="bg-[#FFDE59] text-black px-1 border border-black">{art.year}</span>
                  <span className="truncate max-w-[120px] ml-2 italic">{art.media}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-[100px] left-0 right-0 h-8 flex items-center justify-center pointer-events-none">
           {/* Spacer overlay if needed */}
        </div>
      </div>
    </Box>
  );
};
