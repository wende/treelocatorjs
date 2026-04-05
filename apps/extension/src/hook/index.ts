type Listener = (...args: any[]) => void;

type DevToolsHook = {
  renderers: Map<number, any>;
  supportsFiber: boolean;
  inject: (renderer: any) => number;
  on: (event: string, handler: Listener) => void;
  off: (event: string, handler: Listener) => void;
  sub: (event: string, handler: Listener) => () => void;
  emit: (event: string, ...payload: any[]) => void;
  onCommitFiberRoot: (rendererId: number, root: any, priorityLevel?: number) => void;
  onCommitFiberUnmount: (rendererId: number, fiber: any) => void;
  checkDCE: () => void;
};

function createHook(): DevToolsHook {
  let rendererIdCounter = 0;
  const listeners = new Map<string, Set<Listener>>();

  const hook: DevToolsHook = {
    renderers: new Map<number, any>(),
    supportsFiber: true,
    inject(renderer: any): number {
      rendererIdCounter += 1;
      const rendererId = rendererIdCounter;
      hook.renderers.set(rendererId, renderer);
      hook.emit("renderer", { id: rendererId, renderer });
      return rendererId;
    },
    on(event: string, handler: Listener): void {
      if (!listeners.has(event)) {
        listeners.set(event, new Set<Listener>());
      }
      listeners.get(event)?.add(handler);
    },
    off(event: string, handler: Listener): void {
      listeners.get(event)?.delete(handler);
    },
    sub(event: string, handler: Listener): () => void {
      hook.on(event, handler);
      return () => hook.off(event, handler);
    },
    emit(event: string, ...payload: any[]): void {
      const eventListeners = listeners.get(event);
      if (!eventListeners) {
        return;
      }
      for (const listener of eventListeners) {
        try {
          listener(...payload);
        } catch {
          // Ignore hook listener errors to avoid breaking inspected apps.
        }
      }
    },
    onCommitFiberRoot(rendererId: number, root: any, priorityLevel?: number): void {
      hook.emit("commitFiberRoot", rendererId, root, priorityLevel);
    },
    onCommitFiberUnmount(rendererId: number, fiber: any): void {
      hook.emit("commitFiberUnmount", rendererId, fiber);
    },
    checkDCE(): void {
      // No-op parity with DevTools hook API.
    }
  };

  return hook;
}

function installHookBridge(): void {
  const win = window as any;

  if (!win.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    Object.defineProperty(win, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
      value: createHook(),
      configurable: true,
      enumerable: false,
      writable: false
    });
  }

  if (document.documentElement) {
    document.documentElement.dataset.treelocatorHookBridge = "installed";
  }
}

installHookBridge();
