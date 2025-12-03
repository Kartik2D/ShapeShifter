import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { appState } from '../services/app-state.js';
import { traceWithProcessing, initTracer } from '../services/shape-tracer.js';
import { createBlob, addHoverEffect, PALETTE, type BlobInstance } from '../services/blob-factory.js';

@customElement('process-screen')
export class ProcessScreen extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
      background: var(--bg);
    }

    .preview-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 0;
      background: var(--surface-1);
      overflow: hidden;
      position: relative;
    }


    .svg-preview {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      box-sizing: border-box;
    }

    .svg-preview svg {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      filter: drop-shadow(0 12px 40px rgba(0, 0, 0, 0.35));
    }

    .controls {
      background: var(--bg);
      padding: 1.5rem 1.75rem;
      padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
      border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    .slider-group {
      margin-bottom: 1.5rem;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .slider-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .slider-icon svg {
      width: 22px;
      height: 22px;
      color: var(--text-muted);
    }

    .slider-wrapper {
      position: relative;
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
    }

    .slider-thumb-blob {
      position: absolute;
      width: 40px;
      height: 40px;
      pointer-events: none;
      z-index: 2;
      transition: left 0.1s ease-out;
    }

    .error-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .error-icon svg {
      width: 52px;
      height: 52px;
      color: var(--error);
    }

    /* Custom range slider */
    input[type='range'] {
      position: relative;
      width: 100%;
      height: 28px;
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
      outline: none;
      cursor: pointer;
      z-index: 1;
    }

    input[type='range']::-webkit-slider-runnable-track {
      height: 14px;
      background: var(--surface-2);
      border-radius: 7px;
    }

    input[type='range']::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 40px;
      height: 40px;
      background: transparent;
      cursor: pointer;
      margin-top: -13px;
    }

    input[type='range']::-moz-range-track {
      height: 14px;
      background: var(--surface-2);
      border-radius: 7px;
    }

    input[type='range']::-moz-range-thumb {
      width: 40px;
      height: 40px;
      background: transparent;
      cursor: pointer;
      border: none;
    }

    .actions {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.25rem;
      margin-top: 1.75rem;
    }

    .blob-btn {
      position: relative;
      width: 60px;
      height: 60px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .blob-btn-bg {
      position: absolute;
      inset: -10px;
      width: calc(100% + 20px);
      height: calc(100% + 20px);
    }

    .blob-btn-icon {
      position: relative;
      z-index: 1;
      width: 28px;
      height: 28px;
      color: var(--cream);
      pointer-events: none;
      transition: transform 0.15s ease;
    }

    .blob-btn:hover .blob-btn-icon {
      transform: scale(1.1);
    }

    .blob-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .blob-btn:disabled:hover .blob-btn-icon {
      transform: none;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      color: var(--text-muted);
      font-size: 1rem;
      font-style: italic;
    }

    .spinner {
      width: 70px;
      height: 70px;
    }

    @media (max-width: 600px) {
      .controls {
        padding: 1.25rem;
      }

      .blob-btn {
        width: 52px;
        height: 52px;
      }

      .blob-btn-icon {
        width: 24px;
        height: 24px;
      }
    }
  `;

  @state() private blurAmount = 2;
  @state() private posterizeLevel = 4;
  @state() private previewSvg: string | null = null;
  @state() private isProcessing = false;
  @state() private error: string | null = null;
  @state() private isActive = false;

  private imageData: ImageData | null = null;
  private debounceTimer: number | null = null;
  private unsubscribe?: () => void;
  private tracerInitialized = false;
  private blobs: BlobInstance[] = [];
  private spinnerBlob?: BlobInstance;
  private hoverCleanups: (() => void)[] = [];
  private blurSliderBlob?: BlobInstance;
  private posterizeSliderBlob?: BlobInstance;
  private blurSliderInput?: HTMLInputElement;
  private posterizeSliderInput?: HTMLInputElement;

  connectedCallback(): void {
    super.connectedCallback();
    
    this.unsubscribe = appState.subscribe((state) => {
      const wasActive = this.isActive;
      this.isActive = state.currentScreen === 'process';
      
      if (this.isActive && !wasActive) {
        this.loadImageData();
      }
    });
    
    const state = appState.getState();
    this.isActive = state.currentScreen === 'process';
    if (this.isActive) {
      this.loadImageData();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.blobs.forEach(b => b.destroy());
    this.spinnerBlob?.destroy();
    this.blurSliderBlob?.destroy();
    this.posterizeSliderBlob?.destroy();
    this.hoverCleanups.forEach(cleanup => cleanup());
  }

  async firstUpdated(): Promise<void> {
    await this.updateComplete;
    this.initBlobs();
    this.initSliderBlobs();
  }

  async updated(changedProps: Map<string, unknown>): Promise<void> {
    await this.updateComplete;
    if (changedProps.has('blurAmount') || changedProps.has('posterizeLevel')) {
      this.updateSliderBlobPositions();
    }
  }

  private initBlobs(): void {
    // Button blobs
    this.initButtonBlobs();

    // Spinner blob
    this.initSpinnerBlob();
  }

  private initButtonBlobs(): void {
    const btnContainers = this.shadowRoot?.querySelectorAll('.blob-btn-bg');
    btnContainers?.forEach((container, i) => {
      const isBack = i === 0;
      const blob = createBlob({
        color: isBack ? PALETTE.tertiary : PALETTE.primary,
        centerX: 100,
        centerY: 100,
        radiusX: 120,
        radiusY: 100,
        jiggleIntensity: 3
      });
      container.appendChild(blob.svg);
      this.blobs.push(blob);

      const btn = container.parentElement as HTMLElement;
      if (btn) {
        const cleanup = addHoverEffect(blob, btn, { hoverScale: 1.2, hoverJiggle: 10, normalJiggle: 3 });
        this.hoverCleanups.push(cleanup);
      }
    });
  }

  private initSpinnerBlob(): void {
    const spinnerContainer = this.shadowRoot?.querySelector('.spinner');
    if (spinnerContainer) {
      this.spinnerBlob = createBlob({
        color: PALETTE.primary,
        centerX: 100,
        centerY: 100,
        radiusX: 110,
        radiusY: 110,
        jiggleIntensity: 10
      });
      spinnerContainer.appendChild(this.spinnerBlob.svg);
    }
  }

  private initSliderBlobs(): void {
    // Store slider inputs for position calculation
    this.blurSliderInput = this.shadowRoot?.querySelector('input[type="range"][min="0"][max="50"]') as HTMLInputElement;
    this.posterizeSliderInput = this.shadowRoot?.querySelector('input[type="range"][min="2"][max="8"]') as HTMLInputElement;

    // Blur slider blob
    const blurThumbContainer = this.shadowRoot?.querySelector('.blur-slider-thumb');
    if (blurThumbContainer && this.blurSliderInput) {
      this.blurSliderBlob = createBlob({
        color: PALETTE.primary,
        centerX: 100,
        centerY: 100,
        radiusX: 110,
        radiusY: 110,
        jiggleIntensity: 4
      });
      blurThumbContainer.appendChild(this.blurSliderBlob.svg);
      this.blobs.push(this.blurSliderBlob);

      // Add hover effect to slider input
      const cleanup = addHoverEffect(this.blurSliderBlob, this.blurSliderInput, { 
        hoverScale: 1.2, 
        hoverJiggle: 8, 
        normalJiggle: 4 
      });
      this.hoverCleanups.push(cleanup);
    }

    // Posterize slider blob
    const posterizeThumbContainer = this.shadowRoot?.querySelector('.posterize-slider-thumb');
    if (posterizeThumbContainer && this.posterizeSliderInput) {
      this.posterizeSliderBlob = createBlob({
        color: PALETTE.secondary,
        centerX: 100,
        centerY: 100,
        radiusX: 110,
        radiusY: 110,
        jiggleIntensity: 4
      });
      posterizeThumbContainer.appendChild(this.posterizeSliderBlob.svg);
      this.blobs.push(this.posterizeSliderBlob);

      // Add hover effect to slider input
      const cleanup = addHoverEffect(this.posterizeSliderBlob, this.posterizeSliderInput, { 
        hoverScale: 1.2, 
        hoverJiggle: 8, 
        normalJiggle: 4 
      });
      this.hoverCleanups.push(cleanup);
    }

    // Initial position update
    this.updateSliderBlobPositions();
  }

  private updateSliderBlobPositions(): void {
    if (!this.blurSliderInput || !this.posterizeSliderInput) return;

    // Calculate blur slider position
    if (this.blurSliderBlob) {
      const blurMin = 0;
      const blurMax = 50;
      const blurValue = parseFloat(this.blurSliderInput.value) || this.blurAmount;
      const blurPercent = ((blurValue - blurMin) / (blurMax - blurMin)) * 100;
      const blurThumbContainer = this.shadowRoot?.querySelector('.blur-slider-thumb') as HTMLElement;
      if (blurThumbContainer) {
        blurThumbContainer.style.left = `calc(${blurPercent}% - 20px)`;
      }
    }

    // Calculate posterize slider position
    if (this.posterizeSliderBlob) {
      const posterizeMin = 2;
      const posterizeMax = 8;
      const posterizeValue = parseFloat(this.posterizeSliderInput.value) || this.posterizeLevel;
      const posterizePercent = ((posterizeValue - posterizeMin) / (posterizeMax - posterizeMin)) * 100;
      const posterizeThumbContainer = this.shadowRoot?.querySelector('.posterize-slider-thumb') as HTMLElement;
      if (posterizeThumbContainer) {
        posterizeThumbContainer.style.left = `calc(${posterizePercent}% - 20px)`;
      }
    }
  }

  private async loadImageData(): Promise<void> {
    const state = appState.getState();
    this.imageData = state.capturedImage;
    this.blurAmount = state.blurAmount;
    this.posterizeLevel = state.posterizeLevel;
    this.previewSvg = null;
    this.error = null;
    
    console.log('Loading image data:', this.imageData ? `${this.imageData.width}x${this.imageData.height}` : 'null');
    
    if (this.imageData) {
      await this.initAndTrace();
    }
  }

  private async initAndTrace(): Promise<void> {
    try {
      if (!this.tracerInitialized) {
        console.log('Initializing tracer...');
        await initTracer();
        this.tracerInitialized = true;
        console.log('Tracer initialized successfully');
      }
      this.updatePreview();
    } catch (err) {
      console.error('Failed to initialize tracer:', err);
      this.error = `Failed to initialize image tracer: ${(err as Error).message}`;
    }
  }

  private handleBlurChange(e: Event): void {
    this.blurAmount = parseFloat((e.target as HTMLInputElement).value);
    appState.setBlurAmount(this.blurAmount);
    this.updateSliderBlobPositions();
    this.debouncedUpdatePreview();
  }

  private handlePosterizeChange(e: Event): void {
    this.posterizeLevel = parseInt((e.target as HTMLInputElement).value, 10);
    appState.setPosterizeLevel(this.posterizeLevel);
    this.updateSliderBlobPositions();
    this.debouncedUpdatePreview();
  }

  private debouncedUpdatePreview(): void {
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.updatePreview();
    }, 300);
  }

  private async updatePreview(): Promise<void> {
    if (!this.imageData) {
      console.error('No image data available');
      this.error = 'No image captured. Please go back and take a photo.';
      return;
    }

    this.isProcessing = true;
    this.error = null;

    try {
      console.log('Starting trace...', {
        width: this.imageData.width,
        height: this.imageData.height,
        blur: this.blurAmount,
        posterize: this.posterizeLevel
      });
      
      const svg = await traceWithProcessing(
        this.imageData,
        this.blurAmount,
        this.posterizeLevel
      );
      
      console.log('Trace complete, SVG length:', svg?.length);
      this.previewSvg = svg;
    } catch (err) {
      console.error('Tracing error:', err);
      this.error = `Tracing failed: ${(err as Error).message}`;
    }

    this.isProcessing = false;
  }

  private goBack(): void {
    appState.setScreen('capture');
  }

  private continue(): void {
    if (this.previewSvg) {
      appState.setProcessedSvg(this.previewSvg);
      appState.setScreen('editor');
    }
  }

  render() {
    return html`
      <div class="preview-container">
        ${this.error
          ? html`<div class="error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>`
          : this.isProcessing
            ? html`
                <div class="loading">
                  <div class="spinner"></div>
                </div>
              `
            : this.previewSvg
              ? html`<div class="svg-preview" .innerHTML=${this.previewSvg}></div>`
              : html`<div class="loading"><div class="spinner"></div></div>`}
      </div>

      <div class="controls">
        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="4"></circle>
                <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
                <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
                <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
                <line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line>
                <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
              </svg>
            </span>
          </div>
          <div class="slider-wrapper">
            <div class="slider-thumb-blob blur-slider-thumb"></div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              .value=${String(this.blurAmount)}
              @input=${this.handleBlurChange}
            />
          </div>
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </span>
          </div>
          <div class="slider-wrapper">
            <div class="slider-thumb-blob posterize-slider-thumb"></div>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              .value=${String(this.posterizeLevel)}
              @input=${this.handlePosterizeChange}
            />
          </div>
        </div>

        <div class="actions">
          <button class="blob-btn" @click=${this.goBack} title="Back">
            <div class="blob-btn-bg"></div>
            <svg class="blob-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <button
            class="blob-btn"
            @click=${this.continue}
            ?disabled=${!this.previewSvg || this.isProcessing}
            title="Continue to Editor"
          >
            <div class="blob-btn-bg"></div>
            <svg class="blob-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'process-screen': ProcessScreen;
  }
}
