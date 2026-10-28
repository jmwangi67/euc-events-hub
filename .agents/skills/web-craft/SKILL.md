---
name: web-craft
description: Coordinate design direction, component architecture, motion and browser verification for substantial website or app UI builds and redesigns. Preserve the existing stack and design system.
---

# Web craft

Select the smallest useful part of the installed design stack. Preserve an established brand, component system and project stack before proposing a new direction.

1. Direction: use frontend-design for the aesthetic foundation. Query ui-ux-pro-max for palettes, typography, product patterns and stack guidance. Choose one coherent direction instead of combining conflicting house styles.
2. Structure: account for content, semantics, keyboard focus, loading/error/empty states and responsive behavior. Use web-design-guidelines for UI reviews for accessibility review.
3. Components: use shadcn only in an existing or user-chosen shadcn project. Use vercel-react-best-practices and vercel-composition-patterns where React/Next.js concerns arise. Do not impose React or a heavy component library on a lightweight site or TV interface.
4. Motion: use animate for micro-interactions and animation-performance for jank. Prefer CSS/WAAPI for simple effects and existing project libraries. For intentional GSAP choreography query ui-ux-pro-max with --domain gsap, then verify the current official GSAP API. Support interruption and reduced motion.
5. Verify: use supported browser tools, playwright or playwright-cli to exercise real flows, keyboard navigation and representative viewport sizes. Inspect screenshots. Claim visual regression only when compared with a real baseline.

Scale checks to the change. Deliver the result, actual verification and material limitations. Automatic availability does not require loading every installed skill for every edit.
