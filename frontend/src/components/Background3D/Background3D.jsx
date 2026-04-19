import React, { Suspense, lazy, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import './Background3D.css'

const Scene = lazy(() => import('./Scene'))

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

export default function Background3D() {
  const isMobile = useIsMobile()
  const prefersReducedMotion = usePrefersReducedMotion()

  // On mobile with reduced motion, skip the 3D entirely
  if (isMobile && prefersReducedMotion) {
    return <div className="bg3d-static-fallback" />
  }

  return (
    <div className="bg3d-container" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 50 }}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
        frameloop={prefersReducedMotion ? 'demand' : 'always'}
      >
        <Suspense fallback={null}>
          <Scene isMobile={isMobile} />
        </Suspense>
      </Canvas>
      {/* Dark overlay for readability */}
      <div className="bg3d-overlay" />
    </div>
  )
}
