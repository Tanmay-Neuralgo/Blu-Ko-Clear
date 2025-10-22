import { FileText, Share2, Trash2, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface ResumeCardProps {
  id: string;
  title: string;
  createdAt: string;
  fileSize: string;
  status: string;
  shareUrl: string;
  onView: () => void;
  onDownload: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export default function ResumeCard({
  title,
  createdAt,
  fileSize,
  status,
  shareUrl,
  onView,
  onDownload,
  onShare,
  onDelete,
}: ResumeCardProps) {
  const [showQRModal, setShowQRModal] = useState(false);

  return (
    <>
      <div className="bg-[#003A6E] bg-opacity-50 backdrop-blur-lg border border-[#6A7B93] border-opacity-20 rounded-2xl p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="text-[#FBC888]" size={32} />
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-[#A8B8CC]">
                {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#A8B8CC]">{fileSize}</span>
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-[#1E4C80] text-white">
              {status}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onView}
              className="flex-1 bg-[#1E4C80] hover:bg-[#2A4F7A] text-white px-3 py-2 rounded-lg transition-all duration-200"
            >
              View
            </button>
            <button
              onClick={() => setShowQRModal(true)}
              className="bg-[#1E4C80] hover:bg-[#2A4F7A] text-white p-2 rounded-lg transition-all duration-200"
            >
              <QrCode size={20} />
            </button>
            <button
              onClick={onShare}
              className="bg-[#1E4C80] hover:bg-[#2A4F7A] text-white p-2 rounded-lg transition-all duration-200"
            >
              <Share2 size={20} />
            </button>
            <button
              onClick={onDelete}
              className="bg-[#1E4C80] hover:bg-red-500/20 text-white p-2 rounded-lg transition-all duration-200 hover:text-red-500"
            >
              <Trash2 size={20} />
            </button>
          </div>
          <button
            onClick={onDownload}
            className="w-full bg-[#1E4C80] hover:bg-[#2A4F7A] text-white px-3 py-2 rounded-lg transition-all duration-200"
          >
            Download
          </button>
        </div>
      </div>

      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#003A6E] border border-[#6A7B93] rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Scan QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-[#A8B8CC] hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={shareUrl}
                size={200}
                className="w-full"
                level="H"
                includeMargin
              />
            </div>
            <p className="text-[#A8B8CC] text-center mt-4">
              Scan to view resume
            </p>
          </div>
        </div>
      )}
    </>
  );
}
