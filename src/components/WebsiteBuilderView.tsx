import React, { useState } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Eye,
  Download,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Plus,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { GeneratedWebsite } from '../types/assistant.ts';

interface WebsiteBuilderViewProps {
  websites: GeneratedWebsite[];
  activeWebsiteId: string | null;
  onSelectWebsite: (id: string) => void;
  onGenerateNew: (prompt: string) => void;
  isGenerating: boolean;
}

export const WebsiteBuilderView: React.FC<WebsiteBuilderViewProps> = ({
  websites,
  activeWebsiteId,
  onSelectWebsite,
  onGenerateNew,
  isGenerating,
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [showGallery, setShowGallery] = useState(false);

  const activeSite =
    websites.find((w) => w.id === activeWebsiteId) || websites[0] || null;

  const handleCopyCode = () => {
    if (!activeSite) return;
    navigator.clipboard.writeText(activeSite.html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeSite) return;
    const blob = new Blob([activeSite.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSite.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenExternal = () => {
    if (!activeSite) return;
    const blob = new Blob([activeSite.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isGenerating) return;
    onGenerateNew(promptInput.trim());
    setPromptInput('');
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-slate-800 bg-slate-900/80">
        {/* Left: Active Site Info & Gallery Dropdown */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGallery(!showGallery)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sites ({websites.length})</span>
          </button>

          {activeSite && (
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide truncate max-w-xs md:max-w-md">
                {activeSite.title}
              </h2>
              <p className="text-[11px] text-slate-400 truncate max-w-xs md:max-w-md">
                {activeSite.description}
              </p>
            </div>
          )}
        </div>

        {/* Center: Device Viewport Switches & Preview/Code Toggle */}
        <div className="flex items-center gap-2">
          {viewMode === 'preview' && (
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded text-xs transition ${
                  deviceMode === 'desktop' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop View (Full Width)"
                aria-label="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceMode('tablet')}
                className={`p-1.5 rounded text-xs transition ${
                  deviceMode === 'tablet' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Tablet View (768px)"
                aria-label="Tablet View"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded text-xs transition ${
                  deviceMode === 'mobile' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile View (375px)"
                aria-label="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition ${
                viewMode === 'preview'
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition ${
                viewMode === 'code'
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {viewMode === 'code' ? (
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied HTML' : 'Copy HTML'}</span>
            </button>
          ) : (
            <button
              onClick={handleOpenExternal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
              title="Open full preview in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow"
            title="Download standalone HTML file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .html</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 bg-slate-950 overflow-hidden flex flex-col items-center justify-center p-4">
        {/* Gallery Drawer Overlay */}
        {showGallery && (
          <div className="absolute inset-y-0 left-0 w-80 bg-slate-900 border-r border-slate-800 z-30 shadow-2xl flex flex-col p-4 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                Generated Websites
              </h3>
              <button
                onClick={() => setShowGallery(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {websites.map((w) => (
                <div
                  key={w.id}
                  onClick={() => {
                    onSelectWebsite(w.id);
                    setShowGallery(false);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    w.id === activeSite?.id
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-cyan-300 truncate">{w.title}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">{w.description}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-2">
                    {new Date(w.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Canvas / Frame */}
        {activeSite ? (
          viewMode === 'preview' ? (
            <div
              className={`h-full transition-all duration-300 flex items-center justify-center ${
                deviceMode === 'desktop'
                  ? 'w-full'
                  : deviceMode === 'tablet'
                  ? 'w-[768px] max-w-full'
                  : 'w-[375px] max-w-full'
              }`}
            >
              <div className="w-full h-full rounded-xl overflow-hidden border border-slate-800 bg-white shadow-2xl">
                <iframe
                  title={activeSite.title}
                  srcDoc={activeSite.html}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-full max-w-5xl rounded-xl border border-slate-800 bg-slate-900 p-4 overflow-auto">
              <pre className="text-xs font-mono text-cyan-200 leading-relaxed whitespace-pre-wrap">
                <code>{activeSite.html}</code>
              </pre>
            </div>
          )
        ) : (
          <div className="text-center text-slate-400">
            <Sparkles className="w-10 h-10 text-cyan-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-base font-semibold text-white">No Website Generated Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Ask ZARA in chat "website banao mera portfolio" or enter a prompt below to craft a standalone responsive site!
            </p>
          </div>
        )}
      </div>

      {/* Bottom Floating Prompt Bar to Generate or Iterate */}
      <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90">
        <form onSubmit={handleGenerateSubmit} className="max-w-4xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Ask ZARA to generate or modify site (e.g. 'Add a dark mode toggle', 'Create a cybernetic portfolio')..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              disabled={isGenerating}
            />
          </div>

          <button
            type="submit"
            disabled={!promptInput.trim() || isGenerating}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shrink-0"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Building with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate / Update</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
