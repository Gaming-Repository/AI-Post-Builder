import type { SessionData } from '../types';

const HISTORY_KEY = 'apb_sessions';
const MAX_SESSIONS = 10;

export function loadHistory(): SessionData[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SessionData[]) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: SessionData) {
  const history = loadHistory().filter((s) => s.id !== session.id);
  const updated = [session, ...history].slice(0, MAX_SESSIONS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function deleteSession(id: string) {
  const updated = loadHistory().filter((s) => s.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function exportPostsAsTxt(session: SessionData): string {
  const lines: string[] = [
    `AI Post Builder Export`,
    `Topic: ${session.topic}`,
    `Generated: ${new Date(session.timestamp).toLocaleString()}`,
    `Model: ${session.model}`,
    '='.repeat(60),
    '',
  ];

  for (const post of session.posts) {
    lines.push(`=== ${post.platform.toUpperCase()} ===`);
    lines.push(`Characters: ${post.characterCount} / ${getCharLimit(post.platform)}`);
    lines.push('');
    lines.push(post.content);
    lines.push('');
    lines.push('');
  }

  return lines.join('\n');
}

function getCharLimit(platform: string): number {
  const limits: Record<string, number> = {
    twitter: 280,
    linkedin: 3000,
    instagram: 2200,
    facebook: 63206,
  };
  return limits[platform] ?? 0;
}
