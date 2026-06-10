export type LooseVersion = {
  major: number
  minor: number | null
  patch: number | null
}

export function parseLooseVersion(value: string): LooseVersion | null {
  const match = value.match(/(?:^|[^\d])(\d+)(?:\.(\d+|x))?(?:\.(\d+|x))?/i)
  if (!match) return null

  return {
    major: Number(match[1]),
    minor: match[2] && match[2].toLowerCase() !== 'x' ? Number(match[2]) : null,
    patch: match[3] && match[3].toLowerCase() !== 'x' ? Number(match[3]) : null,
  }
}

export function compareLooseVersion(left: LooseVersion, right: LooseVersion): number {
  const leftParts = [
    left.major,
    left.minor ?? Number.MAX_SAFE_INTEGER,
    left.patch ?? Number.MAX_SAFE_INTEGER,
  ]
  const rightParts = [
    right.major,
    right.minor ?? Number.MAX_SAFE_INTEGER,
    right.patch ?? Number.MAX_SAFE_INTEGER,
  ]

  for (let index = 0; index < leftParts.length; index++) {
    if (leftParts[index] > rightParts[index]) return 1
    if (leftParts[index] < rightParts[index]) return -1
  }

  return 0
}
