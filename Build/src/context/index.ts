export interface Context<T> {
  defaultValue: T;
  Provider: (props: { value: T; children?: any }) => () => void;
  consume: () => T;
}

const contextStacks = new Map<symbol, any[]>();

export function createContext<T>(defaultValue: T, name?: string): Context<T> {
  const contextId = Symbol(name);
  contextStacks.set(contextId, [defaultValue]);

  return {
    defaultValue,
    Provider: ({ value }: { value: T; children?: any }) => {
      const stack = contextStacks.get(contextId)!;
      stack.push(value);
      
      return () => {
        stack.pop();
      };
    },
    consume: () => {
      const stack = contextStacks.get(contextId);
      if (!stack || stack.length === 0) {
        return defaultValue;
      }
      return stack[stack.length - 1];
    },
  };
}

export interface ProviderProps<T> {
  value: T;
  children?: any;
}

export function useContext<T>(context: Context<T>): T {
  return context.consume();
}

export function useContextProvider<T>(context: Context<T>, value: T): () => void {
  return context.Provider({ value });
}

export interface CreateContextOptions<T> {
  name?: string;
  strict?: boolean;
}

export function createContextWithOptions<T>(
  defaultValue: T,
  options?: CreateContextOptions<T>
): Context<T> {
  return createContext(defaultValue, options?.name);
}
