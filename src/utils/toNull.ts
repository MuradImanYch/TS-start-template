export default function toNull<T>(value: T | "" | null | undefined): T | null {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return value as T;
}