import React from 'react'
import Particles from './Particles'
import Lattice from './Lattice'

export default function Scene({ isMobile = false }) {
  return (
    <>
      {/* Lighting — moody and atmospheric */}
      <ambientLight intensity={0.12} />

      {/* Key cyan light from front-right */}
      <pointLight position={[6, 4, 6]} intensity={0.6} color="#00e5ff" distance={20} />

      {/* Purple fill from back-left */}
      <pointLight position={[-5, -2, -5]} intensity={0.4} color="#9333ea" distance={18} />

      {/* Blue rim light from top */}
      <pointLight position={[0, 8, 2]} intensity={0.3} color="#3b82f6" distance={16} />

      {/* Subtle warm from below-right */}
      <pointLight position={[4, -6, 3]} intensity={0.15} color="#00d4a4" distance={14} />

      {/* Fog for depth layering */}
      <fog attach="fog" args={['#020818', 8, 26]} />

      {/* Main elements */}
      <Lattice isMobile={isMobile} />
      <Particles isMobile={isMobile} />
    </>
  )
}
