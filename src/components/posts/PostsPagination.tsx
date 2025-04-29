
import React from 'react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

type PostsPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const PostsPagination = ({ currentPage, totalPages, onPageChange }: PostsPaginationProps) => {
  if (totalPages <= 1) return null;
  
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    for (let i = 0; i < Math.min(maxVisiblePages, totalPages); i++) {
      let pageNum;
      if (totalPages <= maxVisiblePages) {
        pageNum = i + 1;
      } else if (currentPage <= 3) {
        pageNum = i + 1;
      } else if (currentPage >= totalPages - 2) {
        pageNum = totalPages - 4 + i;
      } else {
        pageNum = currentPage - 2 + i;
      }
      
      pageNumbers.push(
        <PaginationItem key={pageNum}>
          <PaginationLink 
            isActive={pageNum === currentPage}
            onClick={() => onPageChange(pageNum)}
            className="cursor-pointer"
          >
            {pageNum}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return pageNumbers;
  };
  
  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="cursor-pointer"
            aria-disabled={currentPage === 1}
            tabIndex={currentPage === 1 ? -1 : 0}
          />
        </PaginationItem>
        
        {renderPageNumbers()}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="cursor-pointer"
            aria-disabled={currentPage === totalPages}
            tabIndex={currentPage === totalPages ? -1 : 0}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PostsPagination;
