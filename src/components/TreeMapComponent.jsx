import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import * as d3 from 'd3';
import './eep-alumni.css';

interface Data {
  name: string;
  location: string;
  department: string;
  programYear: string;
  image?: string; // Optional image URL for avatars
}

interface OrgNode {
  name: string;
  location: string;
  department: string;
  programYear: string;
  image?: string;
  children?: OrgNode[];
}

const EepAlumni: React.FC = () => {
  const [data, setData] = useState<Data[]>([]);
  const [filteredData, setFilteredData] = useState<Data[]>([]);
  const [yearFilter, setYearFilter] = useState<string>('');
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Parse Excel File
  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryStr = e.target?.result as string;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      setData(jsonData as Data[]);
    };
    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelFile(file);
    }
  };

  // Filter data based on year
  useEffect(() => {
    if (yearFilter) {
      setFilteredData(data.filter(item => item.programYear === yearFilter));
    } else {
      setFilteredData(data);
    }
  }, [data, yearFilter]);

  // Build hierarchical tree data
  const buildTreeData = (): OrgNode | null => {
    if (!filteredData.length) return null;

    const root: OrgNode = { name: 'Root', location: '', department: '', programYear: '', children: [] };
    const departments: { [key: string]: OrgNode } = {};

    filteredData.forEach((item) => {
      if (!departments[item.department]) {
        departments[item.department] = {
          name: item.department,
          location: '',
          department: item.department,
          programYear: '',
          children: [],
        };
      }
      departments[item.department].children?.push({
        name: item.name,
        location: item.location,
        department: item.department,
        programYear: item.programYear,
        image: item.image || '',
        children: [],
      });
    });

    root.children = Object.values(departments);
    return root;
  };

  // Render chart using D3
  useEffect(() => {
    const treeData = buildTreeData();
    if (!treeData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous content

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree<OrgNode>().size([width, height - 150]); // Adjusted height for spacing
    const tree = treeLayout(root);

    const nodes = tree.descendants();
    const links = tree.links();

    // Adjust spacing between nodes
    const nodeHeight = 100; // Minimum vertical space between nodes
    nodes.forEach(node => (node.y = node.depth * nodeHeight));

    // Create links
    svg.selectAll('.link')
      .data(links)
      .join('path')
      .attr('class', 'link')
      .attr('d', d3.linkVertical<d3.HierarchyPointLink<OrgNode>, d3.HierarchyPointNode<OrgNode>>()
        .x(d => d.x) // x for horizontal position
        .y(d => d.y)) // y for vertical position
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2);

    // Create nodes
    const nodeGroup = svg.selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    // Add images to nodes
    nodeGroup.append('image')
      .attr('xlink:href', d => d.data.image || 'https://via.placeholder.com/50')
      .attr('x', -25)
      .attr('y', -60)
      .attr('width', 50)
      .attr('height', 50)
      .attr('clip-path', 'circle(25px at 25px 25px)');

    // Add rectangles for each node
    nodeGroup.append('rect')
      .attr('width', 140)
      .attr('height', 50)
      .attr('x', -70)
      .attr('y', -25)
      .attr('rx', 10)
      .attr('ry', 10)
      .style('fill', '#f9f9f9')
      .style('stroke', '#ccc');

    // Add names inside rectangles
    nodeGroup.append('text')
      .attr('dy', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#333')
      .text(d => d.data.name);

    // Add role or department below name
    nodeGroup.append('text')
      .attr('dy', 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#666')
      .text(d => d.data.department);
  }, [filteredData]);

  return (
    <div className="chart-container">
      <div className="controls">
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          <option value="">All Years</option>
          {[...new Set(data.map(item => item.programYear))].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <div className="chart-wrapper">
        <svg ref={svgRef} />
      </div>
    </div>
  );
};

export default EepAlumni;

.chart-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f8f8f8;
}

.controls select {
  width: auto;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.chart-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden; /* Prevent overflow */
}

svg {
  width: 100%; /* Ensure SVG fits within parent */
  height: 100%;
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

