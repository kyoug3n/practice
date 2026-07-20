const SVG_NS = "http://www.w3.org/2000/svg";

function strokeIcon(pathData: string): SVGSVGElement {
  const icon = document.createElementNS(SVG_NS, "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", pathData);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "2");
  icon.append(path);

  return icon;
}

export function trashIcon(): SVGSVGElement {
  return strokeIcon("M5 7h14M9 7V5h6v2M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13");
}

export function pencilIcon(): SVGSVGElement {
  return strokeIcon(
    "m4.75 16-.5 4 4-.5L19.75 8 16.25 4.5 4.75 16Zm9.5-9.5 3.5 3.5",
  );
}

export function chevronIcon(): SVGSVGElement {
  return strokeIcon("M6 9l6 6 6-6");
}

export function refreshIcon(): SVGSVGElement {
  return strokeIcon(
    "M20 11a8 8 0 0 0-14.9-3M4 5v4h4M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4",
  );
}
