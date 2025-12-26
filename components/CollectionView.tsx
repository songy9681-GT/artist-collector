
import React from 'react';
import { Category, Artist, CollectionItem } from '../types';
import { Box } from './MemphisUI';

interface CollectionViewProps {
  categories: Category[];
  favorites: CollectionItem[];
  searchResults: Artist[];
  artistRegistry: Record<string, Artist>;
  language: 'en' | 'cn';
  onSelectArtist: (name: string) => void;
  onDeleteCategory: (id: string) => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({ 
  categories, favorites, searchResults, artistRegistry, language, onSelectArtist, onDeleteCategory 
}) => {
  const t = {
    en: {
      title: 'Master Archive',
      noArtists: 'No artists in this drawer yet.',
      deleteDrawer: 'Delete Drawer'
    },
    cn: {
      title: '大师藏品馆',
      noArtists: '此抽屉尚无艺术家。',
      deleteDrawer: '删除抽屉'
    }
  }[language];

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-5xl font-black uppercase mb-12 italic underline decoration-[#FF1694] decoration-8">{t.title}</h2>
      
      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        {categories.map(cat => {
          const items = favorites.filter(f => f.category === cat.id);
          return (
            <Box key={cat.id} color="bg-white" className="break-inside-avoid shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
              <div className={`p-4 border-b-[3px] border-black flex justify-between items-center`} style={{ backgroundColor: cat.color }}>
                <h3 className="text-xl font-black uppercase tracking-tight">{cat.name}</h3>
                <span className="bg-black text-white px-2 py-0.5 text-xs font-bold">{items.length}</span>
              </div>
              <div className="p-4 space-y-2">
                {items.length > 0 ? (
                  items.map(item => {
                    const artist = artistRegistry[item.artistId] || searchResults.find(a => a.id === item.artistId);
                    const displayName = artist?.name[language] || artist?.name.en || 'Unknown Artist';
                    return (
                      <div 
                        key={item.id}
                        onClick={() => onSelectArtist(displayName)}
                        className="p-3 border-[2px] border-black hover:bg-black hover:text-white cursor-pointer transition-all font-bold text-sm flex justify-between group"
                      >
                        {displayName}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs font-bold italic opacity-40 py-4 text-center">{t.noArtists}</p>
                )}
              </div>
              <div className="p-2 border-t-[2px] border-black flex justify-end">
                <button 
                  onClick={() => onDeleteCategory(cat.id)}
                  className="text-[10px] font-black uppercase text-red-600 hover:underline"
                >
                  {t.deleteDrawer}
                </button>
              </div>
            </Box>
          );
        })}
      </div>
    </div>
  );
};
