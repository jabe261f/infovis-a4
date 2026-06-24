// This is your playground!
// Add functionality to your html controls, play with cytoscape's events and make those magic lenses!

/* global fetch, cytoscape */
import _style from "./style.js";
import { default as d3Fisheye } from "./libs/d3-fisheye-2.1.2.js";
import { default as _ } from "./libs/underscore-1.13.6.js";

async function getData() {
  const _data = await (await fetch("data/data.json")).json();
  const football = await (await fetch("data/football.json")).json();
  const data = [];

  football.nodes.forEach((n) => {
    data.push({
      data: {
        ...n,
        name: n.label,
      },
      group: "nodes",
    });
  });

  football.edges.forEach((n) => {
    data.push({
      data: {
        id: n.id,
        source: n.src,
        target: n.dst,
        weight: n.val,
      },
      group: "edges",
    });
  });

  return data;
}

function nodeAttributeKeys(node) {
  return Object.keys(node.data()).filter((key) => {
    if (key === "id" || key === "name" || key === "label") {
      return false;
    }

    const value = node.data(key);
    return typeof value === "number" && Number.isFinite(value);
  });
}

function hasManyAttributes(node) {
  return nodeAttributeKeys(node).length >= 10;
}

function renderRadarCharts(nodes, layer, cy) {
  if (!window.RadarChart) {
    return;
  }

  layer.innerHTML = "";

  let chartNodes = nodes.toArray();
  if (cy && getZoomLevel(cy.zoom()) === 2) {
    const existingIds = new Set(chartNodes.map((n) => n.id()));
    const visibleNodes = nodesInView(cy)
      .filter((n) => !existingIds.has(n.id()))
      .toArray();
    chartNodes = chartNodes.concat(visibleNodes);
  }

  chartNodes = chartNodes.slice(0, 20);
  const chartSize = 80;

  chartNodes.forEach((node) => {
    const attrs = nodeAttributeKeys(node);
    if (attrs.length === 0) {
      return;
    }

    const chartData = attrs.map((key) => {
      const value = Number(node.data(key));
      return {
        axis: key,
        value: Number.isFinite(value) ? value : 0,
      };
    });

    const chartId = `radar-${node.id()}`;
    const wrapper = document.createElement("div");
    wrapper.id = chartId;
    wrapper.className = "radar-chart-wrapper";
    wrapper.style.width = `${chartSize}px`;
    wrapper.style.height = `${chartSize}px`;
    wrapper.style.left = `${node.renderedPosition().x}px`;
    wrapper.style.top = `${node.renderedPosition().y}px`;

    layer.appendChild(wrapper);

    RadarChart(`#${chartId}`, [chartData], {
      w: chartSize,
      h: chartSize,
      margin: { top: 6, right: 6, bottom: 6, left: 6 },
      levels: 3,
      maxValue: Math.max(1, d3.max(chartData, (d) => d.value)),
      roundStrokes: true,
      color: d3.scaleOrdinal(["#1f77b4"]),
    });
  });
}

function getZoomLevel(zoom) {
  if (zoom < 0.8) {
    return 0;
  }

  if (zoom < 1.6) {
    return 1;
  }

  return 2;
}


function updateZoomView(cy, layer, semanticZoomEnabled = true) {
  if (!semanticZoomEnabled) {
    cy.batch(() => {
      cy.nodes().show();
      layer.innerHTML = "";
    });
    return;
  }

  const level = getZoomLevel(cy.zoom());

  cy.batch(() => {
    const many = cy.nodes().filter(hasManyAttributes);
    const few = cy.nodes().difference(many);

    if (level === 0) {
      few.hide();
      many.show();
      layer.innerHTML = "";
    } else if (level === 1) {
      few.show();
      many.show();
      layer.innerHTML = "";
    } else {
      few.show();
      many.show();
      renderRadarCharts(nodesInView(cy), layer, cy);
    }
  });
}

function getLensCircle() {
  const lens = document.getElementById("lens");
  if (!lens) {
    return null;
  }

  return {
    x: Number(lens.getAttribute("cx")) || 0,
    y: Number(lens.getAttribute("cy")) || 0,
    r: Number(lens.getAttribute("r")) || 0,
  };
}

function nodesInLens(cy) {
  const circle = getLensCircle();
  if (!circle) {
    return cy.collection();
  }

  return cy.nodes().filter((n) => {
    const pos = n.renderedPosition();
    const dx = pos.x - circle.x;
    const dy = pos.y - circle.y;
    return dx * dx + dy * dy <= circle.r * circle.r;
  });
}


