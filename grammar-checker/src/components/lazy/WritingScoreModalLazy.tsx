import React, { Suspense, lazy } from 'react';
import { FullPageLoader } from '../common/LoadingStates';
import { WritingScoreModalProps } from '../../types';

// Lazy load the WritingScoreModal component
const WritingScoreModal = lazy(() => import('../WritingScoreModal'));

interface WritingScoreModalLazyProps extends Omit<WritingScoreModalProps, 'isOpen' | 'onClose'> {
  isOpen: boolean;
  onClose: () => void;
}

const WritingScoreModalLazy: React.FC<WritingScoreModalLazyProps> = (props) => {
  const { isOpen, onClose, ...rest } = props;
  
  if (!isOpen) return null;
  
  return (
    <Suspense fallback={<FullPageLoader />}>
      <WritingScoreModal isOpen={isOpen} onClose={onClose} {...rest} />
    </Suspense>
  );
};

export default WritingScoreModalLazy;