'use client';

interface ProcessingStepsProps {
  currentStep: string;
}

const steps = [
  { id: 'validate', name: 'Validate', icon: '🔍' },
  { id: 'upload', name: 'Upload', icon: '📤' },
  { id: 'extract', name: 'Extract', icon: '🎵' },
  { id: 'compress', name: 'Compress', icon: '🗜️' },
  { id: 'transcribe', name: 'Transcribe', icon: '🎙️' },
  { id: 'generate', name: 'Generate', icon: '📝' },
];

export function ProcessingSteps({ currentStep }: ProcessingStepsProps) {
  const getCurrentStepIndex = () => {
    const stepLower = currentStep.toLowerCase();
    if (stepLower.includes('validat')) return 0;
    if (stepLower.includes('upload')) return 1;
    if (stepLower.includes('extract')) return 2;
    if (stepLower.includes('compress')) return 3;
    if (stepLower.includes('transcrib')) return 4;
    if (stepLower.includes('generat')) return 5;
    if (stepLower.includes('complete')) return 6;
    return 0;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-lg
                    transition-all duration-300 border-2
                    ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white scale-100'
                        : isCurrent
                          ? 'bg-primary-500 border-primary-500 text-white scale-110 shadow-lg animate-pulse'
                          : 'bg-gray-200 border-gray-300 text-gray-400 scale-90'
                    }
                  `}
                >
                  {isCompleted ? '✓' : step.icon}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium
                    ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                  `}
                >
                  {step.name}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 relative">
                  <div className="absolute inset-0 bg-gray-200" />
                  <div
                    className={`
                      absolute inset-0 transition-all duration-500
                      ${isCompleted ? 'bg-green-500 w-full' : isCurrent ? 'bg-primary-500 w-1/2' : 'w-0'}
                    `}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
