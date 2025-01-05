export function array<T>(target: T | T[]): T[] {
  return Array.isArray(target) ? target : [target];
}

export function display_time(time: number): string {
  // display: {X}ms
  if (time < 1000) {
    return `${time}ms`;
  }

  time = time / 1000;

  // display: {X}s
  if (time < 60) {
    return `${time.toFixed(2)}s`;
  }

  const mins = parseInt((time / 60).toString());
  const seconds = time % 60;

  // display: {X}m {Y}s
  return `${mins}m${seconds < 1 ? "" : ` ${seconds.toFixed(0)}s`}`;
}
