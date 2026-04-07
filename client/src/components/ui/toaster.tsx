import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Toast = ({ title, description, variant = 'default', open, onOpenChange }: ToastProps) => (
  <ToastPrimitive.Root
    open={open}
    onOpenChange={onOpenChange}
    style={{
      background: variant === 'destructive' ? 'rgba(240,92,106,0.15)' : 'var(--surface)',
      border: `1px solid ${variant === 'destructive' ? 'rgba(240,92,106,0.3)' : 'var(--border-strong)'}`,
      borderRadius: '10px',
      padding: '12px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '8px',
      backdropFilter: 'blur(12px)',
      animation: 'slideUp 0.25s ease',
    }}
  >
    <div>
      {title && (
        <ToastPrimitive.Title
          style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)', marginBottom: '2px' }}
        >
          {title}
        </ToastPrimitive.Title>
      )}
      {description && (
        <ToastPrimitive.Description
          style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}
        >
          {description}
        </ToastPrimitive.Description>
      )}
    </div>
    <ToastPrimitive.Close asChild>
      <button
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '2px',
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </ToastPrimitive.Close>
  </ToastPrimitive.Root>
);

// Simple global toast state
let _addToast: ((t: Omit<ToastProps, 'open' | 'onOpenChange'> & { id?: string }) => void) | null = null;

export function toast(opts: { title?: string; description?: string; variant?: 'default' | 'destructive' }) {
  _addToast?.({ ...opts, id: String(Date.now()) });
}

interface ToastItem extends ToastProps {
  id: string;
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    _addToast = (t) => {
      const id = t.id ?? String(Date.now());
      setToasts((prev) => [...prev, { ...t, id, open: true, onOpenChange: () => {} }]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
    };
    return () => { _addToast = null; };
  }, []);

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          title={t.title}
          description={t.description}
          variant={t.variant}
          open={t.open}
          onOpenChange={(open) => {
            if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id));
          }}
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
