import React, { useState } from "react";
import * as XLSX from "xlsx";
import { ResponsiveTreeMap } from "@nivo/treemap";

// Define Excel row structure
interface ExcelRow {
  name: string;
  location: string;
  department: string;
  "programme-year": string | number;
}

// TreeMapDatum type as expected by @nivo/treemap
interface TreeMapDatum {
  id: string;
  value?: number; // Numeric value for leaf nodes
  children?: TreeMapDatum[]; // Child nodes
}

const TreeMapComponent: React.FC = () => {
  const [data, setData] = useState<TreeMapDatum | null>(null);
  const [filterYear, setFilterYear] = useState<string>("");

  // File upload handler
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

  // Convert flat Excel data to hierarchical TreeMapDatum
  const formatData = (jsonData: ExcelRow[]): void => {
    const filteredData = filterYear
      ? jsonData.filter((row) => row["programme-year"].toString() === filterYear)
      : jsonData;

    const hierarchy: TreeMapDatum = {
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
      {/* File upload */}
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />

      {/* Filter dropdown */}
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
          <ResponsiveTreeMap<TreeMapDatum>
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
