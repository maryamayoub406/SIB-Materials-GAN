import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const DESKTOP_COUNT = 4000
const MOBILE_COUNT = 1000

export default function Particles({ isMobile = false }) {
  const ambientRef = useRef()
  const streamRef = useRef()

  const count = isMobile ? MOBILE_COUNT : DESKTOP_COUNT
  const streamCount = isMobile ? 600 : 1500

  /* ---- Ambient scattered particles ---- */
  const ambient = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    const cyan = new THREE.Color('#00e5ff')
    const purple = new THREE.Color('#9333ea')
    const blue = new THREE.Color('#3b82f6')

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 2 + Math.random() * 14

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      const t = Math.random()
      const color = t < 0.5
        ? cyan.clone().lerp(blue, t * 2)
        : blue.clone().lerp(purple, (t - 0.5) * 2)

      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = 0.02 + Math.random() * 0.04
    }

    return { positions, colors, sizes }
  }, [count])

  /* ---- Flowing stream particles (diagonal flow like reference) ---- */
  const stream = useMemo(() => {
    const positions = new Float32Array(streamCount * 3)
    const colors = new Float32Array(streamCount * 3)
    const speeds = new Float32Array(streamCount)
    const offsets = new Float32Array(streamCount)

    const cyan = new THREE.Color('#00e5ff')
    const teal = new THREE.Color('#00d4a4')

    for (let i = 0; i < streamCount; i++) {
      // Diagonal band from upper-left to lower-right
      const t = Math.random()
      const spread = 3.0

      positions[i * 3] = -8 + t * 20 + (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = 5 - t * 12 + (Math.random() - 0.5) * spread
      positions[i * 3 + 2] = -3 + (Math.random() - 0.5) * 6

      const color = cyan.clone().lerp(teal, Math.random())
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      speeds[i] = 0.3 + Math.random() * 0.6
      offsets[i] = Math.random() * Math.PI * 2
    }

    return { positions, colors, speeds, offsets }
  }, [streamCount])

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    // Ambient — gentle drift
    if (ambientRef.current) {
      const pos = ambientRef.current.geometry.attributes.position.array
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        pos[i3] += Math.sin(time * 0.08 + i * 0.01) * 0.002
        pos[i3 + 1] += Math.cos(time * 0.06 + i * 0.013) * 0.0015
        pos[i3 + 2] += Math.sin(time * 0.05 + i * 0.007) * 0.002
      }
      ambientRef.current.geometry.attributes.position.needsUpdate = true
    }

    // Stream — flowing diagonal motion
    if (streamRef.current) {
      const pos = streamRef.current.geometry.attributes.position.array
      for (let i = 0; i < streamCount; i++) {
        const i3 = i * 3
        const speed = stream.speeds[i]
        const offset = stream.offsets[i]

        // Flow diagonally
        pos[i3] += speed * 0.008
        pos[i3 + 1] -= speed * 0.005

        // Add undulation
        pos[i3 + 1] += Math.sin(time * speed + offset) * 0.003
        pos[i3 + 2] += Math.cos(time * speed * 0.5 + offset) * 0.002

        // Wrap around when going off screen
        if (pos[i3] > 14) {
          pos[i3] = -10 + Math.random() * 2
          pos[i3 + 1] = 4 + Math.random() * 4
          pos[i3 + 2] = -3 + Math.random() * 6
        }
      }
      streamRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <>
      {/* Ambient scattered particles */}
      <points ref={ambientRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={ambient.positions}
            count={count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={ambient.colors}
            count={count}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Flowing stream particles */}
      <points ref={streamRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={stream.positions}
            count={streamCount}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={stream.colors}
            count={streamCount}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isMobile ? 0.05 : 0.045}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  )
}
