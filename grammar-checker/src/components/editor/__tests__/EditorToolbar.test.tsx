import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditorToolbar from '../EditorToolbar';
import { UnifiedModel, ModelProvider } from '../../../types';

describe('EditorToolbar', () => {
  const mockOnClear = jest.fn();
  const mockOnCheck = jest.fn();
  const mockOnModelChange = jest.fn();
  const mockOnConfigureProvider = jest.fn();
  const mockOnHumanizeOptionsChange = jest.fn();
  const mockOnRequestHumanize = jest.fn();

  const mockAvailableModels: UnifiedModel[] = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai' as ModelProvider,
      displayName: 'GPT-4',
      config: {
        provider: 'openai' as ModelProvider,
        model: 'gpt-4'
      },
      isAvailable: true,
      performance: { 
        speed: 'medium', 
        quality: 'high',
        cost: 'high'
      }
    },
    {
      id: 'claude-3',
      name: 'Claude 3',
      provider: 'openrouter' as ModelProvider,
      displayName: 'Claude 3',
      config: {
        provider: 'openrouter' as ModelProvider,
        model: 'claude-3'
      },
      isAvailable: true,
      performance: { 
        speed: 'fast', 
        quality: 'high',
        cost: 'high'
      }
    }
  ];

  const defaultProps = {
    text: 'Test text',
    onClear: mockOnClear,
    onCheck: mockOnCheck,
    isLoading: false,
    selectedModel: mockAvailableModels[0],
    availableModels: mockAvailableModels,
    onModelChange: mockOnModelChange,
    onConfigureProvider: mockOnConfigureProvider,
    humanizeOptions: {
      tone: 'neutral' as const,
      strength: 'medium' as const
    },
    onHumanizeOptionsChange: mockOnHumanizeOptionsChange,
    onRequestHumanize: mockOnRequestHumanize,
    isHumanizing: false,
    canHumanize: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all toolbar buttons', () => {
    render(<EditorToolbar {...defaultProps} />);

    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Check Grammar & Style')).toBeInTheDocument();
    expect(screen.getByText('Humanize')).toBeInTheDocument();
  });

  it('disables clear button when isLoading is true', () => {
    render(<EditorToolbar {...defaultProps} isLoading={true} />);

    const clearButton = screen.getByText('Clear');
    expect(clearButton).toBeDisabled();
  });

  it('disables check button when isLoading is true or text is empty', () => {
    const { rerender } = render(<EditorToolbar {...defaultProps} isLoading={true} />);
    
    let checkButton = screen.getByText('Check Grammar & Style');
    expect(checkButton).toBeDisabled();

    rerender(<EditorToolbar {...defaultProps} text="" />);
    checkButton = screen.getByText('Check Grammar & Style');
    expect(checkButton).toBeDisabled();
  });

  it('shows loading state for check button', () => {
    render(<EditorToolbar {...defaultProps} isLoading={true} />);

    expect(screen.getByText('Checking...')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument(); // Spinner
  });

  it('calls onClear when clear button is clicked', () => {
    render(<EditorToolbar {...defaultProps} />);

    fireEvent.click(screen.getByText('Clear'));
    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it('calls onCheck when check button is clicked', () => {
    render(<EditorToolbar {...defaultProps} />);

    fireEvent.click(screen.getByText('Check Grammar & Style'));
    expect(mockOnCheck).toHaveBeenCalledTimes(1);
  });

  it('opens humanize popover when humanize button is clicked', () => {
    render(<EditorToolbar {...defaultProps} />);

    const humanizeButton = screen.getByText('Humanize');
    fireEvent.click(humanizeButton);

    expect(screen.getByText('Humanize Settings')).toBeInTheDocument();
    expect(screen.getByText('Tone')).toBeInTheDocument();
    expect(screen.getByText('Strength')).toBeInTheDocument();
  });

  it('closes humanize popover when clicking outside', () => {
    render(<EditorToolbar {...defaultProps} />);

    fireEvent.click(screen.getByText('Humanize'));
    expect(screen.getByText('Humanize Settings')).toBeInTheDocument();

    fireEvent.click(document.body);
    expect(screen.queryByText('Humanize Settings')).not.toBeInTheDocument();
  });

  it('disables humanize button when conditions are not met', () => {
    const { rerender } = render(
      <EditorToolbar {...defaultProps} isLoading={true} />
    );

    let humanizeButton = screen.getByText('Humanize');
    expect(humanizeButton).toBeDisabled();

    rerender(<EditorToolbar {...defaultProps} isHumanizing={true} />);
    humanizeButton = screen.getByText('Humanize');
    expect(humanizeButton).toBeDisabled();

    rerender(<EditorToolbar {...defaultProps} text="" />);
    humanizeButton = screen.getByText('Humanize');
    expect(humanizeButton).toBeDisabled();

    rerender(<EditorToolbar {...defaultProps} canHumanize={false} />);
    humanizeButton = screen.getByText('Humanize');
    expect(humanizeButton).toBeDisabled();
  });

  it('shows humanizing state for humanize button', () => {
    render(<EditorToolbar {...defaultProps} isHumanizing={true} />);

    expect(screen.getByText('Humanizing...')).toBeInTheDocument();
  });

  it('updates tone selection in humanize popover', () => {
    render(<EditorToolbar {...defaultProps} />);

    fireEvent.click(screen.getByText('Humanize'));
    
    const toneSelect = screen.getByDisplayValue('neutral');
    fireEvent.change(toneSelect, { target: { value: 'friendly' } });

    expect(mockOnHumanizeOptionsChange).toHaveBeenCalledWith({
      tone: 'friendly',
      strength: 'medium'
    });
  });

  it('updates strength selection in humanize popover', () => {
    render(<EditorToolbar {...defaultProps} />);

    fireEvent.click(screen.getByText('Humanize'));
    
    const strengthSelect = screen.getByDisplayValue('medium');
    fireEvent.change(strengthSelect, { target: { value: 'strong' } });

    expect(mockOnHumanizeOptionsChange).toHaveBeenCalledWith({
      tone: 'neutral',
      strength: 'strong'
    });
  });

  it('calls onRequestHumanize when apply button is clicked', () => {
    render(<EditorToolbar {...defaultProps} />);

    fireEvent.click(screen.getByText('Humanize'));
    fireEvent.click(screen.getByText('Apply'));

    expect(mockOnRequestHumanize).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Humanize Settings')).not.toBeInTheDocument();
  });

  it('closes popover when cancel button is clicked', () => {
    render(<EditorToolbar {...defaultProps} />);

    fireEvent.click(screen.getByText('Humanize'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Humanize Settings')).not.toBeInTheDocument();
  });

  it('handles undefined humanize options gracefully', () => {
    render(
      <EditorToolbar {...defaultProps} humanizeOptions={undefined as any} />
    );

    fireEvent.click(screen.getByText('Humanize'));
    
    // Should not crash
    expect(screen.getByText('Humanize Settings')).toBeInTheDocument();
  });

  it('handles missing optional callbacks gracefully', () => {
    const { rerender } = render(
      <EditorToolbar {...defaultProps} onHumanizeOptionsChange={undefined as any} />
    );

    fireEvent.click(screen.getByText('Humanize'));
    
    const toneSelect = screen.getByDisplayValue('neutral');
    fireEvent.change(toneSelect, { target: { value: 'friendly' } });

    // Should not crash even without callback
    expect(mockOnHumanizeOptionsChange).not.toHaveBeenCalled();

    rerender(
      <EditorToolbar {...defaultProps} onRequestHumanize={undefined as any} />
    );

    fireEvent.click(screen.getByText('Apply'));
    expect(mockOnRequestHumanize).not.toHaveBeenCalled();
  });

  it('renders ModelSelector component', () => {
    render(<EditorToolbar {...defaultProps} />);

    // ModelSelector should be rendered (though we can't test its internals here)
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles popover interactions with keyboard', () => {
    render(<EditorToolbar {...defaultProps} />);

    const humanizeButton = screen.getByText('Humanize');
    
    // Simulate keyboard interaction
    humanizeButton.focus();
    fireEvent.keyDown(humanizeButton, { key: 'Enter' });

    expect(screen.getByText('Humanize Settings')).toBeInTheDocument();
  });
});