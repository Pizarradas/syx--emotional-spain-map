
# System Architecture

Pipeline:

Google News RSS → Fetch headlines → Emotion classification → Aggregation → JSON generation → Map rendering

Layers:

Data Layer:
Google News RSS feeds

Processing Layer:
Node.js scripts classify emotions and aggregate results

Visualization Layer:
Leaflet.js interactive map

Design Layer:
SYX design system with token-driven theming
