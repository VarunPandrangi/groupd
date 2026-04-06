function buildPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  const sortedPages = [...pages]
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((left, right) => left - right);

  const items = [];

  sortedPages.forEach((pageNumber, index) => {
    if (index > 0 && pageNumber - sortedPages[index - 1] > 1) {
      items.push(`ellipsis-${pageNumber}`);
    }

    items.push(pageNumber);
  });

  return items;
}

function baseButtonStyle(disabled) {
  return {
    minWidth: '42px',
    height: '42px',
    padding: '0 14px',
    borderRadius: '14px',
    border: '1px solid var(--border-default)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.92rem',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.42 : 1,
    transition: 'transform 180ms ease, border-color 180ms ease, color 180ms ease',
  };
}

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap',
      }}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        style={baseButtonStyle(currentPage <= 1)}
      >
        Previous
      </button>

      {pageItems.map((item) => {
        if (typeof item !== 'number') {
          return (
            <span
              key={item}
              style={{
                minWidth: '24px',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontWeight: 700,
              }}
            >
              ...
            </span>
          );
        }

        const isActive = item === currentPage;

        return (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            style={{
              ...baseButtonStyle(false),
              minWidth: '42px',
              padding: '0 12px',
              border: isActive
                ? '1px solid color-mix(in srgb, var(--accent-primary) 35%, transparent)'
                : '1px solid var(--border-default)',
              background: isActive
                ? 'color-mix(in srgb, var(--accent-primary) 14%, transparent)'
                : 'transparent',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        style={baseButtonStyle(currentPage >= totalPages)}
      >
        Next
      </button>
    </div>
  );
}
