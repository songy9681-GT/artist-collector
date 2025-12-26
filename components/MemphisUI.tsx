
import React from 'react';

export const Box: React.FC<{ children: React.ReactNode; className?: string; color?: string }> = ({ 
  children, 
  className = "", 
  color = "bg-white" 
}) => (
  <div className={`border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${color} ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string; 
  color?: string 
}> = ({ children, onClick, className = "", color = "bg-[#FF1694]" }) => (
  <button 
    type="button"
    onClick={onClick}
    className={`border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:bg-black active:text-white transition-all px-4 py-2 font-bold uppercase ${color} ${className}`}
  >
    {children}
  </button>
);

export const IconButton: React.FC<{ 
  onClick?: () => void; 
  className?: string; 
  color?: string;
  icon: string;
}> = ({ onClick, className = "", color = "bg-white", icon }) => (
  <button 
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    className={`border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:scale-95 transition-all p-1 font-bold ${color} ${className}`}
  >
    {icon}
  </button>
);

export const Tag: React.FC<{ label: string; color?: string; onClick?: (label: string) => void }> = ({ 
  label, 
  color = "bg-[#FFDE59]", 
  onClick 
}) => (
  <button 
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick?.(label);
    }}
    className={`inline-block border-[2px] border-black px-4 py-1 text-xs font-black mr-2 mb-2 uppercase rounded-full transition-all hover:scale-105 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:scale-95 ${color}`}
  >
    {label}
  </button>
);

export const DrawerTab: React.FC<{ 
  isOpen: boolean; 
  color: string; 
  onClick: (e: React.MouseEvent) => void; 
  label: string;
  index: number;
  isPlus?: boolean;
}> = ({ isOpen, color, onClick, label, index, isPlus = false }) => (
  <div 
    className={`absolute left-0 transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] pointer-events-auto`}
    style={{ top: `${index * 75}px`, transform: isOpen ? 'translateX(0)' : 'translateX(-5px)' }}
  >
    <button 
      type="button"
      onClick={onClick}
      className={`flex items-center border-[4px] border-black border-l-0 pr-6 pl-5 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-black uppercase transition-all bg-white group hover:translate-x-1 cursor-pointer min-w-[70px] relative z-[60]`}
    >
      <div 
        className={`w-8 h-8 rounded-full border-[4px] border-black flex-shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all ${!isOpen && !isPlus ? 'animate-pulse-dot' : ''} flex items-center justify-center`}
        style={{ backgroundColor: color }}
      >
        {isPlus ? <span className="text-2xl font-black leading-none">+</span> : null}
      </div>
      
      <span className={`max-w-0 overflow-hidden group-hover:max-w-[300px] transition-all duration-300 whitespace-nowrap text-xl tracking-tighter ml-0 ${isPlus ? 'max-w-[300px] ml-4' : 'group-hover:ml-4'}`}>
        {label}
      </span>
    </button>
  </div>
);
