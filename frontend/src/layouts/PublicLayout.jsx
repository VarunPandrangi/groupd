import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

export default function PublicLayout() {
  return (
    <div className="min-h-screen public-shell">
      <Navbar />
      <main className="w-full public-shell__content">
        <div className="w-full max-w-4xl public-shell__frame">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
