import { type ReactNode } from 'react'

// Shimmer CSS Styles
export const ShimmerStyles = () => {
  const shimmerCss = `
    @property --angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }
    @keyframes shimmer-spin {
      to {
        --angle: 360deg;
      }
    }
  `

  return <style>{shimmerCss}</style>
}

// Shimmer Border Wrapper Component
interface ShimmerBorderProps {
  children: ReactNode
  className?: string
  color?: string
  animationDuration?: string
}

export const ShimmerBorder = ({
  children,
  className = '',
  color = '#10b981',
  animationDuration = '3s'
}: ShimmerBorderProps) => {
  return (
    <div className={`relative p-[2px] rounded-lg overflow-hidden flex flex-col ${className}`}>
      {/* Shimmer Border Effect */}
      <div
        className='absolute inset-0'
        style={{
          background: `conic-gradient(from var(--angle), transparent 20%, ${color}, transparent 60%)`,
          animation: `shimmer-spin ${animationDuration} linear infinite`
        }}
      />
      {/* Content */}
      <div className='relative bg-white rounded-lg flex-1 flex flex-col'>{children}</div>
    </div>
  )
}
