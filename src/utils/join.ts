export function safeJoin(arr: unknown[], separator = ',') {
  return arr.filter((v) => v !== undefined).join(separator)
}
