import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../design-system/components';

interface OnboardingProps {
  onComplete: () => void;
  isOpen: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isOpen }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to GrammarFlow",
      description: "Your AI-powered writing assistant for perfect grammar and style.",
      icon: "✍️",
      tips: [
        "Write or paste your text in the editor",
        "Get instant grammar and style suggestions",
        "Enhance your writing with AI-powered tools"
      ]
    },
    {
      title: "How It Works",
      description: "Three simple steps to improve your writing.",
      icon: "✨",
      tips: [
        "Select an AI model for analysis",
        "Click 'Check Grammar' to analyze your text",
        "Review suggestions and apply fixes"
      ]
    },
    {
      title: "Advanced Features",
      description: "Unlock powerful writing tools.",
      icon: "🚀",
      tips: [
        "Humanize AI-generated text to sound more natural",
        "Enhance your writing with powerful AI suggestions",
      "Get intelligent writing improvement recommendations"
      ]
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">{currentStep.icon}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStep.title}</h2>
              <p className="text-gray-600 mb-6">{currentStep.description}</p>
              
              <div className="space-y-3 mb-8">
                {currentStep.tips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-gray-700 text-left">{tip}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center">
                <button
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Skip tutorial
                </button>
                
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === step ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    {step > 0 && (
                      <Button
                        variant="secondary"
                        onClick={handlePrevious}
                      >
                        Back
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      onClick={handleNext}
                    >
                      {step === steps.length - 1 ? 'Get Started' : 'Next'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Onboarding;