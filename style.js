const _style = [{
  "selector": "core",
  "style": {
    "selection-box-color": "#AAD8FF",
    "selection-box-border-color": "#8BB0D0",
    "selection-box-opacity": "0.5"
  }
}, {
  "selector": "node",
  "style": {
    "width": "mapData(mins, 0, 1000, 10, 100)",
    "height": "mapData(mins, 0, 1000, 10, 100)",
    "content": "data(name)",
    "font-size": "12px",
    "text-valign": "center",
    "text-halign": "center",
    "background-color": "#555",
    "text-outline-color": "#555",
    "text-outline-width": "2px",
    "color": "#fff",
    "overlay-padding": "6px",
    "z-index": "10"
  }
}, {
  "selector": "node.lowattr",
  "style": {
    "shape": "ellipse",
    "background-color": "#1f77b4",
    "border-width": "2px",
    "border-color": "#0b3d6c"
  }
}, {
  "selector": "node.highattr",
  "style": {
    "shape": "rectangle",
    "background-color": "#ff7f0e",
    "border-width": "2px",
    "border-color": "#b15000"
  }
}, {
  "selector": "node:selected",
  "style": {
    "border-width": "6px",
    "border-color": "#AAD8FF",
    "border-opacity": "0.5",
    "background-color": "#77828C",
    "text-outline-color": "#77828C"
  }
}, {
  "selector": "edge",
  "style": {
    "curve-style": "haystack", // bezier, taxi, ...
    "haystack-radius": "0.5",
    "opacity": "0.4",
    "line-color": "#bbb",
    "width": "mapData(weight, 0, 1, 1, 8)",
    "overlay-padding": "3px"
  }
}, {
  "selector": "node.magic",
  "style": {
    "border-width": "4px",
    "border-color": "#ffd700",
    "border-opacity": "0.9",
    "background-color": "#ffbf00",
    "background-opacity": "0.7"
  }
}, {
  "selector": "edge.magic",
  "style": {
    "line-color": "#ffa500",
    "width": "4px",
    "opacity": "0.95",
    "source-arrow-shape": "triangle",
    "target-arrow-shape": "triangle",
    "target-arrow-color": "#ffa500"
  }
}]

export default _style;