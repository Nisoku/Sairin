export interface PathKey {
  readonly segments: readonly string[];
  readonly raw: string;
  readonly isGlob: boolean;
  readonly globType: "none" | "shallow" | "deep";
}

function serializePath(segments: readonly string[]): string {
  return "/" + segments.join("/");
}

export function path(...parts: (string | number)[]): PathKey {
  const segments: string[] = [];
  let globType: PathKey["globType"] = "none";

  for (const part of parts) {
    const str = String(part);

    if (str === "*") {
      if (globType === "deep") {
        throw new Error("Cannot use * after ** in path");
      }
      globType = "shallow";
      segments.push("*");
    } else if (str === "**") {
      if (globType === "shallow") {
        throw new Error("Cannot use ** after * in path");
      }
      globType = "deep";
      segments.push("**");
    } else if (str === "") {
      throw new Error("Path segment cannot be empty");
    } else {
      if (str.includes('/')) {
        throw new Error("Path segment cannot contain '/'");
      }
      segments.push(str);
    }
  }

  return {
    segments,
    raw: serializePath(segments),
    isGlob: globType !== "none",
    globType,
  };
}

export function isPathKey(value: unknown): value is PathKey {
  return (
    typeof value === "object" &&
    value !== null &&
    "segments" in value &&
    "raw" in value
  );
}

export function matchesPath(pattern: PathKey, target: PathKey): boolean {
  if (pattern.globType === "none") {
    return pattern.raw === target.raw;
  }

  if (pattern.globType === "deep") {
    // Implement segment-wise matching handling '**' as zero-or-more segments
    const p = pattern.segments;
    const t = target.segments;

    let pi = 0;
    let ti = 0;

    while (pi < p.length && ti < t.length) {
      if (p[pi] === "**") {
        // If '**' is last pattern segment it matches the rest.
        if (pi === p.length - 1) return true;
        // Otherwise try to find a match for the next pattern segment
        const next = p[pi + 1];
        // advance ti until we find next (or run out)
        while (ti < t.length && t[ti] !== next) {
          ti++;
        }
        // move past the '**' and continue
        pi++;
        continue;
      }

      if (p[pi] === "*") {
        pi++;
        ti++;
        continue;
      }

      if (p[pi] !== t[ti]) return false;

      pi++;
      ti++;
    }

    // If we've consumed pattern, success only if we've also consumed target
    if (pi === p.length) return ti === t.length;
    // Remaining pattern could be a trailing '**'
    if (pi === p.length - 1 && p[pi] === "**") return true;
    return false;
  }

  if (pattern.globType === "shallow") {
    if (pattern.segments.length !== target.segments.length) {
      return false;
    }
    for (let i = 0; i < pattern.segments.length; i++) {
      const pSeg = pattern.segments[i];
      if (pSeg !== "*" && pSeg !== target.segments[i]) {
        return false;
      }
    }
    return true;
  }

  return false;
}

// Glob segments are stripped: parent of /user/** is /user, not /**
export function getParentPath(p: PathKey): PathKey | null {
  const nonGlobSegments = p.segments.filter((s) => s !== "*" && s !== "**");
  if (nonGlobSegments.length <= 1) {
    return null;
  }
  return path(...nonGlobSegments.slice(0, -1));
}

export function joinPath(base: PathKey, ...parts: string[]): PathKey {
  // Joining onto a glob path is not meaningful, globs are stripped from base
  const nonGlobSegments = base.segments.filter((s) => s !== "*" && s !== "**");
  return path(...nonGlobSegments, ...parts);
}
