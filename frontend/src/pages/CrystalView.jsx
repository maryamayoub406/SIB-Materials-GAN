import React, { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Line, Html, Stars } from '@react-three/drei'
import { motion } from 'framer-motion'
import { SectionHeader } from '../components/UI.jsx'
import * as THREE from 'three'

// Element color + radius database (CPK coloring)
const ELEMENT_PROPS = {
  Na: { color: '#ab5cf2', radius: 0.55, label: 'Sodium' },
  Fe: { color: '#e06633', radius: 0.45, label: 'Iron' },
  Mn: { color: '#9c7ac7', radius: 0.46, label: 'Manganese' },
  Co: { color: '#f090a0', radius: 0.44, label: 'Cobalt' },
  Ni: { color: '#50d050', radius: 0.44, label: 'Nickel' },
  V: { color: '#a6a6ab', radius: 0.41, label: 'Vanadium' },
  O: { color: '#ff4c4c', radius: 0.30, label: 'Oxygen' },
  P: { color: '#ff8000', radius: 0.36, label: 'Phosphorus' },
  Ti: { color: '#bfc2c7', radius: 0.48, label: 'Titanium' },
  Al: { color: '#bfa6a6', radius: 0.40, label: 'Aluminium' },
  Cr: { color: '#8a99c7', radius: 0.43, label: 'Chromium' },
  F: { color: '#90e050', radius: 0.25, label: 'Fluorine' },
  Li: { color: '#cc80ff', radius: 0.50, label: 'Lithium' },
  Zr: { color: '#c7c761', radius: 0.49, label: 'Zirconium' },
}

// Pre-built crystal structures
const CRYSTAL_STRUCTURES = {
  NaFeO2: {
    name: 'NaFeO2 — Layered Oxide',
    atoms: [
      { elem: 'Na', pos: [0, 0, 0] },
      { elem: 'Na', pos: [2, 0, 0] },
      { elem: 'Na', pos: [0, 2, 0] },
      { elem: 'Na', pos: [2, 2, 0] },
      { elem: 'Fe', pos: [1, 1, 1.5] },
      { elem: 'Fe', pos: [1, 3, 1.5] },
      { elem: 'Fe', pos: [3, 1, 1.5] },
      { elem: 'Fe', pos: [3, 3, 1.5] },
      { elem: 'O', pos: [0.5, 0.5, 0.8] },
      { elem: 'O', pos: [1.5, 0.5, 0.8] },
      { elem: 'O', pos: [0.5, 1.5, 0.8] },
      { elem: 'O', pos: [1.5, 1.5, 0.8] },
      { elem: 'O', pos: [0.5, 0.5, 2.2] },
      { elem: 'O', pos: [1.5, 0.5, 2.2] },
      { elem: 'O', pos: [0.5, 1.5, 2.2] },
      { elem: 'O', pos: [1.5, 1.5, 2.2] },
    ],
    bonds: [[0, 4], [1, 4], [2, 4], [1, 5], [2, 5], [3, 5], [0, 8], [1, 9], [4, 8], [4, 10]],
    lattice: { a: 2.9, b: 2.9, c: 3.1, alpha: 90, beta: 90, gamma: 120 },
    spaceGroup: 'R-3m',
  },
  Na3V2PO43: {
    name: 'Na₃V₂(PO₄)₃ — NASICON',
    atoms: [
      { elem: 'Na', pos: [0, 0, 0] },
      { elem: 'Na', pos: [2, 0, 0] },
      { elem: 'Na', pos: [1, 1.7, 0] },
      { elem: 'V', pos: [1, 0.57, 1.5] },
      { elem: 'V', pos: [1, -0.57, -1.5] },
      { elem: 'P', pos: [0, 1.7, 1.0] },
      { elem: 'P', pos: [2, 1.7, -1.0] },
      { elem: 'O', pos: [0.5, 1.1, 1.3] },
      { elem: 'O', pos: [0, 2.4, 1.3] },
      { elem: 'O', pos: [1.5, 1.4, 0.8] },
      { elem: 'O', pos: [0.7, 2.0, 0.5] },
      { elem: 'O', pos: [1.5, 0.3, 1.8] },
      { elem: 'O', pos: [0.5, 0.8, 2.0] },
    ],
    bonds: [[3, 7], [3, 9], [3, 11], [4, 8], [4, 10], [5, 7], [5, 8], [5, 9], [6, 10], [6, 11]],
    lattice: { a: 8.7, b: 8.7, c: 21.8, alpha: 90, beta: 90, gamma: 120 },
    spaceGroup: 'R-3c',
  },
  NaCoO2: {
    name: 'NaCoO2 — Layered',
    atoms: [
      { elem: 'Na', pos: [0, 0, 0] },
      { elem: 'Na', pos: [2, 0, 0] },
      { elem: 'Na', pos: [1, 1.73, 0] },
      { elem: 'Co', pos: [1, 0.58, 1.6] },
      { elem: 'Co', pos: [1, -0.58, -1.6] },
      { elem: 'O', pos: [0.4, 0.2, 0.9] },
      { elem: 'O', pos: [1.6, 0.2, 0.9] },
      { elem: 'O', pos: [1, 1.2, 0.9] },
      { elem: 'O', pos: [0.4, 0.2, 2.3] },
      { elem: 'O', pos: [1.6, 0.2, 2.3] },
    ],
    bonds: [[3, 5], [3, 6], [3, 7], [4, 8], [4, 9], [0, 5], [1, 6], [2, 7]],
    lattice: { a: 2.8, b: 2.8, c: 10.7, alpha: 90, beta: 90, gamma: 120 },
    spaceGroup: 'R-3m',
  },
}

