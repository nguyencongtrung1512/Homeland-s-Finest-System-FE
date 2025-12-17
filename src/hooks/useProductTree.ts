import { useMemo } from 'react'
import type { Node, Edge } from 'reactflow'
import type { ProductNodeType } from '../components/ProductNode'

export type TreePattern = 'simple' | 'medium' | 'complex'

interface ProductTreeData {
  nodes: Node[]
  edges: Edge[]
}

// Calculate positions for nodes in a tree structure
const calculateTreeLayout = (pattern: TreePattern): { nodes: Omit<Node, 'id'>[]; edges: Omit<Edge, 'id'>[] } => {
  const nodeData: Array<{ type: ProductNodeType; label: string; description?: string; x: number; y: number }> = []
  const edgeData: Array<{ source: string; target: string }> = []

  switch (pattern) {
    case 'simple': {
      // Root node
      nodeData.push({
        type: 'Detail',
        label: 'Thông tin sản phẩm',
        description: 'Ví dụ: Mật ong',
        x: 400,
        y: 80
      })

      // SKU nodes
      nodeData.push({
        type: 'SKU',
        label: 'Quy cách / Đóng gói',
        description: '1 Lít',
        x: 200,
        y: 300
      })

      nodeData.push({
        type: 'SKU',
        label: 'Quy cách / Đóng gói',
        description: '5 Lít',
        x: 600,
        y: 300
      })

      // Edges
      edgeData.push({ source: 'root', target: 'sku1' })
      edgeData.push({ source: 'root', target: 'sku2' })
      break
    }

    case 'medium': {
      // Root node
      nodeData.push({
        type: 'Detail',
        label: 'Thông tin sản phẩm',
        description: 'Mật ong',
        x: 400,
        y: 80
      })

      // Group nodes
      nodeData.push({
        type: 'Group',
        label: 'Hũ Nhựa',
        x: 200,
        y: 280
      })

      nodeData.push({
        type: 'Group',
        label: 'Hũ Thủy Tinh',
        x: 600,
        y: 280
      })

      // SKU nodes under Group 1
      nodeData.push({
        type: 'SKU',
        label: 'Quy cách / Đóng gói',
        description: '100ml',
        x: 200,
        y: 480
      })

      // SKU nodes under Group 2
      nodeData.push({
        type: 'SKU',
        label: 'Quy cách / Đóng gói',
        description: '100ml',
        x: 600,
        y: 480
      })

      // Edges
      edgeData.push({ source: 'root', target: 'group1' })
      edgeData.push({ source: 'root', target: 'group2' })
      edgeData.push({ source: 'group1', target: 'sku1' })
      edgeData.push({ source: 'group2', target: 'sku2' })
      break
    }

    case 'complex': {
      // Level 1: Master node (Gốc) - ở giữa trên cùng
      nodeData.push({
        type: 'Master',
        label: 'Dòng Sản phẩm',
        description: 'Dòng Mật Ong',
        x: 400,
        y: 80
      })

      // Level 2: Detail nodes - Nhánh Trái và Nhánh Phải
      // Nhánh Trái: Mật ong rừng
      nodeData.push({
        type: 'Detail',
        label: 'Mật ong rừng',
        x: 150,
        y: 250
      })

      // Nhánh Phải: Mật ong nhà
      nodeData.push({
        type: 'Detail',
        label: 'Mật ong nhà',
        x: 650,
        y: 250
      })

      // Level 3: Group nodes - Dưới mỗi Detail
      // Group dưới Detail 1 (Nhánh Trái)
      nodeData.push({
        type: 'Group',
        label: 'Nhóm tùy chọn',
        x: 150,
        y: 400
      })

      // Group dưới Detail 2 (Nhánh Phải)
      nodeData.push({
        type: 'Group',
        label: 'Nhóm tùy chọn',
        x: 650,
        y: 400
      })

      // Level 4: SKU nodes - Dưới mỗi Group (2 SKU mỗi nhánh)
      // SKU dưới Group 1 (Nhánh Trái) - SKU 1
      nodeData.push({
        type: 'SKU',
        label: 'Quy cách / Đóng gói',
        description: '100ml',
        x: 50,
        y: 550
      })

      // SKU dưới Group 1 (Nhánh Trái) - SKU 2
      nodeData.push({
        type: 'SKU',
        label: 'Quy cách / Đóng gói',
        description: '500ml',
        x: 250,
        y: 550
      })

      // SKU dưới Group 2 (Nhánh Phải) - SKU 3
      nodeData.push({
        type: 'SKU',
        label: 'Quy cách / Đóng gói',
        description: '100ml',
        x: 550,
        y: 550
      })

      // SKU dưới Group 2 (Nhánh Phải) - SKU 4
      nodeData.push({
        type: 'SKU',
        label: 'Quy cách / Đóng gói',
        description: '500ml',
        x: 750,
        y: 550
      })

      // Edges: Master -> Detail -> Group -> SKU
      edgeData.push({ source: 'master', target: 'detail1' }) // Master -> Detail 1 (Trái)
      edgeData.push({ source: 'master', target: 'detail2' }) // Master -> Detail 2 (Phải)
      edgeData.push({ source: 'detail1', target: 'group1' }) // Detail 1 -> Group 1
      edgeData.push({ source: 'detail2', target: 'group2' }) // Detail 2 -> Group 2
      edgeData.push({ source: 'group1', target: 'sku1' }) // Group 1 -> SKU 1
      edgeData.push({ source: 'group1', target: 'sku2' }) // Group 1 -> SKU 2
      edgeData.push({ source: 'group2', target: 'sku3' }) // Group 2 -> SKU 3
      edgeData.push({ source: 'group2', target: 'sku4' }) // Group 2 -> SKU 4
      break
    }
  }

  // Generate node IDs and create Node objects
  const nodes: Omit<Node, 'id'>[] = nodeData.map((data) => ({
    type: 'productNode',
    position: { x: data.x, y: data.y },
    data: {
      type: data.type,
      label: data.label,
      description: data.description
    }
  }))

  // Generate edge IDs and create Edge objects
  const edges: Omit<Edge, 'id'>[] = edgeData.map((edge) => ({
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#64748b', strokeWidth: 2.5 }
  }))

  return { nodes, edges }
}

