import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

export default function PublicLayout() {
  return (
    <div className="layout-public">
      <Navbar />
      <main className="layout-public__content">
        <Outlet />
      </main>
    </div>
  );
}
