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

function renderRadarCharts(cy, layer) {
  if (!window.RadarChart) {
    return;
  }

  layer.innerHTML = "";

  const visibleNodes = nodesInView(cy).toArray();
  const chartNodes = visibleNodes.slice(0, 20);

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
    wrapper.style.width = "120px";
    wrapper.style.height = "120px";
    wrapper.style.left = `${node.renderedPosition().x}px`;
    wrapper.style.top = `${node.renderedPosition().y}px`;

    layer.appendChild(wrapper);

    RadarChart(`#${chartId}`, [chartData], {
      w: 120,
      h: 120,
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
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


function updateZoomView(cy, layer) {
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
      renderRadarCharts(cy, layer);
    }
  });
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
  styleNodes(cy);
  updateZoomView(cy, chartLayer);
  
  cy.on("zoom", () => updateZoomView(cy, chartLayer));
  cy.on("pan", _.throttle(() => {
    if (getZoomLevel(cy.zoom()) === 2) {
      renderRadarCharts(cy, chartLayer);
    }
  }, 100));

  cy.on("mousemove", _.throttle(e => {
    const mouse = { x: e.originalEvent.x, y: e.originalEvent.y };
    console.log(`Mouse position: [x: ${mouse.x}, y: ${mouse.y}]`);

    cy.nodes().forEach((n) => {
      const node = n.renderedPosition(); // Careful: other position functions may invoke different coordinate systems

      // console.log(`Node position: [x: ${node.x}, y: ${node.y}]`);
    });
    
    /* 
      Your code also goes here! 

      HINTs: 
        1. use the "isInCircle" function defined above to calculate whether a node is inside the lens! 
        2. if you experience performance issues, use cy.startBatch() and cy.endBatch() to avoid unnecessary canvas redraws. See https://js.cytoscape.org/#cy.batch for more
        3. see below how to get the mouse and node positions
    */
  }, 100));
  
}

main();