export const useProductTree = (pattern: TreePattern | null): ProductTreeData => {
  return useMemo(() => {
    if (!pattern) {
      return { nodes: [], edges: [] }
    }

    const { nodes: nodeTemplates, edges: edgeTemplates } = calculateTreeLayout(pattern)

    // Generate unique IDs for nodes and create mapping
    const nodes: Node[] = nodeTemplates.map((node, idx) => ({
      ...node,
      id: `node-${pattern}-${idx}`
    }))

    // Map edge source/target to actual node IDs based on pattern
    const nodeIdMap: Record<string, string> = {}
    nodes.forEach((node, idx) => {
      let key: string
      if (pattern === 'simple') {
        key = idx === 0 ? 'root' : `sku${idx}`
      } else if (pattern === 'medium') {
        if (idx === 0) {
          key = 'root'
        } else if (idx <= 2) {
          key = `group${idx}`
        } else {
          key = `sku${idx - 2}`
        }
      } else {
        // complex: Master -> Detail -> Group -> SKU (4 SKU total)
        if (idx === 0) {
          key = 'master'
        } else if (idx === 1) {
          key = 'detail1'
        } else if (idx === 2) {
          key = 'detail2'
        } else if (idx === 3) {
          key = 'group1'
        } else if (idx === 4) {
          key = 'group2'
        } else if (idx === 5) {
          key = 'sku1'
        } else if (idx === 6) {
          key = 'sku2'
        } else if (idx === 7) {
          key = 'sku3'
        } else {
          key = 'sku4'
        }
      }
      nodeIdMap[key] = node.id
    })

    // Generate unique IDs for edges and map source/target
    const edges: Edge[] = edgeTemplates.map((edge, index) => ({
      ...edge,
      id: `edge-${pattern}-${index}`,
      source: nodeIdMap[edge.source] || edge.source,
      target: nodeIdMap[edge.target] || edge.target
    }))

    return { nodes, edges }
  }, [pattern])
}
