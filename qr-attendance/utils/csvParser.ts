export interface Person {
  name: string;
  id: string;
  extra: Record<string, string>;
}

export function parseCSV(csvText: string): { people: Person[]; errors: string[] } {
  // Strip BOM (byte-order mark) that some editors add silently
  const stripped = csvText.replace(/^\uFEFF/, "").trim();
  const lines = stripped.split(/\r?\n/);
  const errors: string[] = [];
  const people: Person[] = [];

  if (lines.length < 2) {
    return { people: [], errors: ["CSV must have a header row and at least one data row"] };
  }

  // Auto-detect delimiter: semicolon, tab, or comma
  const firstLine = lines[0];
  const delimiter =
    firstLine.split(";").length > firstLine.split(",").length
      ? ";"
      : firstLine.split("\t").length > firstLine.split(",").length
      ? "\t"
      : ",";

  const headers = firstLine
    .split(delimiter)
    .map((h) => h.trim().toLowerCase().replace(/['"]/g, "").replace(/\s+/g, " "));

  const nameIdx = headers.findIndex(
    (h) =>
      h === "name" ||
      h === "student name" ||
      h === "employee name" ||
      h === "full name" ||
      h === "fullname" ||
      h === "studentname" ||
      h === "nombre" ||
      h.includes("name")
  );
  const idIdx = headers.findIndex(
    (h) =>
      h === "id" ||
      h === "student id" ||
      h === "employee id" ||
      h === "roll no" ||
      h === "roll number" ||
      h === "studentid" ||
      h === "employeeid" ||
      h === "rollno" ||
      h.includes("id")
  );

  if (nameIdx === -1) {
    return { people: [], errors: ['CSV must have a "name" column (or "student name", "employee name", "full name")'] };
  }

  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = splitCSVLine(line, delimiter);
    const name = (cols[nameIdx] || "").trim().replace(/['"]/g, "");

    if (!name) {
      errors.push(`Row ${i + 1}: empty name, skipped`);
      continue;
    }

    const normalizedName = name.toLowerCase();
    if (seen.has(normalizedName)) {
      errors.push(`Row ${i + 1}: duplicate name "${name}", skipped`);
      continue;
    }
    seen.add(normalizedName);

    const id = idIdx >= 0 ? (cols[idIdx] || "").trim().replace(/['"]/g, "") : `${i}`;
    const extra: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (idx !== nameIdx && idx !== idIdx) {
        extra[h] = (cols[idx] || "").trim().replace(/['"]/g, "");
      }
    });

    people.push({ name, id, extra });
  }

  return { people, errors };
}

function splitCSVLine(line: string, delimiter: string = ","): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && line.startsWith(delimiter, i)) {
      result.push(current);
      current = "";
      i += delimiter.length - 1;
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
