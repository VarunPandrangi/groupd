import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import Button from './Button';

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

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) {
  if (totalPages <= 1) {
    return null;
  }

  const items = buildPageItems(currentPage, totalPages);

  return (
    <div className="flex items-center gap-2 pagination">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      >
        <CaretLeft size={14} />
      </Button>

      {items.map((item) => {
        if (typeof item !== 'number') {
          return (
            <span key={item} className="text-sm pagination__ellipsis">
              ...
            </span>
          );
        }

        return (
          <Button
            key={item}
            type="button"
            variant={item === currentPage ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        );
      })}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      >
        <CaretRight size={14} />
      </Button>
    </div>
  );
}
