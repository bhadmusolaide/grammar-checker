import React, { memo } from 'react';

interface ServiceSelectorProps {
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  autoCheckEnabled: boolean;
  onAutoCheckToggle: (enabled: boolean) => void;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedServices,
  onServicesChange,
  language,
  onLanguageChange,
  autoCheckEnabled,
  onAutoCheckToggle
}) => {
  const toggleService = (service: string) => {
    let newServices = [...selectedServices];
    
    if (newServices.includes(service)) {
      // If unchecking a service
      newServices = newServices.filter(s => s !== service);
    } else {
      // If checking a service
      newServices.push(service);
    }
    
    onServicesChange(newServices);
  };

  const serviceOptions = [
    { id: 'ollama', label: 'AI Grammar Assistant', description: 'Advanced AI-powered grammar and style analysis' }
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {serviceOptions.map((service) => (
          <div
            key={service.id}
            onClick={() => toggleService(service.id)}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedServices.includes(service.id)
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${
                selectedServices.includes(service.id)
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {selectedServices.includes(service.id) && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{service.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <label htmlFor="language" className="text-sm font-medium text-gray-700">
            Language:
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Auto-check:</span>
          <button
            onClick={() => onAutoCheckToggle(!autoCheckEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              autoCheckEnabled ? 'bg-primary-600' : 'bg-gray-300'
            }`}
            aria-pressed={autoCheckEnabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoCheckEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom comparison function for React.memo
const areEqual = (prevProps: ServiceSelectorProps, nextProps: ServiceSelectorProps) => {
  return (
    prevProps.selectedServices === nextProps.selectedServices &&
    prevProps.language === nextProps.language &&
    prevProps.autoCheckEnabled === nextProps.autoCheckEnabled &&
    prevProps.onServicesChange === nextProps.onServicesChange &&
    prevProps.onLanguageChange === nextProps.onLanguageChange &&
    prevProps.onAutoCheckToggle === nextProps.onAutoCheckToggle
  );
};

export default memo(ServiceSelector, areEqual);