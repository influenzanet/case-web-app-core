export type SymptomsToImageMap = {
  [key: string]: string;
  default: string;
};

export type GenderKeys = "0" | "1" | "2";

export type SymptomsConfig = {
  [K in GenderKeys]: SymptomsToImageMap[];
};

function isValidSymptomsToImageMap(item: any): item is SymptomsToImageMap {
  return (
    typeof item === "object" &&
    item !== null &&
    "default" in item &&
    typeof item.default === "string"
  );
}

export function isValidUserSymptomsHistoryConfig(
  obj: any
): obj is SymptomsConfig {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const validKeys: GenderKeys[] = ["0", "1", "2"];
  for (const key of validKeys) {
    if (!(key in obj) || !Array.isArray(obj[key])) {
      return false;
    }

    for (const item of obj[key]) {
      if (!isValidSymptomsToImageMap(item)) {
        return false;
      }
    }
  }

  return true;
}
