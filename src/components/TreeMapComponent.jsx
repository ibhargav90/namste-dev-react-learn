import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import * as d3 from 'd3';

interface Data {
  name: string;
  location: string;
  department: string;
  programYear: string;
}

interface OrgNode {
  name: string;
  location: string;
  department: string;
  programYear: string;
  children?: OrgNode[];
}

// Modify the d3 types by extending the HierarchyNode
interface D3HierarchyNode extends d3.HierarchyPointNode<OrgNode> {
  x: number;
  y: number;
}

const DepartmentTreeMap: React.FC = () => {
  const [data, setData] = useState<Data[]>([]);
  const [filteredData, setFilteredData] = useState<Data[]>([]);
  const [yearFilter, setYearFilter] = useState<string>('');
  const [treeData, setTreeData] = useState<OrgNode | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Function to parse the Excel file and extract data
  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0]; // Assuming the first sheet
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      setData(jsonData as Data[]); // Set data state once parsing is done
    };
    reader.readAsBinaryString(file);
  };

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseExcelFile(file);
    }
  };

  // Filter data based on the selected year
  useEffect(() => {
    if (yearFilter) {
      setFilteredData(data.filter(item => item.programYear === yearFilter));
    } else {
      setFilteredData(data);
    }
  }, [data, yearFilter]);

  // Build tree data for d3.js based on the filtered data
  useEffect(() => {
    if (filteredData.length > 0) {
      const orgTree = buildOrgTree(filteredData);
      setTreeData(orgTree);
    }
  }, [filteredData]);

  // Helper function to build hierarchical tree structure
  const buildOrgTree = (filteredData: Data[]): OrgNode => {
    const root: OrgNode = { name: 'Root', location: '', department: '', programYear: '', children: [] };
    
    // Group nodes by department
    const departmentMap: { [key: string]: OrgNode } = {};

    filteredData.forEach(item => {
      const { department, location, name, programYear } = item;
      const nodeId = `${department}-${location}-${name}`;
      
      if (!departmentMap[department]) {
        departmentMap[department] = {
          name: department,
          location: '',
          department,
          programYear: '',
          children: [],
        };
      }

      departmentMap[department].children?.push({
        name,
        location,
        department,
        programYear,
        children: [],
      });
    });

    // Add departments to root
    Object.values(departmentMap).forEach(department => root.children?.push(department));

    return root;
  };

  // Render the tree using d3.js
  useEffect(() => {
    if (treeData && svgRef.current) {
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;

      const root = d3.hierarchy(treeData);
      const treeLayout = d3.tree().size([height, width - 160]);

      treeLayout(root);

      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height);

      const nodes = svg.selectAll('.node')
        .data(root.descendants())
        .join('g')
        .attr('class', 'node')
        .attr('transform', (d: D3HierarchyNode) => `translate(${d.y},${d.x})`);

      nodes.append('circle')
        .attr('r', 10)
        .style('fill', '#69b3a2');

      nodes.append('text')
        .attr('dx', 12)
        .attr('dy', 3)
        .text((d: D3HierarchyNode) => d.data.name);

      const links = svg.selectAll('.link')
        .data(root.links())
        .join('line')
        .attr('class', 'link')
        .attr('x1', (d: any) => d.source.y)
        .attr('y1', (d: any) => d.source.x)
        .attr('x2', (d: any) => d.target.y)
        .attr('y2', (d: any) => d.target.x)
        .style('stroke', '#ccc')
        .style('stroke-width', 2);
    }
  }, [treeData]);

  return (
    <div>
      {/* File input for uploading the Excel file */}
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />

      {/* Dropdown to filter by year */}
      <select onChange={(e) => setYearFilter(e.target.value)} value={yearFilter}>
        <option value="">Select Year</option>
        {Array.from(new Set(data.map(item => item.programYear))).map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      {/* SVG container for D3 tree */}
      <div style={{ marginTop: '20px', height: '600px', width: '100%' }}>
        <svg ref={svgRef} />
      </div>
    </div>
  );
};

export default DepartmentTreeMap;
