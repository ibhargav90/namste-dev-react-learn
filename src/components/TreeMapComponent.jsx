import React, { useState } from "react";
import * as XLSX from "xlsx";
import * as d3 from "d3";

const TreeMapComponent = () => {
  const [data, setData] = useState([]);
  const [filterYear, setFilterYear] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        setData(jsonData);
      };
      reader.readAsBinaryString(file);
    }
  };

  const createTreeMap = () => {
    const filteredData = filterYear
      ? data.filter((row) => row["programme-year"] === filterYear)
      : data;

    // Prepare the hierarchical data structure
    const hierarchy = d3
      .hierarchy({ children: filteredData }, (d) =>
        d.children || d.department || d.location
      )
      .sum(() => 1);

    const width = 800;
    const height = 600;

    const treemap = d3.treemap().size([width, height]).padding(1);
    const root = treemap(hierarchy);

    const svg = d3
      .select("#tree-map")
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove(); // Clear previous renders

    svg
      .selectAll("rect")
      .data(root.leaves())
      .enter()
      .append("rect")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", "steelblue")
      .on("mouseover", (e, d) => {
        console.log(d.data);
      });

    svg
      .selectAll("text")
      .data(root.leaves())
      .enter()
      .append("text")
      .attr("x", (d) => d.x0 + 5)
      .attr("y", (d) => d.y0 + 20)
      .text((d) => d.data.name)
      .attr("font-size", "12px")
      .attr("fill", "white");
  };

  return (
    <div>
      <h2>Tree Map Viewer</h2>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      <select onChange={(e) => setFilterYear(e.target.value)} value={filterYear}>
        <option value="">All Years</option>
        {[...new Set(data.map((d) => d["programme-year"]))].map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <button onClick={createTreeMap}>Generate Tree Map</button>
      <svg id="tree-map"></svg>
    </div>
  );
};

export default TreeMapComponent;
