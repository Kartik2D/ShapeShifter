// App state service for sharing data between wizard screens

export type WizardScreen = 'capture' | 'process' | 'editor';

export interface AppState {
  currentScreen: WizardScreen;
  capturedImage: ImageData | null;
  processedSvg: string | null;
  blurAmount: number;
  posterizeLevel: number;
}

type StateListener = (state: AppState) => void;

class AppStateService {
  private state: AppState = {
    currentScreen: 'capture',
    capturedImage: null,
    processedSvg: null,
    blurAmount: 2,
    posterizeLevel: 4,
  };

  private listeners: Set<StateListener> = new Set();

  getState(): AppState {
    return { ...this.state };
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const stateCopy = this.getState();
    this.listeners.forEach((listener) => listener(stateCopy));
  }

  setScreen(screen: WizardScreen): void {
    this.state.currentScreen = screen;
    this.notify();
  }

  setCapturedImage(image: ImageData): void {
    this.state.capturedImage = image;
    this.notify();
  }

  setProcessedSvg(svg: string): void {
    this.state.processedSvg = svg;
    this.notify();
  }

  setBlurAmount(amount: number): void {
    this.state.blurAmount = amount;
    this.notify();
  }

  setPosterizeLevel(level: number): void {
    this.state.posterizeLevel = level;
    this.notify();
  }

  reset(): void {
    this.state = {
      currentScreen: 'capture',
      capturedImage: null,
      processedSvg: null,
      blurAmount: 2,
      posterizeLevel: 4,
    };
    this.notify();
  }
}

// Singleton instance
export const appState = new AppStateService();

