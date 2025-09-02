import { render, screen, fireEvent } from '@testing-library/react';
import SwipeableTabNavigation from '../SwipeableTabNavigation';

const mockProps = {
  activeTab: 'input' as const,
  onTabChange: jest.fn(),
  suggestionCount: 5,
};

describe('SwipeableTabNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both tabs correctly', () => {
    render(<SwipeableTabNavigation {...mockProps} />);

    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    render(<SwipeableTabNavigation {...mockProps} activeTab="input" />);
    
    const inputTab = screen.getByText('Input').closest('button');
    const suggestionsTab = screen.getByText('Suggestions').closest('button');

    expect(inputTab).toHaveClass('text-blue-600');
    expect(suggestionsTab).toHaveClass('text-gray-500');
  });

  it('calls onTabChange when input tab is clicked', () => {
    render(<SwipeableTabNavigation {...mockProps} activeTab="suggestions" />);
    
    const inputTab = screen.getByText('Input').closest('button');
    fireEvent.click(inputTab!);

    expect(mockProps.onTabChange).toHaveBeenCalledWith('input');
  });

  it('calls onTabChange when suggestions tab is clicked', () => {
    render(<SwipeableTabNavigation {...mockProps} activeTab="input" />);
    
    const suggestionsTab = screen.getByText('Suggestions').closest('button');
    fireEvent.click(suggestionsTab!);

    expect(mockProps.onTabChange).toHaveBeenCalledWith('suggestions');
  });

  it('shows 0 suggestions when count is 0', () => {
    render(<SwipeableTabNavigation {...mockProps} suggestionCount={0} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows "99+" when count is over 99', () => {
    render(<SwipeableTabNavigation {...mockProps} suggestionCount={150} />);
    
    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});