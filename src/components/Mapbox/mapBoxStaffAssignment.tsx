import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Staff } from '../../apis/admin.api'
import type { StoreResponse } from '../../apis/store.api'

interface MapBoxStaffAssignmentProps {
  store: StoreResponse | null
  staffList: Staff[]
  selectedStaffId?: string | null
  onStaffSelect?: (staffId: string) => void
  storeLat?: number | null
  storeLng?: number | null
}

const MapBoxStaffAssignment: React.FC<MapBoxStaffAssignmentProps> = ({
  store,
  staffList,
  selectedStaffId,
  onStaffSelect,
  storeLat,
  storeLng
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const popupsRef = useRef<{ [key: string]: mapboxgl.Popup }>({})
  const markerElementsRef = useRef<{ [key: string]: HTMLDivElement }>({})
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Khởi tạo map
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

    if (!mapboxToken) {
      console.error('❌ Mapbox access token không được tìm thấy!')
      return
    }

    mapboxgl.accessToken = mapboxToken

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [105.8542, 21.0285],
        zoom: 5
      })

      map.current.on('load', () => {
        console.log('✅ Mapbox map đã load thành công!')
        map.current?.resize()
        setIsMapLoaded(true)
      })

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

      if (map.current.isStyleLoaded()) {
        setIsMapLoaded(true)
      }
    } catch (error) {
      console.error('❌ Lỗi khi khởi tạo Mapbox:', error)
    }

    return () => {
      Object.values(markersRef.current).forEach((marker) => marker.remove())
      markersRef.current = {}
      Object.values(popupsRef.current).forEach((popup) => popup.remove())
      popupsRef.current = {}
      markerElementsRef.current = {}

      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Thêm marker cho cửa hàng
  useEffect(() => {
    if (!map.current || !isMapLoaded || !store) return

    if (markersRef.current['store']) {
      markersRef.current['store'].remove()
      delete markersRef.current['store']
      delete markerElementsRef.current['store']
    }
    if (popupsRef.current['store']) {
      popupsRef.current['store'].remove()
      delete popupsRef.current['store']
    }

    if (storeLat != null && storeLng != null) {
      const el = document.createElement('div')
      el.className = 'store-marker'
      el.style.width = '40px'
      el.style.height = '40px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = '#22c55e'
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
      el.style.cursor = 'pointer'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.position = 'absolute'
      el.style.pointerEvents = 'auto'

      el.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
          <path d="M9 22v-4h6v4"/>
          <path d="M8 6h.01"/>
          <path d="M16 6h.01"/>
          <path d="M12 6h.01"/>
          <path d="M12 10h.01"/>
          <path d="M12 14h.01"/>
          <path d="M16 10h.01"/>
          <path d="M16 14h.01"/>
          <path d="M8 10h.01"/>
          <path d="M8 14h.01"/>
        </svg>
      `

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat([storeLng, storeLat])
        .addTo(map.current!)

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
        .setHTML(`
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">Vị trí cửa hàng:</h3>
            <p style="margin: 0; font-size: 13px; font-weight: 500;">${store.storeName}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${store.address || ''}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${store.province || ''}</p>
          </div>
        `)

      marker.setPopup(popup)
      markersRef.current['store'] = marker
      markerElementsRef.current['store'] = el
      popupsRef.current['store'] = popup
    }
  }, [store, storeLat, storeLng, isMapLoaded])

  // Thêm marker cho tất cả nhân viên
  useEffect(() => {
    if (!map.current || !isMapLoaded || !staffList || staffList.length === 0) return

    Object.keys(markersRef.current).forEach((key) => {
      if (key.startsWith('staff-')) {
        markersRef.current[key].remove()
        delete markersRef.current[key]
        delete markerElementsRef.current[key]
      }
    })
    Object.keys(popupsRef.current).forEach((key) => {
      if (key.startsWith('staff-')) {
        popupsRef.current[key].remove()
        delete popupsRef.current[key]
      }
    })

    staffList.forEach((staff) => {
      if (staff.lat != null && staff.lng != null && staff.staffId) {
        const el = document.createElement('div')
        el.className = 'staff-marker'
        const isSelected = selectedStaffId === staff.staffId
        el.style.width = isSelected ? '44px' : '36px'
        el.style.height = isSelected ? '44px' : '36px'
        el.style.borderRadius = '50%'
        el.style.backgroundColor = staff.isRecommended ? '#8b5cf6' : '#a855f7'
        el.style.border = isSelected ? '4px solid #fbbf24' : '3px solid white'
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
        el.style.cursor = 'pointer'
        el.style.display = 'flex'
        el.style.alignItems = 'center'
        el.style.justifyContent = 'center'
        el.style.transition = 'all 0.2s ease'
        el.style.position = 'absolute'
        el.style.pointerEvents = 'auto'

        el.innerHTML = `
          <svg width="${isSelected ? '22' : '18'}" height="${isSelected ? '22' : '18'}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        `

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat([staff.lng, staff.lat])
          .addTo(map.current!)

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
          .setHTML(`
            <div style="padding: 8px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #8b5cf6; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px;">
                  ${staff.staffName?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  <h3 style="margin: 0; font-size: 14px; font-weight: 600;">${staff.staffName || 'Nhân viên'}</h3>
                  ${staff.isRecommended ? '<span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;">Đề xuất</span>' : ''}
                </div>
              </div>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">${staff.email || ''}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
                <strong>Province:</strong> ${staff.provinceName || 'N/A'}
              </p>
            </div>
          `)

        marker.setPopup(popup)

        el.addEventListener('click', () => {
          if (onStaffSelect) {
            onStaffSelect(staff.staffId)
          }
        })

        markersRef.current[`staff-${staff.staffId}`] = marker
        markerElementsRef.current[`staff-${staff.staffId}`] = el
        popupsRef.current[`staff-${staff.staffId}`] = popup
      }
    })
  }, [staffList, isMapLoaded, selectedStaffId, onStaffSelect])

  // Fit bounds chỉ lần đầu tiên
  useEffect(() => {
    if (!map.current || !isMapLoaded) return

    const bounds = new mapboxgl.LngLatBounds()

    if (storeLat != null && storeLng != null) {
      bounds.extend([storeLng, storeLat])
    }

    staffList.forEach((staff) => {
      if (staff.lat != null && staff.lng != null) {
        bounds.extend([staff.lng, staff.lat])
      }
    })

    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 10,
        duration: 1000
      })
    } else {
      map.current.setCenter([105.8542, 21.0285])
      map.current.setZoom(5)
    }
  }, [isMapLoaded])

  // Fly to marker khi selectedStaffId thay đổi
  useEffect(() => {
    if (!map.current || !isMapLoaded || !selectedStaffId) return

    const staff = staffList.find((s) => s.staffId === selectedStaffId)
    if (staff && staff.lat != null && staff.lng != null) {
      map.current.flyTo({
        center: [staff.lng, staff.lat],
        zoom: 8,
        duration: 1000
      })

      const marker = markersRef.current[`staff-${staff.staffId}`]
      if (marker && popupsRef.current[`staff-${staff.staffId}`]) {
        marker.togglePopup()
      }
    }
  }, [selectedStaffId, staffList, isMapLoaded])

  return (
    <div className='w-full h-full relative'>
      <div ref={mapContainer} className='w-full h-full rounded-lg' style={{ minHeight: '400px' }} />
      {!isMapLoaded && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg'>
          <div className='flex items-center gap-2 text-gray-600'>
            <div className='w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
            <span className='text-sm'>Đang tải bản đồ...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapBoxStaffAssignment