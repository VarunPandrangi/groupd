import {
  MagnifyingGlass,
  PlusCircle,
} from '@phosphor-icons/react';
import heroImage from '../../stitch/dashboard-no-group/d12535913ad74f4d85076741bb924f27-hero.jpg';

export default function StitchNoGroupDashboard({ onCreateGroup, onFindTeammates }) {
  return (
    <>
      <div className="stitch-dashboard__module-wrap layout-frame">
        <section className="stitch-no-group" aria-labelledby="stitch-no-group-title">
          <div className="stitch-no-group__shell">
            <div className="stitch-no-group__copy">
              <div className="stitch-no-group__status">
                <span className="stitch-no-group__status-dot" />
                <span>Status: Unassigned</span>
              </div>

              <h2 id="stitch-no-group-title" className="stitch-no-group__title">
                Create or join a group to get started.
              </h2>

              <p className="stitch-no-group__description">
                Access to project repositories, assignment tracking, and academic peer communication
                requires formal group affiliation.
              </p>

              <div className="stitch-no-group__actions">
                <button
                  type="button"
                  className="stitch-no-group__button stitch-no-group__button--primary"
                  onClick={onCreateGroup}
                >
                  <PlusCircle size={18} weight="fill" />
                  Create a Group
                </button>

                <button
                  type="button"
                  className="stitch-no-group__button stitch-no-group__button--secondary"
                  onClick={onFindTeammates}
                >
                  <MagnifyingGlass size={18} />
                  Find Teammates
                </button>
              </div>
            </div>

            <div className="stitch-no-group__visual-wrap">
              <span className="stitch-no-group__fig">FIG. 01</span>
              <span className="stitch-no-group__diag">DIAG-A</span>

              <div className="stitch-no-group__visual">
                <img src={heroImage} alt="Structural node diagram" className="stitch-no-group__image" />

                <div className="stitch-no-group__overlay" aria-hidden="true">
                  <span className="stitch-no-group__line stitch-no-group__line--h1" />
                  <span className="stitch-no-group__line stitch-no-group__line--h2" />
                  <span className="stitch-no-group__line stitch-no-group__line--v1" />
                  <span className="stitch-no-group__line stitch-no-group__line--v2" />
                  <div className="stitch-no-group__node">
                    <span className="stitch-no-group__node-dot" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside className="stitch-dashboard__memory" aria-label="Group status">
        <div className="stitch-dashboard__memory-label">GROUP STATUS</div>
        <div className="stitch-dashboard__memory-value">NO GROUP ASSIGNED</div>
      </aside>
    </>
  );
}
