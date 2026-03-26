import './ParthBanner.css';

/**
 * Construction Banner - Shows Parth in construction gear 
 * to signal the app is being updated.
 * 
 * Usage: <ParthBanner /> — add anywhere to show the "under construction" banner
 * Set show={false} to hide it when updates are complete.
 */
export default function ParthBanner({ show = true }) {
  if (!show) return null;

  return (
    <div className="parth-banner glass-sm">
      <img src="/parth.png" alt="Parth building" className="parth-banner-img" />
      <div className="parth-banner-text">
        <strong>🚧 Parth is building something!</strong>
        <p>New features dropping soon — stay tuned!</p>
      </div>
    </div>
  );
}
