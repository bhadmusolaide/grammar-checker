import { render, screen, fireEvent } from '@testing-library/react';
import BottomSheetModal from '../BottomSheetModal';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock react-swipeable
jest.mock('react-swipeable', () => ({
  useSwipeable: () => ({ ref: jest.fn() }),
}));

describe('BottomSheetModal', () => {
  const mockOnClose = jest.fn();
  const mockChildren = <div>Test Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render nothing when isOpen is false', () => {
    const { container } = render(
      <BottomSheetModal isOpen={false} onClose={mockOnClose}>
        {mockChildren}
      </BottomSheetModal>
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <BottomSheetModal isOpen={true} onClose={mockOnClose}>
        {mockChildren}
      </BottomSheetModal>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    render(
      <BottomSheetModal isOpen={true} onClose={mockOnClose} title="Test Title">
        {mockChildren}
      </BottomSheetModal>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should call onClose when backdrop is clicked', () => {
    render(
      <BottomSheetModal isOpen={true} onClose={mockOnClose}>
        {mockChildren}
      </BottomSheetModal>
    );
    
    const backdrop = screen.getByTestId('bottom-sheet-backdrop');
    fireEvent.click(backdrop);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when modal content is clicked', () => {
    render(
      <BottomSheetModal isOpen={true} onClose={mockOnClose}>
        {mockChildren}
      </BottomSheetModal>
    );
    
    const content = screen.getByText('Test Content');
    fireEvent.click(content);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should apply custom height when provided', () => {
    const { container } = render(
      <BottomSheetModal isOpen={true} onClose={mockOnClose} maxHeight="80vh">
        {mockChildren}
      </BottomSheetModal>
    );
    
    const modal = container.querySelector('[style*="max-height"]');
    expect(modal).toBeInTheDocument();
  });

  it('should render close button when title is provided', () => {
    render(
      <BottomSheetModal isOpen={true} onClose={mockOnClose} title="Test Modal">
        {mockChildren}
      </BottomSheetModal>
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <BottomSheetModal isOpen={true} onClose={mockOnClose} title="Test Modal">
        {mockChildren}
      </BottomSheetModal>
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should apply custom height settings', () => {
    const { container } = render(
      <BottomSheetModal 
        isOpen={true} 
        onClose={mockOnClose} 
        maxHeight="90vh"
        minHeight="50vh"
      >
        {mockChildren}
      </BottomSheetModal>
    );
    
    const modal = container.querySelector('[style*="max-height"]');
    expect(modal).toBeInTheDocument();
  });
});