function AtomSphere({ elem, position, onClick, hovered, setHovered }) {
  const ep = ELEMENT_PROPS[elem] ?? { color: '#888', radius: 0.35, label: elem }
  const ref = useRef()
  const isHov = hovered === `${elem}-${position.join(',')}`

  useFrame(() => {
    if (ref.current) {
      ref.current.scale.setScalar(isHov ? 1.25 : 1.0)
    }
  })

  return (
    <group position={position.map(v => v - 1)}>
      <Sphere ref={ref} args={[ep.radius * 0.65, 24, 24]}
        onClick={() => onClick({ elem, position, ...ep })}
        onPointerOver={() => setHovered(`${elem}-${position.join(',')}`)}
        onPointerOut={() => setHovered(null)}
      >
        <meshStandardMaterial
          color={ep.color}
          roughness={0.25}
          metalness={0.4}
          emissive={isHov ? ep.color : '#000'}
          emissiveIntensity={isHov ? 0.4 : 0}
        />
      </Sphere>
      {isHov && (
        <Html distanceFactor={8}>
          <div style={{
            background: 'rgba(10,22,40,0.95)',
            border: '1px solid rgba(0,212,164,0.5)',
            borderRadius: 8, padding: '5px 10px',
            fontSize: 12, color: '#e8f4f8', whiteSpace: 'nowrap',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {elem} — {ep.label}
          </div>
        </Html>
      )}
    </group>
  )
}

function BondLine({ start, end }) {
  const s = start.map(v => v - 1)
  const e = end.map(v => v - 1)
  return (
    <Line
      points={[s, e]}
      color="rgba(0,212,164,0.35)"
      lineWidth={1.5}
    />
  )
}

function RotatingGroup({ children, autoRotate }) {
  const ref = useRef()
  useFrame((_, delta) => {
    if (autoRotate && ref.current) {
      ref.current.rotation.y += delta * 0.3
    }
  })
  return <group ref={ref}>{children}</group>
}

function CrystalScene({ structure, autoRotate, onAtomClick, hovered, setHovered }) {
  const { atoms, bonds } = structure

  return (
    <>
      <Stars radius={80} depth={40} count={1500} factor={4} fade />
      <ambientLight intensity={0.5} />
      <pointLight position={[8, 8, 8]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-8, -8, 8]} intensity={0.8} color="#00d4a4" />
      <pointLight position={[0, 8, -8]} intensity={0.6} color="#3b82f6" />

      <RotatingGroup autoRotate={autoRotate}>
        {/* Atoms */}
        {atoms.map((a, i) => (
          <AtomSphere key={i} elem={a.elem} position={a.pos}
            onClick={onAtomClick} hovered={hovered} setHovered={setHovered} />
        ))}
        {/* Bonds */}
        {bonds?.map(([i, j], k) => atoms[i] && atoms[j] && (
          <BondLine key={k} start={atoms[i].pos} end={atoms[j].pos} />
        ))}
      </RotatingGroup>

      <OrbitControls enableDamping dampingFactor={0.08} minDistance={4} maxDistance={25} />
    </>
  )
}

export default function CrystalView() {
  const [selected, setSelected] = useState('NaFeO2')
  const [autoRotate, setAutoRotate] = useState(true)
  const [clickedAtom, setClickedAtom] = useState(null)
  const [hovered, setHovered] = useState(null)

  const structure = CRYSTAL_STRUCTURES[selected]

  const elementCounts = useMemo(() => {
    const counts = {}
    structure.atoms.forEach(a => { counts[a.elem] = (counts[a.elem] || 0) + 1 })
    return counts
  }, [selected])

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="⬡ 3D Crystal Structure Viewer"
        subtitle="Interactive atomic-scale visualization of sodium-ion battery cathode materials"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* Controls panel */}
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>Select Structure</div>
            {Object.entries(CRYSTAL_STRUCTURES).map(([key, s]) => (
              <button key={key} onClick={() => { setSelected(key); setClickedAtom(null) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                  background: selected === key ? 'rgba(0,212,164,0.1)' : 'transparent',
                  border: `1px solid ${selected === key ? 'rgba(0,212,164,0.4)' : 'transparent'}`,
                  color: selected === key ? 'var(--teal)' : 'var(--text-secondary)',
                  fontWeight: selected === key ? 600 : 400,
                  fontSize: 13, transition: 'all 0.2s',
                }}>
                {s.name}
              </button>
            ))}
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>Controls</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              <input type="checkbox" checked={autoRotate} onChange={e => setAutoRotate(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--teal)' }} />
              Auto-rotate
            </label>
            {/* <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              🖱 Drag to rotate<br/>
              📐 Scroll to zoom<br/>
              🖱 Right-drag to pan<br/>
              🔵 Click atom for info
            </div> */}
          </div>

          {/* Atom legend */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>Atom Legend</div>
            {Object.entries(elementCounts).map(([elem, count]) => {
              const ep = ELEMENT_PROPS[elem] ?? { color: '#888', label: elem }
              return (
                <div key={elem} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: ep.color, boxShadow: `0 0 8px ${ep.color}88` }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    <b style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{elem}</b> — {ep.label} ({count})
                  </span>
                </div>
              )
            })}
          </div>

          {/* Crystal info */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>Lattice Parameters</div>
            {structure.lattice && Object.entries(structure.lattice).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ color: 'var(--teal)', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                  {typeof v === 'number' ? v.toFixed(1) : v}{['a', 'b', 'c'].includes(k) ? ' Å' : '°'}
                </span>
              </div>
            ))}
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Space Group</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'JetBrains Mono', float: 'right' }}>
                {structure.spaceGroup}
              </span>
            </div>
          </div>
        </div>

        {/* 3D Canvas */}
        <div>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            height: 520, position: 'relative',
          }}>
            {/* Title overlay */}
            <div style={{
              position: 'absolute', top: 16, left: 16, zIndex: 10,
              background: 'rgba(10,22,40,0.85)', backdropFilter: 'blur(8px)',
              border: '1px solid var(--border)', borderRadius: 8,
              padding: '8px 14px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600,
            }}>
              {structure.name}
            </div>

            <Canvas camera={{ position: [0, 0, 10], fov: 50 }}
              gl={{ antialias: true, alpha: false }}
              style={{ background: 'radial-gradient(ellipse at center, #0d1f3c 0%, #060d1f 100%)' }}
            >
              <CrystalScene
                structure={structure}
                autoRotate={autoRotate}
                onAtomClick={setClickedAtom}
                hovered={hovered}
                setHovered={setHovered}
              />
            </Canvas>

            {/* Atom info popup */}
            {clickedAtom && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  position: 'absolute', bottom: 16, right: 16,
                  background: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(8px)',
                  border: `1px solid ${clickedAtom.color}66`,
                  borderRadius: 10, padding: '12px 18px',
                  fontSize: 13, color: 'var(--text-primary)', zIndex: 10,
                  minWidth: 180,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: clickedAtom.color, boxShadow: `0 0 10px ${clickedAtom.color}` }} />
                  <span style={{ fontWeight: 700, color: clickedAtom.color, fontFamily: 'JetBrains Mono', fontSize: 16 }}>
                    {clickedAtom.elem}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 12 }}>
                  <div>Name: {clickedAtom.label}</div>
                  <div>Position: [{clickedAtom.position?.map(v => v.toFixed(1)).join(', ')}]</div>
                  <div>Radius: {(clickedAtom.radius * 100).toFixed(0)} pm</div>
                </div>
                <button onClick={() => setClickedAtom(null)}
                  style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ✕ close
                </button>
              </motion.div>
            )}
          </div>

          {/* Additional info */}
          <div className="page-grid-3" style={{ marginTop: 16 }}>
            {[
              { label: 'Total Atoms', value: structure.atoms.length, color: '#00d4a4' },
              { label: 'Bond Count', value: structure.bonds?.length ?? 0, color: '#3b82f6' },
              { label: 'Unique Elements', value: Object.keys(elementCounts).length, color: '#f59e0b' },
            ].map(({ label, value, color }, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'JetBrains Mono' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
