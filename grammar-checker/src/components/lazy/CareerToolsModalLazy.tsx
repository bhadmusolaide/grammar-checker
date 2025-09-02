import React, { Suspense, lazy } from 'react';
import { FullPageLoader } from '../common/LoadingStates';
import { CareerToolsModalProps } from '../../types';

// Lazy load the CareerToolsModal component
const CareerToolsModal = lazy(() => import('../CareerToolsModal'));

interface CareerToolsModalLazyProps extends Omit<CareerToolsModalProps, 'isOpen' | 'onClose'> {
  isOpen: boolean;
  onClose: () => void;
}

const CareerToolsModalLazy: React.FC<CareerToolsModalLazyProps> = (props) => {
  const { isOpen, onClose, ...rest } = props;
  
  if (!isOpen) return null;
  
  return (
    <Suspense fallback={<FullPageLoader />}>
      <CareerToolsModal isOpen={isOpen} onClose={onClose} {...rest} />
    </Suspense>
  );
};

export default CareerToolsModalLazy;