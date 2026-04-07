import { useState, useRef } from 'react';
import {
  Sparkles, Video, History, Download, Loader2,
  ChevronDown, Zap
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from '@/components/ui/toaster';
import { saveSession, loadHistory, exportPostsAsTxt } from '@/lib/history';
import { extractVideoFrames } from '@/lib/videoFrames';
import { downloadTextFile } from '@/lib/utils';
import PostCard from './PostCard';
import HistoryPanel from './HistoryPanel';
import {
  PLATFORM_CONFIGS, MODEL_CONFIGS,
  type Platform, type ModelId, type GeneratedPost, type SessionData, type VideoAnalysis,
} from '@/types';

const PLATFORMS: Platform[] = ['twitter', 'linkedin', 'instagram', 'facebook'];
const TONES = ['professional', 'casual', 'witty', 'inspirational', 'educational', 'promotional'];

export default function PostBuilder() {
  // Form state
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [audience, setAudience] = useState('');
  const [keywordsRaw, setKeywordsRaw] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['twitter', 'linkedin']);
  const [model, setModel] = useState<ModelId>('sonnet');

  // Results
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<Omit<SessionData, 'id' | 'timestamp' | 'postCount' | 'posts'> | null>(null);

  // Video
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysis | null>(null);
  const [videoAnalyzing, setVideoAnalyzing] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // UI
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SessionData[]>(() => loadHistory());

  const generate = trpc.posts.generate.useMutation({
    onSuccess: (data) => {
      const generatedPosts = data.posts as GeneratedPost[];
      setPosts(generatedPosts);
      setSessionId(data.sessionId);

      const keywords = keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean);
      const platforms = selectedPlatforms;
      const session: SessionData = {
        id: data.sessionId,
        topic,
        tone,
        audience,
        keywords,
        platforms,
        model,
        posts: generatedPosts,
        timestamp: data.timestamp,
        postCount: generatedPosts.length,
      };
      setCurrentSession({ topic, tone, audience, keywords, platforms, model });
      saveSession(session);
      setHistory(loadHistory());
      toast({ title: `${generatedPosts.length} posts generated`, description: `Model: ${MODEL_CONFIGS[model].name}` });
    },
    onError: (e) => toast({ title: 'Generation failed', description: e.message, variant: 'destructive' }),
  });

  const analyzeVideo = trpc.video.analyzeVideo.useMutation({
    onSuccess: (data) => {
      setVideoAnalysis(data);
      setTopic(data.suggestedTopic);
      setKeywordsRaw(data.suggestedKeywords.join(', '));
      setVideoAnalyzing(false);
      toast({ title: 'Video analyzed', description: 'Topic & keywords auto-filled' });
    },
    onError: (e) => {
      setVideoAnalyzing(false);
      toast({ title: 'Video analysis failed', description: e.message, variant: 'destructive' });
    },
  });

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoAnalyzing(true);
    try {
      const frames = await extractVideoFrames(file, 6);
      await analyzeVideo.mutateAsync({ frames });
    } catch (err) {
      setVideoAnalyzing(false);
      toast({ title: 'Frame extraction failed', description: String(err), variant: 'destructive' });
    }
  }

  function togglePlatform(p: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function handleGenerate() {
    if (!topic.trim()) return toast({ title: 'Topic required', variant: 'destructive' });
    if (selectedPlatforms.length === 0) return toast({ title: 'Select at least one platform', variant: 'destructive' });
    const keywords = keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean);
    generate.mutate({
      topic: topic.trim(),
      tone,
      audience: audience.trim() || 'general',
      keywords,
      platforms: selectedPlatforms,
      model,
      videoAnalysis: videoAnalysis ?? undefined,
    });
  }

  function handleUpdatePost(updated: GeneratedPost) {
    setPosts((prev) => prev.map((p) => (p.platform === updated.platform ? updated : p)));
  }

  function handleRestoreSession(session: SessionData) {
    setTopic(session.topic);
    setTone(session.tone);
    setAudience(session.audience ?? '');
    setKeywordsRaw(session.keywords?.join(', ') ?? '');
    setSelectedPlatforms(session.platforms ?? []);
    setModel(session.model ?? 'sonnet');
    setPosts(session.posts ?? []);
    setSessionId(session.id);
    toast({ title: 'Session restored' });
  }

  function handleExportAll() {
    if (posts.length === 0) return;
    const keywords = keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean);
    const session: SessionData = {
      id: sessionId,
      topic,
      tone,
      audience,
      keywords,
      platforms: selectedPlatforms,
      model,
      posts,
      timestamp: new Date().toISOString(),
      postCount: posts.length,
    };
    downloadTextFile(exportPostsAsTxt(session), `posts-${Date.now()}.txt`);
    toast({ title: 'Exported', description: `${posts.length} posts saved to file` });
  }

  const loading = generate.isPending;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10,10,12,0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '58px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}>
              <Zap size={15} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.04em' }}>AI POST BUILDER</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost" onClick={() => setShowHistory(true)}>
              <History size={14} /> History
            </button>
            {posts.length > 0 && (
              <button className="btn btn-ghost" onClick={handleExportAll}>
                <Download size={14} /> Export
              </button>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '28px 24px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: posts.length > 0 ? '380px 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>

          {/* ── Form panel ── */}
          <div className="glass" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.01em' }}>
                Generate Posts
              </h1>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                AI-powered content for every platform
              </p>
            </div>

            {/* Topic */}
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Topic *</label>
              <textarea
                className="input-base"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What do you want to post about?"
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>

            {/* Tone */}
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Tone</label>
              <div style={{ position: 'relative' }}>
                <select
                  className="input-base"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  style={{ appearance: 'none', paddingRight: '2rem', cursor: 'pointer' }}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t} style={{ background: 'var(--surface-2)' }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Audience */}
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Target Audience</label>
              <input
                className="input-base"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. developers, marketers, founders"
              />
            </div>

            {/* Keywords */}
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Keywords</label>
              <input
                className="input-base"
                value={keywordsRaw}
                onChange={(e) => setKeywordsRaw(e.target.value)}
                placeholder="AI, productivity, SaaS (comma-separated)"
              />
            </div>

            {/* Model */}
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Model</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {(Object.keys(MODEL_CONFIGS) as ModelId[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: model === m ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: model === m ? 'rgba(124,106,240,0.12)' : 'var(--surface-2)',
                      color: model === m ? 'var(--accent-bright)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {MODEL_CONFIGS[m].name}
                    </div>
                    <div style={{ fontSize: '0.62rem', marginTop: '2px', opacity: 0.7 }}>
                      {MODEL_CONFIGS[m].description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div style={{ marginBottom: '20px' }}>
              <label className="label">Platforms</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {PLATFORMS.map((p) => {
                  const cfg = PLATFORM_CONFIGS[p];
                  const active = selectedPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: active ? `1px solid ${cfg.color}44` : '1px solid var(--border)',
                        background: active ? cfg.bg : 'var(--surface-2)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: active ? cfg.color : 'var(--border)',
                          transition: 'background 0.15s',
                          flexShrink: 0,
                        }} />
                        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: active ? cfg.color : 'var(--text-dim)', letterSpacing: '0.03em' }}>
                          {cfg.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {cfg.charLimit.toLocaleString()} chars
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video upload */}
            <div style={{ marginBottom: '20px' }}>
              <label className="label">Video Analysis (optional)</label>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleVideoUpload}
              />
              <button
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => videoInputRef.current?.click()}
                disabled={videoAnalyzing}
              >
                {videoAnalyzing ? (
                  <><Loader2 size={14} className="animate-spin" /> Analyzing video…</>
                ) : videoAnalysis ? (
                  <><Video size={14} style={{ color: 'var(--green)' }} /> Video analyzed ✓</>
                ) : (
                  <><Video size={14} /> Upload video to auto-fill</>
                )}
              </button>
              {videoAnalysis && (
                <div className="glass-2" style={{ marginTop: '8px', padding: '10px 12px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '2px' }}>
                    {videoAnalysis.suggestedTopic}
                  </strong>
                  {videoAnalysis.keyElements.slice(0, 4).join(' · ')}
                </div>
              )}
            </div>

            {/* Generate button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.85rem' }}
              onClick={handleGenerate}
              disabled={loading || !topic.trim() || selectedPlatforms.length === 0}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Generating…</>
              ) : (
                <><Sparkles size={16} /> Generate Posts</>
              )}
            </button>
          </div>

          {/* ── Posts panel ── */}
          {posts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', letterSpacing: '0.02em' }}>
                    Generated Posts
                  </h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    {posts.length} posts · {currentSession?.model ?? model}
                  </p>
                </div>
                <button className="btn btn-ghost" style={{ fontSize: '0.72rem' }} onClick={handleExportAll}>
                  <Download size={13} /> Export .txt
                </button>
              </div>
              {posts.map((post, i) => (
                <PostCard
                  key={post.platform}
                  post={post}
                  model={model}
                  sessionId={sessionId}
                  onUpdate={handleUpdatePost}
                  index={i}
                />
              ))}
            </div>
          )}


        </div>

        {/* Welcome state when form is the only column */}
        {posts.length === 0 && (
          <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {PLATFORMS.map((p) => {
              const cfg = PLATFORM_CONFIGS[p];
              return (
                <div
                  key={p}
                  className="glass"
                  style={{ padding: '16px', borderLeft: `3px solid ${cfg.color}`, background: cfg.bg }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: cfg.color, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {cfg.name}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {cfg.charLimit.toLocaleString()} chars
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {cfg.description}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showHistory && (
        <HistoryPanel
          sessions={history}
          onRestore={handleRestoreSession}
          onDelete={(id) => setHistory((prev) => prev.filter((s) => s.id !== id))}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
