import { LucidePlay, LucideEye } from 'lucide-react';

export function TopVideos() {
  const videos = [
     { id: 1, title: 'Deadlift Form Masterclass', views: '240k' },
     { id: 2, title: 'HIIT Cardio Blast', views: '180k' },
     { id: 3, title: 'Nutrition for Growth', views: '95k' },
     { id: 4, title: 'Morning Mobility Flow', views: '45k' },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white text-sm font-black uppercase tracking-widest">Top Videos</h3>
        <button className="text-xs font-bold text-green-400 hover:text-green-300">View All</button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {videos.map(video => (
          <div key={video.id} className="space-y-3 group cursor-pointer">
            <div className="aspect-video bg-white/5 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden group-hover:bg-white/10 transition-all">
              <LucidePlay className="w-8 h-8 text-white/20 group-hover:text-green-400 group-hover:scale-110 transition-all" />
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/40 backdrop-blur-sm rounded text-[8px] font-black text-white/80 uppercase">
                 12:40
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white leading-tight line-clamp-2 group-hover:text-green-400 transition-colors">
                 {video.title}
              </h4>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-white/40 uppercase">
                 <LucideEye className="w-3 h-3" />
                 {video.views} views
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
