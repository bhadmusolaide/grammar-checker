import React, { Suspense, lazy } from 'react';
import { FullPageLoader } from '../common/LoadingStates';
import { ModelConfigModalProps } from '../../types';

// Lazy load the ModelConfigModal component
const ModelConfigModal = lazy(() => import('../ModelConfigModal'));

interface ModelConfigModalLazyProps extends Omit<ModelConfigModalProps, 'isOpen' | 'onClose'> {
  isOpen: boolean;
  onClose: () => void;
}

const ModelConfigModalLazy: React.FC<ModelConfigModalLazyProps> = (props) => {
  const { isOpen, onClose, ...rest } = props;
  
  if (!isOpen) return null;
  
  return (
    <Suspense fallback={<FullPageLoader />}>
      <ModelConfigModal isOpen={isOpen} onClose={onClose} {...rest} />
    </Suspense>
  );
};

export default ModelConfigModalLazy;