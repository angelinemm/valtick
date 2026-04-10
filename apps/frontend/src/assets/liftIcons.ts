function svgIcon(color: string, label: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="${color}" rx="4"/><text x="50%" y="55%" font-size="7" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">${label}</text></svg>`
  )}`;
}

export const liftIcons: Record<string, string> = {
  "magic-carpet": svgIcon("#4caf50", "Magic Carpet"),
  "drag-lift":    svgIcon("#2196f3", "Drag Lift"),
  "chairlift":    svgIcon("#ff9800", "Chairlift"),
  "gondola":      svgIcon("#9c27b0", "Gondola"),
  "cable-car":    svgIcon("#f44336", "Cable Car"),
};
