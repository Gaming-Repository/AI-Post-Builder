import { useState, useRef, useEffect } from 'react';
import { Copy, Pencil, RefreshCw, Check, X, Image } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from '@/components/ui/toaster';
import { PLATFORM_CONFIGS, type GeneratedPost, type ModelId } from '@/types';

interface PostCardProps {
  post: GeneratedPost;
  model: ModelId;
  sessionId: string;
  onUpdate: (updated: GeneratedPost) => void;
  index: number;
}

export default function PostCard({ post, model, sessionId, onUpdate, index }: PostCardProps) {
  const cfg = PLATFORM_CONFIGS[post.platform];
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const regenerate = trpc.posts.regenerate.useMutation({
    onSuccess: (data) => {
      onUpdate({
        platform: data.platform as GeneratedPost['platform'],
        content: data.content,
        characterCount: data.characterCount,
        withinLimit: data.withinLimit,
        metadata: data.metadata,
      });
      toast({ title: 'Post regenerated', description: `${cfg.name} updated` });
    },
    onError: (e) => toast({ title: 'Regenerate failed', description: e.message, variant: 'destructive' }),
  });

  const generateImage = trpc.image.generateImage.useMutation({
    onSuccess: () => toast({ title: 'Image prompt generated', description: 'Ready to use with your image service' }),
    onError: (e) => toast({ title: 'Image generation failed', description: e.message, variant: 'destructive' }),
  });

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const editCharCount = editContent.length;
  const editWithin = editCharCount <= cfg.charLimit;

  const currentContent = post.content;
  const charCount = post.characterCount;
  const withinLimit = post.withinLimit;
  const pct = Math.min((charCount / cfg.charLimit) * 100, 100);

  function handleCopy() {
    void navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: `${cfg.name} post copied to clipboard` });
  }

  function handleSaveEdit() {
    onUpdate({ ...post, content: editContent, characterCount: editContent.length, withinLimit: editWithin });
    setEditing(false);
  }

  function handleCancelEdit() {
    setEditContent(post.content);
    setEditing(false);
  }

  const sentimentColors: Record<string, string> = {
    positive: 'var(--green)',
    neutral: 'var(--text-dim)',
    negative: 'var(--red)',
  };

  return (
    <div
      className="glass fade-in"
      style={{
        animationDelay: `${index * 60}ms`,
        borderLeft: `3px solid ${cfg.color}`,
        background: cfg.bg,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.06em', color: cfg.color, textTransform: 'uppercase' }}>
            {cfg.name}
          </span>
          <span
            className={withinLimit ? 'badge badge-green' : 'badge badge-red'}
          >
            {charCount} / {cfg.charLimit.toLocaleString()}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-ghost"
            style={{ padding: '5px 8px' }}
            onClick={() => {
              void generateImage.mutateAsync({ postContent: currentContent, platform: post.platform });
            }}
            disabled={generateImage.isPending}
            title="Generate image prompt"
          >
            <Image size={13} />
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: '5px 8px' }}
            onClick={() => regenerate.mutate({ sessionId, platform: post.platform, model })}
            disabled={regenerate.isPending}
            title="Regenerate"
          >
            <RefreshCw size={13} className={regenerate.isPending ? 'animate-spin' : ''} />
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: '5px 8px' }}
            onClick={() => { setEditing(true); setEditContent(post.content); }}
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: '5px 8px' }}
            onClick={handleCopy}
            title="Copy"
          >
            {copied ? <Check size={13} style={{ color: 'var(--green)' }} /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 16px 6px' }}>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${pct}%`,
              background: withinLimit
                ? `linear-gradient(90deg, ${cfg.color}, var(--green))`
                : 'var(--red)',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '8px 16px 14px' }}>
        {editing ? (
          <div>
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="input-base"
              style={{
                minHeight: '120px',
                resize: 'vertical',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.8rem',
                lineHeight: 1.7,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <span
                className={editWithin ? 'badge badge-green' : 'badge badge-red'}
              >
                {editCharCount} / {cfg.charLimit.toLocaleString()}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-ghost" style={{ padding: '5px 10px' }} onClick={handleCancelEdit}>
                  <X size={12} /> Cancel
                </button>
                <button className="btn btn-primary" style={{ padding: '5px 12px' }} onClick={handleSaveEdit}>
                  <Check size={12} /> Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: '0.84rem',
              lineHeight: 1.75,
              color: 'var(--text-dim)',
              whiteSpace: 'pre-wrap',
              cursor: 'text',
            }}
            onClick={() => { setEditing(true); setEditContent(post.content); }}
            title="Click to edit"
          >
            {currentContent}
          </p>
        )}
      </div>

      {/* Metadata */}
      {post.metadata && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '10px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          <span
            className="badge"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: sentimentColors[post.metadata.sentiment] ?? 'var(--text-dim)',
              textTransform: 'capitalize',
            }}
          >
            {post.metadata.sentiment}
          </span>
          {post.metadata.callToAction && (
            <span className="badge badge-accent" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {post.metadata.callToAction}
            </span>
          )}
          {post.metadata.hashtags.slice(0, 3).map((h) => (
            <span key={h} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              {h}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
