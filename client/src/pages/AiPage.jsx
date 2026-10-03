import { AiChatView } from '@/features/ai/components/AiChatView';

export default function AiPage() {
  return (
    <div className="min-h-screen pt-16 pb-24 md:pb-8 max-w-4xl mx-auto px-2 sm:px-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 rounded-3xl border border-purple-500/20 shadow-2xl overflow-hidden bg-[#080711]">
        <AiChatView />
      </div>
    </div>
  );
}
