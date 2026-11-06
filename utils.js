export function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] || "th"}`;
}

export function findMoved(before, after) {
  for (const item of before) {
    const a = before.filter((x) => x.id !== item.id).map((x) => x.id).join(",");
    const b = after.filter((x) => x.id !== item.id).map((x) => x.id).join(",");
    const newIndex = after.findIndex((x) => x.id === item.id);
    if (a === b && before.indexOf(item) !== newIndex) return { item, position: newIndex };
  }
  return null;
}