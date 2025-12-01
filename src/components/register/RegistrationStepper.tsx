import React from 'react'
import { User, Lock, Home } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Step {
  number: number
  title: string
  icon: React.ReactNode
}

interface RegistrationStepperProps {
  currentStep: number
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Về bản thân bạn',
    icon: <User className='w-5 h-5' />
  },
  {
    number: 2,
    title: 'Tài khoản & Bảo mật',
    icon: <Lock className='w-5 h-5' />
  },
  {
    number: 3,
    title: 'Hương ước cộng đồng',
    icon: <Home className='w-5 h-5' />
  }
]

const RegistrationStepper: React.FC<RegistrationStepperProps> = ({ currentStep }) => {
  return (
    <div className='flex flex-col space-y-6 mt-8'>
      {steps.map((step, index) => {
        const isActive = step.number === currentStep
        const isCompleted = step.number < currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={step.number} className='flex items-start space-x-4'>
            {/* Step Icon */}
            <div className='flex flex-col items-center'>
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                  isActive
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                    : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-white/20 text-white/60 border-2 border-white/30'
                )}
              >
                {step.icon}
              </div>
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 h-16 mt-2 transition-all duration-300',
                    isCompleted || isActive ? 'bg-green-500' : 'bg-white/20'
                  )}
                />
              )}
            </div>

            {/* Step Content */}
            <div className='flex-1 pt-2'>
              <div className='text-sm font-medium text-white/60 mb-1'>Bước {step.number}</div>
              <div
                className={cn(
                  'text-lg font-semibold transition-colors duration-300',
                  isActive ? 'text-white' : isCompleted ? 'text-white/80' : 'text-white/60'
                )}
              >
                {step.title}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RegistrationStepper

