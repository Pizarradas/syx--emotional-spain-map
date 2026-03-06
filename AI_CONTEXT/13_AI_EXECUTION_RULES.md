# AI Execution Rules

## Purpose

This document defines **how the AI assistant must reason and generate code** when working on this project.

The goal is to guarantee:

- strict compliance with SYX Design System
- architectural consistency
- predictable outputs
- maintainable code
- scalable UI structure

The AI must treat this document as **mandatory operational guidelines**.

---

# AI Development Philosophy

The AI must approach development with the following priorities:

1. **Respect the architecture first**
2. **Respect SYX design system rules**
3. **Avoid shortcuts**
4. **Avoid introducing external UI systems**
5. **Prefer semantic clarity over clever solutions**

The AI should generate code that is:

- readable
- modular
- predictable
- extensible

---

# Mandatory Design System Compliance

All UI implementation MUST strictly follow **SYX Design System**.

The AI must never introduce alternative styling systems.

Forbidden examples:

- Tailwind
- Bootstrap
- random CSS utilities
- inline color declarations
- arbitrary spacing values
- direct primitive token usage in components

Allowed styling sources:

- SYX tokens
- SYX mixins
- SYX semantic classes
- SYX component architecture

---

# Token Usage Rules

The AI must respect the SYX token hierarchy.

```
PRIMITIVE → SEMANTIC → COMPONENT → PAGE
```

Rules:

Primitive tokens
• only used in token definition files
• never used directly in components

Semantic tokens
• used by components
• may be overridden by themes

Component tokens
• used inside specific components

Page level
• uses components only

The AI must **never bypass this hierarchy**.

---

# Emotion Theme Handling

Emotion themes are applied through the attribute:

```
data-emotion-theme
```

Example:

```html
<body data-emotion-theme="joy"></body>
```

Rules:

• themes override semantic tokens
• primitives remain untouched
• components must react automatically through tokens

The AI must **never manually change component colors based on emotion**.

Only token changes are allowed.

---

# Component Creation Rules

When the AI needs to introduce a new component, the following process must be respected.

### Step 1 — Verify necessity

Check whether a similar component already exists in SYX.

### Step 2 — Determine atomic level

Component must be classified as:

- atom
- molecule
- organism

### Step 3 — Token usage

Component must use semantic tokens.

### Step 4 — Naming conventions

Follow SYX naming patterns.

### Step 5 — Documentation

Component behavior must be clear and predictable.

---

# Map-Specific Component Rules

For this project the following components may exist:

### Map Container

Responsible for layout and map rendering area.

### City Marker

Leaflet marker wrapper with emotion metadata.

### Emotion Popup

Displays headline and source.

### Emotional Ambience Layer

Visual atmospheric layer reacting to theme.

All components must remain modular.

---

# JavaScript Rules

JavaScript must remain:

- modular
- readable
- predictable

Avoid:

- monolithic scripts
- unnecessary abstractions
- deeply nested logic

Recommended structure:

```
/scripts
  fetch-news.js
  classify-emotions.js
  generate-json.js
  map-controller.js
```

---

# GSAP Usage Rules

GSAP is allowed and encouraged for animations.

Allowed purposes:

- theme transitions
- marker hover animation
- popup animations
- ambience motion

GSAP must **not replace SYX styling logic**.

Motion must remain separated from theming.

---

# Performance Awareness

The AI must prioritize performance.

Avoid:

- excessive DOM nodes
- continuous heavy animations
- layout thrashing
- unnecessary reflows

Prefer:

- transform animations
- opacity animations
- GPU-friendly properties

---

# Accessibility Rules

The AI must preserve accessibility.

Requirements:

- focusable markers
- keyboard navigation support
- accessible popup structure
- color contrast compliance
- reduced motion support

The system must support:

```
prefers-reduced-motion
```

---

# Reduced Motion Behaviour

If reduced motion is enabled:

- disable continuous animations
- reduce GSAP timelines
- avoid motion-heavy ambience

Interaction must remain usable.

---

# Error Handling

The AI must implement safe fallbacks.

Example scenarios:

• RSS feed unavailable
• emotion classification fails
• missing city data

Fallback behavior:

- neutral emotion state
- marker displayed without theme change
- safe default tokens

---

# Data Integrity Rules

Generated JSON must always remain valid.

Example structure:

```json
[
  {
    "city": "Madrid",
    "emotion": "anger",
    "emoji": "😡",
    "headline": "Protestas frente al Congreso",
    "source": "El País"
  }
]
```

The AI must never produce incomplete structures.

---

# Map Interaction Rules

Marker hover:

• update emotion theme
• animate marker feedback
• update ambience layer

Marker click:

• open popup
• show headline
• highlight emotion

---

# Validation Workflow

Before producing final code, the AI must verify:

1. SYX rules respected
2. tokens used correctly
3. components modular
4. animations safe
5. accessibility preserved
6. JSON structures valid

If any rule is violated, the AI must revise the implementation.

---

# Architectural Discipline

The AI must prioritize:

```
architecture > visuals
```

Visual features must never break the architecture.

---

# Final Directive

The purpose of this project is not only to build a map.

It is to demonstrate that **SYX can power a complex interactive system driven by data and emotion-based theming**.

All generated code must reinforce this objective.
