import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAnalytics } from "./hooks/useAnalytics";
import RetentionChart from "./components/RetentionChart";
import CTRBySourceBar from "./components/CTRBySourceBar";

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const vid = Number(id);
  const { videoDetail, fetchVideoDetail } = useAnalytics();
  const [ctrBySource, setCtrBySource] = useState<{ source: string; ctr: number }[]>([]);

  useEffect(() => {
    if (!Number.isNaN(vid)) fetchVideoDetail(vid);
  }, [vid]);

  useEffect(() => {
    // Se houver heatmap ou dados por origem, converta para CTR por fonte; senão, mock quando VITE_USE_MOCKS
    if (!videoDetail && import.meta.env.VITE_USE_MOCKS === "true") {
      setCtrBySource([
        { source: "search", ctr: 0.06 },
        { source: "suggested", ctr: 0.052 },
        { source: "browse", ctr: 0.041 },
        { source: "external", ctr: 0.035 },
      ]);
    }
  }, [videoDetail]);

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold">Vídeo #{vid}</h2>
      <RetentionChart data={videoDetail?.retention || []} />
      <CTRBySourceBar data={ctrBySource} />
    </div>
  );
}