import { X, RotateCcw, Trash2, Clock } from 'lucide-react';
import { deleteSession, exportPostsAsTxt } from '@/lib/history';
import { downloadTextFile, formatDate } from '@/lib/utils';
import { PLATFORM_CONFIGS, type SessionData, type Platform } from '@/types';
import { toast } from '@/components/ui/toaster';

interface HistoryPanelProps {
  sessions: SessionData[];
  onRestore: (session: SessionData) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function HistoryPanel({ sessions, onRestore, onDelete, onClose }: HistoryPanelProps) {
  function handleDelete(id: string) {
    deleteSession(id);
    onDelete(id);
    toast({ title: 'Session deleted' });
  }

  function handleExport(session: SessionData) {
    const content = exportPostsAsTxt(session);
    downloadTextFile(content, `posts-${session.id.slice(0, 8)}.txt`);
    toast({ title: 'Exported', description: `${session.postCount} posts downloaded` });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass slide-up"
        style={{ width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.04em' }}>HISTORY</span>
          </div>
          <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '12px 20px', flex: 1 }}>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '0.85rem' }}>
              No saved sessions yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="glass-2"
                  style={{ padding: '12px 14px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {session.topic}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {(session.platforms ?? []).map((p: Platform) => (
                          <span
                            key={p}
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 6px',
                              borderRadius: '99px',
                              background: PLATFORM_CONFIGS[p]?.bg ?? 'var(--surface-2)',
                              color: PLATFORM_CONFIGS[p]?.color ?? 'var(--text-dim)',
                              border: `1px solid ${PLATFORM_CONFIGS[p]?.color ?? 'var(--border)'}22`,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {p}
                          </span>
                        ))}
                        <span className="badge" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          {session.postCount} posts
                        </span>
                      </div>
                      <div style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {formatDate(session.timestamp)} · {session.model}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '5px 8px', fontSize: '0.72rem' }}
                        onClick={() => handleExport(session)}
                        title="Export"
                      >
                        ↓
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '5px 8px' }}
                        onClick={() => { onRestore(session); onClose(); }}
                        title="Restore"
                      >
                        <RotateCcw size={12} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 8px' }}
                        onClick={() => handleDelete(session.id)}
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
