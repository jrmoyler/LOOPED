import Link from "next/link";
import { LoopedLogo } from "@/components/ui/Logo";
import { ArrowLeft, Layers } from "lucide-react";

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col">
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-[#9CA3AF]"><ArrowLeft size={18} /></Link>
        <LoopedLogo size="sm" />
        <span className="text-[#9CA3AF] text-sm">Create</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 rounded-2xl bg-[#7B61FF]/20 flex items-center justify-center mb-2">
          <Layers size={28} className="text-[#7B61FF]" />
        </div>
        <h1 className="text-2xl font-700">3D Staging</h1>
        <p className="text-[#9CA3AF] text-center max-w-xs">
          Design your space in 3D. Drag and drop furniture to see how it fits.
        </p>
        <div className="mt-4 px-4 py-2 bg-[#7B61FF]/20 rounded-full text-[#7B61FF] text-sm font-500">
          Coming Soon
        </div>
      </div>
    </div>
  );
}
