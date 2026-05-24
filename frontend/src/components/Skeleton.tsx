/**
 * Skeleton — reusable loading placeholder component.
 *
 * Usage examples:
 *   <Skeleton type="title" />
 *   <Skeleton type="text" width="80%" />
 *   <Skeleton type="chart" />
 *   <Skeleton type="card" />
 *   <Skeleton type="row" count={5} />
 */

interface SkeletonProps {
  type?: 'text' | 'title' | 'chart' | 'card' | 'row' | 'custom';
  width?: string;
  height?: string;
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ type = 'text', width, height, count = 1, className = '', style }: SkeletonProps) {
  const baseClass = `skeleton skeleton-${type} ${className}`;
  const inlineStyle: React.CSSProperties = { ...(width ? { width } : {}), ...(height ? { height } : {}), ...style };

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={baseClass} style={inlineStyle} />
        ))}
      </>
    );
  }

  return <div className={baseClass} style={inlineStyle} />;
}

/**
 * CardSkeleton — full card with shimmer header + body blocks.
 * Drop-in placeholder for any card while data loads.
 */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card">
      <div className="card-header" style={{ gap: 8, alignItems: 'center' }}>
        <Skeleton type="title" width="40%" />
        <Skeleton type="text" width="15%" style={{ marginBottom: 0 }} />
      </div>
      <div className="card-body">
        <Skeleton type="chart" style={{ marginBottom: 12 }} />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} type="row" width={`${65 + (i % 3) * 10}%`} />
        ))}
      </div>
    </div>
  );
}

/**
 * StatCardSkeleton — skeleton for the summary stat mini-cards.
 */
export function StatCardSkeleton() {
  return (
    <div className="card">
      <div className="card-body" style={{ padding: '14px 16px' }}>
        <Skeleton type="text" width="55%" />
        <Skeleton type="title" width="35%" style={{ marginBottom: 0, height: 28 }} />
      </div>
    </div>
  );
}
