import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { appState, type WizardScreen } from './services/app-state.js';
import { createBlob, addHoverEffect, PALETTE, type BlobInstance } from './services/blob-factory.js';

// Import components
import './components/capture-screen.js';
import './components/process-screen.js';
import './components/editor-screen.js';

@customElement('main-element')
export class MainElement extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      background: var(--bg);
      color: var(--text);
    }
    
    /* Fill container on large screens (phone frame mode) */
    @media (min-width: 500px) {
      :host {
        height: 100%;
        border-radius: inherit;
      }
    }

    header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
      background: transparent;
    }

    header.hidden {
      display: none;
    }

    .steps {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }

    .step {
      position: relative;
      width: 50px;
      height: 50px;
      cursor: pointer;
      opacity: 0.35;
      transition: opacity 0.25s ease;
    }

    .step:hover {
      opacity: 0.75;
    }

    .step.active {
      opacity: 1;
    }

    .step.completed {
      opacity: 0.65;
    }

    .step-blob {
      position: absolute;
      inset: -8px;
      width: calc(100% + 16px);
      height: calc(100% + 16px);
    }

    .step-icon {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    .step-icon svg {
      width: 22px;
      height: 22px;
      color: var(--bg);
      transition: transform 0.15s ease;
    }

    .step:hover .step-icon svg {
      transform: scale(1.1);
    }

    main {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    capture-screen,
    process-screen,
    editor-screen {
      display: none;
      width: 100%;
      height: 100%;
      max-width: 600px;
    }

    capture-screen[active],
    process-screen[active],
    editor-screen[active] {
      display: flex;
    }

    capture-screen[active] {
      display: block;
    }

    @media (max-width: 600px) {
      .step {
        width: 44px;
        height: 44px;
      }

      .step-icon svg {
        width: 20px;
        height: 20px;
      }

      capture-screen,
      process-screen,
      editor-screen {
        max-width: 100%;
      }
    }
  `;

  @state() private currentScreen: WizardScreen = 'capture';

  private unsubscribe?: () => void;
  private stepBlobs: BlobInstance[] = [];
  private hoverCleanups: (() => void)[] = [];

  connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe = appState.subscribe((state) => {
      this.currentScreen = state.currentScreen;
      this.updateStepColors();
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.stepBlobs.forEach(b => b.destroy());
    this.hoverCleanups.forEach(cleanup => cleanup());
  }

  firstUpdated(): void {
    this.initBlobs();
  }

  private initBlobs(): void {
    const stepContainers = this.shadowRoot?.querySelectorAll('.step-blob');
    const stepElements = this.shadowRoot?.querySelectorAll('.step');
    
    stepContainers?.forEach((container, i) => {
      const blob = createBlob({
        color: this.getStepColor(i),
        centerX: 100,
        centerY: 100,
        radiusX: 85,
        radiusY: 85,
        jiggleIntensity: 2
      });
      container.appendChild(blob.svg);
      this.stepBlobs.push(blob);

      // Add hover effect
      const stepEl = stepElements?.[i] as HTMLElement;
      if (stepEl) {
        const cleanup = addHoverEffect(blob, stepEl, { hoverScale: 1.15, hoverJiggle: 6, normalJiggle: 2 });
        this.hoverCleanups.push(cleanup);
      }
    });
  }

  private getStepColor(stepIndex: number): string {
    const steps: WizardScreen[] = ['capture', 'process', 'editor'];
    const currentIndex = steps.indexOf(this.currentScreen);
    
    if (stepIndex < currentIndex) {
      return PALETTE.success; // completed - green
    } else if (stepIndex === currentIndex) {
      return PALETTE.primary; // active - orange accent
    }
    return PALETTE.neutral; // pending - muted slate
  }

  private updateStepColors(): void {
    this.stepBlobs.forEach((blob, i) => {
      blob.setColor(this.getStepColor(i));
    });
  }

  private getStepState(step: WizardScreen): 'pending' | 'active' | 'completed' {
    const steps: WizardScreen[] = ['capture', 'process', 'editor'];
    const currentIndex = steps.indexOf(this.currentScreen);
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  }

  private handleStepClick(step: WizardScreen): void {
    appState.setScreen(step);
  }

  render() {
    return html`
      <header>
        <nav class="steps">
          <div class="step ${this.getStepState('capture')}" @click=${() => this.handleStepClick('capture')}>
            <div class="step-blob"></div>
            <div class="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="14.31" y1="8" x2="20.05" y2="17.94"></line>
                <line x1="9.69" y1="8" x2="21.17" y2="8"></line>
                <line x1="7.38" y1="12" x2="13.12" y2="2.06"></line>
                <line x1="9.69" y1="16" x2="3.95" y2="6.06"></line>
                <line x1="14.31" y1="16" x2="2.83" y2="16"></line>
                <line x1="16.62" y1="12" x2="10.88" y2="21.94"></line>
              </svg>
            </div>
          </div>
          <div class="step ${this.getStepState('process')}" @click=${() => this.handleStepClick('process')}>
            <div class="step-blob"></div>
            <div class="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
            </div>
          </div>
          <div class="step ${this.getStepState('editor')}" @click=${() => this.handleStepClick('editor')}>
            <div class="step-blob"></div>
            <div class="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <capture-screen ?active=${this.currentScreen === 'capture'}></capture-screen>
        <process-screen ?active=${this.currentScreen === 'process'}></process-screen>
        <editor-screen ?active=${this.currentScreen === 'editor'}></editor-screen>
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'main-element': MainElement;
  }
}
