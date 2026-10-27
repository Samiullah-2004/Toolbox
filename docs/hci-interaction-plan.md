# Toolbox: Interaction and Motion Plan (HCI)

This plan explains how Toolbox gives users feedback, guidance and a feeling of control through interaction and animation. Every animation has a job. If it does not help the user understand what is happening, it is not added.

## 1. Goals

1. **Visibility of system status.** The user always sees what the site is doing: which file is selected, how big it is compared to the limit, which step comes next.
2. **Direct feedback.** Every hover, press, drag and drop gets an instant visual response (under 100 ms to start).
3. **Continuity.** When things change (filtering a list, adding a file, switching theme), they move to their new place instead of jumping, so the eye can follow.
4. **Delight with a purpose.** The mascot, Mistri, reacts to the user. This makes the site feel friendly and personal, and it looks hand-made rather than generic.
5. **Respect for the user.** No animation blocks a task, nothing loops forever in the way, and everything turns off for people who ask their device for reduced motion.

## 2. HCI principles we apply

| Principle | Where you see it |
| --- | --- |
| Visibility of system status (Nielsen #1) | Live "How to use" steps that tick off as you go, a size bar on every file, result counts that update while filtering |
| Recognition over recall (Nielsen #6) | Rotating example searches in the search box ("compress PDF", "HEIC to JPG"), icons and colors for every category |
| Feedback and affordance (Norman) | Hover lift on cards, press-down on buttons, arrows that slide to say "this goes somewhere" |
| Fitts's law | Large drop zones, full-width buttons on phones, big touch targets (at least 40 px) |
| Doherty threshold (< 400 ms) | All UI motion is 150 to 400 ms, so the site feels fast |
| Continuity / object constancy | Sliding highlight in the navbar and filters, cards that glide to their new position when the list changes |
| Error prevention (Nielsen #5) | File type and size are checked the moment a file is dropped, with a clear message |
| Accessibility (WCAG 2.2: 2.3.3, 2.4.7) | `prefers-reduced-motion` respected everywhere, visible focus rings, full keyboard use, no motion needed to understand anything |

## 3. Libraries

| Library | Why |
| --- | --- |
| **Motion** (`motion`, the new name of Framer Motion) | Spring physics for hover and press, shared-layout animations (sliding highlights), enter and exit animations for lists, scroll reveals. Loaded with `LazyMotion` so only the needed features ship. |
| **CSS animations** (Tailwind + `tw-animate-css`) | First-paint animations (hero headline, page headers) run before JavaScript loads, so content never waits for code to appear. |
| **View Transitions API** (built into browsers) | The circular reveal when switching dark and light mode. Falls back to an instant switch in older browsers. |

Deliberately **not** used:

- **Smooth-scroll libraries** (like Lenis): they take over the scroll wheel, which breaks expected behavior and hurts accessibility.
- **Heavy 3D or particle effects**: they slow down weak phones, which many of our users have.

## 4. Motion rules

- **Durations:** micro feedback 150 ms, small moves 200 to 250 ms, bigger entrances 300 to 400 ms.
- **Easing:** springs for things the user touches (they feel physical); ease-out for things that appear.
- **Only `transform` and `opacity` are animated**, so the browser never has to recalculate layout. This keeps it smooth at 60 fps.
- **Entrances happen once.** Sections reveal the first time they scroll into view, not every time.
- **Reduced motion:** with the system setting on, movement is removed and only quick fades remain.

## 5. What changes, page by page

### Everywhere

- Header gains a soft shadow once you scroll, so you know you are not at the top.
- Navbar: a highlight follows your mouse between links, and the current section has its own marker.
- Theme switch: the sun and moon icons morph, and the new theme spreads out in a circle from the button.
- Buttons press down slightly when clicked; links get an animated underline.
- A "back to top" button appears on long pages.
- Search: press `/` or `Ctrl+K` from anywhere.

### Home page

- The headline rises in line by line and the hand-drawn underline draws itself.
- Small tool doodles (scissors, film, music note) float in the background and shift a little with the mouse (parallax).
- The search box cycles through real example searches, showing new users what they can type.
- **Mistri's eyes follow the mouse** and blink now and then. When you drag a file over the page, Mistri starts working.
- The category cards reveal one after another as you scroll. On hover a card lifts, its colored top bar grows and the tool rows highlight smoothly.
- AI-looking visual cliches (sparkle icons, blurry gradient blobs) are replaced with the truck-art identity.

### All tools and category pages

- Filter chips have a sliding highlight.
- When you search or filter, cards fade out and the rest glide into their new positions.
- The result count updates as you type.
- Tool cards lift on hover with a spring, the icon tilts and the arrow slides in.

### Tool page

- The drop zone breathes gently while idle and its dashed border moves while you hover.
- Files slide in when added and slide out when removed.
- Each file shows a **size bar** against the tool's limit (green, amber near the limit).
- **Live steps:** "How to use" ticks off step 1 when you add a file and highlights the next step.

### About page

- The three "How it works" steps appear in order, and the dashed line between them draws itself.
- Tool counts count up when they come into view.

### 404 page

- Mistri looks around with eyes that follow the mouse.

## 6. Testing checklist

Tested on 27 October 2026 with an automated script driving Chrome (9 pages × 7 screen sizes = 63 combinations, plus 15 interaction checks).

- [x] Screens: 360 px (small Android), 390 px (iPhone), 768 px (tablet), 1024 px (small laptop), 1280 px, 1440 px, 1920 px
- [x] No sideways scrolling on any page, at any size
- [x] No JavaScript errors on any page
- [x] Interactions: eyes follow the mouse, rotating search examples, navbar highlight, drop zone outline, card lift, drop overlay, file suggestions, size bars, live steps, file removal, filter highlight, search filtering, theme switch, `/` shortcut
- [x] Reduced-motion mode: nothing moves, and no content is left invisible
- [x] Light and dark mode
- [x] Type check, lint and production build pass

Bug found and fixed during testing: the filter chips on the All tools page were cut off on laptops (one category was hidden). They now fit on one line from 1280 px and wrap to two lines at 1024 px.
