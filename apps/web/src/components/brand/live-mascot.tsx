"use client"

import { useRef } from "react"
import { Mascot, type MascotMood } from "@/components/brand/mascot"
import { useEyeTracking } from "@/hooks/use-eye-tracking"

/** Mistri with eyes that follow the mouse */
export function LiveMascot(props: { mood?: MascotMood; className?: string; label?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useEyeTracking(ref)
  return <Mascot ref={ref} {...props} />
}
