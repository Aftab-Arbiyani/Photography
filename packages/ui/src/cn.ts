/** Tiny classNames joiner — filters falsy values. Keeps the package dependency-free. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
