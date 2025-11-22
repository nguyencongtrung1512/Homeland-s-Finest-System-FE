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
  contentClassName?: string
}

export const ShimmerBorder = ({
  children,
  className = '',
  color = '#10b981',
  animationDuration = '3s',
  contentClassName = 'bg-white'
}: ShimmerBorderProps) => {
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

  return (
    <>
      <style>{shimmerCss}</style>
      <div className={`relative p-[1.5px] rounded-lg overflow-hidden ${className}`}>
        {/* Shimmer Border Effect */}
        <div
          className='absolute inset-0 pointer-events-none'
          style={{
            background: `conic-gradient(from var(--angle), transparent 25%, ${color}, transparent 50%)`,
            animation: `shimmer-spin ${animationDuration} linear infinite`
          }}
        />
        {/* Content */}
        <div className={`relative z-10 ${contentClassName} rounded-lg flex-1 flex flex-col`}>{children}</div>
      </div>
    </>
  )
}
