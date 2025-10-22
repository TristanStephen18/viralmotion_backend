import fs from "fs";
import XLSX from "xlsx";
import fetch from "node-fetch"; // ensure installed via `npm install node-fetch`

// For JSON from a URL or local path
export async function extractFromJsonPath(filePath) {
  let fileContent;

  // If it's a remote file (starts with http)
  if (filePath.startsWith("http")) {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Failed to fetch JSON file: ${response.statusText}`);
    fileContent = await response.text();
  } else {
    fileContent = await fs.promises.readFile(filePath, "utf8");
  }

  let parsed = JSON.parse(fileContent);
  if (typeof parsed === "object" && !Array.isArray(parsed)) {
    parsed = [parsed];
  }
  if (!Array.isArray(parsed)) {
    throw new Error("JSON file must contain an array or object at the top level.");
  }
  if (!parsed.every(item => typeof item === "object" && item !== null)) {
    throw new Error("JSON array must contain objects.");
  }
  return parsed;
}

// For XLSX from a URL or local path
export async function extractFromXlsxPath(filePath) {
  let workbook;

  if (filePath.startsWith("http")) {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Failed to fetch XLSX file: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    workbook = XLSX.read(buffer, { type: "buffer" });
  } else {
    workbook = XLSX.readFile(filePath);
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("No sheets found in XLSX file.");
  }

  const result = {};
  let foundData = false;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    if (Array.isArray(data) && data.length > 0) {
      result[sheetName] = data;
      foundData = true;
    }
  }

  if (!foundData) {
    throw new Error("No data found in any sheet of the XLSX file.");
  }

  if (Object.keys(result).length === 1) {
    return result[workbook.SheetNames[0]];
  }

  return result;
}
