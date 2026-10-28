# Browser reliability review — 2026-10-27

## Intent preserved

Do not restore the broad mobile-runtime rewrite reverted by 5026050. Preserve editor/debug controls, artwork, and music sequencing from bff105a. Existing MusicManager intends automatic visibility recovery.

## Changes

Prevent hidden frame sync from restarting music; avoid redundant play calls while a request or playback is active. Resume interrupted reveal/route tracks at their previous position after pause or mute. Skip hidden rendering/simulation work.

## Validation

Production build; existing stage-map checks; new audio regression checks; Chromium and mobile WebKit start/reload/mute/return browser tests. No public deployment URL was found in the connected Vercel team or repository metadata.

Mobile checks used WebKit on macOS with a 390×844 touch viewport. Cold-pickup fixtures position collectibles at the player and run the normal collision/score/audio path. Playback was checked through running audio contexts and started buffers, not recorded speaker output. These are not physical iPhone/Android tests. Occasional long cold frames also occur with SFX off; repeat on a real phone before treating overall frame smoothness as resolved.
