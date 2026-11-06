import React from 'react';
import { Github, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 mt-16 py-6 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>ApexLedger — High-Throughput Double-Entry Ledger & Idempotent Settlement Engine</span>
        </div>

        {/* Mandatory exact requirement: "made with ♥ by Tejdeep" positioned at bottom right linking to repo */}
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/TejdeepKodati/apex-ledger"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-slate-300 hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="font-medium">GitHub Repository</span>
          </a>

          <a
            href="https://github.com/TejdeepKodati/apex-ledger"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-emerald-400 transition-colors font-medium cursor-pointer"
          >
            made with ♥ by Tejdeep
          </a>
        </div>
      </div>
    </footer>
  );
};
