import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SuggestionCard from '../SuggestionCard';
import { Suggestion } from '../../../types';

describe('SuggestionCard', () => {
  const mockSuggestion: Suggestion = {
    type: 'grammar',
    message: 'This is a test suggestion',
    category: 'grammar',
    severity: 'high',
    offset: 10,
    length: 5,
    replacements: [{ value: 'replacement1' }, { value: 'replacement2' }],
    confidence: 95,
  };

  const mockOnApply = jest.fn();
  const mockOnIgnore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders suggestion card with basic information', () => {
    render(
      <SuggestionCard
        suggestion={mockSuggestion}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
      />
    );

    expect(screen.getByText('This is a test suggestion')).toBeInTheDocument();
    expect(screen.getByText('grammar')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('95% confidence')).toBeInTheDocument();
  });

  it('displays severity colors and icons correctly', () => {
    const { rerender } = render(
      <SuggestionCard
        suggestion={{ ...mockSuggestion, severity: 'high' }}
        onApply={mockOnApply}
      />
    );
    
    let card = screen.getByText('This is a test suggestion').closest('.group');
    expect(card).toHaveClass('border-red-500', 'bg-red-50');

    rerender(
      <SuggestionCard
        suggestion={{ ...mockSuggestion, severity: 'medium' }}
        onApply={mockOnApply}
      />
    );
    
    card = screen.getByText('This is a test suggestion').closest('.group');
    expect(card).toHaveClass('border-yellow-500', 'bg-yellow-50');

    rerender(
      <SuggestionCard
        suggestion={{ ...mockSuggestion, severity: 'low' }}
        onApply={mockOnApply}
      />
    );
    
    card = screen.getByText('This is a test suggestion').closest('.group');
    expect(card).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('displays suggested replacement', () => {
    render(
      <SuggestionCard
        suggestion={mockSuggestion}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText('Suggested:')).toBeInTheDocument();
    expect(screen.getByText('replacement1')).toBeInTheDocument();
  });

  it('shows context preview when text is provided', () => {
    const text = 'This is a sample text with an error in it';
    const suggestionWithContext: Suggestion = {
      ...mockSuggestion,
      offset: 10,
      length: 6,
      replacements: [{ value: 'test' }],
    };

    render(
      <SuggestionCard
        suggestion={suggestionWithContext}
        onApply={mockOnApply}
        text={text}
      />
    );

    expect(screen.getByText('Context:')).toBeInTheDocument();
    expect(screen.getByText('sample')).toBeInTheDocument();
  });

  it('calls onApply when accept button is clicked', () => {
    render(
      <SuggestionCard
        suggestion={mockSuggestion}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
      />
    );

    const acceptButton = screen.getByText('Accept');
    fireEvent.click(acceptButton);

    expect(mockOnApply).toHaveBeenCalledWith(mockSuggestion);
  });

  it('calls onIgnore when ignore button is clicked', () => {
    render(
      <SuggestionCard
        suggestion={mockSuggestion}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
      />
    );

    const ignoreButton = screen.getByText('Ignore');
    fireEvent.click(ignoreButton);

    expect(mockOnIgnore).toHaveBeenCalledWith(mockSuggestion);
  });

  it('does not show ignore button when onIgnore is not provided', () => {
    render(
      <SuggestionCard
        suggestion={mockSuggestion}
        onApply={mockOnApply}
      />
    );

    expect(screen.queryByText('Ignore')).not.toBeInTheDocument();
  });

  it('does not show accept button when no replacements', () => {
    const suggestionWithoutReplacements: Suggestion = {
      ...mockSuggestion,
      replacements: [],
    };

    render(
      <SuggestionCard
        suggestion={suggestionWithoutReplacements}
        onApply={mockOnApply}
      />
    );

    expect(screen.queryByText('Accept')).not.toBeInTheDocument();
  });

  it('handles undefined severity gracefully', () => {
    render(
      <SuggestionCard
        suggestion={{ ...mockSuggestion, severity: undefined }}
        onApply={mockOnApply}
      />
    );

    const card = screen.getByText('This is a test suggestion').closest('.group');
    expect(card).toHaveClass('border-gray-300', 'bg-gray-50');
  });

  it('handles undefined confidence gracefully', () => {
    render(
      <SuggestionCard
        suggestion={{ ...mockSuggestion, confidence: undefined }}
        onApply={mockOnApply}
      />
    );

    expect(screen.queryByText(/% confidence/)).not.toBeInTheDocument();
  });
});