import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { appState } from '../services/app-state.js';
import { createBlob, addHoverEffect, PALETTE, getBlobColor, type BlobInstance } from '../services/blob-factory.js';

@customElement('capture-screen')
export class CaptureScreen extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      position: relative;
      background: var(--bg);
    }

    video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
    }

    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      background: var(--bg);
      color: var(--text-muted);
      text-align: center;
      padding: 2rem;
    }

    .overlay.hidden {
      display: none;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid var(--surface-2);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }


    .button-group {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      align-items: center;
    }

    .blob-btn {
      position: relative;
      width: 72px;
      height: 72px;
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
      width: 30px;
      height: 30px;
      color: var(--cream);
      pointer-events: none;
      transition: transform 0.15s ease;
    }

    .blob-btn:hover .blob-btn-icon {
      transform: scale(1.1);
    }

    .controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2.5rem;
      padding: 2.5rem;
      padding-bottom: calc(2.5rem + env(safe-area-inset-bottom, 0px));
      background: linear-gradient(to top, rgba(43, 40, 33, 0.95) 0%, transparent 100%);
      z-index: 100;
    }

    .capture-btn {
      position: relative;
      width: 88px;
      height: 88px;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      z-index: 10;
    }

    .capture-btn-outer {
      position: absolute;
      inset: -10px;
      width: calc(100% + 20px);
      height: calc(100% + 20px);
      z-index: 1;
      pointer-events: none;
    }

    .capture-btn-inner {
      position: absolute;
      inset: 14px;
      width: calc(100% - 28px);
      height: calc(100% - 28px);
      z-index: 2;
      pointer-events: none;
    }

    .capture-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .side-btn {
      position: relative;
      width: 60px;
      height: 60px;
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .side-btn-bg {
      position: absolute;
      inset: -8px;
      width: calc(100% + 16px);
      height: calc(100% + 16px);
    }

    .side-btn svg {
      position: relative;
      z-index: 1;
      width: 26px;
      height: 26px;
      color: var(--cream);
      pointer-events: none;
      transition: transform 0.15s ease;
    }

    .side-btn:hover svg {
      transform: scale(1.1);
    }

    .side-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .side-btn:disabled:hover svg {
      transform: none;
    }

    .upload-input {
      display: none;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (max-width: 600px) {
      .capture-btn {
        width: 76px;
        height: 76px;
      }

      .side-btn {
        width: 52px;
        height: 52px;
      }

      .side-btn svg {
        width: 22px;
        height: 22px;
      }

      .controls {
        gap: 2rem;
        padding: 2rem;
      }

      .blob-btn {
        width: 64px;
        height: 64px;
      }

      .blob-btn-icon {
        width: 26px;
        height: 26px;
      }
    }
  `;

  @state() private streamActive = false;
  @state() private cameraStarted = false;
  @state() private error: string | null = null;
  @state() private facingMode: 'user' | 'environment' = 'environment';

  private videoEl: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private blobs: BlobInstance[] = [];
  private hoverCleanups: (() => void)[] = [];

  connectedCallback(): void {
    super.connectedCallback();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopCamera();
    this.blobs.forEach(b => b.destroy());
    this.hoverCleanups.forEach(cleanup => cleanup());
  }

  firstUpdated(): void {
    this.initBlobs();
  }

  async updated(changedProps: Map<string, unknown>): Promise<void> {
    if (changedProps.has('cameraStarted') && this.cameraStarted) {
      await this.updateComplete;
      this.initCaptureButtonBlobs();
      this.initSideButtonBlobs();
    }
  }

  private initBlobs(): void {
    // Button blobs - primary for first, tertiary for others
    const btnContainers = this.shadowRoot?.querySelectorAll('.blob-btn-bg');
    btnContainers?.forEach((container, i) => {
      const blob = createBlob({
        color: i === 0 ? PALETTE.primary : PALETTE.tertiary,
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

    this.initCaptureButtonBlobs();
    this.initSideButtonBlobs();
  }

  private initCaptureButtonBlobs(): void {
    // Capture button - outer ring (lighter/neutral)
    const captureOuter = this.shadowRoot?.querySelector('.capture-btn-outer');
    if (captureOuter && captureOuter.children.length === 0) {
      const blob = createBlob({
        color: PALETTE.neutral,
        centerX: 100,
        centerY: 100,
        radiusX: 110,
        radiusY: 110,
        jiggleIntensity: 2
      });
      captureOuter.appendChild(blob.svg);
      this.blobs.push(blob);
    }

    // Capture button - inner (primary accent)
    const captureInner = this.shadowRoot?.querySelector('.capture-btn-inner');
    if (captureInner && captureInner.children.length === 0) {
      const blob = createBlob({
        color: PALETTE.primary,
        centerX: 100,
        centerY: 100,
        radiusX: 110,
        radiusY: 110,
        jiggleIntensity: 3
      });
      captureInner.appendChild(blob.svg);
      this.blobs.push(blob);

      const btn = this.shadowRoot?.querySelector('.capture-btn') as HTMLElement;
      if (btn) {
        const cleanup = addHoverEffect(blob, btn, { hoverScale: 1.25, hoverJiggle: 12, normalJiggle: 3 });
        this.hoverCleanups.push(cleanup);
      }
    }
  }

  private initSideButtonBlobs(): void {
    const sideBtnContainers = this.shadowRoot?.querySelectorAll('.side-btn-bg');
    sideBtnContainers?.forEach((container) => {
      if (container.children.length > 0) return;
      
      const blob = createBlob({
        color: PALETTE.tertiary,
        centerX: 100,
        centerY: 100,
        radiusX: 110,
        radiusY: 110,
        jiggleIntensity: 2
      });
      container.appendChild(blob.svg);
      this.blobs.push(blob);

      const btn = container.parentElement as HTMLElement;
      if (btn) {
        const cleanup = addHoverEffect(blob, btn, { hoverScale: 1.2, hoverJiggle: 8, normalJiggle: 2 });
        this.hoverCleanups.push(cleanup);
      }
    });
  }

  private getVideo(): HTMLVideoElement {
    if (!this.videoEl) {
      this.videoEl = this.shadowRoot?.querySelector('video') ?? null;
    }
    return this.videoEl!;
  }

  private startCamera(): void {
    this.error = null;
    this.cameraStarted = true;
    this.stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      this.error = 'Camera not supported on this browser.';
      return;
    }

    const video = this.getVideo();
    if (!video) {
      this.error = 'Video element not found.';
      return;
    }

    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    const constraints = {
      audio: false,
      video: {
        facingMode: this.facingMode
      }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(localMediaStream => {
        this.stream = localMediaStream;
        
        if ('srcObject' in video) {
          video.srcObject = localMediaStream;
        } else {
          (video as HTMLVideoElement & { src: string }).src = URL.createObjectURL(localMediaStream);
        }
        
        video.play();
        this.streamActive = true;
        this.requestUpdate();
      })
      .catch(err => {
        console.error('Camera error:', err);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          this.error = 'Camera access denied. Please allow camera permissions.';
        } else if (err.name === 'NotFoundError') {
          this.error = 'No camera found.';
        } else if (err.name === 'NotReadableError') {
          this.error = 'Camera is in use by another app.';
        } else {
          this.error = `Camera error: ${err.message || 'Unknown'}`;
        }
        
        this.streamActive = false;
        this.requestUpdate();
      });
  }

  private stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
    this.streamActive = false;
  }

  private switchCamera(): void {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    this.startCamera();
  }

  private capture(): void {
    const video = this.getVideo();
    if (!video || !this.streamActive) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    
    if (width === 0 || height === 0) {
      this.error = 'Video not ready. Please wait.';
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    appState.setCapturedImage(imageData);
    appState.setScreen('process');
  }

  private handleUploadClick(): void {
    const input = this.shadowRoot?.querySelector('.upload-input') as HTMLInputElement;
    input?.click();
  }

  private handleFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      this.error = 'Please select an image file.';
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      appState.setCapturedImage(imageData);
      appState.setScreen('process');
      
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      this.error = 'Failed to load image.';
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
    input.value = '';
  }

  render() {
    return html`
      <video></video>
      
      <div class="overlay ${this.streamActive ? 'hidden' : ''}">
        ${this.cameraStarted
          ? this.error 
            ? html`
                <button class="blob-btn" @click=${this.startCamera} title="Try Again">
                  <div class="blob-btn-bg"></div>
                  <svg class="blob-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                </button>
              `
            : html`<div class="spinner"></div>`
          : html`
              <div class="button-group">
                <button class="blob-btn" @click=${this.startCamera} title="Enable Camera">
                  <div class="blob-btn-bg"></div>
                  <svg class="blob-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </button>
                <button class="blob-btn" @click=${this.handleUploadClick} title="Upload Image">
                  <div class="blob-btn-bg"></div>
                  <svg class="blob-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </button>
              </div>
            `
        }
      </div>

      ${this.cameraStarted ? html`
        <div class="controls">
          <button 
            class="side-btn" 
            @click=${this.handleUploadClick}
            title="Upload image"
          >
            <div class="side-btn-bg"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>

          <button
            class="capture-btn"
            @click=${this.capture}
            ?disabled=${!this.streamActive}
            aria-label="Capture photo"
          >
            <div class="capture-btn-outer"></div>
            <div class="capture-btn-inner"></div>
          </button>

          <button 
            class="side-btn" 
            @click=${this.switchCamera}
            ?disabled=${!this.streamActive}
            title="Switch camera"
          >
            <div class="side-btn-bg"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 3h5v5"/>
              <path d="M8 21H3v-5"/>
              <path d="M21 3l-7 7"/>
              <path d="M3 21l7-7"/>
            </svg>
          </button>
        </div>
      ` : ''}

      <input 
        type="file" 
        accept="image/*" 
        class="upload-input"
        @change=${this.handleFileChange}
      />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'capture-screen': CaptureScreen;
  }
}
