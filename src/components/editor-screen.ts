import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { appState } from '../services/app-state.js';
import { createBlob, createResetBlob, addHoverEffect, PALETTE, getBlobColor, type BlobInstance } from '../services/blob-factory.js';
import paper from 'paper';

@customElement('editor-screen')
export class EditorScreen extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
      background: var(--bg);
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .tool-btn {
      position: relative;
      width: 56px;
      height: 56px;
      background: none;
      border: none;
      cursor: pointer;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .tool-btn-bg {
      position: absolute;
      inset: -8px;
      width: calc(100% + 16px);
      height: calc(100% + 16px);
    }

    .tool-btn-icon {
      position: relative;
      z-index: 1;
      width: 26px;
      height: 26px;
      color: var(--cream);
      pointer-events: none;
      transition: transform 0.15s ease;
    }

    .tool-btn:hover .tool-btn-icon {
      transform: scale(1.1);
    }

    .tool-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .tool-btn:disabled:hover .tool-btn-icon {
      transform: none;
    }

    .spacer {
      flex: 1;
    }

    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .color-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .color-wrapper {
      position: relative;
      width: 48px;
      height: 48px;
    }

    .color-blob-bg {
      position: absolute;
      inset: -10px;
      width: calc(100% + 20px);
      height: calc(100% + 20px);
    }

    .color-input {
      position: relative;
      width: 100%;
      height: 100%;
      padding: 0;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      background: none;
      z-index: 1;
    }

    .color-input::-webkit-color-swatch-wrapper {
      padding: 3px;
    }

    .color-input::-webkit-color-swatch {
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .canvas-container {
      flex: 1;
      position: relative;
      overflow: hidden;
      background: var(--surface-1);
      cursor: grab;
    }

    .canvas-container.dragging {
      cursor: grabbing;
    }

    .canvas-container.selecting {
      cursor: move;
    }

    .canvas-container.rotating {
      cursor: crosshair;
    }


    canvas {
      width: 100%;
      height: 100%;
    }

    .bottom-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
      background: var(--surface-1);
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      gap: 1.5rem;
    }

    .new-btn {
      position: relative;
      width: 56px;
      height: 56px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;
    }

    .new-btn-bg {
      position: absolute;
      inset: -8px;
      width: calc(100% + 16px);
      height: calc(100% + 16px);
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .zoom-btn {
      position: relative;
      width: 44px;
      height: 44px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .zoom-btn-bg {
      position: absolute;
      inset: -6px;
      width: calc(100% + 12px);
      height: calc(100% + 12px);
    }

    .zoom-btn svg {
      position: relative;
      z-index: 1;
      width: 22px;
      height: 22px;
      color: var(--cream);
      transition: transform 0.15s ease;
    }

    .zoom-btn:hover svg {
      transform: scale(1.15);
    }

    .zoom-level {
      font-size: 0.75rem;
      color: var(--text-muted);
      min-width: 40px;
      text-align: center;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
    }

    .zoom-level:hover {
      color: var(--text);
    }

    .export-btn {
      position: relative;
      width: 60px;
      height: 60px;
      background: none;
      border: none;
      cursor: pointer;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .export-btn-bg {
      position: absolute;
      inset: -10px;
      width: calc(100% + 20px);
      height: calc(100% + 20px);
    }

    .export-btn-icon {
      position: relative;
      z-index: 1;
      width: 28px;
      height: 28px;
      color: var(--bg);
      pointer-events: none;
      transition: transform 0.15s ease;
    }

    .export-btn:hover .export-btn-icon {
      transform: scale(1.1);
    }

    .dropdown {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      bottom: 100%;
      right: 0;
      margin-bottom: 0.75rem;
      background: var(--surface-2);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      z-index: 100;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .dropdown-menu.hidden {
      display: none;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0.875rem 1.25rem;
      background: none;
      border: none;
      color: var(--text);
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .dropdown-item svg {
      width: 22px;
      height: 22px;
    }

    .dropdown-item:hover {
      background: var(--surface-1);
    }

    /* Selection gizmo */
    .gizmo {
      position: absolute;
      pointer-events: none;
      border: 2px solid var(--accent);
      border-radius: 4px;
      z-index: 10;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
    }

    .gizmo.hidden {
      display: none;
    }

    .gizmo-handle {
      position: absolute;
      width: 18px;
      height: 18px;
      pointer-events: auto;
    }

    .gizmo-handle.tl { top: -9px; left: -9px; cursor: nwse-resize; }
    .gizmo-handle.tr { top: -9px; right: -9px; cursor: nesw-resize; }
    .gizmo-handle.bl { bottom: -9px; left: -9px; cursor: nesw-resize; }
    .gizmo-handle.br { bottom: -9px; right: -9px; cursor: nwse-resize; }

    /* Rotation handle */
    .gizmo-rotate {
      position: absolute;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      width: 22px;
      height: 22px;
      pointer-events: auto;
      cursor: grab;
    }

    .gizmo-rotate:active {
      cursor: grabbing;
    }

    .gizmo-rotate-line {
      position: absolute;
      top: 100%;
      left: 50%;
      width: 2px;
      height: 22px;
      background: var(--accent);
      transform: translateX(-50%);
      pointer-events: none;
    }

    .help-hint {
      position: absolute;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: var(--text-muted);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.75rem;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 5;
      white-space: nowrap;
    }

    .help-hint.visible {
      opacity: 1;
    }

    @media (max-width: 600px) {
      .toolbar {
        gap: 0.75rem;
        padding: 0.75rem;
      }

      .tool-btn {
        width: 48px;
        height: 48px;
      }

      .tool-btn-icon {
        width: 22px;
        height: 22px;
      }

      .color-wrapper {
        width: 40px;
        height: 40px;
      }

      .export-btn {
        width: 52px;
        height: 52px;
      }

      .export-btn-icon {
        width: 24px;
        height: 24px;
      }

      .zoom-controls {
        display: none;
      }
    }
  `;

  @state() private selectedItem: paper.Item | null = null;
  @state() private fillColor = '#ffffff';
  @state() private showExportMenu = false;
  @state() private isActive = false;
  @state() private gizmoStyle = { display: 'none', top: '0', left: '0', width: '0', height: '0' };
  @state() private zoomLevel = 100;
  @state() private showHint = false;

  @query('canvas') private canvasEl!: HTMLCanvasElement;
  @query('.canvas-container') private containerEl!: HTMLDivElement;

  private paperScope!: paper.PaperScope;
  private unsubscribe?: () => void;
  private paperInitialized = false;
  private blobs: BlobInstance[] = [];
  private gizmoHandleBlobs: BlobInstance[] = [];
  private rotateHandleBlob?: BlobInstance;
  private hoverCleanups: (() => void)[] = [];
  
  // Mouse interaction state
  private isDragging = false;
  private isResizing = false;
  private isRotating = false;
  private dragStartPos: { x: number; y: number } | null = null;
  private itemStartPos: paper.Point | null = null;
  private itemStartBounds: paper.Rectangle | null = null;
  private rotationStartAngle = 0;
  private itemStartRotation = 0;
  private activeHandle: 'tl' | 'tr' | 'bl' | 'br' | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    
    this.unsubscribe = appState.subscribe((state) => {
      const wasActive = this.isActive;
      this.isActive = state.currentScreen === 'editor';
      
      if (this.isActive && !wasActive) {
        this.setupEditor();
      }
    });
    
    const state = appState.getState();
    this.isActive = state.currentScreen === 'editor';
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    if (this.paperScope) {
      this.paperScope.project?.clear();
    }
    this.blobs.forEach(b => b.destroy());
    this.gizmoHandleBlobs.forEach(b => b.destroy());
    this.rotateHandleBlob?.destroy();
    this.hoverCleanups.forEach(cleanup => cleanup());
  }

  async firstUpdated(): Promise<void> {
    await this.updateComplete;
    this.initBlobs();
    if (this.isActive) {
      this.setupEditor();
    }
  }

  private initBlobs(): void {
    // Tool button blobs - cycle through distinct colors
    const toolBtnContainers = this.shadowRoot?.querySelectorAll('.tool-btn-bg');
    toolBtnContainers?.forEach((container, i) => {
      const blob = createBlob({
        color: getBlobColor(i),
        centerX: 100,
        centerY: 100,
        radiusX: 120,
        radiusY: 100,
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

    // Color picker blobs
    const colorBlobContainers = this.shadowRoot?.querySelectorAll('.color-blob-bg');
    colorBlobContainers?.forEach((container) => {
      const blob = createBlob({
        color: PALETTE.neutral,
        centerX: 100,
        centerY: 100,
        radiusX: 110,
        radiusY: 110,
        jiggleIntensity: 2
      });
      container.appendChild(blob.svg);
      this.blobs.push(blob);

      const wrapper = container.parentElement as HTMLElement;
      if (wrapper) {
        const cleanup = addHoverEffect(blob, wrapper, { hoverScale: 1.15, hoverJiggle: 6, normalJiggle: 2 });
        this.hoverCleanups.push(cleanup);
      }
    });

    // New button (reset with triangle)
    const newBtnContainer = this.shadowRoot?.querySelector('.new-btn-bg');
    if (newBtnContainer) {
      const resetBlob = createResetBlob({
        color: PALETTE.tertiary,
        triangleColor: PALETTE.icon
      });
      newBtnContainer.appendChild(resetBlob.svg);
      this.blobs.push(resetBlob);

      const btn = newBtnContainer.parentElement as HTMLElement;
      if (btn) {
        const cleanup = addHoverEffect(resetBlob, btn, { hoverScale: 1.2, hoverJiggle: 10, normalJiggle: 3 });
        this.hoverCleanups.push(cleanup);
      }
    }

    // Zoom buttons
    const zoomBtnContainers = this.shadowRoot?.querySelectorAll('.zoom-btn-bg');
    zoomBtnContainers?.forEach((container) => {
      const blob = createBlob({
        color: PALETTE.neutral,
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
        const cleanup = addHoverEffect(blob, btn, { hoverScale: 1.2, hoverJiggle: 6, normalJiggle: 2 });
        this.hoverCleanups.push(cleanup);
      }
    });

    // Export button - primary accent color
    const exportBtnContainer = this.shadowRoot?.querySelector('.export-btn-bg');
    if (exportBtnContainer) {
      const blob = createBlob({
        color: PALETTE.primary,
        centerX: 100,
        centerY: 100,
        radiusX: 120,
        radiusY: 100,
        jiggleIntensity: 3
      });
      exportBtnContainer.appendChild(blob.svg);
      this.blobs.push(blob);

      const btn = exportBtnContainer.parentElement as HTMLElement;
      if (btn) {
        const cleanup = addHoverEffect(blob, btn, { hoverScale: 1.2, hoverJiggle: 10, normalJiggle: 3 });
        this.hoverCleanups.push(cleanup);
      }
    }

    // Gizmo scale handle blobs - use primary accent
    const gizmoHandles = this.shadowRoot?.querySelectorAll('.gizmo-handle');
    gizmoHandles?.forEach((handle) => {
      const blob = createBlob({
        color: PALETTE.primary,
        centerX: 100,
        centerY: 100,
        radiusX: 110,
        radiusY: 110,
        jiggleIntensity: 3
      });
      handle.appendChild(blob.svg);
      this.gizmoHandleBlobs.push(blob);

      const cleanup = addHoverEffect(blob, handle as HTMLElement, { hoverScale: 1.3, hoverJiggle: 8, normalJiggle: 3 });
      this.hoverCleanups.push(cleanup);
    });

    // Gizmo rotation handle blob - use secondary (teal)
    const rotateHandle = this.shadowRoot?.querySelector('.gizmo-rotate');
    if (rotateHandle) {
      this.rotateHandleBlob = createBlob({
        color: PALETTE.secondary,
        centerX: 100,
        centerY: 100,
        radiusX: 110,
        radiusY: 110,
        jiggleIntensity: 3
      });
      rotateHandle.appendChild(this.rotateHandleBlob.svg);

      const cleanup = addHoverEffect(this.rotateHandleBlob, rotateHandle as HTMLElement, { hoverScale: 1.3, hoverJiggle: 8, normalJiggle: 3 });
      this.hoverCleanups.push(cleanup);
    }
  }

  private async setupEditor(): Promise<void> {
    await this.updateComplete;
    
    if (!this.paperInitialized) {
      this.initPaper();
      this.initMouseEvents();
      this.paperInitialized = true;
    } else {
      this.paperScope.project?.clear();
    }
    
    this.loadSvg();
    
    // Show hint briefly
    this.showHint = true;
    setTimeout(() => this.showHint = false, 3000);
  }

  private initPaper(): void {
    this.paperScope = new paper.PaperScope();
    this.paperScope.setup(this.canvasEl);
    
    this.handleResize();
    this.paperScope.view.onResize = () => this.handleResize();
  }

  private initMouseEvents(): void {
    const container = this.containerEl;
    if (!container) return;

    // Mouse events for click, drag, pan
    container.addEventListener('mousedown', this.onMouseDown);
    container.addEventListener('mousemove', this.onMouseMove);
    container.addEventListener('mouseup', this.onMouseUp);
    container.addEventListener('mouseleave', this.onMouseUp);
    
    // Wheel for zoom (boundless - very wide range)
    container.addEventListener('wheel', this.onWheel, { passive: false });

    // Gizmo scale handle events
    const handles = this.shadowRoot?.querySelectorAll('.gizmo-handle');
    handles?.forEach(handle => {
      handle.addEventListener('mousedown', this.onHandleMouseDown as EventListener);
    });

    // Gizmo rotation handle event
    const rotateHandle = this.shadowRoot?.querySelector('.gizmo-rotate');
    if (rotateHandle) {
      rotateHandle.addEventListener('mousedown', this.onRotateHandleMouseDown as EventListener);
    }
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (this.isResizing || this.isRotating) return;
    
    const point = this.screenToCanvas(e.clientX, e.clientY);
    const hitItem = this.findSelectableItem(point);

    if (hitItem) {
      this.selectItem(hitItem);
      this.isDragging = true;
      this.dragStartPos = { x: e.clientX, y: e.clientY };
      this.itemStartPos = hitItem.position.clone();
      this.containerEl.classList.add('selecting');
    } else {
      this.deselectAll();
      this.isDragging = true;
      this.dragStartPos = { x: e.clientX, y: e.clientY };
      this.containerEl.classList.add('dragging');
    }
  };

  private onHandleMouseDown = (e: MouseEvent): void => {
    e.stopPropagation();
    
    if (!this.selectedItem) return;
    
    // Determine which handle was clicked
    const target = e.currentTarget as HTMLElement;
    if (target.classList.contains('tl')) this.activeHandle = 'tl';
    else if (target.classList.contains('tr')) this.activeHandle = 'tr';
    else if (target.classList.contains('bl')) this.activeHandle = 'bl';
    else if (target.classList.contains('br')) this.activeHandle = 'br';
    
    this.isResizing = true;
    this.dragStartPos = { x: e.clientX, y: e.clientY };
    this.itemStartBounds = this.selectedItem.bounds.clone();
  };

  private onRotateHandleMouseDown = (e: MouseEvent): void => {
    e.stopPropagation();
    
    if (!this.selectedItem) return;
    
    this.isRotating = true;
    this.containerEl.classList.add('rotating');
    
    // Get center of the item in screen coordinates
    const itemCenter = this.canvasToScreen(this.selectedItem.bounds.center);
    
    // Calculate initial angle from center to mouse
    const dx = e.clientX - itemCenter.x;
    const dy = e.clientY - itemCenter.y;
    this.rotationStartAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    this.itemStartRotation = this.selectedItem.data.rotation || 0;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (this.isRotating && this.selectedItem) {
      // Get center of the item in screen coordinates
      const itemCenter = this.canvasToScreen(this.selectedItem.bounds.center);
      
      // Calculate current angle from center to mouse
      const dx = e.clientX - itemCenter.x;
      const dy = e.clientY - itemCenter.y;
      const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Calculate rotation delta
      const angleDelta = currentAngle - this.rotationStartAngle;
      
      // Apply rotation
      const newRotation = this.itemStartRotation + angleDelta;
      const rotationDiff = newRotation - (this.selectedItem.data.rotation || 0);
      this.selectedItem.rotate(rotationDiff, this.selectedItem.bounds.center);
      this.selectedItem.data.rotation = newRotation;
      
      this.updateGizmo();
      return;
    }

    if (!this.dragStartPos) return;

    const dx = e.clientX - this.dragStartPos.x;
    const dy = e.clientY - this.dragStartPos.y;

    if (this.isResizing && this.selectedItem && this.itemStartBounds) {
      // Resize the selected item
      const scale = this.paperScope.view.zoom;
      
      // Adjust delta direction based on which handle is being dragged
      // so that dragging "outward" from the shape always scales up
      let adjustedDx = dx;
      let adjustedDy = dy;
      if (this.activeHandle === 'tl') {
        adjustedDx = -dx;
        adjustedDy = -dy;
      } else if (this.activeHandle === 'tr') {
        adjustedDy = -dy;
      } else if (this.activeHandle === 'bl') {
        adjustedDx = -dx;
      }
      // 'br' keeps original dx, dy
      
      // Transform the delta by the item's rotation
      // so scaling follows cursor direction regardless of rotation
      const rotation = this.selectedItem.data.rotation || 0;
      const angleRad = rotation * (Math.PI / 180);
      const rotatedDx = adjustedDx * Math.cos(angleRad) - adjustedDy * Math.sin(angleRad);
      const rotatedDy = adjustedDx * Math.sin(angleRad) + adjustedDy * Math.cos(angleRad);
      
      const scaleFactor = 1 + (rotatedDx + rotatedDy) / (200 * scale);
      
      // Scale uniformly from center
      const newScale = Math.max(0.05, scaleFactor);
      this.selectedItem.scale(newScale, this.selectedItem.bounds.center);
      
      this.dragStartPos = { x: e.clientX, y: e.clientY };
      this.updateGizmo();
    } else if (this.isDragging) {
      const scale = this.paperScope.view.zoom;
      
      if (this.selectedItem && this.itemStartPos) {
        // Move selected item - no bounds checking = boundless
        this.selectedItem.position = this.itemStartPos.add(
          new paper.Point(dx / scale, dy / scale)
        );
        this.updateGizmo();
      } else {
        // Pan canvas - boundless panning
        this.paperScope.view.center = this.paperScope.view.center.subtract(
          new paper.Point(dx / scale, dy / scale)
        );
        this.dragStartPos = { x: e.clientX, y: e.clientY };
      }
    }
  };

  private onMouseUp = (): void => {
    this.isDragging = false;
    this.isResizing = false;
    this.isRotating = false;
    this.dragStartPos = null;
    this.itemStartPos = null;
    this.itemStartBounds = null;
    this.activeHandle = null;
    this.containerEl.classList.remove('dragging', 'selecting', 'rotating');
    // Show gizmo again after transformation completes
    if (this.selectedItem) {
      this.updateGizmo();
    }
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    // Boundless zoom - very wide range from 1% to 10000%
    const newZoom = Math.max(0.01, Math.min(100, this.paperScope.view.zoom * delta));
    
    // Zoom toward cursor position
    const mousePoint = this.screenToCanvas(e.clientX, e.clientY);
    const viewCenter = this.paperScope.view.center;
    const offset = mousePoint.subtract(viewCenter);
    
    this.paperScope.view.zoom = newZoom;
    this.paperScope.view.center = viewCenter.add(offset.multiply(1 - 1/delta));
    
    this.zoomLevel = Math.round(newZoom * 100);
    this.updateGizmo();
  };

  private findSelectableItem(point: paper.Point): paper.Item | null {
    const tolerance = Math.max(20, 40 / this.paperScope.view.zoom);
    
    const hitResult = this.paperScope.project.hitTest(point, {
      fill: true,
      stroke: true,
      segments: true,
      tolerance: tolerance,
    });

    if (hitResult?.item) {
      let item: paper.Item | null = hitResult.item;
      while (item) {
        if (item.data?.selectable) {
          return item;
        }
        item = item.parent;
      }
      if (hitResult.item instanceof paper.Path || hitResult.item instanceof paper.CompoundPath) {
        return hitResult.item;
      }
    }

    const allItems = this.paperScope.project.activeLayer.getItems({
      recursive: true,
      match: (item: paper.Item) => {
        return (item instanceof paper.Path || item instanceof paper.CompoundPath) && 
               item.bounds.expand(tolerance).contains(point);
      }
    });

    if (allItems.length > 0) {
      return allItems[allItems.length - 1];
    }

    return null;
  }

  private screenToCanvas(x: number, y: number): paper.Point {
    const rect = this.containerEl.getBoundingClientRect();
    const view = this.paperScope.view;
    
    const scaleX = view.viewSize.width / rect.width;
    const scaleY = view.viewSize.height / rect.height;
    
    const viewX = (x - rect.left) * scaleX;
    const viewY = (y - rect.top) * scaleY;
    
    return view.viewToProject(new paper.Point(viewX, viewY));
  }

  private canvasToScreen(point: paper.Point): { x: number; y: number } {
    const rect = this.containerEl.getBoundingClientRect();
    const view = this.paperScope.view;
    
    const viewPoint = view.projectToView(point);
    
    const scaleX = rect.width / view.viewSize.width;
    const scaleY = rect.height / view.viewSize.height;
    
    return {
      x: rect.left + viewPoint.x * scaleX,
      y: rect.top + viewPoint.y * scaleY
    };
  }

  private loadSvg(): void {
    const state = appState.getState();
    if (!state.processedSvg) return;

    this.paperScope.project.importSVG(state.processedSvg, {
      expandShapes: true,
      onLoad: (item: paper.Item) => {
        // Remove any clipping masks from the imported SVG
        // This prevents shapes from disappearing when dragged outside the original viewBox
        this.removeClipMasks(item);
        
        item.position = this.paperScope.view.center;

        const viewBounds = this.paperScope.view.bounds;
        const itemBounds = item.bounds;
        const scale = Math.min(
          (viewBounds.width * 0.85) / itemBounds.width,
          (viewBounds.height * 0.85) / itemBounds.height
        );
        item.scale(scale);
        item.position = this.paperScope.view.center;

        this.makeItemsSelectable(item);
      },
    });
  }

  private removeClipMasks(item: paper.Item): void {
    // If this is a group with clipping, disable it
    if (item instanceof paper.Group && item.clipped) {
      item.clipped = false;
      // Remove the clip mask item (usually the first child that's a clipMask)
      const clipMask = item.children.find((child: paper.Item) => child.clipMask);
      if (clipMask) {
        clipMask.remove();
      }
    }
    
    // Recursively process children
    if (item.children) {
      // Iterate in reverse since we might remove items
      for (let i = item.children.length - 1; i >= 0; i--) {
        this.removeClipMasks(item.children[i]);
      }
    }
  }

  private makeItemsSelectable(item: paper.Item): void {
    if (item instanceof paper.Group) {
      item.children.forEach((child) => this.makeItemsSelectable(child));
    } else if (item instanceof paper.Path || item instanceof paper.CompoundPath) {
      item.data.selectable = true;
      item.data.rotation = 0;
    }
  }

  private selectItem(item: paper.Item): void {
    this.deselectAll();
    this.selectedItem = item;
    item.selected = true;

    if (item instanceof paper.Path || item instanceof paper.CompoundPath) {
      if (item.fillColor) {
        this.fillColor = item.fillColor.toCSS(true);
      }
    }
    
    this.updateGizmo();
  }

  private deselectAll(): void {
    this.paperScope?.project?.deselectAll();
    this.selectedItem = null;
    this.hideGizmo();
  }

  private updateGizmo(): void {
    if (!this.selectedItem || !this.containerEl) {
      this.hideGizmo();
      return;
    }

    // Hide gizmo during active transformations
    if (this.isRotating || this.isResizing) {
      this.gizmoStyle = { ...this.gizmoStyle, display: 'none' };
      return;
    }

    const item = this.selectedItem;
    const view = this.paperScope.view;
    const rect = this.containerEl.getBoundingClientRect();
    
    const scaleX = rect.width / view.viewSize.width;
    const scaleY = rect.height / view.viewSize.height;
    
    const bounds = item.bounds;
    const topLeftView = view.projectToView(bounds.topLeft);
    const bottomRightView = view.projectToView(bounds.bottomRight);
    
    const left = topLeftView.x * scaleX;
    const top = topLeftView.y * scaleY;
    const width = (bottomRightView.x - topLeftView.x) * scaleX;
    const height = (bottomRightView.y - topLeftView.y) * scaleY;

    this.gizmoStyle = {
      display: 'block',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }

  private hideGizmo(): void {
    this.gizmoStyle = { ...this.gizmoStyle, display: 'none' };
  }

  private deleteSelected(): void {
    if (this.selectedItem) {
      this.selectedItem.remove();
      this.selectedItem = null;
      this.hideGizmo();
    }
  }

  private simplifySelected(): void {
    if (this.selectedItem && this.selectedItem instanceof paper.Path) {
      this.selectedItem.simplify(2.5);
      this.updateGizmo();
    } else if (this.selectedItem instanceof paper.CompoundPath) {
      this.selectedItem.children.forEach((child) => {
        if (child instanceof paper.Path) {
          child.simplify(2.5);
        }
      });
      this.updateGizmo();
    }
  }

  private moveUp(): void {
    if (!this.selectedItem) return;
    
    const layer = this.selectedItem.layer || this.paperScope.project.activeLayer;
    const items = layer.getItems({ recursive: false });
    const currentIndex = items.indexOf(this.selectedItem);
    
    if (currentIndex < items.length - 1) {
      // Move one position forward (bring forward)
      const nextItem = items[currentIndex + 1];
      this.selectedItem.insertAbove(nextItem);
      this.updateGizmo();
    }
  }

  private moveDown(): void {
    if (!this.selectedItem) return;
    
    const layer = this.selectedItem.layer || this.paperScope.project.activeLayer;
    const items = layer.getItems({ recursive: false });
    const currentIndex = items.indexOf(this.selectedItem);
    
    if (currentIndex > 0) {
      // Move one position backward (send backward)
      const prevItem = items[currentIndex - 1];
      this.selectedItem.insertBelow(prevItem);
      this.updateGizmo();
    }
  }

  private handleFillColorChange(e: Event): void {
    this.fillColor = (e.target as HTMLInputElement).value;
    if (
      this.selectedItem &&
      (this.selectedItem instanceof paper.Path ||
        this.selectedItem instanceof paper.CompoundPath)
    ) {
      this.selectedItem.fillColor = new paper.Color(this.fillColor);
    }
  }

  private handleResize(): void {
    if (this.canvasEl && this.containerEl) {
      const rect = this.containerEl.getBoundingClientRect();
      this.paperScope.view.viewSize = new paper.Size(rect.width, rect.height);
    }
  }

  private zoomIn(): void {
    const newZoom = Math.min(100, this.paperScope.view.zoom * 1.25);
    this.paperScope.view.zoom = newZoom;
    this.zoomLevel = Math.round(newZoom * 100);
    this.updateGizmo();
  }

  private zoomOut(): void {
    const newZoom = Math.max(0.01, this.paperScope.view.zoom * 0.8);
    this.paperScope.view.zoom = newZoom;
    this.zoomLevel = Math.round(newZoom * 100);
    this.updateGizmo();
  }

  private resetZoom(): void {
    this.paperScope.view.zoom = 1;
    this.zoomLevel = 100;
    this.updateGizmo();
  }

  private toggleExportMenu(): void {
    this.showExportMenu = !this.showExportMenu;
  }

  private exportSvg(): void {
    const svg = this.paperScope.project.exportSVG({ asString: true }) as string;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shapeshift-artwork.svg';
    a.click();
    
    URL.revokeObjectURL(url);
    this.showExportMenu = false;
  }

  private exportPng(): void {
    const tempCanvas = document.createElement('canvas');
    const scale = 2;
    tempCanvas.width = this.canvasEl.width * scale;
    tempCanvas.height = this.canvasEl.height * scale;
    
    const ctx = tempCanvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.fillStyle = '#3a342c';
    ctx.fillRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    ctx.drawImage(this.canvasEl, 0, 0);

    const url = tempCanvas.toDataURL('image/png');
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shapeshift-artwork.png';
    a.click();
    
    this.showExportMenu = false;
  }

  private goBack(): void {
    appState.setScreen('process');
  }

  private newProject(): void {
    appState.reset();
  }

  render() {
    return html`
      <div class="toolbar">
        <div class="toolbar-group">
          <button class="tool-btn" @click=${this.goBack} title="Back">
            <div class="tool-btn-bg"></div>
            <svg class="tool-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          
          <div class="color-group">
            <div class="color-wrapper">
              <div class="color-blob-bg"></div>
              <input
                type="color"
                class="color-input"
                .value=${this.fillColor}
                @input=${this.handleFillColorChange}
                ?disabled=${!this.selectedItem}
                title="Fill Color"
              />
            </div>
          </div>
        </div>

        <div class="toolbar-group">
          <button
            class="tool-btn"
            @click=${this.moveDown}
            ?disabled=${!this.selectedItem}
            title="Move Down (Send Backward)"
          >
            <div class="tool-btn-bg"></div>
            <svg class="tool-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"></path>
              <path d="M19 12l-7 7-7-7"></path>
            </svg>
          </button>

          <button
            class="tool-btn"
            @click=${this.moveUp}
            ?disabled=${!this.selectedItem}
            title="Move Up (Bring Forward)"
          >
            <div class="tool-btn-bg"></div>
            <svg class="tool-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 19V5"></path>
              <path d="M5 12l7-7 7 7"></path>
            </svg>
          </button>

          <button
            class="tool-btn"
            @click=${this.simplifySelected}
            ?disabled=${!this.selectedItem}
            title="Simplify Path"
          >
            <div class="tool-btn-bg"></div>
            <svg class="tool-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
          </button>

          <button
            class="tool-btn"
            @click=${this.deleteSelected}
            ?disabled=${!this.selectedItem}
            title="Delete"
          >
            <div class="tool-btn-bg"></div>
            <svg class="tool-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="canvas-container">
        <canvas></canvas>
        
        <div 
          class="gizmo ${this.selectedItem && !this.isRotating && !this.isResizing ? '' : 'hidden'}"
          style="
            top: ${this.gizmoStyle.top};
            left: ${this.gizmoStyle.left};
            width: ${this.gizmoStyle.width};
            height: ${this.gizmoStyle.height};
          "
        >
          <div class="gizmo-handle tl"></div>
          <div class="gizmo-handle tr"></div>
          <div class="gizmo-handle bl"></div>
          <div class="gizmo-handle br"></div>
          <div class="gizmo-rotate">
            <div class="gizmo-rotate-line"></div>
          </div>
        </div>

        <div class="help-hint ${this.showHint ? 'visible' : ''}">
          Click to select • Drag to move • Scroll to zoom • Drag top handle to rotate
        </div>
      </div>

      <div class="bottom-bar">
        <button class="new-btn" @click=${this.newProject} title="New Project">
          <div class="new-btn-bg"></div>
        </button>

        <div class="zoom-controls">
          <button class="zoom-btn" @click=${this.zoomOut} title="Zoom Out">
            <div class="zoom-btn-bg"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <span class="zoom-level" @click=${this.resetZoom} title="Reset Zoom">${this.zoomLevel}%</span>
          <button class="zoom-btn" @click=${this.zoomIn} title="Zoom In">
            <div class="zoom-btn-bg"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
        </div>

        <div class="dropdown">
          <div class="dropdown-menu ${this.showExportMenu ? '' : 'hidden'}">
            <button class="dropdown-item" @click=${this.exportSvg} title="Export as SVG">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </button>
            <button class="dropdown-item" @click=${this.exportPng} title="Export as PNG">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>
          </div>
          <button class="export-btn" @click=${this.toggleExportMenu} title="Export">
            <div class="export-btn-bg"></div>
            <svg class="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-screen': EditorScreen;
  }
}
