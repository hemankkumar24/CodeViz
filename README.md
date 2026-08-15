# Algorithm Weaver

CodeVisualizer — Frontend Build Prompt for AI Design Agent

Role

You are an Expert Frontend Designer and Senior React/TypeScript Engineer with deep experience shipping premium developer tools (in the tier of Linear, Raycast, Vercel, VS Code, and Apple's own developer-facing surfaces like Xcode and Swift Playgrounds). You have taste. You do not default to generic SaaS templates, stock gradients, or dashboard boilerplate. Every pixel should feel intentional.

Your task is to design and build the complete frontend for CodeVisualizer — an interactive tool that lets developers paste an algorithm, choose the exact variable/data structure they care about (an array, a DP table, a matrix, a set of variables, a call stack), and then step through execution watching that state visually transform, line by line.

The one sentence that must be true the instant someone opens this product:

"I give this thing my algorithm, tell it which array/DP table I care about, and it lets me watch the algorithm transform it."

Do not build a real code execution engine. Build the entire frontend — every page, every component, every state — against a mock execution event model (defined in detail below) so that a real backend can be dropped in later without touching the UI layer.

0. Visual Direction — "Apple-Grade Developer Glass"

The base aesthetic is dark-first, restrained, developer-tool minimalism (Linear / Raycast / VS Code lineage), with a deliberate, light-handed inclination toward Apple's glassmorphism language — the way macOS Sonoma/Sequoia menu bars, Control Center, sidebars, and visionOS panels use translucency, specular highlights, and depth. This should read as premium hardware-software polish, never as a "glassy SaaS landing page."

Apply glass selectively, not everywhere:

Use frosted glass / translucency + backdrop-blur for: the top navigation bar, floating panels (playback controls bar, the variable inspector when it overlays on mobile, modals, dropdowns/selects, tooltips, the command palette if you build one, the timeline scrubber's floating step-detail popover).

Do NOT use glass for: the code editor surface, the array/DP/matrix visualization canvas itself, or large content areas. These stay on solid, near-black surfaces with crisp 1px borders — glass would reduce legibility of code and data, which is the actual hero content.

Recipe for a "glass panel":

background: rgba(20, 20, 24, 0.6–0.72) depending on what's behind it

backdrop-filter: blur(20–28px) saturate(150–180%)

border: 1px solid rgba(255,255,255,0.08) — a hairline, not a stroke

A very subtle top inner highlight: box-shadow: inset 0 1px 0 rgba(255,255,255,0.06) to simulate a specular edge catching light, the way macOS panels do

Corner radius: 12–16px for panels, 8–10px for small controls, never the "giant rounded card" look called out as an anti-pattern

No colored gradients inside the glass — keep it neutral so it doesn't compete with syntax-highlighted code or data-visualization color coding

Motion on glass elements should feel like macOS: panels slide/scale in with a slight overshoot-free ease, never bounce, never float idly.

Elevation is expressed through blur + border + very soft shadow, not drop-shadow stacks or heavy elevation systems.

Think: if VS Code's title bar and Command Center were designed by Apple's Human Interface team, and everything below the glass layer is still a serious, high-density developer workspace.

1. Design System (build this first, as shared primitives)

1.1 Color Tokens

Background base: near-black, e.g. #0A0A0C (not pure #000)

Surface 1 (panels/cards): #111114 / #131316

Surface 2 (raised, e.g. code editor gutter): #17171B

Glass surfaces: translucent versions of Surface 1/2 per recipe above

Border/hairline: rgba(255,255,255,0.08) default, rgba(255,255,255,0.14) on hover

Text primary: #F5F5F7 (Apple's own off-white, not pure white)

Text secondary: #A1A1A8

Text tertiary/muted: #6E6E76

Accent (single, restrained): one accessible accent — e.g. a desaturated electric blue #4C8CFF or a signal cyan #3DD6C4. Use it sparingly: primary CTA, active states, current-line marker, current-index pointer. Never as decoration.

Semantic colors (used only in data visualization, not chrome):

Insert/new = green #3DDC84

Update/change = amber #FFB454

Delete/removed = red #FF6B6B

Comparison highlight = accent blue at low opacity

Dependency link (DP) = violet #A78BFA

All semantic color usage must be paired with a non-color signal (icon, motion, label, border-style) — do not rely on color alone (explicit requirement from spec, also an accessibility requirement).

1.2 Typography

UI font: an Inter/SF-Pro-like system font stack (-apple-system, "SF Pro Display", Inter, sans-serif)

Code/data font: a monospace with good number legibility — "SF Mono", "JetBrains Mono", "Fira Code", monospace. Use monospace for: code editor, array/matrix cell values, variable values, step numbers, line numbers.

Strong type hierarchy: hero headline uses a large, tight-tracking display size (56–72px desktop); body copy stays restrained (15–17px); code stays 13–14px with 1.6 line-height.

1.3 Spacing & Layout

Generous whitespace on marketing pages; dense, information-rich but not cramped in the workspace (developer tools tolerate higher density than marketing pages — don't pad the workspace like a landing page).

8px base spacing scale.

1.4 Iconography

Line icons, 1.5px stroke, consistent sizing (16/20/24). No filled icon sets, no emoji as UI icons.

1.5 Motion Principles

Fast (150–250ms), purposeful, no bounce/spring overshoot except very subtle glass panel entrances.

Every animation must communicate a state change (value moved, line changed, pointer moved, step advanced). No idle/decorative motion — no floating blobs, no shimmering gradients.

Use Framer Motion (or an equivalent lightweight solution) for orchestrated sequences (array cell reflow, pointer travel, timeline scrub).

2. Information Architecture / Routes

/                → Landing
/visualize       → Main Workspace (the core product)
/examples        → Example Algorithm Gallery
/learn           → Educational Lessons
/about           → About / Philosophy


Global persistent chrome: a top navigation bar (glass) present on every route except possibly a fully immersive workspace mode. Footer only on marketing routes (/, /examples, /learn, /about), not on /visualize.

3. Global Navigation (glass panel, sticky top)

Build a sticky, translucent top bar (frosted glass per §0) present across the app:

Left: Logo mark + wordmark "CodeVisualizer" (monospace-influenced logotype, small accent-colored cursor-blink or bracket motif < /> as the mark — subtle, not cartoonish)

Center/left nav links: Visualize · Examples · Learn (About lives in footer, not top nav, to keep nav lean)

Right side:

Theme toggle (dark is default/primary; if you add light mode, keep the same restraint)

GitHub icon-link

A profile/settings placeholder (avatar-shaped ghost button, non-functional but present for future auth)

Primary CTA button "Start Visualizing" (only shown on marketing pages, not on /visualize itself)

On scroll, the bar's blur/opacity should intensify slightly (from ~40% opacity glass at top of page to ~70% once content scrolls beneath it) — an Apple-menu-bar-style behavior.

Mobile: collapses into a glass sheet/hamburger menu that slides down as a translucent panel.

4. PAGE 1 — Landing (/)

Build this as a cinematic, product-first marketing page. Every section must earn its place — no filler.

4.1 Hero Section

Two-column desktop layout (stacked on mobile): left = copy + CTAs, right = live-feeling product mockup.

Eyebrow label above headline (small, uppercase, muted, accent-colored dot): e.g. ● Now visualizing execution, not just output

Headline (large display type): "See your code think."

Subheadline (secondary, muted text): "Paste your algorithm, choose the state you want to track, and watch every meaningful change happen step by step."

CTA row:

Primary button: "Start Visualizing →" — solid accent-colored button, subtle glass sheen on hover (a light sweep/shine effect on hover, very Apple-product-page), links to /visualize

Secondary button: "Explore Examples" — ghost/outline button with glass background on hover, links to /examples

Hero visual mockup (right side, or full-bleed below headline on mobile): This is the single most important element on the page. Build a static-but-alive mockup of the actual workspace UI:

A miniature code editor pane showing a real insertion-sort snippet with line 8 visually highlighted (accent-colored line background + left gutter marker)

Beside/below it, a miniature array visualizer: 4 cells [5][2][4][1] with one cell mid-transition (show a subtle "before → after" ghost or a moving highlight) and index labels beneath

A tiny variables strip showing i=1 j=0 key=2

A tiny horizontal timeline strip with a dot on "step 3 of 12"

This entire mockup sits inside a glass-bordered "device frame" panel (soft glass card, hairline border, faint ambient glow behind it using the accent color at very low opacity — this is where you're allowed one subtle glow, everywhere else stay flat)

This mockup should be composed from real (though simplified/reused) versions of your actual ArrayVisualizer, CodeEditor, and Timeline components, not a throwaway image — so it stays visually consistent with the real product.

4.2 Interactive Demonstration Section

Section heading: something like "Watch it happen" (muted eyebrow + headline).

A larger, actually-animating version of the insertion sort trace:

Code panel on one side with the line highlight moving through 3–4 lines in a loop (line 5 → 7 → 8 → 9 → 5...)

Array panel showing the literal sequence from the spec:

[5] [2] [4] [1]       ↓[5] [5] [4] [1]       ↓[2] [5] [4] [1]


rendered as actual animated cell transitions (value fade/slide, changed-cell highlight in amber, then settle) — not literal arrow-text, use real motion between real array-cell components.

This should auto-play on scroll-into-view, loop subtly, pause on hover/focus, and respect prefers-reduced-motion (fall back to a static 3-frame sequence).

Keep it "subtle and professional" per spec — no confetti, no bounce, no color noise.

4.3 How It Works

Three-step horizontal section (stacks vertically on mobile), each step in a minimal glass-edged card with a large monospace step number (01, 02, 03):

01 — Write: "Bring your algorithm or paste code." + small icon/illustration of a code bracket.

02 — Select: "Choose the array, vector, matrix, DP table, or variables you want to observe." + small illustration of a dropdown/selector with array icon.

03 — Visualize: "Step through execution and understand exactly how the state changes." + small illustration of a play button + shifting cells. Connect the three steps with a thin animated line/progress indicator that "fills" as the user scrolls through the section.

4.4 Visualization Types Section

Grid (3 columns desktop, 1 column mobile) of actual visual miniatures, not icons, for each type:

Arrays — 4–5 small cells with one highlighted

DP Tables — a 3×3 grid with row/col labels and a highlighted current cell + a dependency arrow into it

Matrices — a plain 3×3 numeric grid (visually distinct from DP — no dependency arrows, more neutral border, no "current cell" glow, per §11 requirement to visually distinguish DP from ordinary matrices)

Variables — a small key/value list (i 3, sum 12) with one value mid-transition (strikethrough old, new value sliding in)

Recursion — a tiny tree/branch diagram (fib(5) branching into fib(4) / fib(3))

Graphs/Trees (future) — same tile treatment but with a small "Coming soon" glass badge overlay, slightly dimmed opacity so it reads as roadmap, not shipped Each tile: glass-bordered card, hover lifts very slightly (2–4px translate + border brightening, no shadow pop).

4.5 Example Algorithms Section

A horizontally-scrollable (desktop: grid; mobile: swipeable) set of cards for: Insertion Sort · Binary Search · Sliding Window · Kadane's Algorithm · Fibonacci DP · 0/1 Knapsack · Longest Increasing Subsequence · BFS · DFS

Each card contains:

Category tag (pill, muted glass background) — e.g. "Sorting", "Dynamic Programming", "Graphs"

Difficulty indicator (e.g. three dot-segments, filled proportionally: Easy = 1/3, Medium = 2/3, Hard = 3/3) — small, unobtrusive, not a loud badge

Title (e.g. "Insertion Sort")

One-line description (e.g. "Watch elements shift until each value reaches its correct position.")

Visualization-type tag with a tiny inline icon (Array / DP Table / Graph, etc.)

CTA: "Visualize →" ghost-button, bottom-right of card, navigates to /visualize?example=insertion-sort (conceptually pre-loads that example into the workspace)

A tiny sparkline-style visual preview strip at the top of the card (e.g. for Insertion Sort, 4 tiny cells; for BFS, a tiny node/edge cluster) — reinforces "this is a real visual product," not a text list.

4.6 Product Philosophy Section

Two-column: left = short manifesto copy, right = a simple before/after visual (left: static code block, muted, labeled "What a debugger shows you"; right: the same code with the array visualization overlay, labeled "What CodeVisualizer shows you").

Copy direction: traditional debuggers expose program state but weren't designed to make algorithms visually understandable — CodeVisualizer turns execution into a visual story. Write this in plain, confident, non-corporate language — short sentences, no buzzwords ("synergy," "unlock," "empower," "seamless" are banned).

4.7 Final CTA Section

Full-width, quieter section (not another loud gradient block — keep it consistent with the rest: solid dark surface, maybe a very faint accent-colored radial glow behind the button only).

Headline: "Stop guessing what your algorithm is doing. Watch it happen."

Single centered button: "Start Visualizing →"

4.8 Footer

Four columns + bottom bar:

Product: Visualize, Examples, Learn

Examples: (a few direct links, e.g. Sorting, Dynamic Programming, Graphs)

Learn: (a few direct links to lesson categories)

About: About, GitHub, Feedback

Bottom bar: small logo mark, © line, and a minimal "Built for developers" tagline. Keep it dark, hairline-bordered top divider, muted text — footers should disappear visually, not compete with hero.

5. PAGE 2 — Visualization Workspace (/visualize) — THE CORE PRODUCT

Design this like a premium IDE, information-dense, glass used only for chrome/floating elements, everything else solid and crisp.

5.1 Desktop Layout (exact regions)

┌───────────────────────────────────────────────────────────┐
│  Header (glass, sticky)                                    │
├───────────────────────────┬───────────────────────────────┤
│                           │                               │
│      CODE EDITOR          │       VISUALIZATION            │
│      (+ Input panel       │   (renders whichever           │
│       as a tab/drawer     │    visualizer is active)       │
│       within this pane)   │                               │
│                           │                               │
├───────────────────────────┴───────────────────────────────┤
│  VARIABLES / STATE INSPECTOR                                │
├───────────────────────────────────────────────────────────┤
│  CHANGE EXPLANATION (contextual, tied to current step)      │
├───────────────────────────────────────────────────────────┤
│  EXECUTION TIMELINE                                          │
├───────────────────────────────────────────────────────────┤
│  PLAYBACK CONTROLS (glass, floating/sticky bottom bar)       │
└───────────────────────────────────────────────────────────┘


Left pane (code) and right pane (visualization) are resizable via a thin drag handle (hover reveals a subtle grip).

The bottom three regions (Variables, Change Explanation, Timeline) span full width beneath the split pane.

Playback Controls is a glass floating bar, either pinned to the very bottom of the viewport or docked beneath the timeline — this is one of the few workspace elements that should use the frosted-glass treatment, since it floats above content conceptually (like macOS's floating media controls).

5.2 Top Toolbar (within the workspace, below global nav)

A slim secondary bar (not glass — solid Surface 1, hairline bottom border) containing:

Left: workspace title/breadcrumb (e.g. "Untitled" or the loaded example name, editable inline)

Center-left: Visualization Selector (see §5.5)

Right: a primary "Visualize" button (accent-filled) that triggers mock execution; disabled/dimmed state when required inputs are missing, with a tooltip explaining what's missing

Far right: overflow menu (share/export placeholder, reset workspace)

5.3 Code Editor Pane

Monaco-style editor, visually faithful:

Line-number gutter (muted monospace numbers, right-aligned)

Syntax highlighting matching the accent-restrained palette (keywords in accent blue, strings in a muted green, numbers in amber, comments in tertiary gray-italic)

Current execution line: full-row background highlight in a very low-opacity accent wash + a solid accent-colored left gutter bar (2–3px) + a small ▶ or → marker in the gutter replacing the line number, exactly like the spec's example:

  7 | while (j >= 0 && nums[j] > key) {> 8 |     nums[j + 1] = nums[j];  9 |     j--;


Smooth scroll-sync: when stepping execution, the editor auto-scrolls (eased, ~200ms) to keep the current line in view with some breathing room above/below.

Error indication: a red squiggle affordance + an inline glass tooltip on hover showing the mock error message (for the Error global state).

A small tab strip above the editor: Code / Input — clicking "Input" swaps the pane to the Input Panel (§5.4) without disrupting the layout. (Alternative: show Code and Input stacked vertically in the left pane with a resizable divider — pick one and be consistent; the tabbed approach is recommended for a cleaner IDE feel.)

5.4 Input Panel (tab within the left pane)

Friendly, clearly labeled data-entry surface:

Input Type selector: segmented control — Array / Matrix / Custom Variables

Data editor: a monospace text area with light structural validation (bracket matching hint, live-parsed preview chip showing e.g. "4 elements detected" or "3×3 matrix detected")

Example Input button: ghost button that populates a canonical example for the current algorithm

Reset button: ghost/destructive-muted, clears the field

Validation state indicator: inline, small — a green check + "Valid input" or a red/amber icon + specific message ("Expected a numeric array, found a string at index 2"), shown directly beneath the editor, never a blocking modal.

5.5 Visualization Selector

A prominent control, label: "What should we visualize?"

A row of selectable pill/segmented options: Array/Vector · Matrix · DP Table · Variables · Multiple Structures · Recursion · Auto Detect

Selecting one reveals a contextual sub-control directly beneath, e.g.:

Array/Vector → Variable: [ nums ▾ ] dropdown (glass dropdown panel) populated from variables detected/declared in the code

DP Table → Variable: [ dp ▾ ] + Dimensions: 2D (or 1D) toggle

Multiple Structures → a multi-select chip list (left[] right[] nums[])

Recursion → Function: [ fib ▾ ]

Auto Detect → a short muted note: "We'll infer the most relevant structure from your code." (explicitly present as an option, not the default/only path, per spec)

Architect this selector as a plugin-style registry in code (see §7 Component Architecture) so new visualization types can be added by registering a new entry, not by editing this component's internals.

5.6 Visualization Canvas (right pane)

This pane renders whichever visualizer is active, chosen by the Visualization Selector. It is the hero surface of the workspace — solid dark background (not glass), generous internal padding, centered content, and its own zoom/fit-to-view behavior for large data.

Build all five visualizers described below as isolated, swappable components sharing one visual language (index/label typography, cell sizing, border treatment) so switching types feels like the same product, not five different widgets.

5.6.1 Array / Vector Visualizer

Cells rendered as bordered boxes in a horizontal row, monospace value text centered.

Index row above (or below) each cell, small muted monospace numerals.

Current index highlight: accent-colored border + subtle fill on the active cell.

Changed-cell highlight: amber border/fill pulse (single pulse, not looping) the moment a value updates, then settles to normal.

Value change animation: old value fades/scales out, new value scales/fades in — fast (150–200ms), no bounce.

Comparison indicator: when two cells are being compared, connect them with a thin dashed accent line/bracket above the row, or a paired subtle highlight — must be distinguishable from a plain "current index" highlight (different border style, e.g. dashed vs solid).

Pointers (i/j/etc.): rendered as small labeled arrows above or below specific cells, exactly like the spec:

          j          ↓[ 2 ][ 5 ][ 4 ][ 1 ]          ↑          i


Multiple pointers on the same index must stack/offset legibly rather than overlap. Pointer labels are monospace, small, muted-to-accent depending on whether that pointer moved this step.

Support: duplicate values (no dedup assumptions), negative numbers (proper minus-sign rendering, slightly wider cell if needed), large arrays (switch to a horizontally scrollable strip with a fade-edge mask past ~20–30 elements, plus a "zoom out" / compact mode that shrinks cell size rather than wrapping awkwardly), and an explicit empty state ("No array data yet — provide input and run Visualize" with a ghost illustration of empty cells).

5.6.2 Matrix Visualizer

Plain 2D grid of bordered cells, row/column index labels on the outer edges.

Deliberately neutral styling relative to DP (no dependency arrows, no recurrence panel, simpler current-cell highlight) so it's visually distinct from DP tables per spec requirement.

Same change/compare/current-cell interaction language as the array visualizer, adapted to 2D coordinates (row, col).

Large matrices: allow pan/zoom or a minimap-style overview + focused viewport, rather than shrinking cells to illegibility.

5.6.3 DP Table Visualizer

Grid with explicit i ↓ (row) and j → (column) axis labels, exactly like spec:

        j →      0   1   2   3i 0  [0] [∞] [∞] [∞]↓i 1  [0] [2] [∞] [∞]↓i 2  [0] [2] [5] [∞]


Current cell: strong accent border + fill.

Recently changed cell: amber pulse, same language as array but scoped to this cell.

Previous dependency cells: highlighted in violet (per token in §1.1) with a directional connector (thin curved/straight arrow) drawn from each dependency cell into the current cell, showing where the value came from.

Recurrence explanation panel: a small glass-edged callout attached near the current cell (or docked in the Change Explanation region, §5.8) showing the formula, e.g.:

dp[2][3] = max(    dp[1][3],    dp[1][2] + value)


rendered in monospace with the dependency terms color-matched to the violet highlight on the grid, so users can visually trace formula → cells.

Uninitialized cells show ∞ or – per algorithm convention, visually muted/dimmed relative to computed cells.

Large DP tables: same pan/zoom + minimap approach as matrices, with the current cell auto-scrolled into view on each step.

5.6.4 Variable Inspector (also used as the persistent bottom Variables panel, §5.7 — but the selector can also make it the primary canvas view when "Variables" is chosen as the visualization type, shown larger/centered)

Table/list layout, monospace, two columns: name, value.

Variablesi       3j       1key     4sum     12target  15


On change, show the specific transition inline and briefly:

sum11 → 12


Old value strikes through/fades, arrow, new value emphasized in accent — then settles back to a plain row after ~600–800ms. Explicitly do not over-animate (per spec) — one clean transition per change, no shimmer/glow loops.

5.6.5 Recursion / Call Stack Visualizer (architected now, can ship as a v1-simple version)

Tree layout, root at top, children branching downward, connecting lines drawn as clean thin strokes (not curvy/organic — match the app's crisp geometric language).

fib(5) ├── fib(4) │    ├── fib(3) │    └── fib(2) └── fib(3)


Currently executing call: accent border + fill on its node.

Returned/completed calls: dimmed, with the returned value shown as a small badge on the node once resolved.

Not-yet-called siblings: fully muted/ghosted outline.

Deep/wide trees: allow pan + zoom-to-fit, and a collapse affordance on subtrees.

Even if you only ship a functional but simpler version, the component and event model must already support this shape (see §8 event model — structure: "callstack").

5.6.6 Multiple Arrays / Multiple Structures

When "Multiple Structures" is selected, stack the relevant visualizers vertically inside the canvas (e.g. left[], right[], nums[] each as its own labeled array-visualizer instance), each with its own mini-label header. Reuse the single Array Visualizer component per instance — do not build a separate "multi-array" renderer from scratch.

5.6.7 Auto Detect

When active, show a small glass badge in the canvas corner: "Auto-detected: nums (array)" with a manual override link ("Not right? Choose manually") that jumps back to the Visualization Selector. Auto Detect still ultimately renders through one of the five renderers above — it's a selection convenience, not a sixth renderer.

5.7 Variables / State Panel (persistent strip beneath the split pane)

Always visible regardless of which visualization type is active in the canvas (the canvas shows the primary structure; this strip always shows all tracked scalar variables), using the Variable Inspector styling from §5.6.4 but in a compact horizontal chip layout instead of a vertical list, so it fits a thin strip:

i: 3   j: 1   key: 4   sum: 12   target: 15


Changed values this step get a brief accent glow on their chip.

5.8 Change Explanation Panel

A single-line-to-few-lines contextual explanation tied to the current step, styled as a quiet inline panel (not glass, not a loud callout — just a left accent-colored border + slightly raised surface), directly reflecting the event model:

Step 18

nums[2] changed
4 → 5

Because:
nums[j + 1] = nums[j]


For DP steps, it instead renders the recurrence explanation (mirrors §5.6.3's callout — this panel is the canonical place it lives; the in-canvas callout is optional/duplicate for spatial context). If a step has no explanation (e.g. a pure loop-condition check with no mutation), show a muted placeholder: "No state change this step."

5.9 Execution Timeline

Full-width horizontal timeline beneath the Change Explanation panel:

Step 1 ─── Step 2 ─── Step 3 ─── Step 4 ─── Step 5
                         ●
                       current


Draggable scrubber (the ●), smooth drag with the visualization/editor/variables updating live as it's dragged (throttled to avoid jank on rapid drags — snap to nearest discrete step).

Each step marker on the line can be tapped to jump directly.

Mutation/important-event markers: steps that contain a StateChange get a small filled tick on the timeline (vs. an empty/hollow tick for non-mutating steps like condition checks) so users can visually spot "where the interesting stuff happens" at a glance, and can right/left-arrow or click directly to jump between mutation events specifically (a "next change" / "previous change" pair of buttons flanking the timeline).

Total step count shown at the timeline's right edge, e.g. "Step 18 / 42".

On very long traces (100+ steps), compress the timeline into a density/heatmap-style strip rather than trying to render every discrete tick — still draggable, still shows the current position.

5.10 Playback Controls (glass floating bar)

Centered pill-shaped glass bar, docked at the bottom of the workspace (per §0, this is one of the intentionally-glass elements):

Restart (⏮)

Step backward (⏴)

Play/Pause (⏵/⏸, primary/larger, accent-filled circular button in the center)

Step forward (⏵)

Speed control (e.g. 1× opening a small glass popover with 0.5×/1×/2×/4× options)

Current step readout (18 / 42) integrated into the bar

The bar should feel exactly like a macOS media-control HUD — compact, translucent, high-contrast icons, subtle hover states (icon background brightens in a small rounded hit-area on hover).

5.11 Workspace Global/Empty/Error States (must all be explicitly designed, not just handled in code)

Empty state: No code entered — canvas shows a friendly placeholder illustration (ghosted array cells / blinking cursor motif) with copy like "Write or paste an algorithm to get started" and a link to load an example.

Input missing: Code present, input missing — "Visualize" button disabled with tooltip "Add input data to run this."; Input tab gets a small attention dot.

Invalid input: Inline validation message under the Input editor (§5.4); Visualize button disabled.

No visualization selected: Canvas shows a prompt state: "Choose what to visualize above ↑" pointing at the Visualization Selector.

Ready: All three (code, input, target) present, Visualize button fully enabled/accent-highlighted, subtle pulse or glow invites the click (very restrained — one soft breathing glow cycle, not a flashing button).

Running: Playback controls show Pause as primary; editor/canvas/variables update live each tick at the selected speed; timeline scrubber advances automatically.

Paused: Play button restored as primary; everything freezes at the exact current step; a small "Paused" glass chip can appear near the controls.

Error: A distinct error state — e.g. mock "execution failed at line 9" — editor shows the error line in red-tinted highlight (not accent), canvas shows a calm error illustration + message + a "Back to editing" action. Never a harsh red full-screen takeover.

Complete: Timeline reaches the final step; Playback bar's Play button becomes a "Restart" affordance; a small completion chip appears ("Execution complete — 42 steps"); canvas keeps the final state visible (not cleared).

Large data: Triggers the compact/zoom/pan behaviors described in §5.6.1–5.6.3 automatically past defined thresholds (e.g. >30 array elements, >12×12 matrix/DP grid).

Mobile: See §6.

6. Mobile / Responsive Workspace Behavior

Do not simply shrink the desktop grid. Redesign the workspace as a vertically stacked, tab/scroll-driven flow:

Code
 ↓
Visualization
 ↓
Variables
 ↓
Controls


Concretely:

The split-pane becomes a single-column stack: Code Editor (with Input as a swipeable tab, same as desktop) first, full width.

Beneath it, the Visualization canvas — full width, taller than wide, with the same pan/zoom affordances (even more important on small screens for large arrays/DP tables).

Beneath that, Variables as a horizontally-scrollable chip strip (same component as desktop §5.7, just full width and scrollable).

The Change Explanation panel appears as a collapsible strip above the timeline (collapsed by default on small screens to save space, expandable by tap).

Timeline becomes a full-width compact scrubber.

Playback Controls become a persistent bottom-docked glass bar, pinned above the mobile safe-area, always reachable regardless of scroll position (this is the one workspace element that stays fixed) — this is the most natural, most Apple-native use of the glass language on mobile (mirrors iOS's bottom media/now-playing bars).

Visualization Selector and the top toolbar collapse into a single glass "Configure" sheet accessible via a button, rather than permanently consuming vertical space — tapping it slides up a glass bottom-sheet with the selector + variable/dimension sub-controls.

7. PAGE 3 — Examples Gallery (/examples)

A polished, filterable gallery:

Filter bar (sticky beneath the glass nav, itself a slim glass strip): category pills — Sorting, Searching, Arrays, Sliding Window, Two Pointers, Dynamic Programming, Recursion, Graphs, Trees — multi-selectable, plus a search input (monospace placeholder text, e.g. Search algorithms…).

Grid of cards (reuse the card component from §4.5, expanded with a slightly larger visual-preview area since this page's job is browsing, not just teasing):

Title, Difficulty, Category tag, short description, visualization-type tag, tiny visual preview, "Visualize →" CTA.

Sorting/filtering should animate the grid with a quick reflow (fade+scale on filtered-out cards, no layout jank).

Empty filter-result state: quiet illustration + "No examples match these filters" + a "Clear filters" ghost button.

Clicking a card's CTA conceptually routes to /visualize?example=<slug> and the workspace should be architected to accept this query param and pre-populate code/input/visualization-target from a static examples data source (§9).

8. PAGE 4 — Learn (/learn)

Framed as a future educational layer, built now as a well-structured placeholder system:

Grid of lesson cards: Understanding DP · How Recursion Unfolds · Sliding Window · Two Pointers · Binary Search · Graph Traversals.

Each card shows the four-stage structure as a small visual progression indicator:

Concept → Code → Visualization → Explanation


rendered as four small connected steps/dots at the bottom of the card (echoes the "How It Works" motif from the landing page for consistency).

Card body: title, one-line description of what the lesson will eventually teach, a "Coming soon" or "Preview" state chip.

If you choose to make 1–2 lessons "live" as a demonstration of the eventual format, structure the lesson detail view as: a short concept explainer → an embedded (reused) code editor showing the relevant snippet → an embedded (reused) visualizer showing a short trace → a written explanation panel — literally composed from the same components used in /visualize, not bespoke lesson UI.

9. PAGE 5 — About (/about)

Simple, developer-focused, no corporate SaaS language (no "empower," "unlock," "at scale," "revolutionize"):

Short narrative sections (not marketing blocks — closer to a well-written README or blog post in tone):

Why CodeVisualizer exists

The problem with understanding algorithms from static code alone

The idea: making execution state visible over time, not just inspectable at a breakpoint

The long-term vision (recursion, graphs/trees, multi-language support — framed honestly as roadmap, not overpromised)

Minimal visual treatment: mostly typography, generous line-length constraints for readability (60–75 characters per line), maybe one small supporting diagram (e.g. the architecture flow from §11) rendered simply.

10. Component Architecture (adapt to chosen framework — React + TypeScript + Vite/Next.js + Tailwind + Monaco + Framer Motion)

src/
  components/
    layout/            # GlobalNav, Footer, GlassPanel, PageShell
    landing/            # Hero, InteractiveDemo, HowItWorks, VizTypesGrid,
                         # ExampleCardGrid, PhilosophySection, FinalCTA
    editor/             # CodeEditor, EditorTabs, LineGutter, ErrorMarker
    input/              # InputPanel, InputTypeSelector, ExampleInputButton
    visualization/
      registry.ts        # visualization-type registry (plugin pattern, §5.5)
      ArrayVisualizer/
      MatrixVisualizer/
      DPVisualizer/
      VariableInspector/
      RecursionVisualizer/
      shared/            # Cell, PointerLabel, ChangeHighlight, DependencyArrow
    execution/
      Timeline/
      PlaybackControls/
      ChangeExplanationPanel/
      ExecutionStateBadge/  # Ready/Running/Paused/Error/Complete chip
    examples/            # ExampleCard, FilterBar
    learn/                # LessonCard, LessonDetail
    ui/                   # Button, GlassCard, Select, SegmentedControl,
                           # Tooltip, Badge, Pill, EmptyState, Skeleton

  pages/
    Landing/
    Visualize/
    Examples/
    Learn/
    About/

  data/
    examples/            # one file per example algorithm: code, input, meta
    mockExecutions/       # generated ExecutionEvent[] traces per example

  types/
    execution.ts          # ExecutionEvent, StateChange, VisualizationType
    visualization.ts       # per-renderer prop contracts

  state/
    visualizationStore.ts  # user configuration (see §11)
    executionStore.ts       # execution/runtime state (see §11)


Hard rule: visualization renderer components must never import from execution/ state management directly with backend assumptions baked in — they receive plain, typed props (current structure snapshot + highlighted/changed paths) derived from the event stream by a selector layer. This keeps renderers reusable in the Learn page and Landing page mockups.

11. State Architecture — Three Explicit, Separated Domains

11.1 User Configuration

type UserConfig = {
  code: string;
  input: InputData; // discriminated union: array | matrix | variables
  selectedVariable: string | null;
  visualizationType:
    | "array" | "matrix" | "dp" | "variables"
    | "multiple" | "recursion" | "auto";
};


11.2 Execution State

type ExecutionState = {
  events: ExecutionEvent[];
  currentStep: number;
  isPlaying: boolean;
  speed: 0.5 | 1 | 2 | 4;
  status: "empty" | "missingInput" | "invalidInput" | "noTargetSelected"
        | "ready" | "running" | "paused" | "error" | "complete";
};


11.3 Visualization (derived) State

type VisualizationState = {
  currentArray?: number[];
  currentMatrix?: number[][];
  highlightedCells: number[][];   // paths currently "active" (e.g. compared)
  changedCells: number[][];       // paths mutated on the current step
  pointers: Record<string, number[]>; // e.g. { i: [3], j: [1] }
  variables: Record<string, unknown>;
};


VisualizationState is always derived from ExecutionState.events[currentStep] via a pure selector — never hand-set imperatively by UI components. This guarantees the renderer is a pure function of the event stream, satisfying the architectural principle in §12.

12. Mock Execution Event Model (build the frontend against this contract exactly)

type ExecutionEvent = {
  step: number;
  line: number;
  variables: Record<string, unknown>;
  changes: StateChange[];
  explanation?: string;
};

type StateChange = {
  structure: string;     // e.g. "nums", "dp", "left", "callstack"
  path: number[];        // e.g. [2] for nums[2], [1,3] for dp[1][3]
  previousValue: unknown;
  nextValue: unknown;
  type: "update" | "insert" | "delete";
};


Build the following flow explicitly, and make sure it's visible in how the code is organized (this is the core architectural promise of the product, per spec §25):

Code
   ↓
[Future Execution Engine]   ← not built now
   ↓
ExecutionEvent[]
   ↓
Frontend State Machine (executionStore + selectors)
   ↓
Visualization Renderer (pure, event-driven, backend-agnostic)


For now, this becomes:

Mock ExecutionEvent[]  (hand-authored per example, in data/mockExecutions/)
   ↓
Frontend State Machine
   ↓
Visualization Renderer


12.1 Mock Data To Author

Hand-author complete ExecutionEvent[] traces for at least:

Insertion Sort (array) — full trace matching the exact spec example ([5,2,4,1] → sorted), including pointer events for i/j/key.

Binary Search (array, with low/mid/high pointers)

Fibonacci DP (1D DP table, with dependency links)

0/1 Knapsack (2D DP table, with dependency links matching the spec's dp[2][3] = max(dp[1][3], dp[1][2] + value) style explanation)

Kadane's Algorithm (array + variables: currentSum, maxSum)

Fibonacci recursion (call-stack trace matching the spec's fib(5) tree) These traces power both /visualize (via ?example= preload) and the landing page's interactive demo (a trimmed version of the Insertion Sort trace).

13. Deliverables Checklist (build all of this)

Full route/page structure (/, /visualize, /examples, /learn, /about)

Complete Landing page (all sections in §4)

Complete Visualization Workspace (all regions in §5, desktop + mobile per §6)

Examples page (§7)

Learn page (§8)

About page (§9)

Responsive behavior throughout, not just the workspace

All explicit global/empty/loading/error/success states (§5.11)

Mock execution engine + event model + authored traces (§12)

Array Visualizer, DP Visualizer, Matrix Visualizer, Variable Inspector, Recursion Visualizer (§5.6)

Timeline + Playback Controls (§5.9–5.10)

Visualization Selector, extensible via a registry pattern (§5.5, §10)

Input Editor, Code Editor (§5.3–5.4)

A reusable design system (tokens, glass primitives, typography, motion — §1)

Mock data for the six algorithms in §12.1

Final bar: the result must feel like a real, coherent, premium developer product — dark, precise, information-dense where it needs to be, generous where it doesn't, with glass used exactly where Apple would use it (floating chrome, controls, overlays) and never where it would compromise legibility of code or data. The workspace is the hero; the marketing pages exist to earn the click into it.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/15249b64-eb6a-4ba0-a07f-5456ba64ed24).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
