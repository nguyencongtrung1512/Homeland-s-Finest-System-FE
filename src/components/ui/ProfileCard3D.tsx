import { useEffect, useRef, useState } from 'react'
import { Canvas, extend, useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RigidBodyProps
} from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import * as THREE from 'three'
import type { User } from '../../apis/user.api'

extend({ MeshLineGeometry, MeshLineMaterial })

interface ProfileCard3DProps {
  user: User | null
  position?: [number, number, number]
  gravity?: [number, number, number]
  fov?: number
  transparent?: boolean
  className?: string
}

export default function ProfileCard3D({
  user,
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  className = ''
}: ProfileCard3DProps) {
  if (!user) {
    return (
      <div className={`relative z-0 w-full h-[600px] flex justify-center items-center ${className}`}>
        <div className='text-gray-500'>Đang tải thông tin...</div>
      </div>
    )
  }

  return (
    <div
      className={`relative z-0 w-full h-[600px] flex justify-center items-center transform scale-100 origin-center ${className}`}
    >
      <Canvas
        camera={{ position, fov }}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={1 / 60}>
          <Band user={user} />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color='white'
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color='white'
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color='white'
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color='white'
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  )
}

interface BandProps {
  user: User
  maxSpeed?: number
  minSpeed?: number
}

function Band({ user, maxSpeed = 50, minSpeed = 0 }: BandProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const band = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fixed = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j1 = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j2 = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j3 = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const card = useRef<any>(null)

  const vec = new THREE.Vector3()
  const ang = new THREE.Vector3()
  const rot = new THREE.Vector3()
  const dir = new THREE.Vector3()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const segmentProps: any = {
    type: 'dynamic' as RigidBodyProps['type'],
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4
  }

  // Tạo texture cho dây lanyard với chữ "tinh hoa quê nhà"
  const [texture] = useState(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Tạo gradient màu trắng với pattern
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
      gradient.addColorStop(0, '#ffffff')
      gradient.addColorStop(0.5, '#f0f0f0')
      gradient.addColorStop(1, '#ffffff')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Thêm pattern nhỏ
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      for (let i = 0; i < canvas.width; i += 8) {
        ctx.fillRect(i, 0, 2, canvas.height)
      }

      // Thêm chữ "TINH HOA QUÊ NHÀ"
      ctx.fillStyle = '#059669'
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const text = 'TINH HOA QUÊ NHÀ'
      ctx.fillText(text, canvas.width / 2, canvas.height / 2)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    return tex
  })

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  )
  const [dragged, drag] = useState<false | THREE.Vector3>(false)
  const [hovered, hover] = useState(false)

  const [isSmall, setIsSmall] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false
  })

  useEffect(() => {
    const handleResize = (): void => {
      setIsSmall(window.innerWidth < 1024)
    }

    window.addEventListener('resize', handleResize)
    return (): void => window.removeEventListener('resize', handleResize)
  }, [])

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0]
  ])

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab'
      return () => {
        document.body.style.cursor = 'auto'
      }
    }
  }, [hovered, dragged])

  useFrame((state, delta) => {
    if (dragged && typeof dragged !== 'boolean') {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      const refs = [card, j1, j2, j3, fixed]
      refs.forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z
      })
    }
    if (fixed.current) {
      const jointRefs = [j1, j2]
      jointRefs.forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())))
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)))
      })
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.lerped)
      curve.points[2].copy(j1.current.lerped)
      curve.points[3].copy(fixed.current.translation())
      band.current.geometry.setPoints(curve.getPoints(32))
      ang.copy(card.current.angvel())
      rot.copy(card.current.rotation())
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })
    }
  })

  curve.curveType = 'chordal'
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  // Tạo texture cho card từ thông tin user
  const cardTexture = useRef<THREE.CanvasTexture | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null)
  const [textureReady, setTextureReady] = useState(false)
  const [textureKey, setTextureKey] = useState(0)

  useEffect(() => {
    // Hàm vẽ toàn bộ card
    const drawCard = (avatarImage: HTMLImageElement | null = null) => {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas')
        canvasRef.current.width = 1408
        canvasRef.current.height = 800
      }
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#059669')
      gradient.addColorStop(1, '#047857')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Pattern overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      for (let i = 0; i < 20; i++) {
        ctx.fillRect(i * 50, 0, 2, canvas.height)
        ctx.fillRect(0, i * 30, canvas.width, 2)
      }

      // Vẽ avatar - tăng kích thước
      const avatarX = 200
      const avatarY = 200
      const avatarRadius = 120
      if (avatarImage && avatarImage.complete && avatarImage.naturalWidth > 0) {
        // Vẽ avatar từ image đã load
        try {
          ctx.save()
          ctx.beginPath()
          ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(avatarImage, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2)
          ctx.restore()
        } catch (error) {
          console.warn('Lỗi khi vẽ avatar:', error)
          // Fallback về avatar mặc định
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#059669'
          ctx.font = 'bold 120px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
          ctx.fillText(initials, avatarX, avatarY)
        }
      } else {
        // Default avatar (initials)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#059669'
        ctx.font = 'bold 120px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
        ctx.fillText(initials, avatarX, avatarY)
      }

      // Tên - Tăng font size và điều chỉnh vị trí
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 96px Arial'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Người dùng'
      ctx.fillText(fullName, 400, 120)

      // Email - Tăng font size
      ctx.fillStyle = '#e5e7eb'
      ctx.font = '54px Arial'
      ctx.fillText(user.email || '', 400, 240)

      // Phone - Tăng font size
      if (user.phoneNumber) {
        ctx.font = '54px Arial'
        ctx.fillText(`Điện thoại: ${user.phoneNumber}`, 400, 320)
      }

      // Gender và Date of Birth - Tăng font size
      if (user.gender || user.dateOfBirth) {
        let infoY = 400
        ctx.font = '48px Arial'
        if (user.gender) {
          const genderText = user.gender === 'Male' ? 'Nam' : user.gender === 'Female' ? 'Nữ' : user.gender
          ctx.fillText(`Giới tính: ${genderText}`, 400, infoY)
          infoY += 80
        }
        if (user.dateOfBirth) {
          const dob = new Date(user.dateOfBirth).toLocaleDateString('vi-VN')
          ctx.fillText(`Ngày sinh: ${dob}`, 400, infoY)
        }
      }

      // User Point - Tăng font size
      if (user.userPoint !== undefined) {
        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 66px Arial'
        ctx.fillText(`Điểm: ${user.userPoint.toLocaleString('vi-VN')} điểm`, 400, 580)
      }

      // Border
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

      // Tạo hoặc update texture
      if (!cardTexture.current) {
        cardTexture.current = new THREE.CanvasTexture(canvas)
        cardTexture.current.anisotropy = 16
        cardTexture.current.needsUpdate = true
        setTextureReady(true)
        setTextureKey((prev) => prev + 1)
        console.log('Texture được tạo với canvas:', canvas.width, 'x', canvas.height)
      } else {
        // Update texture từ canvas mới - tạo texture mới để đảm bảo update
        const oldTexture = cardTexture.current
        cardTexture.current = new THREE.CanvasTexture(canvas)
        cardTexture.current.anisotropy = 16
        cardTexture.current.needsUpdate = true
        // Dispose texture cũ
        oldTexture.dispose()
        setTextureKey((prev) => prev + 1)
        console.log('Texture được update với canvas mới')
      }

      // Force update material nếu có
      if (materialRef.current && cardTexture.current) {
        materialRef.current.map = cardTexture.current
        materialRef.current.needsUpdate = true
      }
    }

    // URL ảnh mặc định
    const defaultAvatarUrl = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

    // Hàm load avatar với fallback
    const loadAvatarWithFallback = (avatarUrl: string | null) => {
      if (!avatarUrl) {
        // Nếu không có avatar, load default
        loadDefaultAvatar()
        return
      }

      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        // Vẽ lại card với avatar đã load
        drawCard(img)
        // Force update để đảm bảo texture được render
        if (cardTexture.current) {
          cardTexture.current.needsUpdate = true
        }
      }

      img.onerror = () => {
        // Nếu load thất bại, load ảnh default
        console.warn('Không thể load avatar, sử dụng ảnh mặc định')
        loadDefaultAvatar()
      }

      // Thử load ảnh
      try {
        img.src = avatarUrl
      } catch (error) {
        console.warn('Lỗi khi set src cho avatar:', error)
        loadDefaultAvatar()
      }
    }

    // Hàm load ảnh mặc định
    const loadDefaultAvatar = () => {
      console.log('Bắt đầu load ảnh mặc định từ:', defaultAvatarUrl)
      const defaultImg = new Image()
      defaultImg.crossOrigin = 'anonymous'

      defaultImg.onload = () => {
        console.log('Ảnh mặc định đã load thành công:', defaultImg.width, 'x', defaultImg.height)
        // Vẽ lại card với ảnh mặc định
        drawCard(defaultImg)
        if (cardTexture.current) {
          cardTexture.current.needsUpdate = true
          setTextureKey((prev) => prev + 1)
        }
      }

      defaultImg.onerror = (error) => {
        // Nếu cả ảnh default cũng không load được, dùng initials
        console.warn('Không thể load ảnh mặc định, sử dụng initials', error)
        drawCard(null)
        if (cardTexture.current) {
          cardTexture.current.needsUpdate = true
          setTextureKey((prev) => prev + 1)
        }
      }

      try {
        defaultImg.src = defaultAvatarUrl
        console.log('Đã set src cho ảnh mặc định')
      } catch (error) {
        console.warn('Lỗi khi set src cho ảnh mặc định:', error)
        // Fallback về initials
        drawCard(null)
        if (cardTexture.current) {
          cardTexture.current.needsUpdate = true
          setTextureKey((prev) => prev + 1)
        }
      }
    }

    // Vẽ card với avatar mặc định (initials) trước để hiển thị ngay
    drawCard()

    // Đảm bảo texture được tạo và ready
    if (cardTexture.current) {
      const textureSize = cardTexture.current.image
        ? `${cardTexture.current.image.width}x${cardTexture.current.image.height}`
        : 'no image'
      console.log('Card đã được vẽ, texture sẵn sàng:', {
        hasTexture: !!cardTexture.current,
        textureSize
      })
    }

    // Load avatar nếu có, nếu không thì load default
    if (user.avatar) {
      loadAvatarWithFallback(user.avatar)
    } else {
      loadDefaultAvatar()
    }

    // Cleanup function
    return () => {
      if (cardTexture.current) {
        // Không dispose texture ở đây vì có thể cần dùng lại
      }
    }
  }, [user])

  return (
    <>
      <group position={[0, 5, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type={'fixed' as RigidBodyProps['type']} />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps} type={'dynamic' as RigidBodyProps['type']}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps} type={'dynamic' as RigidBodyProps['type']}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps} type={'dynamic' as RigidBodyProps['type']}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[1.5, 1.5, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? ('kinematicPosition' as RigidBodyProps['type']) : ('dynamic' as RigidBodyProps['type'])}
        >
          <CuboidCollider args={[1.2, 1.7, 0.01]} />
          <group
            scale={3.5}
            position={[0, 0, -0.05]}
            rotation={[0, 0, 0]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPointerUp={(e: any) => {
              e.target.releasePointerCapture(e.pointerId)
              drag(false)
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPointerDown={(e: any) => {
              e.target.setPointerCapture(e.pointerId)
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            }}
          >
            <mesh key={`card-${textureKey}`}>
              <planeGeometry args={[2.2, 1.25]} />
              <meshPhysicalMaterial
                ref={materialRef}
                map={textureReady && cardTexture.current ? cardTexture.current : undefined}
                color={textureReady && cardTexture.current ? undefined : '#059669'}
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        {/* @ts-expect-error - MeshLineGeometry is extended via extend() */}
        <meshLineGeometry />
        {/* @ts-expect-error - MeshLineMaterial is extended via extend() */}
        <meshLineMaterial
          color='white'
          depthTest={false}
          resolution={isSmall ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-2, 1]}
          lineWidth={2}
        />
      </mesh>
    </>
  )
}
