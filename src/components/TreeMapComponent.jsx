import React, { useState } from "react";
import * as XLSX from "xlsx";
import { ResponsiveTreeMap } from "@nivo/treemap";

interface ExcelRow {
  name: string;
  location: string;
  department: string;
  "programme-year": string | number;
}

interface TreeNode {
  name: string;
  children?: TreeNode[];
  value?: number;
}

const TreeMapComponent: React.FC = () => {
  const [data, setData] = useState<TreeNode | null>(null);
  const [filterYear, setFilterYear] = useState<string>("");

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

  const formatData = (jsonData: ExcelRow[]): void => {
    const filteredData = filterYear
      ? jsonData.filter((row) => row["programme-year"].toString() === filterYear)
      : jsonData;

    const hierarchy: TreeNode = {
      name: "root",
      children: [],
    };

    const groupedData = filteredData.reduce<Record<string, Record<string, ExcelRow[]>>>(
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
    );

    Object.entries(groupedData).forEach(([department, locations]) => {
      const departmentNode: TreeNode = {
        name: department,
        children: [],
      };

      Object.entries(locations).forEach(([location, rows]) => {
        departmentNode.children!.push({
          name: location,
          value: rows.length,
        });
      });

      hierarchy.children!.push(departmentNode);
    });

    setData(hierarchy);
  };

  return (
    <div>
      <h2>Tree Map Viewer</h2>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
      />
      <select
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          setFilterYear(e.target.value)
        }
        value={filterYear}
      >
        <option value="">All Years</option>
        {/* Add available years dynamically */}
        {data?.children &&
          [...new Set(data.children.flatMap((d) => d.children?.map((c) => c.name)))]
            .sort()
            .map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
      </select>
      {data ? (
        <div style={{ height: 600 }}>
          <ResponsiveTreeMap
            root={data}
            identity="name"
            value="value"
            label={(node) => `${node.id} (${node.value})`}
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
