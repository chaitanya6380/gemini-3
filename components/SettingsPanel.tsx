import React from 'react';
import { AppMode, GenerationSettings } from '../types';

interface SettingsPanelProps {
  mode: AppMode;
  settings: GenerationSettings;
  onSettingsChange: (newSettings: Partial<GenerationSettings>) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ mode, settings, onSettingsChange }) => {
  if (mode === AppMode.Chat || mode === AppMode.ImageEdit) return null;

  return (
    <div className="flex gap-4 mb-4 overflow-x-auto pb-2 scrollbar-hide">
      
      {/* Aspect Ratio Selector */}
      <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
        <span className="text-xs text-zinc-500 pl-2 font-medium">Aspect</span>
        <select 
          value={settings.aspectRatio}
          onChange={(e) => onSettingsChange({ aspectRatio: e.target.value })}
          className="bg-zinc-800 text-zinc-200 text-xs py-1.5 px-3 rounded-lg border-none outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          {mode === AppMode.VideoGen ? (
            <>
              <option value="16:9">16:9 Landscape</option>
              <option value="9:16">9:16 Portrait</option>
            </>
          ) : (
            <>
              <option value="1:1">1:1 Square</option>
              <option value="16:9">16:9 Wide</option>
              <option value="4:3">4:3 Standard</option>
              <option value="3:4">3:4 Portrait</option>
              <option value="9:16">9:16 Mobile</option>
              <option value="21:9">21:9 Cinema</option>
            </>
          )}
        </select>
      </div>

      {/* Resolution Selector (Only for Image) */}
      {mode === AppMode.ImageGen && (
        <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
          <span className="text-xs text-zinc-500 pl-2 font-medium">Size</span>
          <select 
            value={settings.imageSize}
            onChange={(e) => onSettingsChange({ imageSize: e.target.value })}
            className="bg-zinc-800 text-zinc-200 text-xs py-1.5 px-3 rounded-lg border-none outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="1K">1K Fast</option>
            <option value="2K">2K High Res</option>
            <option value="4K">4K Ultra</option>
          </select>
        </div>
      )}
      
      {mode === AppMode.VideoGen && (
         <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 opacity-75 cursor-not-allowed">
           <span className="text-xs text-zinc-500 pl-2 font-medium">Res</span>
           <span className="text-xs text-zinc-400 px-2">1080p (Fixed)</span>
         </div>
      )}
    </div>
  );
};