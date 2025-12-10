import React, { useState, useRef, useEffect } from 'react';

const SwipeButton = ({ onConfirm }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sliderLeft, setSliderLeft] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const containerRef = useRef(null);
  const sliderRef = useRef(null);

  const startX = useRef(0);

  // Xử lý khi bắt đầu kéo (Chuột hoặc Cảm ứng)
  const handleStart = (e) => {
    if (confirmed) return;
    setIsDragging(true);
    // Lấy toạ độ X ban đầu (hỗ trợ cả mobile touch và PC mouse)
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
  };

  // Xử lý khi đang kéo
  const handleMove = (e) => {
    if (!isDragging || confirmed) return;

    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const containerWidth = containerRef.current.clientWidth;
    const sliderWidth = sliderRef.current.clientWidth;
    const maxDrag = containerWidth - sliderWidth; // Quãng đường tối đa kéo được

    // Tính toán vị trí mới
    let newLeft = currentX - startX.current;

    // Giới hạn không cho kéo ra ngoài khung
    if (newLeft < 0) newLeft = 0;
    if (newLeft > maxDrag) newLeft = maxDrag;

    setSliderLeft(newLeft);
  };

  // Xử lý khi thả tay ra
  const handleEnd = () => {
    if (!isDragging || confirmed) return;
    setIsDragging(false);

    const containerWidth = containerRef.current.clientWidth;
    const sliderWidth = sliderRef.current.clientWidth;
    const maxDrag = containerWidth - sliderWidth;

    // Nếu kéo được hơn 90% quãng đường -> Xác nhận
    if (sliderLeft >= maxDrag * 0.9) {
      setSliderLeft(maxDrag);
      setConfirmed(true);
      if (onConfirm) onConfirm();
    } else {
      // Nếu chưa đủ -> Trượt về vị trí cũ
      setSliderLeft(0);
    }
  };

  // Lắng nghe sự kiện nhả chuột/touch toàn màn hình để tránh lỗi bị kẹt khi kéo ra ngoài div
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('touchmove', handleMove);
    } else {
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
    }
    return () => {
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
    };
  }, [isDragging, sliderLeft]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '50px',
        backgroundColor: '#E0E0E0', // Màu nền xám
        borderRadius: '25px',
        userSelect: 'none',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      {/* Text hướng dẫn (nằm dưới nút trượt) */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: confirmed ? '#4CAF50' : '#666',
          fontWeight: 'bold',
          zIndex: 1,
          transition: 'opacity 0.3s'
        }}
      >
        {confirmed ? "ĐÃ XÁC NHẬN" : "Trượt để đặt hàng >>"}
      </div>

      {/* Nút trượt (Slider) */}
      <div
        ref={sliderRef}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        style={{
          position: 'absolute',
          left: sliderLeft, // Vị trí thay đổi theo state
          top: 0,
          width: '50px',
          height: '50px',
          backgroundColor: '#4CAF50', // Màu xanh lá giống design
          borderRadius: '50%',
          cursor: 'pointer',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          transition: isDragging ? 'none' : 'left 0.3s ease' // Animation mượt khi thả tay
        }}
      >
        {/* Icon mũi tên hoặc checkmark */}
        {confirmed ? (
          <span style={{ color: 'white', fontSize: '20px' }}>✓</span>
        ) : (
          <span style={{ color: 'white', fontSize: '20px' }}>➜</span>
        )}
      </div>

      {/* Màu nền xanh chạy theo nút (Progress bar) */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: sliderLeft + 25, // +25 là bán kính nút để lấp đầy
        backgroundColor: '#A5D6A7', // Màu xanh nhạt phía sau
        borderRadius: '25px 0 0 25px',
        zIndex: 0
      }} />
    </div>
  );
};

export default SwipeButton;