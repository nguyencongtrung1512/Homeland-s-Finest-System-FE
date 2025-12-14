import { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Gamepad2, TreePine, Tag, Lightbulb, CheckCircle2, Box, Layers } from 'lucide-react'
import ReactFlow, {
  Background,
  Controls,
  type ReactFlowInstance,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow'
import 'reactflow/dist/style.css'
import ProductNode from '../../../components/ProductNode'
import { useProductTree, type TreePattern } from '../../../hooks/useProductTree'

interface ProductTutorialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TreeModel = 'simple' | 'medium' | 'complex'

// Register custom node type
const nodeTypes = {
  productNode: ProductNode
}

function ProductTutorialModal({ open, onOpenChange }: ProductTutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedModel, setSelectedModel] = useState<TreeModel | null>(null)

  const totalSteps = 5

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onOpenChange(false)
    setCurrentStep(1)
    setSelectedModel(null)
  }

  const handleComplete = () => {
    onOpenChange(false)
    setCurrentStep(1)
    setSelectedModel(null)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Welcome />
      case 2:
        return <Step2ChooseModel selectedModel={selectedModel} onSelectModel={setSelectedModel} />
      case 3:
        return <Step3NameRoot />
      case 4:
        return <Step4Category />
      case 5:
        return <Step5Complete />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
        <div className='bg-gradient-to-r from-green-600 to-green-700 h-2 w-full absolute top-0 left-0' />
        <DialogHeader className='relative'>
          <div className='flex items-center gap-3 mb-4'>
            {currentStep === 1 && (
              <div className='w-12 h-12 rounded-full bg-green-100 border-2 border-green-600 flex items-center justify-center'>
                <Gamepad2 className='w-6 h-6 text-green-600' />
              </div>
            )}
            {currentStep === 2 && (
              <div className='w-12 h-12 rounded-full bg-purple-100 border-2 border-purple-600 flex items-center justify-center'>
                <Layers className='w-6 h-6 text-purple-600' />
              </div>
            )}
            {currentStep === 3 && (
              <div className='w-12 h-12 rounded-full bg-green-100 border-2 border-green-600 flex items-center justify-center'>
                <Lightbulb className='w-6 h-6 text-yellow-500' />
              </div>
            )}
            {currentStep === 4 && (
              <div className='w-12 h-12 rounded-full bg-green-100 border-2 border-green-600 flex items-center justify-center'>
                <Lightbulb className='w-6 h-6 text-yellow-500' />
              </div>
            )}
            {currentStep === 5 && (
              <div className='w-12 h-12 rounded-full bg-green-100 border-2 border-green-600 flex items-center justify-center'>
                <CheckCircle2 className='w-6 h-6 text-green-600' />
              </div>
            )}
            <DialogTitle className='text-2xl font-bold text-gray-900 flex-1'>
              {currentStep === 1 && 'Chào mừng Người bán mới!'}
              {currentStep === 2 && 'Chọn cách bán sản phẩm'}
              {currentStep === 3 && 'Nhập thông tin sản phẩm'}
              {currentStep === 4 && 'Chọn danh mục bán hàng'}
              {currentStep === 5 && 'Xong! Tiếp theo tạo quy cách bán'}
            </DialogTitle>
            <div className='text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full'>
              {currentStep}/{totalSteps}
            </div>
          </div>
        </DialogHeader>

        <DialogDescription asChild>
          <div className='mt-4'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </DialogDescription>

        <div className='flex justify-between items-center mt-6 pt-4 border-t'>
          <button
            onClick={handleSkip}
            className='text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors'
          >
            Bỏ qua
          </button>
          <div className='flex gap-3'>
            {currentStep > 1 && (
              <Button variant='outline' onClick={handlePrevious}>
                Quay lại
              </Button>
            )}
            <Button variant='green' onClick={handleNext} disabled={currentStep === 2 && !selectedModel}>
              {currentStep === totalSteps ? 'Hoàn thành' : 'Tiếp theo >'}
              {currentStep === totalSteps && <CheckCircle2 className='w-4 h-4 ml-2' />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step 1: Welcome
function Step1Welcome() {
  return (
    <div className='space-y-4'>
      <p className='text-gray-700 leading-relaxed'>
        Sản phẩm được chia thành 2 phần: <strong className='text-green-600'>Thông tin sản phẩm</strong> và{' '}
        <strong className='text-green-600'>Quy cách / đóng gói</strong>. Hiểu đúng 2 phần này sẽ giúp bạn tạo sản phẩm nhanh và bán hàng hiệu quả hơn.
      </p>

      <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm mt-6'>
        <div className='space-y-4'>
          <div className='flex items-start gap-4'>
            <div className='w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0'>
              <Box className='w-6 h-6 text-blue-600' />
            </div>
            <div className='flex-1'>
              <h4 className='font-semibold text-gray-900 mb-1'>Thông tin sản phẩm:</h4>
              <p className='text-gray-600 text-sm'>(Ví dụ: Mật ong, Áo thun, Gốm sứ Bát Tràng...)</p>
            </div>
          </div>

          <div className='flex items-start gap-4'>
            <div className='w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0'>
              <Tag className='w-6 h-6 text-green-600' />
            </div>
            <div className='flex-1'>
              <h4 className='font-semibold text-gray-900 mb-1'>Quy cách / Đóng gói:</h4>
              <p className='text-gray-600 text-sm'>(Ví dụ: Chai 1 lít, Hộp 100g, Bộ 3 sản phẩm...)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 2: Choose Tree Model
interface Step2Props {
  selectedModel: TreeModel | null
  onSelectModel: (model: TreeModel) => void
}

function Step2ChooseModel({ selectedModel, onSelectModel }: Step2Props) {
  const { nodes: initialNodes, edges: initialEdges } = useProductTree(selectedModel as TreePattern | null)
  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)

  // Reset nodes and edges when pattern changes
  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges])

  const onInit = useCallback((reactFlowInstance: ReactFlowInstance) => {
    reactFlowInstance.fitView()
  }, [])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds))
  }, [])

  return (
    <div className='space-y-6'>
      <p className='text-gray-700 leading-relaxed'>
        Trước khi bắt đầu, hãy xem bạn muốn bán sản phẩm theo cách nào nhé:
      </p>

      <div className='flex gap-3 mb-6'>
        <button
          onClick={() => onSelectModel('simple')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${selectedModel === 'simple'
            ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
        >
         Bán cố định
        </button>
        <button
          onClick={() => onSelectModel('medium')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${selectedModel === 'medium'
            ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
        >
          Bán theo quy cách / đóng gói
        </button>
        <button
          onClick={() => onSelectModel('complex')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${selectedModel === 'complex'
            ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
        >
          Bán nhiều loại
        </button>
      </div>

      {selectedModel && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
            <div className='h-[500px] w-full'>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onInit={onInit}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                nodesDraggable={true}
                nodesConnectable={false}
                elementsSelectable={true}
                panOnDrag={true}
                zoomOnScroll={true}
                className='bg-gray-50'
              >
                <Background color='#e5e7eb' gap={16} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>

            <div className='mt-6 bg-gray-50 rounded-lg p-4'>
              <p className='text-sm text-gray-600'>
                {selectedModel === 'simple' && 'Khách chỉ mua, không cần chọn gì thêm'}
                {selectedModel === 'medium' && 'Khách chọn 1 trong các quy cách đóng gói sản phẩm'}
                {selectedModel === 'complex' && 'Khách phải chọn từ 2 bước trở lên'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Step 3: Name Root (Sản phẩm chính)
function Step3NameRoot() {
  return (
    <div className='space-y-4'>
      <p className='text-gray-700 leading-relaxed mb-4'>
        Đây là thông tin cơ bản mà khách hàng sẽ thấy khi tìm kiếm sản phẩm của bạn.
      </p>

      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <h4 className='font-semibold text-gray-900 mb-3'> Cần điền gì?</h4>
        
        <div className='space-y-3'>
          <div>
            <p className='text-gray-700 text-sm'>
              <strong>• Tên sản phẩm:</strong> Rõ ràng, dễ tìm
            </p>
            <p className='text-gray-600 text-sm ml-4 mt-1'>
              Ví dụ: "Mật ong rừng", "Áo thun trơn", "Gốm sứ Bát Tràng"
            </p>
          </div>

          <p className='text-gray-700 text-sm'>
            <strong>• Mô tả:</strong> Viết chi tiết về sản phẩm
          </p>

          <p className='text-gray-700 text-sm'>
            <strong>• Hình ảnh:</strong> Chọn ảnh đại diện đẹp nhất
          </p>
        </div>
      </div>

      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4'>
        <p className='text-sm text-gray-700'>
          <strong> Lưu ý:</strong> Chưa cần nhập giá! Bạn sẽ đặt giá ở bước sau khi tạo quy cách bán.
        </p>
      </div>
    </div>
  )
}

// Step 4: Category
function Step4Category() {
  return (
    <div className='space-y-4'>
      <p className='text-gray-700 leading-relaxed mb-4'>
        Chọn danh mục phù hợp để khách hàng dễ tìm thấy sản phẩm của bạn.
      </p>

      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <p className='text-gray-700 text-sm mb-2'>
          <strong> Ví dụ:</strong>
        </p>
        <p className='text-gray-600 text-sm ml-4'>
          "Mật ong" → Thực phẩm → Đồ uống & Thực phẩm tự nhiên
        </p>
      </div>

      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3'>
        <p className='text-sm text-gray-700'>
          <strong> Mẹo:</strong> Nếu không chắc chắn, hãy chọn danh mục gần nhất.
        </p>
      </div>
    </div>
  )
}

// Step 5: Complete
function Step5Complete() {
  return (
    <div className='space-y-6'>
      <div className='flex justify-center'>
        <div className='w-24 h-24 rounded-full bg-green-100 border-4 border-green-600 flex items-center justify-center'>
          <CheckCircle2 className='w-12 h-12 text-green-600' />
        </div>
      </div>

      <div className='text-center space-y-3'>
        <p className='text-gray-700 leading-relaxed text-lg font-medium'>
          🎉 Bạn đã hoàn thành bước đầu tiên!
        </p>
        
        <p className='text-gray-700 leading-relaxed'>
          Bấm <strong className='text-green-600'>Lưu sản phẩm</strong> để tiếp tục.
        </p>
      </div>

      <div className='bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-5 shadow-sm'>
        <div className='flex items-start gap-3'>
          <div className='w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0'>
            <Box className='w-6 h-6 text-blue-600' />
          </div>
          <div>
            <h4 className='font-semibold text-gray-900 mb-2'>
               Bước tiếp theo:
            </h4>
            <p className='text-sm text-gray-700 leading-relaxed'>
              Sau khi lưu, bạn sẽ tạo các <strong>quy cách bán</strong> (ví dụ: 500ml, 1 lít, 5 lít) và <strong>đặt giá</strong> cho từng quy cách.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ProductTutorialModal