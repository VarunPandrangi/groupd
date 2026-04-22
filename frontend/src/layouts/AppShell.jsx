import AppSidebar from '../components/common/AppSidebar';
import AppTopbar from '../components/common/AppTopbar';
import { cx } from '../utils/cx';

export default function AppShell({
  navItems = [],
  children,
  shellClassName = '',
  sidebarAction = null,
}) {
  return (
    <div className={cx('min-h-screen app-shell stitch-dashboard', shellClassName)}>
      <AppSidebar navItems={navItems} primaryAction={sidebarAction} />

      <div className="stitch-dashboard__main">
        <AppTopbar />

        <main className="app-shell__content stitch-dashboard__canvas">
          <div className="app-shell__canvas-grid" aria-hidden="true" />
          <div className="app-shell__content-inner layout-frame">{children}</div>
        </main>
      </div>
    </div>
  );
}
