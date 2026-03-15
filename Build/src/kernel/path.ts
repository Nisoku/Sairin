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
    const baseSegments = pattern.segments.filter(
      (s) => s !== "*" && s !== "**",
    );
    const basePath = "/" + baseSegments.join("/");
    return target.raw === basePath || target.raw.startsWith(basePath + "/");
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
