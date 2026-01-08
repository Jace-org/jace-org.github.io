
import React from 'react';

const Contact: React.FC = () => {
  return (
    <section id="contact" className="py-24 px-6 bg-[#010409]">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h3 className="text-3xl font-orbitron mb-4 text-red-600">Initialize Uplink</h3>
        <p className="text-slate-400 tracking-widest font-medium">SECURE MESSAGE TRANSMISSION. ENCRYPTED AND DIRECT.</p>
      </div>

      <div className="max-w-3xl mx-auto bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl p-8 md:p-12 shadow-2xl">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-[10px] font-orbitron uppercase tracking-widest text-slate-500 mb-2 group-focus-within:text-red-500 transition-colors font-bold">Signal Name</label>
              <input 
                type="text" 
                placeholder="Ex. J. Smith"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-red-600/50 focus:bg-black/60 transition-all font-medium"
              />
            </div>
            <div className="group">
              <label className="block text-[10px] font-orbitron uppercase tracking-widest text-slate-500 mb-2 group-focus-within:text-blue-500 transition-colors font-bold">Return Address</label>
              <input 
                type="email" 
                placeholder="Ex. smith@cipher.net"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-600/50 focus:bg-black/60 transition-all font-medium"
              />
            </div>
          </div>
          
          <div className="group">
            <label className="block text-[10px] font-orbitron uppercase tracking-widest text-slate-500 mb-2 group-focus-within:text-red-500 transition-colors font-bold">Payload (Message)</label>
            <textarea 
              rows={5} 
              placeholder="Enter your transmission data..."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-red-600/50 focus:bg-black/60 transition-all resize-none font-medium"
            />
          </div>
          
          <button className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-orbitron font-bold uppercase tracking-[0.3em] rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(190,18,60,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.6)] border border-red-500/30">
            Execute Send
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
