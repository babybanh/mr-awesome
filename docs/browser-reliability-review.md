# Live deployment reliability port

The canonical production alias was serving b427765 on codex/99-lane-compact-map-experiment, not the GitHub default branch. This port preserves that live baseline, including compact map, dialogue, mobile assets and tutorial timings. Only hidden audio/render guards, playback request deduplication, and interrupted-track position recovery are ported from PR #1.

Validate production build, stage-map checks, audio checks, sites static checks and browser opening/reload before assigning the live alias.
