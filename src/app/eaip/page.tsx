import EAIPViewer from "@/components/eaip/EAIPViewer";
import Header from "@/components/Header";
import "../../styles/eaip.css";

export default function EAIPPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="eaip" />
      <EAIPViewer />
    </div>
  );
}