function updateLensEffects(cy, layer, lensMode) {
  cy.nodes().removeClass("magic");
  cy.edges().removeClass("magic");
  layer.innerHTML = "";

  if (lensMode === "star") {
    const nodes = nodesInLens(cy);
    nodes.addClass("magic");
    renderRadarCharts(nodes, layer, cy);
  } else if (lensMode === "edges") {
    const nodes = nodesInLens(cy);
    const connected = cy.edges().filter((edge) => {
      return nodes.contains(edge.source()) || nodes.contains(edge.target());
    });
    connected.addClass("magic");
  }
}

function styleNodes(cy) {
  cy.batch(() => {
      const many = cy.nodes().filter(hasManyAttributes);
      const few = cy.nodes().difference(many);
      many.addClass("highattr");
      few.addClass("lowattr");
  });
}


// returns true if the point "p" is inside the circle defined by "c" (center) and "r" (radius)
function isInCircle(c, r, p) {
  return Math.pow(p.x - c.x, 2) + Math.pow(p.y - c.y, 2) <= Math.pow(r, 2);
}

// returns the nodes that are visible 
function nodesInView(cy) {
  const ext = cy.extent();

  return cy.nodes().filter(n => {
    const bb = n.boundingBox()
    return bb.x1 > ext.x1 && bb.x2 < ext.x2 && bb.y1 > ext.y1 && bb.y2 < ext.y2
  })
}

async function main() {
  const data = await getData();

  const cy = cytoscape({
    container: document.getElementById("cy"),
    elements: data,
  });

  const layout = cy.layout({
    name: "cola",
    nodeSpacing: 50,
    edgeLength: 800,
    animate: true,
    randomize: false,
    maxSimulationTime: 2000,
  });
  
  layout.run(); // emits special events! 
  
  cy.style(_style);

  const chartLayer = document.getElementById("chart-layer");
  const lens = document.getElementById("lens");
  const lensSvg = lens?.ownerSVGElement;
  const lensRadiusInput = document.getElementById("lens-radius");
  const lensRadiusValue = document.getElementById("lens-radius-value");
  const semanticZoomCheckbox = document.getElementById("semantic-zoom");
  const lensModeSelect = document.getElementById("lens-mode");
  let semanticZoomEnabled = semanticZoomCheckbox?.checked ?? true;
  let lensMode = lensModeSelect?.value || "star";

  function setLensRadius(radius) {
    if (lens) {
      lens.setAttribute("r", String(radius));
    }
    if (lensRadiusValue) {
      lensRadiusValue.textContent = String(radius);
    }
  }

  if (lensRadiusInput) {
    setLensRadius(Number(lensRadiusInput.value));
    lensRadiusInput.addEventListener("input", () => {
      setLensRadius(Number(lensRadiusInput.value));
      updateLensEffects(cy, chartLayer, lensMode);
    });
  }

  if (semanticZoomCheckbox) {
    semanticZoomCheckbox.addEventListener("change", () => {
      semanticZoomEnabled = semanticZoomCheckbox.checked;
      updateZoomView(cy, chartLayer, semanticZoomEnabled);
      updateLensEffects(cy, chartLayer, lensMode);
    });
  }

  if (lensModeSelect) {
    lensModeSelect.addEventListener("change", () => {
      lensMode = lensModeSelect.value;
      updateLensEffects(cy, chartLayer, lensMode);
    });
  }

  styleNodes(cy);
  updateZoomView(cy, chartLayer, semanticZoomEnabled);
  
  cy.on("zoom", () => {
    updateZoomView(cy, chartLayer, semanticZoomEnabled);
  });
  cy.on("pan", _.throttle(() => {
    if (semanticZoomEnabled && getZoomLevel(cy.zoom()) === 2) {
      renderRadarCharts(nodesInView(cy), chartLayer, cy);
    }
  }, 100));

  cy.on("mousemove", _.throttle((e) => {
    const mouse = { x: e.originalEvent.clientX, y: e.originalEvent.clientY };
    console.log(`Mouse position: [x: ${mouse.x}, y: ${mouse.y}]`);

    if (lens && lensSvg && lensSvg.getScreenCTM) {
      const pt = lensSvg.createSVGPoint();
      pt.x = mouse.x;
      pt.y = mouse.y;
      const svgP = pt.matrixTransform(lensSvg.getScreenCTM().inverse());
      lens.setAttribute("cx", svgP.x);
      lens.setAttribute("cy", svgP.y);
      updateLensEffects(cy, chartLayer, lensMode);
    }
  }, 10));
  
}

main();
