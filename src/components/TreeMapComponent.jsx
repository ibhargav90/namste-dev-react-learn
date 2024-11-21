import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import "./eep-alumni.css";

type OrgNode = {
  name: string;
  department: string;
  image?: string;
  year: string;
  children?: OrgNode[];
};

type EepAlumniProps = {
  data: OrgNode[];
};

const EepAlumni: React.FC<EepAlumniProps> = ({ data }) => {
  const [filteredYear, setFilteredYear] = useState<string>("All Years");
  const svgRef = useRef<SVGSVGElement | null>(null);

  const years = Array.from(new Set(data.map((d) => d.year))).sort();

  const filteredData = filteredYear === "All Years" ? data : data.filter((d) => d.year === filteredYear);

  const buildTreeData = (): OrgNode | null => {
    if (filteredData.length === 0) return null;

    const rootNode = filteredData[0];
    return rootNode;
  };

  useEffect(() => {
    const treeData = buildTreeData();
    if (!treeData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const root = d3.hierarchy(treeData);

    const horizontalSpacing = 150; // Minimum space between sibling nodes
    const verticalSpacing = 120; // Minimum vertical space between nodes

    const treeLayout = d3.tree<OrgNode>().nodeSize([horizontalSpacing, verticalSpacing]);

    const tree = treeLayout(root);

    const nodes = tree.descendants();
    const links = tree.links();

    // Adjust root positioning (padding for the top)
    const padding = 100;
    nodes.forEach((node) => (node.y += padding));

    // Create links
    svg.selectAll(".link")
      .data(links)
      .join("path")
      .attr("class", "link")
      .attr(
        "d",
        d3
          .linkVertical<d3.HierarchyPointLink<OrgNode>, d3.HierarchyPointNode<OrgNode>>()
          .x((d) => d.x) // x for horizontal position
          .y((d) => d.y) // y for vertical position
      )
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2);

    // Create nodes
    const nodeGroup = svg
      .selectAll(".node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    // Add images to nodes
    nodeGroup
      .append("image")
      .attr("xlink:href", (d) => d.data.image || "https://via.placeholder.com/50")
      .attr("x", -25)
      .attr("y", -60)
      .attr("width", 50)
      .attr("height", 50)
      .attr("clip-path", "circle(25px at center)");

    // Add rectangles for each node
    nodeGroup
      .append("rect")
      .attr("width", 140)
      .attr("height", 50)
      .attr("x", -70)
      .attr("y", -25)
      .attr("rx", 10)
      .attr("ry", 10)
      .style("fill", "#f9f9f9")
      .style("stroke", "#ccc");

    // Add names inside rectangles
    nodeGroup
      .append("text")
      .attr("dy", -5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#333")
      .text((d) => d.data.name);

    // Add role or department below name
    nodeGroup
      .append("text")
      .attr("dy", 10)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#666")
      .text((d) => d.data.department);
  }, [filteredData]);

  return (
    <div className="chart-wrapper">
      <div className="filter-bar">
        <select
          value={filteredYear}
          onChange={(e) => setFilteredYear(e.target.value)}
          className="year-select"
        >
          <option>All Years</option>
          {years.map((year) => (
            <option key={year}>{year}</option>
          ))}
        </select>
      </div>
      <svg ref={svgRef} className="chart"></svg>
    </div>
  );
};

export default EepAlumni;
.chart-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto; /* Allow scrolling for large charts */
  padding: 20px; /* Ensure proper spacing around the chart */
}

.filter-bar {
  margin-bottom: 10px;
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

.year-select {
  width: auto; /* Adjust dropdown width */
  padding: 5px;
  font-size: 14px;
}

svg.chart {
  width: 100%; /* Scale SVG to fit the parent container */
  height: 800px; /* Set initial height */
  overflow: visible;
}

.link {
  fill: none;
  stroke: #ccc;
  stroke-width: 2px;
}

.node rect {
  fill: #f9f9f9;
  stroke: #ccc;
  stroke-width: 1px;
}

.node text {
  font-family: Arial, sans-serif;
  pointer-events: none;
}

.node image {
  clip-path: circle(25px at center);
}
