
export const parseBooleanFlag = (v: string|undefined, empty: boolean, other: boolean ):boolean => {
  const b = (v ?? '').toLowerCase().trim();
  if(b === '') {
    return empty;
  }
  if(b === "1" || b === "true" || b === "on") {
    return true;
  }
  return other;
}
