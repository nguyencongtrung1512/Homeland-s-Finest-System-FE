import React from 'react'

interface CurveSeparatorProps {
  className?: string
}

/**
 * CurveSeparator component creates a curved boundary between the left and right panels
 * Uses SVG path to create the wave effect without CSS clip-path or mask-image
 * 
 * Implementation with two layers:
 * - Element A: White fill (background for the form)
 * - Element B: Decorative stroke with opacity (ripple effect)
 */
const CurveSeparator: React.FC<CurveSeparatorProps> = ({ className = '' }) => {
  // Base path from the design - original path without offset
  const basePath = 'M313 0L325.2 22.5C337.3 45 361.7 90 359.5 135C357.3 180 328.7 225 309.7 270C290.7 315 281.3 360 287.8 405C294.3 450 316.7 495 327.8 517.5L339 540'
  
  // Closed path for white fill (Element A) - extends to right edge
  const closedPath = `${basePath}L960 540L960 0Z`

  return (
    <div className={`absolute left-0 top-0 bottom-0 pointer-events-none ${className}`} style={{ zIndex: 5, width: '250px' }}>
      <svg
        viewBox='0 0 960 540'
        preserveAspectRatio='none'
        className='h-full w-full'
        xmlns='http://www.w3.org/2000/svg'
      >
        {/* Element A: White fill - creates the background for the form */}
        <path
          fill='white'
          d={closedPath}
        />
        
        {/* Element B: Decorative stroke - creates the ripple effect */}
        <path
          fill='none'
          stroke='white'
          strokeOpacity='0.3'
          strokeWidth='20'
          d={basePath}
        />
      </svg>
    </div>
  )
}

export default CurveSeparator

