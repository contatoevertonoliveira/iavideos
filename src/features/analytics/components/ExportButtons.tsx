import html2canvas from "html2canvas";

type Props = {
  targetRef?: React.RefObject<HTMLElement>;
  csvName?: string;
  csvData?: any[];
};

export default function ExportButtons({ targetRef, csvName = "export.csv", csvData = [] }: Props) {
  const exportPNG = async () => {
    const el = targetRef?.current;
    if (!el) return;
    const canvas = await html2canvas(el as HTMLElement, { backgroundColor: "#ffffff", scale: 2 });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = (csvName.replace(/\.csv$/, "") || "chart") + ".png";
    a.click();
  };
  const exportCSV = () => {
    if (!csvData || csvData.length === 0) return;
    const headers = Object.keys(csvData[0]);
    const rows = csvData.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvName;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="flex gap-2">
      <button className="border rounded px-2 py-1" onClick={exportCSV}>Exportar CSV</button>
      <button className="border rounded px-2 py-1" onClick={exportPNG}>Exportar PNG</button>
    </div>
  );
}