import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextEditor from '../TextEditor';

describe('TextEditor', () => {
  const mockProps = {
    text: '',
    onChange: jest.fn(),
    suggestions: [],
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders textarea with correct props', () => {
    render(<TextEditor {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText('Start writing or paste your text here...');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('');
  });

  it('displays the provided text', () => {
    render(<TextEditor {...mockProps} text="Hello world" />);
    
    const textarea = screen.getByDisplayValue('Hello world');
    expect(textarea).toBeInTheDocument();
  });

  it('calls onChange when text is entered', () => {
    render(<TextEditor {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText('Start writing or paste your text here...');
    fireEvent.change(textarea, { target: { value: 'New text' } });
    
    expect(mockProps.onChange).toHaveBeenCalledWith('New text');
  });
});