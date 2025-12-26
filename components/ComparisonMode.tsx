
import React, { useState } from 'react';
import { Artist } from '../types';
import { Box, Button } from './MemphisUI';

interface FlipCardProps {
  question: string;
  artistA: Artist;
  artistB: Artist;
  analysisKey: keyof Artist;
  color: string;
  language: 'en' | 'cn';
}

const ComparisonFlip: React.FC<FlipCardProps> = ({ question, artistA, artistB, analysisKey, color, language }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const getAnalysis = (artist: Artist) => {
    const val = artist[analysisKey];
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'object' && val !== null) {
      const v = val as any;
      return v[language] || v.en || v.cn || JSON.stringify(val);
    }
    return 'N/A';
  };

  return (
    <div className="group perspective-1000 w-full h-[350px] cursor-pointer mb-8" onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        <Box color={color} className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 text-center border-[5px]">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4">{question}</h2>
          <span className="text-xs font-black bg-black text-white px-4 py-1 animate-bounce">
            {language === 'en' ? 'CLICK TO UNVEIL' : '点击揭晓'}
          </span>
        </Box>

        <Box color="bg-white" className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col border-[5px]">
          <div className="flex h-full">
            <div className="flex-1 p-6 border-r-[3px] border-black flex flex-col justify-center bg-[#F0F0F0] overflow-y-auto no-scrollbar">
               <h4 className="text-lg font-black underline mb-2">{artistA.name[language]}</h4>
               <p className="text-sm font-bold leading-relaxed">{getAnalysis(artistA)}</p>
            </div>
            <div className="flex-1 p-6 flex flex-col justify-center bg-[#FFDE59] overflow-y-auto no-scrollbar">
               <h4 className="text-lg font-black underline mb-2">{artistB.name[language]}</h4>
               <p className="text-sm font-bold leading-relaxed">{getAnalysis(artistB)}</p>
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
};

export const ComparisonMode: React.FC<{ artists: Artist[]; language: 'en' | 'cn'; onClear: () => void }> = ({ artists, language, onClear }) => {
  const t = {
    en: {
      title: 'Vs Comparison',
      clear: 'Clear All',
      needTwo: 'NEED TWO TO TANGO!',
      needTwoDesc: 'Please pick 2 artists from your search to start the battle.',
      back: 'Back to Search',
      qVisual: 'Visual Elements?',
      qTechnique: 'What is their Technique?',
      qCultural: 'Their Cultural Context?'
    },
    cn: {
      title: 'VS 艺术家对比',
      clear: '清空列表',
      needTwo: '还差一位！',
      needTwoDesc: '请从搜索结果中选择两位艺术家进行对比分析。',
      back: '返回搜索',
      qVisual: '视觉元素分析',
      qTechnique: '创作手法/媒介',
      qCultural: '文化背景分析'
    }
  }[language];

  if (artists.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 space-y-6">
        <Box className="p-8 text-center" color="bg-[#5454FF] text-white">
          <h2 className="text-4xl font-black italic mb-4">{t.needTwo}</h2>
          <p className="text-xl font-bold">{t.needTwoDesc}</p>
        </Box>
        <Button onClick={onClear} color="bg-black text-white">{t.back}</Button>
      </div>
    );
  }

  const [a1, a2] = artists;

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-5xl font-black uppercase tracking-tighter bg-black text-white px-6 py-2 -rotate-2">{t.title}</h2>
        <Button onClick={onClear} color="bg-[#FF1694]" className="text-white">{t.clear}</Button>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <ComparisonFlip 
          question={t.qVisual}
          artistA={a1} 
          artistB={a2} 
          analysisKey="visualElements" 
          color="bg-[#FFDE59]" 
          language={language}
        />
        <ComparisonFlip 
          question={t.qTechnique}
          artistA={a1} 
          artistB={a2} 
          analysisKey="techniques" 
          color="bg-[#5454FF] text-white" 
          language={language}
        />
        <ComparisonFlip 
          question={t.qCultural}
          artistA={a1} 
          artistB={a2} 
          analysisKey="culturalBackground" 
          color="bg-[#FF1694] text-white" 
          language={language}
        />
      </div>
    </div>
  );
};
