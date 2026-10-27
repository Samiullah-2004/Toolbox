import { cn } from "cn"

export type MascotMood = "happy" | "working" | "oops"

const INK = "#1e2433"

/**
 * Mistri, the Toolbox mascot: a friendly toolbox with a mustache and a spanner.
 * Placeholder art until the final illustration is made.
 */
export function Mascot({
  mood = "happy",
  className,
  label = "Mistri, the Toolbox mascot",
  ref: svgRef,
}: {
  mood?: MascotMood
  className?: string
  label?: string
  ref?: React.Ref<SVGSVGElement>
}) {
  const look = mood === "working" ? { x: 3, y: 2 } : mood === "oops" ? { x: 0, y: -2 } : { x: 2, y: 1 }

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 270 232"
      role="img"
      aria-label={label}
      className={cn("h-auto w-full", className)}
      // Where the pupils look. useEyeTracking() overrides these to follow the pointer.
      style={{ "--look-x": `${look.x}px`, "--look-y": `${look.y}px` } as React.CSSProperties}
    >
      {/* ground shadow */}
      <ellipse cx="122" cy="218" rx="84" ry="9" className="fill-foreground" opacity="0.08" />

      {/* handle */}
      <path
        d="M90 72V54a14 14 0 0 1 14-14h36a14 14 0 0 1 14 14v18"
        fill="none"
        className="stroke-foreground"
        strokeOpacity="0.85"
        strokeWidth="11"
        strokeLinecap="round"
      />

      {/* body */}
      <rect x="34" y="86" width="176" height="124" rx="24" fill="var(--brand)" />
      <path
        d="M34 176h176v10a24 24 0 0 1-24 24H58a24 24 0 0 1-24-24z"
        style={{ fill: "color-mix(in oklch, var(--brand) 80%, black)" }}
      />

      {/* lid with truck-art dots */}
      <rect x="26" y="66" width="192" height="36" rx="15" fill="var(--teal)" />
      {Array.from({ length: 11 }, (_, i) => (
        <circle
          key={i}
          cx={40 + i * 16.4}
          cy="84"
          r="3.2"
          fill={i % 2 ? "#fff" : "var(--saffron)"}
          opacity={i === 5 ? 0 : 1}
        />
      ))}
      <rect x="108" y="92" width="28" height="20" rx="5" fill="var(--saffron)" stroke={INK} strokeWidth="3" />

      {/* eyes */}
      {[94, 150].map((cx) => (
        <g key={cx} className="origin-center animate-blink [transform-box:fill-box]">
          <circle cx={cx} cy="134" r="16" fill="#fff" stroke={INK} strokeWidth="3" />
          <g className="[transform:translate(var(--look-x),var(--look-y))] transition-transform duration-150 ease-out">
            <circle cx={cx} cy="134" r={mood === "oops" ? 5 : 7.5} fill={INK} />
            <circle cx={cx + 2.5} cy="131" r="2.3" fill="#fff" />
          </g>
        </g>
      ))}

      {/* eyebrows */}
      {mood === "oops" ? (
        <>
          <path d="M80 112l24-6" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path d="M164 112l-24-6" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        </>
      ) : mood === "working" ? (
        <>
          <path d="M80 110l26 4" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path d="M164 110l-26 4" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M80 112q14-9 28 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path d="M136 112q14-9 28 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        </>
      )}

      {/* cheeks */}
      <ellipse cx="68" cy="160" rx="10" ry="6" fill="#ff7a8a" opacity="0.45" />
      <ellipse cx="176" cy="160" rx="10" ry="6" fill="#ff7a8a" opacity="0.45" />

      {/* mouth */}
      {mood === "happy" && (
        <path d="M108 174q14 18 28 0z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      )}
      {mood === "working" && (
        <path d="M112 178q10 4 20 0" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      )}
      {mood === "oops" && <ellipse cx="122" cy="180" rx="8" ry="10" fill={INK} />}

      {/* handlebar mustache */}
      <path
        d="M122 160c-8-7-22-9-32-2-8 5-15 4-19-2 0 11 11 19 25 17 13-2 20-6 26-9 6 3 13 7 26 9 14 2 25-6 25-17-4 6-11 7-19 2-10-7-24-5-32 2z"
        fill={INK}
      />

      {/* sweat drop when something went wrong */}
      {mood === "oops" && (
        <path d="M196 104c5 8 8 12 8 16a8 8 0 0 1-16 0c0-4 3-8 8-16z" fill="var(--teal)" opacity="0.9" />
      )}

      {/* arm */}
      <path
        d="M206 160q16-6 18-28"
        fill="none"
        strokeWidth="12"
        strokeLinecap="round"
        style={{ stroke: "color-mix(in oklch, var(--brand) 80%, black)" }}
      />

      {/* spanner, rotating around the hand while working */}
      <g
        className={cn("[transform-box:view-box]", mood === "working" && "animate-wrench")}
        style={{ transformOrigin: "224px 130px" }}
      >
        <path
          transform="translate(215.4 83.8) scale(2.2)"
          d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
          fill="#c9d1dc"
          stroke={INK}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </g>
      <circle cx="224" cy="130" r="9" fill="var(--brand)" stroke={INK} strokeWidth="3" />
    </svg>
  )
}
