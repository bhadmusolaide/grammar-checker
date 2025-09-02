import { render, screen, fireEvent } from '@testing-library/react';
import FloatingActionMenu from '../FloatingActionMenu';

const mockProps = {
  onCheck: jest.fn(),
  onClear: jest.fn(),
  onSettings: jest.fn(),
  isLoading: false,
  canCheck: true,
};

describe('FloatingActionMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the floating action button', () => {
    render(<FloatingActionMenu {...mockProps} />);
    
    expect(screen.getByRole('button', { name: /main menu/i })).toBeInTheDocument();
  });

  it('opens menu when FAB is clicked', () => {
    render(<FloatingActionMenu {...mockProps} />);
    
    const fab = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(fab);

    expect(screen.getByRole('button', { name: /check grammar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('closes menu when clicking outside', () => {
    const { container } = render(<FloatingActionMenu {...mockProps} />);
    
    const fab = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(fab);

    expect(screen.getByRole('button', { name: /check grammar/i })).toBeInTheDocument();

    fireEvent.click(container);
    
    expect(screen.queryByRole('button', { name: /check grammar/i })).not.toBeInTheDocument();
  });

  it('calls onCheck when check button is clicked', () => {
    render(<FloatingActionMenu {...mockProps} />);
    
    const fab = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(fab);
    
    const checkButton = screen.getByRole('button', { name: /check grammar/i });
    fireEvent.click(checkButton);

    expect(mockProps.onCheck).toHaveBeenCalled();
  });

  it('calls onClear when clear button is clicked', () => {
    render(<FloatingActionMenu {...mockProps} />);
    
    const fab = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(fab);
    
    const clearButton = screen.getByRole('button', { name: /clear text/i });
    fireEvent.click(clearButton);

    expect(mockProps.onClear).toHaveBeenCalled();
  });

  it('calls onSettings when settings button is clicked', () => {
    render(<FloatingActionMenu {...mockProps} />);
    
    const fab = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(fab);
    
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);

    expect(mockProps.onSettings).toHaveBeenCalled();
  });

  it('disables check button when canCheck is false', () => {
    render(<FloatingActionMenu {...mockProps} canCheck={false} />);
    
    const fab = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(fab);
    
    const checkButton = screen.getByRole('button', { name: /check grammar/i });
    expect(checkButton).toBeDisabled();
  });

  it('disables check button when isLoading is true', () => {
    render(<FloatingActionMenu {...mockProps} isLoading={true} />);
    
    const fab = screen.getByRole('button', { name: /main menu/i });
    fireEvent.click(fab);
    
    const checkButton = screen.getByRole('button', { name: /check grammar/i });
    expect(checkButton).toBeDisabled();
  });
});