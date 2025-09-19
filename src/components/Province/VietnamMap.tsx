import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import geoJsonData from '../docs/Provinces_included_Paracel_SpratlyIslands.json'

export type ProvinceProperties = {
  Name: string
  Note?: string | null
  Region?: string
  description?: string
  details?: string
}

// Interface cho GeoJSON feature
interface GeoJsonFeature {
  type: string
  properties: ProvinceProperties
  geometry: {
    type: string
    coordinates: number[][][][] | number[][][]
  }
}

// Interface cho GeoJSON data
interface GeoJsonData {
  type: string
  features: GeoJsonFeature[]
}

export interface VietnamMapProps {
  setSelectedProvince: (province: ProvinceProperties | null) => void
}

const VietnamMap = ({ setSelectedProvince }: VietnamMapProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    // Tạo bảng màu đa dạng cho các tỉnh
    const colorPalette = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FECA57',
      '#FF9FF3',
      '#54A0FF',
      '#5F27CD',
      '#00D2D3',
      '#FF9F43',
      '#FF6348',
      '#2ED573',
      '#747D8C',
      '#A4B0BE',
      '#57606F',
      '#3742FA',
      '#2F3542',
      '#FF3838',
      '#FF6B35',
      '#F8B500',
      '#78E08F',
      '#F8B500',
      '#6C5CE7',
      '#A29BFE',
      '#FD79A8',
      '#FDCB6E',
      '#E17055',
      '#00B894',
      '#00CEC9',
      '#0984E3',
      '#6C5CE7',
      '#A29BFE',
      '#FD79A8',
      '#FDCB6E',
      '#E17055',
      '#00B894',
      '#00CEC9',
      '#0984E3',
      '#74B9FF',
      '#81ECEC',
      '#FAB1A0',
      '#E84393',
      '#00B894',
      '#FDCB6E',
      '#6C5CE7',
      '#FF7675',
      '#74B9FF',
      '#00B894',
      '#FDCB6E',
      '#A29BFE',
      '#FD79A8',
      '#FDCB6E',
      '#55A3FF',
      '#26DE81',
      '#FD79A8',
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FECA57',
      '#FF9FF3',
      '#54A0FF',
      '#5F27CD',
      '#00D2D3',
      '#FF9F43'
    ]

    // Hàm lấy màu cho từng tỉnh dựa trên index
    const getProvinceColor = (provinceName: string): string => {
      // Sử dụng hash để tạo màu nhất quán cho cùng một tỉnh
      let hash = 0
      for (let i = 0; i < provinceName.length; i++) {
        const char = provinceName.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Convert to 32bit integer
      }

      // Sử dụng hash để chọn màu từ palette
      const colorIndex = Math.abs(hash) % colorPalette.length
      return colorPalette[colorIndex]
    }
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current as SVGSVGElement)
    const width = 400
    const height = 600

    // Clear previous content
    svg.selectAll('*').remove()

    // Tạo tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('padding', '8px 12px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', '1000')

    // Define projection for Vietnam
    const projection = d3
      .geoMercator()
      .center([107, 16])
      .scale(1500)
      .translate([width / 2, height / 2])

    const path = d3.geoPath().projection(projection)

    // Render provinces
    svg
      .selectAll('path')
      .data((geoJsonData as unknown as GeoJsonData).features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', (d: GeoJsonFeature) => {
        return getProvinceColor(d.properties.Name)
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('class', 'cursor-pointer transition-all duration-300')
      .style('opacity', 0.8)
      .on('mouseenter', function (this: SVGPathElement, event: MouseEvent, d: GeoJsonFeature) {
        d3.select(this).style('opacity', 1).attr('stroke-width', 2).attr('stroke', '#333')

        tooltip
          .style('opacity', 1)
          .html(`<div>${d.properties.Name}</div>`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px')
      })
      .on('mousemove', function (this: SVGPathElement, event: MouseEvent) {
        tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px')
      })
      .on('mouseleave', function (this: SVGPathElement) {
        d3.select(this).style('opacity', 0.8).attr('stroke-width', 1).attr('stroke', '#fff')

        tooltip.style('opacity', 0)
      })
      .on('click', function (this: SVGPathElement, _event: MouseEvent, d: GeoJsonFeature) {
        // Reset all provinces to their original colors
        svg
          .selectAll('path')
          .attr('fill', (d: GeoJsonFeature) => {
            return getProvinceColor(d.properties.Name)
          })
          .attr('stroke-width', 1)
          .attr('stroke', '#fff')

        // Highlight selected province
        d3.select(this)
          .attr('fill', '#FF1744') // Màu đỏ đậm cho tỉnh được chọn
          .attr('stroke-width', 3)
          .attr('stroke', '#333')

        setSelectedProvince(d.properties as ProvinceProperties)
      })

    // Add province labels
    svg
      .selectAll('.province-label')
      .data((geoJsonData as unknown as GeoJsonData).features)
      .enter()
      .append('text')
      .attr('class', 'province-label')
      .attr('x', (d: GeoJsonFeature) => path.centroid(d)[0])
      .attr('y', (d: GeoJsonFeature) => path.centroid(d)[1])
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1B5E20')
      .style('pointer-events', 'none')

    // Cleanup function
    return () => {
      tooltip.remove()
    }
  }, [setSelectedProvince])

  return (
    <div>
      <svg ref={svgRef} width='300' height='500' className='drop-shadow-lg mb-20'></svg>
    </div>
  )
}

export default VietnamMap
