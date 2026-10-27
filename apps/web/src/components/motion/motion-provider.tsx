"use client"

import { useLayoutEffect } from "react"
import { domMax, LazyMotion, MotionConfig } from "motion/react"

/**
 * One place for motion settings:
 * - LazyMotion loads only the animation features we use (layout + gestures), and `strict`
 *   makes sure every animated element uses the lightweight `m` components.
 * - reducedMotion="user" turns movement off for people who ask their device for less motion.
 * - `motion-ready` on <html> lets CSS scroll reveals hide content only once JavaScript is
 *   running. Child layout effects run first, so content already on screen is marked visible
 *   before this class is added, and nothing flickers.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    document.documentElement.classList.add("motion-ready")
  }, [])

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 380, damping: 30 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
