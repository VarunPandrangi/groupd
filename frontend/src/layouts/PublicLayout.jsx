import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

export default function PublicLayout() {
  return (
    <div className="public-shell">
      <Navbar />
      <main className="public-shell__content">
        <div className="public-shell__frame">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
