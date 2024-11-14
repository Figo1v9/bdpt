import React from 'react';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-800/50 backdrop-blur-lg border-t border-slate-700/50 py-4 mt-auto">
      <div className="container mx-auto px-4 text-center text-slate-400">
        <p className="flex items-center justify-center gap-2">
          Made with <Heart size={16} className="text-red-500" /> by Muhammad Ahmad Khader
        </p>
      </div>
    </footer>
  );
}