
import React from 'react';
import { FileText, FileCode, Archive, FileImage, Download, Search, HardDrive } from 'lucide-react';
import { RESOURCES } from '../constants';

const Resources: React.FC = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-8 h-8 text-red-500" />;
      case 'doc': return <FileText className="w-8 h-8 text-blue-500" />;
      case 'script': return <FileCode className="w-8 h-8 text-green-500" />;
      case 'archive': return <Archive className="w-8 h-8 text-yellow-500" />;
      case 'image': return <FileImage className="w-8 h-8 text-purple-500" />;
      default: return <FileText className="w-8 h-8 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-black/95">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-white/10 pb-12">
          <div>
            <h2 className="text-4xl md:text-6xl font-orbitron font-black text-white flex items-center gap-4">
              <span className="text-red-600">SECURE</span> VAULT
            </h2>
            <p className="text-slate-500 font-orbitron tracking-[0.3em] uppercase text-xs mt-4 font-bold">
              Directory: /root/resources/production-logs
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-xl backdrop-blur-md">
            <HardDrive className="w-5 h-5 text-blue-500" />
            <div className="text-left">
              <p className="text-[10px] font-orbitron text-slate-500 uppercase">System Storage</p>
              <p className="text-sm font-bold text-white">42.8 GB / 128 GB</p>
            </div>
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-4">
              <div className="h-full bg-blue-500 w-[33%]" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-12 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search assets by name, extension, or category..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-8 text-white outline-none focus:border-red-600/50 transition-all font-orbitron tracking-widest text-sm"
          />
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESOURCES.map((file) => (
            <div 
              key={file.id} 
              className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-red-600/30 rounded-2xl p-6 transition-all duration-300"
            >
              {/* Dynamic Glow Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                    {getIcon(file.type)}
                  </div>
                  <span className="text-[10px] font-orbitron font-black tracking-widest px-3 py-1 bg-white/5 text-slate-400 rounded-full border border-white/5 uppercase">
                    {file.category}
                  </span>
                </div>
                
                <h4 className="text-lg font-orbitron font-bold text-white mb-2 truncate group-hover:text-red-500 transition-colors">
                  {file.name}
                </h4>
                
                <div className="flex items-center gap-6 mb-8 text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {file.size}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {file.date}
                  </span>
                </div>

                <button className="w-full py-3 bg-black/40 hover:bg-red-600 text-white border border-white/10 hover:border-red-600 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 text-xs font-orbitron font-bold tracking-[0.2em] uppercase">
                  <Download className="w-4 h-4" />
                  Request Access
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Resources;
