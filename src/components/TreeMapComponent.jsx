import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import * as d3 from 'd3';
import './OrganizationChart.css'; // Add CSS for styling

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
  image?: string; // Optional image URL for avatars
  children?: OrgNode[];
}

const OrganizationChart: React.FC = () => {
  const [data, setData] = useState<Data[]>([]);
  const [filteredData, setFilteredData] = useState<Data[]>([]);
  const [yearFilter, setYearFilter] = useState<string>('');
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Parse the Excel file
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

  // Filter data based on selected year
  useEffect(() => {
    if (yearFilter) {
      setFilteredData(data.filter(item => item.programYear === yearFilter));
    } else {
      setFilteredData(data);
    }
  }, [data, yearFilter]);

  // Build hierarchical tree structure
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
        image: item.image || '', // Optional image
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
    const treeLayout = d3.tree<OrgNode>().size([height, width - 200]);
    const tree = treeLayout(root);

    const nodes = tree.descendants();
    const links = tree.links();

    // Create links
    svg.selectAll('.link')
      .data(links)
      .join('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<d3.HierarchyPointLink<OrgNode>, d3.HierarchyPointNode<OrgNode>>()
        .x(d => d.y)
        .y(d => d.x))
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2);

    // Create nodes
    const nodeGroup = svg.selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`);

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
      .attr('dy', 0)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#333')
      .text(d => d.data.name);

    // Add role or department below name
    nodeGroup.append('text')
      .attr('dy', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#666')
      .text(d => d.data.department);
  }, [filteredData]);

  return (
    <div>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
        <option value="">All Years</option>
        {[...new Set(data.map(item => item.programYear))].map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      <div style={{ width: '100%', height: '600px', overflow: 'hidden' }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default OrganizationChart;



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

.node text:nth-child(1) {
  font-weight: bold;
}

