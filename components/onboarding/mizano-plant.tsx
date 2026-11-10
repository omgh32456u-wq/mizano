'use client'

import { useEffect, useId, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { clamp01, easeInOutCubic, easeOutCubic, prefersReducedMotion, segment } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Lens-shaped leaf drawn along +x from its attachment point; scaled and rotated per leaf. */
const LEAF = 'M0 0C22 -30 70 -34 100 0C70 24 24 28 0 0Z'
const RIB = 'M6 0Q50 -3 92 0'
const STEM = 'M60 97C60 87 57.5 79 59 69C60.5 60 60 51 60 41'

interface LeafDef {
  id: string
  x: number
  y: number
  /** Folded angle (leaf hugging the stem) and open angle, degrees; -90 points straight up. */
  from: number
  to: number
  size: number
  /** Growth window (0..1 of the grow channel) in which this leaf unfolds. */
  start: number
  end: number
  tone: 'a' | 'b'
}

const LEAVES: LeafDef[] = [
  { id: 'a-r', x: 59, y: 72, from: -88, to: -50, size: 0.3, start: 0.34, end: 0.64, tone: 'a' },
  { id: 'a-l', x: 59, y: 72, from: -92, to: -130, size: 0.3, start: 0.34, end: 0.64, tone: 'a' },
  { id: 'b-r', x: 60, y: 56, from: -86, to: -44, size: 0.23, start: 0.5, end: 0.78, tone: 'b' },
  { id: 'b-l', x: 60, y: 56, from: -94, to: -136, size: 0.23, start: 0.5, end: 0.78, tone: 'b' },
  { id: 'top', x: 60, y: 41, from: -90, to: -90, size: 0.22, start: 0.66, end: 0.88, tone: 'b' },
]

/** Progress buds above the crown; one opens per onboarding step. */
const BUDS = [
  { x: 43, y: 31 },
  { x: 77, y: 31 },
  { x: 60, y: 11 },
]

interface Nodes {
  seed: SVGElement
  stem: SVGPathElement
  glow: SVGElement
  leaves: { def: LeafDef; el: SVGElement }[]
  buds: { halo: SVGElement; core: SVGElement }[]
}

function collect(svg: SVGSVGElement): Nodes | null {
  const get = <T extends SVGElement = SVGElement>(k: string) => svg.querySelector<T>(`[data-p="${k}"]`)
  const seed = get('seed')
  const stem = get<SVGPathElement>('stem')
  const glow = get('glow')
  if (!seed || !stem || !glow) return null
  const leaves = LEAVES.flatMap((def) => {
    const el = get(`leaf-${def.id}`)
    return el ? [{ def, el }] : []
  })
  const buds = BUDS.flatMap((_, i) => {
    const halo = get(`bud-halo-${i}`)
    const core = get(`bud-core-${i}`)
    return halo && core ? [{ halo, core }] : []
  })
  return { seed, stem, glow, leaves, buds }
}

/**
 * Paints the plant for growth `g` (0 = seed, 1 = finished mark) and bloom `b` (0..1, how many progress buds are open).
 * Direct attribute writes keep the opening animation off React's render path.
 */
function apply(n: Nodes, g: number, b: number) {
  const seedT = easeOutCubic(segment(g, 0.1, 0.3))
  n.seed.setAttribute('transform', `translate(60 93) rotate(14) scale(${(1 - 0.5 * seedT).toFixed(3)})`)

  n.stem.style.strokeDashoffset = String(1 - easeInOutCubic(segment(g, 0.08, 0.42)))
  n.stem.style.opacity = String(segment(g, 0.06, 0.1))

  for (const { def, el } of n.leaves) {
    const t = easeOutCubic(segment(g, def.start, def.end))
    const angle = def.from + (def.to - def.from) * t
    el.setAttribute('transform', `translate(${def.x} ${def.y}) rotate(${angle.toFixed(2)}) scale(${(def.size * t).toFixed(4)})`)
    el.setAttribute('opacity', String(Math.min(1, t * 4)))
  }

  n.glow.setAttribute('opacity', (0.9 * segment(g, 0.84, 1)).toFixed(3))

  const crown = segment(g, 0.88, 1)
  n.buds.forEach(({ halo, core }, i) => {
    const t = easeOutCubic(clamp01(b * BUDS.length - i))
    core.setAttribute('r', ((1.2 + 2.2 * t) * crown).toFixed(2))
    core.setAttribute('opacity', (0.5 + 0.5 * t).toFixed(2))
    halo.setAttribute('r', (3.4 + 4 * t).toFixed(2))
    halo.setAttribute('opacity', (0.38 * t * crown).toFixed(3))
  })
}

function tween(from: number, to: number, ms: number, ease: (t: number) => number, set: (v: number) => void): () => void {
  if (from === to || ms <= 0 || prefersReducedMotion()) {
    set(to)
    return () => undefined
  }
  let raf = 0
  const t0 = performance.now()
  const step = (now: number) => {
    const k = clamp01((now - t0) / ms)
    set(from + (to - from) * ease(k))
    if (k < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
  return () => cancelAnimationFrame(raf)
}

export interface MizanoPlantProps {
  /** Target growth, 0 (seed) to 1 (finished mark). Changing it tweens over `growMs`. */
  grow?: number
  /** Target bloom, 0..1: how many of the three progress buds are open. */
  bloom?: number
  growMs?: number
  className?: string
}

/** The Mizano plant: seed, stem, two leaf pairs, a crown leaf and three progress buds, as one SVG. */
export function MizanoPlant({ grow = 1, bloom = 0, growMs = 2400, className }: MizanoPlantProps) {
  const uid = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement>(null)
  const nodes = useRef<Nodes | null>(null)
  const state = useRef({ g: grow, b: bloom })

  useLayoutEffect(() => {
    if (!svgRef.current) return
    nodes.current = collect(svgRef.current)
    if (nodes.current) apply(nodes.current, state.current.g, state.current.b)
  }, [])

  const draw = () => {
    if (nodes.current) apply(nodes.current, state.current.g, state.current.b)
  }

  useEffect(
    () =>
      tween(state.current.g, grow, growMs, (t) => t, (v) => {
        state.current.g = v
        draw()
      }),
    [grow, growMs],
  )

  useEffect(
    () =>
      tween(state.current.b, bloom, 700, easeInOutCubic, (v) => {
        state.current.b = v
        draw()
      }),
    [bloom],
  )

  const id = (k: string) => `${uid}-${k}`

  return (
    <svg ref={svgRef} viewBox="4 2 112 112" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id={id('la')} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#7fdc9a" />
          <stop offset="1" stopColor="#d6f47c" />
        </linearGradient>
        <linearGradient id={id('lb')} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#4fc486" />
          <stop offset="1" stopColor="#bfec7a" />
        </linearGradient>
        <linearGradient id={id('st')} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#2f9b68" />
          <stop offset="1" stopColor="#9be08c" />
        </linearGradient>
        <radialGradient id={id('gl')}>
          <stop offset="0" stopColor="#c4f26c" stopOpacity="0.38" />
          <stop offset="1" stopColor="#c4f26c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle data-p="glow" cx="60" cy="50" r="44" fill={`url(#${id('gl')})`} opacity="0" />

      <g className="ob-sway">
        <path
          data-p="stem"
          d={STEM}
          pathLength={1}
          fill="none"
          stroke={`url(#${id('st')})`}
          strokeWidth="3.4"
          strokeLinecap="round"
          style={{ strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 } as CSSProperties}
        />
        {LEAVES.map((l) => (
          <g key={l.id} data-p={`leaf-${l.id}`} opacity="0" transform={`translate(${l.x} ${l.y}) scale(0)`}>
            <path d={LEAF} fill={`url(#${id(l.tone === 'a' ? 'la' : 'lb')})`} />
            <path d={RIB} fill="none" stroke="#0f3d2a" strokeOpacity="0.38" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        ))}
        {BUDS.map((b, i) => (
          <g key={i}>
            <circle data-p={`bud-halo-${i}`} cx={b.x} cy={b.y} r="3.4" fill="#c8f26a" opacity="0" />
            <circle data-p={`bud-core-${i}`} cx={b.x} cy={b.y} r="0" fill="#eaff8f" opacity="0.5" />
          </g>
        ))}
      </g>

      <g data-p="seed" transform="translate(60 93) rotate(14)">
        <ellipse rx="5" ry="6.6" fill="#e6f5a2" />
        <path d="M-1.6 -3.6Q0.6 -0.4 -0.8 3.6" fill="none" stroke="#6a8a2e" strokeOpacity="0.55" strokeWidth="1.1" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export interface MizanoMarkProps extends MizanoPlantProps {
  size: number
  className?: string
  style?: CSSProperties
}

/** The plant on Mizano's deep-green rounded tile: the logo used in the opening and the onboarding header. */
export function MizanoMark({ size, className, style, ...plant }: MizanoMarkProps) {
  return (
    <div className={cn('ob-tile', className)} style={{ width: size, height: size, ...style }}>
      <MizanoPlant {...plant} />
    </div>
  )
}
