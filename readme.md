# Emotional Weather Map of Spain 🇪🇸

Interactive visualization that represents the **emotional climate of current news across Spain**.

This project collects news headlines automatically, analyzes their emotional tone, and visualizes the dominant emotion of each region on an interactive map.

The interface dynamically adapts using the **SYX Design System multi-theming architecture**.

---

# Project Concept

The project treats news like **weather patterns**.

Instead of temperature or rain, the map displays the **dominant emotional state of news** in major Spanish cities.

Example:

| City     | Emotion    |
| -------- | ---------- |
| Madrid   | 😡 Anger   |
| Valencia | 😢 Sadness |
| Bilbao   | 😀 Joy     |

Each city marker contains the dominant news emotion calculated from recent headlines.

Hovering a city dynamically changes the **visual theme of the entire interface**.

---

# Project Goals

This project has several objectives.

### 1. Explore emotional data visualization

Transform large volumes of news into a **clear emotional overview** of the current information landscape.

### 2. Demonstrate the capabilities of the SYX Design System

The interface dynamically adapts through **semantic token overrides and theme switching**, proving that SYX can power **data-driven multi-theme interfaces**.

### 3. Experiment with AI-assisted development workflows

The project was designed to be generated and extended using **AI agents guided by structured documentation**.

### 4. Build an interactive editorial visualization

Create an experience that feels closer to an **interactive story or data journalism piece** than a traditional dashboard.

---

# How the Project Works

The system follows a simple pipeline.

```
Google News RSS
      ↓
Fetch headlines
      ↓
Emotion classification
      ↓
Aggregation by city
      ↓
Generate JSON dataset
      ↓
Render interactive map
```

The map reads the generated dataset and visualizes the emotional state of each city.

---

# Planning and Architecture

The project was planned using a **structured AI-assisted development workflow**.

A dedicated documentation system was created in the folder:

```
AI_CONTEXT/
```

This documentation defines:

- system architecture
- UI rules
- SYX design system constraints
- data pipeline structure
- development phases
- AI execution rules

This allows AI agents to generate code while respecting architectural constraints.

---

# Technology Stack

## Frontend

- **HTML**
- **CSS**
- **JavaScript**

### Map Library

- **Leaflet.js**

Used to render the interactive map and city markers.

### Animation System

- **GSAP (GreenSock)**

Used for:

- UI transitions
- marker interactions
- emotional ambience animations
- theme transitions

All GSAP plugins can be used when needed.

---

## Design System

**SYX Design System**

SYX provides:

- token architecture
- semantic theming
- scalable UI structure
- strict design system rules

The project uses **emotion-driven themes** that override semantic tokens.

Token hierarchy:

```
PRIMITIVE → SEMANTIC → COMPONENT → PAGE
```

Emotion themes modify only **semantic tokens**, preserving system integrity.

---

## Data Sources

News headlines are collected using **Google News RSS feeds**.

Example query:

```
https://news.google.com/rss/search?q=Madrid&hl=es&gl=ES&ceid=ES:es
```

Cities currently included:

- Madrid
- Barcelona
- Valencia
- Sevilla
- Bilbao
- Zaragoza
- Málaga
- Murcia
- Valladolid
- A Coruña

---

# Data Structure

Two main datasets are used.

### Cities dataset

Static coordinates.

```
data/cities-spain.json
```

Example:

```
{
 "city": "Madrid",
 "lat": 40.4168,
 "lng": -3.7038
}
```

---

### Emotion dataset

Generated from news analysis.

```
data/emotions-spain.json
```

Example:

```
{
 "city": "Madrid",
 "emotion": "anger",
 "emoji": "😡",
 "headline": "Protestas frente al Congreso",
 "source": "El País"
}
```

---

# Emotion Theming

When a user hovers a city marker:

```
:hover
```

The application updates the root attribute:

```
data-emotion-theme
```

Example:

```
<body data-emotion-theme="anger">
```

This triggers **SYX theme overrides** and changes the visual atmosphere of the interface.

---

# Emotional Ambience System

The interface also includes an **emotional ambience layer** that reacts to the active theme.

Examples:

- background gradients
- overlay color shifts
- marker animations
- popup styling

GSAP is used to orchestrate these transitions.

---

# Development Roadmap

The project was implemented in phases.

### Phase 1

Project structure and documentation.

### Phase 2

Leaflet map with static city markers.

### Phase 3

Emotion dataset integration.

### Phase 4

Emotion-driven UI theming using SYX.

### Phase 5

Interactive markers and popups.

### Phase 6

Emotional ambience layer.

### Phase 7

GSAP motion integration.

### Phase 8

Automated news ingestion pipeline.

---

# Future Improvements

Possible enhancements include:

- emotional heatmaps
- timeline of emotional states
- animated transitions between news cycles
- regional emotion aggregation
- deeper sentiment analysis models

---

# Why This Project Exists

This project demonstrates that a modern design system like **SYX** can power:

- data-driven interfaces
- dynamic multi-theme systems
- AI-generated development workflows
- complex interactive experiences

It is both an **experimental visualization project** and a **technical showcase**.

---

# License

Open source project intended for experimentation and research in:

- design systems
- interactive data visualization
- AI-assisted development
