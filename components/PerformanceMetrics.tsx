
import React from 'react';
import { Award } from 'lucide-react';
import { KPI } from '../types';

const PERFORMANCE_METRICS: KPI[] = [
  { id: '1', metric: 'Goal Attainment Rate', weight: 4, target: 100, actual: 85, rating: 4, remarks: 'Excellent' },
  { id: '2', metric: 'Task Completion Rate', weight: 4, target: 100, actual: 92, rating: 5, remarks: 'Superior' },
  { id: '3', metric: 'Quality Performance Rating', weight: 4, target: 100, actual: 78, rating: 3, remarks: 'Good' },
  { id: '4', metric: 'Team Collaboration Index', weight: 4, target: 100, actual: 88, rating: 4, remarks: 'Very Good' },
  { id: '5', metric: 'Timelines Score', weight: 4, target: 100, actual: 70, rating: 2, remarks: 'Fair' },
];

const PerformanceMetrics: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8">
        <div className="w-32 h-32 rounded-full border-4 border-amber-500/20 flex items-center justify-center relative shrink-0">
          <div className="w-24 h-24 rounded-full border-4 border-amber-500 flex items-center justify-center">
            <span className="text-3xl font-bold">4.2</span>
          </div>
          <Award className="absolute -bottom-2 -right-2 text-amber-500 bg-zinc-900 rounded-full" size={32} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white">Staff Performance Overview</h2>
          <p className="text-zinc-500 mt-2 max-w-xl">
            This evaluation is based on SMART goals and key metrics. Scores represent goal attainment, 
            task completion, and overall quality of contribution within the PRRR-SMART-SKRC framework.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PERFORMANCE_METRICS.map((kpi) => (
          <div key={kpi.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-zinc-200">{kpi.metric}</h4>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Weight: {kpi.weight}%</p>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold ${kpi.rating >= 4 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                {kpi.remarks}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Target Achievement</span>
                <span className="text-zinc-200 font-bold">{kpi.actual}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full gold-gradient rounded-full transition-all duration-1000"
                  style={{ width: `${kpi.actual}%` }}
                ></div>
              </div>
            </div>

            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <div 
                  key={star} 
                  className={`w-3 h-3 rounded-full ${star <= kpi.rating ? 'bg-amber-500' : 'bg-zinc-800'}`}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceMetrics;
