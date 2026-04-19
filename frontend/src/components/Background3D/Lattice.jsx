import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Noise for subtle GAN-style morphing
function noise3D(x, y, z) {
  return (
    Math.sin(x * 1.2 + y * 0.9) * Math.cos(z * 0.8 + x * 0.6) * 0.5 +
    Math.sin(y * 1.5 + z * 1.1) * Math.cos(x * 0.7) * 0.3 +
    Math.sin(z * 1.3 + x * 0.5 + y * 0.4) * 0.2
  )
}

/* ---------- Glowing Node (sphere + ring halo) ---------- */
function LatticeNode({ position, color, size = 0.18 }) {
  const groupRef = useRef()
  const ringRef = useRef()
  const glowRef = useRef()

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.3
      ringRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.5
    }
    // Pulse the glow
    if (glowRef.current) {
      const pulse = 0.8 + Math.sin(clock.getElapsedTime() * 1.5 + position[0] * 2) * 0.2
      glowRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Inner glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 2.2, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Orbital ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[size * 2.5, size * 2.9, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Second ring — perpendicular */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.8, size * 2.1, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/* ---------- Main Lattice ---------- */
export default function Lattice({ isMobile = false }) {
  const groupRef = useRef()
  const linesRef = useRef()

  const nodeCount = isMobile ? 14 : 24

  // Generate icosahedral / spherical lattice positions
  const { nodes, edges, nodeColors } = useMemo(() => {
    const nodes = []
    const nodeColors = []

    const cyan = '#00e5ff'
    const purple = '#9333ea'
    const blue = '#3b82f6'
    const colorSet = [cyan, cyan, cyan, blue, blue, purple]

    // Layer 1: Inner core (small radius)
    const innerCount = isMobile ? 4 : 6
    const innerR = 1.2
    for (let i = 0; i < innerCount; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / innerCount)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      nodes.push([
        innerR * Math.sin(phi) * Math.cos(theta),
        innerR * Math.sin(phi) * Math.sin(theta),
        innerR * Math.cos(phi)
      ])
      nodeColors.push(cyan)
    }

    // Layer 2: Middle shell
    const midCount = isMobile ? 6 : 10
    const midR = 2.8
    for (let i = 0; i < midCount; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / midCount)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      nodes.push([
        midR * Math.sin(phi) * Math.cos(theta),
        midR * Math.sin(phi) * Math.sin(theta),
        midR * Math.cos(phi)
      ])
      nodeColors.push(colorSet[i % colorSet.length])
    }

    // Layer 3: Outer shell
    const outerCount = isMobile ? 4 : 8
    const outerR = 4.2
    for (let i = 0; i < outerCount; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / outerCount)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      nodes.push([
        outerR * Math.sin(phi) * Math.cos(theta),
        outerR * Math.sin(phi) * Math.sin(theta),
        outerR * Math.cos(phi)
      ])
      nodeColors.push(colorSet[(i + 2) % colorSet.length])
    }

    // Generate edges — connect nearby nodes
    const edges = []
    const maxDist = isMobile ? 3.2 : 3.0
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i][0] - nodes[j][0]
        const dy = nodes[i][1] - nodes[j][1]
        const dz = nodes[i][2] - nodes[j][2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist <= maxDist) {
          edges.push([i, j, dist])
        }
      }
    }

    return { nodes, edges, nodeColors }
  }, [isMobile])

  // Line positions buffer
  const linePositions = useMemo(() => {
    const arr = new Float32Array(edges.length * 6)
    edges.forEach(([a, b], i) => {
      arr[i * 6] = nodes[a][0]
      arr[i * 6 + 1] = nodes[a][1]
      arr[i * 6 + 2] = nodes[a][2]
      arr[i * 6 + 3] = nodes[b][0]
      arr[i * 6 + 4] = nodes[b][1]
      arr[i * 6 + 5] = nodes[b][2]
    })
    return arr
  }, [nodes, edges])

  // Store base positions for morphing
  const basePositions = useMemo(() => nodes.map(n => [...n]), [nodes])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()

    // Very slow rotation
    groupRef.current.rotation.y = t * 0.06
    groupRef.current.rotation.x = Math.sin(t * 0.03) * 0.12

    // GAN morphing — subtly shift node positions
    const morphStrength = 0.12
    const morphSpeed = 0.2

    // Update line endpoints based on morphed positions
    if (linesRef.current) {
      const linePos = linesRef.current.geometry.attributes.position.array
      const morphedNodes = basePositions.map(([bx, by, bz]) => {
        const n = noise3D(bx + t * morphSpeed, by + t * morphSpeed * 0.7, bz + t * morphSpeed * 0.5)
        return [
          bx + n * morphStrength,
          by + n * morphStrength * 0.8,
          bz + n * morphStrength * 0.6
        ]
      })

      edges.forEach(([a, b], i) => {
        linePos[i * 6] = morphedNodes[a][0]
        linePos[i * 6 + 1] = morphedNodes[a][1]
        linePos[i * 6 + 2] = morphedNodes[a][2]
        linePos[i * 6 + 3] = morphedNodes[b][0]
        linePos[i * 6 + 4] = morphedNodes[b][1]
        linePos[i * 6 + 5] = morphedNodes[b][2]
      })
      linesRef.current.geometry.attributes.position.needsUpdate = true

      // Also update node mesh positions
      groupRef.current.children.forEach((child, idx) => {
        if (idx < morphedNodes.length && child.isGroup) {
          child.position.set(
            morphedNodes[idx][0],
            morphedNodes[idx][1],
            morphedNodes[idx][2]
          )
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {/* Lattice nodes as full 3D glowing spheres */}
      {nodes.map((pos, i) => (
        <LatticeNode
          key={i}
          position={pos}
          color={nodeColors[i]}
          size={i < (isMobile ? 4 : 6) ? 0.12 : 0.16}
        />
      ))}

      {/* Connection lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={linePositions}
            count={edges.length * 2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Outer wireframe icosahedron */}
      <mesh>
        <icosahedronGeometry args={[5.0, 1]} />
        <meshBasicMaterial
          color="#00e5ff"
          wireframe
          transparent
          opacity={0.04}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
