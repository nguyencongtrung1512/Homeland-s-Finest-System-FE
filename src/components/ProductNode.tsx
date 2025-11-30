import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Box, Tag, Layers, Home } from 'lucide-react'

export type ProductNodeType = 'Master' | 'Detail' | 'Group' | 'SKU'

interface ProductNodeData {
  type: ProductNodeType
  label: string
  description?: string
}

interface ProductNodeProps extends NodeProps {
  data: ProductNodeData
}

// Node configuration based on type
const nodeConfig = {
  Master: {
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-600',
    iconColor: 'text-purple-600',
    icon: Home,
    size: 'w-16 h-16'
  },
  Detail: {
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-600',
    iconColor: 'text-blue-600',
    icon: Box,
    size: 'w-16 h-16'
  },
  Group: {
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-600',
    iconColor: 'text-yellow-600',
    icon: Layers,
    size: 'w-16 h-16'
  },
  SKU: {
    bgColor: 'bg-green-100',
    borderColor: 'border-green-600',
    iconColor: 'text-green-600',
    icon: Tag,
    size: 'w-16 h-16'
  }
}

function ProductNode({ data, selected }: ProductNodeProps) {
  const config = nodeConfig[data.type]
  const Icon = config.icon

  return (
    <div
      className={`bg-white border-2 rounded-lg p-4 shadow-sm transition-all ${selected ? `${config.borderColor} shadow-md` : 'border-gray-200'
        }`}
    >
      {/* Top handle for incoming connections */}
      <Handle type='target' position={Position.Top} className='w-3 h-3 bg-gray-400' />

      <div className='flex flex-col items-center space-y-2 min-w-[120px]'>
        {/* Icon */}
        <div
          className={`${config.bgColor} ${config.borderColor} border-2 ${config.size} rounded-lg flex items-center justify-center`}
        >
          <Icon className={`${config.iconColor} w-8 h-8`} />
        </div>

        {/* Label */}
        <div className='text-center'>
          <p className='font-semibold text-gray-900 text-sm'>{data.label}</p>
          {data.description && <p className='text-xs text-gray-500 mt-1'>{data.description}</p>}
        </div>
      </div>

      {/* Bottom handle for outgoing connections */}
      <Handle type='source' position={Position.Bottom} className='w-3 h-3 bg-gray-400' />
    </div>
  )
}

export default memo(ProductNode)

