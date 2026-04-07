import { Toaster } from './components/ui/toaster';
import PostBuilder from './components/PostBuilder';

export default function App() {
  return (
    <div className="noise">
      <PostBuilder />
      <Toaster />
    </div>
  );
}
