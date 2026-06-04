# Archived Stage Editor

The public MVP no longer ships the in-game stage editor, map drawer, camera/theme controls, or hidden debug toggles. Those tools were useful during stage authoring, but they added DOM, event handlers, localStorage state, and hidden control paths to the phone experience.

The player build now loads `baselineStageMap()` directly from `src/game/stageMap.ts`. The parser, serializer, map editing helpers, and `scripts/stage-map-checks.mjs` remain in the repository so stage data can still be tested and recovered from git history if authoring tools are needed again.

To recover the old editor UI, inspect the pre-archive versions of `index.html`, `src/main.ts`, and `src/styles.css` from git history around the commit that introduced this document.
