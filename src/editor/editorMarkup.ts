export function mountEditorMarkup(gameBoard: HTMLElement): void {
  gameBoard.insertAdjacentHTML(
    "beforeend",
    `
          <div class="gameplay-zoom-guide" data-gameplay-zoom-guide hidden aria-hidden="true"></div>
          <div class="lane-hover-card" data-lane-hover hidden>
            <span>Lane row</span>
            <code data-lane-hover-code></code>
            <textarea data-lane-hover-text spellcheck="false" aria-label="Selected lane row text" hidden></textarea>
            <button type="button" data-lane-hover-copy>Copy</button>
            <button type="button" data-lane-hover-edit>Quick Edit</button>
            <button type="button" data-lane-hover-apply hidden>Apply</button>
            <button type="button" data-lane-hover-cancel hidden>Cancel</button>
          </div>`,
  );
  document.querySelector("#app-shell")?.insertAdjacentHTML(
    "beforeend",
    `
      <aside id="map-drawer" hidden aria-label="Stage Map Textbox">
        <div class="drawer-head">
          <strong>Stage Map Textbox</strong>
          <span data-map-status data-tone="neutral">Ready</span>
          <button type="button" class="drawer-close" data-toggle-map aria-label="Close stage map">X</button>
        </div>
        <textarea data-stage-map spellcheck="false" aria-label="Stage 1 map text"></textarea>
        <div class="drawer-actions">
          <button type="button" data-stage-apply>Apply Map</button>
          <button type="button" data-stage-copy>Copy Map</button>
          <button type="button" data-stage-reset>Reset Stage</button>
          <button type="button" data-stage-validate>Validate Map</button>
          <button type="button" data-feedback-copy>Copy Feedback Block</button>
          <button type="button" data-edit-toggle aria-pressed="false">Edit Mode</button>
        </div>
        <div class="drawer-camera" data-edit-camera-panel hidden>
          <label>
            <span>Avatar Character</span>
            <select data-avatar-character aria-label="Dialogue avatar character"></select>
          </label>
          <label>
            <span>Avatar Background</span>
            <select data-avatar-background aria-label="Dialogue avatar background color"></select>
          </label>
          <label>
            <span>Button Style</span>
            <select data-control-style aria-label="On-screen button style"></select>
          </label>
          <label>
            <span>Background</span>
            <select data-background-theme aria-label="Temporary background color option"></select>
          </label>
          <label>
            <span>Border Style</span>
            <select data-border-style aria-label="Temporary border style option"></select>
          </label>
          <label>
            <span>Dialogue Panel</span>
            <select data-dialogue-panel aria-label="Temporary dialogue panel color option"></select>
          </label>
          <label>
            <span>Editor Angle</span>
            <select data-camera-preset aria-label="Editor camera angle"></select>
          </label>
          <label>
            <span>Editor Zoom</span>
            <span class="zoom-range-wrap">
              <input data-camera-zoom type="range" min="90" max="190" step="5" value="150" aria-label="Editor camera zoom" />
              <span class="gameplay-zoom-mark" aria-hidden="true"></span>
            </span>
          </label>
          <div class="avatar-drag-control">
            <span>Avatar Vertical</span>
            <button type="button" class="avatar-drag-pad" data-avatar-drag aria-label="Drag avatar portrait up or down">
              <span></span>
            </button>
          </div>
          <div class="avatar-zoom-control">
            <span>Avatar Zoom</span>
            <div class="avatar-zoom-buttons">
              <button type="button" data-avatar-zoom-step="-10" aria-label="Zoom avatar out">−</button>
              <button type="button" data-avatar-zoom-reset>Default</button>
              <button type="button" data-avatar-zoom-step="10" aria-label="Zoom avatar in">+</button>
            </div>
          </div>
        </div>
        <textarea data-stage-validation spellcheck="false" readonly aria-label="Stage 1 validation output"></textarea>
      </aside>`,
  );
}
