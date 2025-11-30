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
              {currentStep === 1 && 'Chào mừng Seller mới!'}
              {currentStep === 2 && 'Tạo mô hình cây của bạn'}
              {currentStep === 3 && 'Đặt tên cho Sản phẩm chính'}
              {currentStep === 4 && 'Chọn danh mục sản phẩm'}
              {currentStep === 5 && 'Sẵn sàng tạo tùy chọn!'}
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
        Hệ thống sản phẩm được thiết kế như việc <strong className='text-green-600'>trồng cây</strong>
        <TreePine className='w-5 h-5 inline-block ml-1 text-green-600' />. Để bán hàng hiệu quả, bạn cần hiểu cấu trúc
        cây.
      </p>

      <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm mt-6'>
        <div className='space-y-4'>
          <div className='flex items-start gap-4'>
            <div className='w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0'>
              <Box className='w-6 h-6 text-blue-600' />
            </div>
            <div className='flex-1'>
              <h4 className='font-semibold text-gray-900 mb-1'>Gốc (SP Chính):</h4>
              <p className='text-gray-600 text-sm'>Cái khách thấy (Vd: Mật ong)</p>
            </div>
          </div>

          <div className='flex items-start gap-4'>
            <div className='w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0'>
              <Tag className='w-6 h-6 text-green-600' />
            </div>
            <div className='flex-1'>
              <h4 className='font-semibold text-gray-900 mb-1'>Quả (SKU):</h4>
              <p className='text-gray-600 text-sm'>Cái khách mua (Vd: Chai 1 lít)</p>
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
        Trước khi bắt đầu, hãy xem sản phẩm của bạn thuộc mô hình nào nhé:
      </p>

      <div className='flex gap-3 mb-6'>
        <button
          onClick={() => onSelectModel('simple')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${selectedModel === 'simple'
            ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
        >
          Đơn giản (1 Cấp)
        </button>
        <button
          onClick={() => onSelectModel('medium')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${selectedModel === 'medium'
            ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
        >
          Trung bình (2 Cấp)
        </button>
        <button
          onClick={() => onSelectModel('complex')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${selectedModel === 'complex'
            ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
        >
          Phức tạp (Master)
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
                {selectedModel === 'simple' && 'Thích hợp khi sản phẩm chỉ có 1 cấp tùy chọn (Size hoặc Dung tích...)'}
                {selectedModel === 'medium' && 'Phổ biến nhất: 2 cấp tùy chọn (VD: Chất liệu → Dung tích)'}
                {selectedModel === 'complex' && 'Dùng khi có nhiều sản phẩm con khác tên/ảnh (VD: Rừng vs Nhà)'}
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
        Bắt đầu tạo <strong className='text-blue-600'>Sản phẩm chính</strong> - đây là sản phẩm độc lập mà khách hàng
        sẽ thấy trên trang danh mục.
      </p>

      <div className='space-y-3'>
        <div className='flex items-start gap-2'>
          <span className='text-green-600 font-bold'>•</span>
          <p className='text-gray-700 text-sm'>
            <strong>Tên sản phẩm:</strong> Đặt tên rõ ràng, cụ thể - đây là tên khách hàng sẽ thấy trên danh mục tìm
            kiếm.
          </p>
        </div>
        <div className='flex items-start gap-2'>
          <span className='text-green-600 font-bold'>•</span>
          <p className='text-gray-700 text-sm'>
            <strong>Ví dụ tên tốt:</strong> "Mật ong rừng", "Mật ong nhà", "Áo thun trơn", "Gốm sứ Bát Tràng"
          </p>
        </div>
        <div className='flex items-start gap-2'>
          <span className='text-green-600 font-bold'>•</span>
          <p className='text-gray-700 text-sm'>
            <strong>Mô tả & Hình ảnh:</strong> Thêm mô tả chi tiết và hình ảnh đại diện cho sản phẩm.
          </p>
        </div>
        <div className='flex items-start gap-2'>
          <span className='text-green-600 font-bold'>•</span>
          <p className='text-gray-700 text-sm'>
            <strong>Lưu ý:</strong> Chưa cần nhập giá ở đây. Giá sẽ được đặt ở bước tạo <strong className='text-green-600'>Phiên bản bán được (SKU)</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}

// Step 4: Category
function Step4Category() {
  return (
    <div className='space-y-4'>
      <p className='text-gray-700 leading-relaxed mb-4'>
        Chọn <strong className='text-blue-600'>danh mục sản phẩm</strong> phù hợp để khách hàng dễ dàng tìm thấy sản
        phẩm của bạn.
      </p>

      <div className='space-y-3'>
        <div className='flex items-start gap-2'>
          <span className='text-green-600 font-bold'>•</span>
          <p className='text-gray-700 text-sm'>
            <strong>Chọn danh mục chính xác:</strong> Đặt sản phẩm vào đúng danh mục giúp khách hàng tìm thấy dễ dàng
            hơn.
          </p>
        </div>
        <div className='flex items-start gap-2'>
          <span className='text-green-600 font-bold'>•</span>
          <p className='text-gray-700 text-sm'>
            <strong>Ví dụ:</strong> "Mật ong" → Danh mục "Thực phẩm" → "Đồ uống & Thực phẩm tự nhiên"
          </p>
        </div>
        <div className='flex items-start gap-2'>
          <span className='text-green-600 font-bold'>•</span>
          <p className='text-gray-700 text-sm'>
            <strong>Lưu ý:</strong> Nếu không tìm thấy danh mục phù hợp, hãy chọn danh mục gần nhất.
          </p>
        </div>
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
        <p className='text-gray-700 leading-relaxed mb-4'>
          Bạn đã hoàn thành bước tạo <strong className='text-blue-600'>Sản phẩm chính</strong>!
        </p>
        <p className='text-gray-700 leading-relaxed'>
          Hãy bấm <strong className='text-green-600'>Lưu sản phẩm</strong> để sang bước tiếp theo: Tạo các{' '}
          <strong className='text-yellow-600'>Nhóm tùy chọn</strong> và{' '}
          <strong className='text-green-600'>Phiên bản bán được (SKU)</strong>
          .
        </p>
        <div className='mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-left'>
          <p className='text-sm text-gray-700'>
            <strong>Bước tiếp theo:</strong> Sau khi lưu, bạn sẽ tạo các tùy chọn sản phẩm (ví dụ: Loại hũ, Dung tích)
            và đặt giá cho từng phiên bản bán được.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProductTutorialModal
