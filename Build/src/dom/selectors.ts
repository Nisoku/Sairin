export function find<T extends Element = HTMLElement>(
  selector: string,
  parent?: ParentNode,
): T | null {
  return (parent ?? document).querySelector<T>(selector);
}

export function findAll<T extends Element = HTMLElement>(
  selector: string,
  parent?: ParentNode,
): T[] {
  return Array.from((parent ?? document).querySelectorAll<T>(selector));
}
