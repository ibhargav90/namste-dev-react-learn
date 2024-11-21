import React, { useState } from "react";
import * as XLSX from "xlsx";
import { ResponsiveTreeMap } from "@nivo/treemap";

// Define the structure of each row in the Excel sheet
interface ExcelRow {
  name: string;
  location: string;
  department: string;
  "programme-year": string | number;
}

// Define the structure for hierarchical data
interface TreeNode {
  id: string;
  value?: number;
  children?: TreeNode[];
}

const TreeMapComponent: React.FC = () => {
  const [data, setData] = useState<TreeNode | null>(null);
  const [filterYear, setFilterYear] = useState<string>("");

  // Handle file upload and process Excel file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          const workbook = XLSX.read(e.target.result, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);
          formatData(jsonData);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  // Format the JSON data into hierarchical structure
  const formatData = (jsonData: ExcelRow[]): void => {
    const filteredData = filterYear
      ? jsonData.filter((row) => row["programme-year"].toString() === filterYear)
      : jsonData;

    const hierarchy: TreeNode = {
      id: "root",
      children: Object.entries(
        filteredData.reduce<Record<string, Record<string, ExcelRow[]>>>(
          (acc, row) => {
            const department = row.department || "Unknown";
            const location = row.location || "Unknown";

            if (!acc[department]) {
              acc[department] = {};
            }
            if (!acc[department][location]) {
              acc[department][location] = [];
            }

            acc[department][location].push(row);
            return acc;
          },
          {}
        )
      ).map(([department, locations]) => ({
        id: department,
        children: Object.entries(locations).map(([location, rows]) => ({
          id: location,
          value: rows.length,
        })),
      })),
    };

    setData(hierarchy);
  };

  return (
    <div>
      <h2>Tree Map Viewer</h2>
      {/* File upload input */}
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />

      {/* Dropdown for filtering by programme year */}
      <select
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          setFilterYear(e.target.value)
        }
        value={filterYear}
      >
        <option value="">All Years</option>
        {/* Add unique programme years dynamically */}
        {data?.children &&
          [...new Set(
            data.children.flatMap((department) =>
              department.children?.map((location) => location.id)
            )
          )]
            .sort()
            .map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
      </select>

      {/* Tree map visualization */}
      {data ? (
        <div style={{ height: 600 }}>
          <ResponsiveTreeMap
            root={data}
            identity="id"
            value="value"
            label={(node) => `${node.id} (${node.value || 0})`}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            colors={{ scheme: "nivo" }}
            labelSkipSize={12}
            borderColor={{ from: "color", modifiers: [["darker", 0.5]] }}
            animate={true}
          />
        </div>
      ) : (
        <p>Upload an Excel file to generate the tree map.</p>
      )}
    </div>
  );
};

export default TreeMapComponent;
