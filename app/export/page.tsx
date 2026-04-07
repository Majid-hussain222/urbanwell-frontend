'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

/* ─── jsPDF loaded dynamically (no SSR issues) ──────────── */
async function loadJsPDF() {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
}

/* ─── PDF helpers ────────────────────────────────────────── */
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}

/* ════════════════════════════════════════════════════════ */
export default function ExportPage() {
  const router = useRouter();
  const [user,        setUser]       = useState<any>(null);
  const [loading,     setLoading]    = useState(true);
  const [workouts,    setWorkouts]   = useState<any[]>([]);
  const [mealPlan,    setMealPlan]   = useState<any>(null);
  const [progress,    setProgress]   = useState<any[]>([]);
  const [workoutLogs, setWkLogs]     = useState<any[]>([]);
  const [dataLoading, setDataLoading]= useState(true);

  const [exporting,   setExporting]  = useState<string | null>(null);
  const [done,        setDone]       = useState<string | null>(null);
  const [toast,       setToast]      = useState('');

  // Export options
  const [wkInclude,   setWkInclude]  = useState({ exercises: true, notes: true, history: true });
  const [mpInclude,   setMpInclude]  = useState({ macros: true, schedule: true, tips: true });
  const [prInclude,   setPrInclude]  = useState({ weekly: true, charts: false, goals: true });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/users/profile');
        setUser(data?.data || data);
        await fetchData();
      } catch { router.push('/login'); }
      finally  { setLoading(false); }
    })();
  }, []);

  const fetchData = async () => {
    setDataLoading(true);
    const results = await Promise.allSettled([
      API.get('/workouts?limit=20'),
      API.get('/meals/current'),
      API.get('/progress?limit=30'),
      API.get('/workouts/history?limit=20'),
    ]);
    if (results[0].status === 'fulfilled') setWorkouts(results[0].value.data?.data || results[0].value.data?.workouts || []);
    if (results[1].status === 'fulfilled') setMealPlan(results[1].value.data?.data || results[1].value.data?.plan || null);
    if (results[2].status === 'fulfilled') setProgress(results[2].value.data?.data || []);
    if (results[3].status === 'fulfilled') setWkLogs(results[3].value.data?.data || []);
    setDataLoading(false);
  };

  /* ── Generate Workout PDF ── */
  const exportWorkoutPDF = async () => {
    setExporting('workout');
    try {
      const JsPDF = await loadJsPDF();
      const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210; const MARGIN = 18;

      // ── Cover ──
      doc.setFillColor(3, 5, 10);
      doc.rect(0, 0, W, 297, 'F');

      // Accent bar
      doc.setFillColor(198, 241, 53);
      doc.rect(0, 0, W, 3, 'F');

      // Logo text
      doc.setFontSize(28); doc.setFont('helvetica', 'bold');
      doc.setTextColor(198, 241, 53);
      doc.text('Urban', MARGIN, 28);
      doc.setTextColor(226, 236, 255);
      doc.text('Well', MARGIN + 33, 28);

      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.setTextColor(77, 107, 138);
      doc.text('AI-Powered Health & Fitness Platform', MARGIN, 36);

      // Title block
      doc.setFillColor(10, 18, 32);
      doc.roundedRect(MARGIN, 48, W - MARGIN*2, 40, 4, 4, 'F');
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.setTextColor(198, 241, 53);
      doc.text('Workout Plan', MARGIN + 8, 64);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.setTextColor(77, 107, 138);
      doc.text(`Generated for ${user?.name || 'Member'} · ${new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}`, MARGIN + 8, 74);
      doc.setTextColor(226, 236, 255);
      doc.text(`Goal: ${user?.fitnessGoal?.replace(/_/g,' ') || 'General Fitness'}`, MARGIN + 8, 82);

      let y = 102;

      // ── Summary Stats ──
      if (workoutLogs.length > 0 && wkInclude.history) {
        const totalMins = workoutLogs.reduce((s: number, w: any) => s + (w.duration || 0), 0);
        const totalCals = workoutLogs.reduce((s: number, w: any) => s + (w.caloriesBurned || 0), 0);

        const stats = [
          { label: 'Total Sessions', value: String(workoutLogs.length) },
          { label: 'Total Minutes',  value: String(totalMins) },
          { label: 'Cals Burned',    value: String(totalCals) },
          { label: 'Avg Duration',   value: `${workoutLogs.length ? Math.round(totalMins / workoutLogs.length) : 0}m` },
        ];
        const colW = (W - MARGIN*2 - 9) / 4;
        stats.forEach((s, i) => {
          const x = MARGIN + i * (colW + 3);
          doc.setFillColor(10, 18, 32);
          doc.roundedRect(x, y, colW, 20, 3, 3, 'F');
          doc.setFontSize(14); doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 212, 255);
          doc.text(s.value, x + colW/2, y + 11, { align: 'center' });
          doc.setFontSize(8); doc.setFont('helvetica', 'normal');
          doc.setTextColor(77, 107, 138);
          doc.text(s.label, x + colW/2, y + 17, { align: 'center' });
        });
        y += 28;
      }

      // ── Workout Plans ──
      if (workouts.length > 0) {
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.setTextColor(226, 236, 255);
        doc.text('Scheduled Workouts', MARGIN, y);
        doc.setFillColor(198, 241, 53);
        doc.rect(MARGIN, y + 2, 30, 1, 'F');
        y += 10;

        for (const workout of workouts.slice(0, 8)) {
          if (y > 260) { doc.addPage(); doc.setFillColor(3,5,10); doc.rect(0,0,W,297,'F'); y = 20; }

          doc.setFillColor(10, 18, 32);
          doc.roundedRect(MARGIN, y, W - MARGIN*2, wkInclude.exercises && workout.exercises?.length ? 8 + workout.exercises.length * 6 + 8 : 22, 3, 3, 'F');

          doc.setFontSize(11); doc.setFont('helvetica', 'bold');
          doc.setTextColor(198, 241, 53);
          doc.text(workout.title || workout.name || 'Workout', MARGIN + 5, y + 8);

          if (workout.duration || workout.exercises?.length) {
            doc.setFontSize(8); doc.setFont('helvetica', 'normal');
            doc.setTextColor(77, 107, 138);
            const meta = [workout.duration ? `${workout.duration}min` : '', workout.exercises?.length ? `${workout.exercises.length} exercises` : ''].filter(Boolean).join(' · ');
            doc.text(meta, MARGIN + 5, y + 14);
          }

          if (wkInclude.exercises && workout.exercises?.length) {
            let ey = y + 20;
            workout.exercises.slice(0, 6).forEach((ex: any) => {
              doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
              doc.setTextColor(177, 196, 220);
              const sets = ex.sets?.length ? ` — ${ex.sets.length} sets` : '';
              const reps = ex.sets?.[0]?.reps ? ` × ${ex.sets[0].reps} reps` : '';
              const wt   = ex.sets?.[0]?.weight ? ` @ ${ex.sets[0].weight}kg` : '';
              doc.text(`  • ${ex.name}${sets}${reps}${wt}`, MARGIN + 5, ey);
              ey += 6;
            });
            y = ey + 6;
          } else {
            y += 26;
          }
        }
      }

      // ── Workout History ──
      if (wkInclude.history && workoutLogs.length > 0) {
        if (y > 240) { doc.addPage(); doc.setFillColor(3,5,10); doc.rect(0,0,W,297,'F'); y = 20; }
        y += 6;
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.setTextColor(226, 236, 255);
        doc.text('Recent History', MARGIN, y);
        doc.setFillColor(198, 241, 53);
        doc.rect(MARGIN, y + 2, 22, 1, 'F');
        y += 10;

        // Table header
        doc.setFillColor(15, 26, 46);
        doc.rect(MARGIN, y, W - MARGIN*2, 8, 'F');
        ['Workout','Date','Duration','Calories','Difficulty'].forEach((h, i) => {
          const xs = [MARGIN+3, MARGIN+55, MARGIN+95, MARGIN+120, MARGIN+148];
          doc.setFontSize(8); doc.setFont('helvetica', 'bold');
          doc.setTextColor(77, 107, 138);
          doc.text(h, xs[i], y + 5.5);
        });
        y += 10;

        workoutLogs.slice(0, 10).forEach((log: any, i: number) => {
          if (y > 270) return;
          if (i % 2 === 0) { doc.setFillColor(10,18,32); doc.rect(MARGIN, y, W-MARGIN*2, 7, 'F'); }
          doc.setFontSize(8); doc.setFont('helvetica', 'normal');
          doc.setTextColor(177, 196, 220);
          const row = [
            (log.name || 'Session').slice(0,20),
            new Date(log.date).toLocaleDateString('en-PK',{day:'numeric',month:'short'}),
            log.duration ? `${log.duration}m` : '—',
            log.caloriesBurned ? `${log.caloriesBurned}` : '—',
            log.difficulty || '—',
          ];
          const xs = [MARGIN+3, MARGIN+55, MARGIN+95, MARGIN+120, MARGIN+148];
          row.forEach((cell, ci) => doc.text(cell, xs[ci], y + 5));
          y += 7;
        });
      }

      // Footer
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 60, 80);
      doc.text(`UrbanWell · Generated ${new Date().toLocaleString()} · Confidential`, MARGIN, 290);

      doc.save(`UrbanWell_Workout_Plan_${new Date().toISOString().split('T')[0]}.pdf`);
      setDone('workout');
      showToast('✓ Workout PDF downloaded!');
    } catch (e) {
      console.error(e);
      showToast('⚠ Failed to generate PDF');
    }
    setExporting(null);
  };

  /* ── Generate Meal Plan PDF ── */
  const exportMealPDF = async () => {
    setExporting('meal');
    try {
      const JsPDF = await loadJsPDF();
      const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210; const MARGIN = 18;

      doc.setFillColor(3, 5, 10);
      doc.rect(0, 0, W, 297, 'F');
      doc.setFillColor(198, 241, 53);
      doc.rect(0, 0, W, 3, 'F');

      doc.setFontSize(28); doc.setFont('helvetica', 'bold');
      doc.setTextColor(198, 241, 53);
      doc.text('Urban', MARGIN, 28);
      doc.setTextColor(226, 236, 255);
      doc.text('Well', MARGIN + 33, 28);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.setTextColor(77, 107, 138);
      doc.text('AI-Powered Health & Fitness Platform', MARGIN, 36);

      doc.setFillColor(10, 18, 32);
      doc.roundedRect(MARGIN, 48, W - MARGIN*2, 40, 4, 4, 'F');
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 211, 153);
      doc.text('Meal Plan', MARGIN + 8, 64);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.setTextColor(77, 107, 138);
      doc.text(`Generated for ${user?.name || 'Member'} · ${new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}`, MARGIN + 8, 74);
      doc.setTextColor(226, 236, 255);
      const calorieGoal = user?.calorieGoal || mealPlan?.totalCalories || '—';
      doc.text(`Daily Target: ${calorieGoal} kcal`, MARGIN + 8, 82);

      let y = 102;

      if (!mealPlan) {
        doc.setFontSize(13); doc.setTextColor(77, 107, 138);
        doc.text('No active meal plan found. Generate one in the app!', MARGIN, y);
        doc.setFontSize(10);
        doc.text('Visit urbanwell.app/meals to create your AI meal plan.', MARGIN, y + 10);
      } else {
        // Plan name + description
        if (mealPlan.name) {
          doc.setFontSize(14); doc.setFont('helvetica', 'bold');
          doc.setTextColor(52, 211, 153);
          doc.text(mealPlan.name, MARGIN, y);
          y += 8;
        }

        if (mpInclude.macros && (mealPlan.protein || mealPlan.carbs || mealPlan.fat)) {
          doc.setFontSize(11); doc.setFont('helvetica', 'bold');
          doc.setTextColor(226, 236, 255);
          doc.text('Daily Macros', MARGIN, y);
          y += 8;
          const macros = [
            { label: 'Protein', value: `${mealPlan.protein || 0}g`,          color: [0, 212, 255]    },
            { label: 'Carbs',   value: `${mealPlan.carbs || 0}g`,            color: [198, 241, 53]   },
            { label: 'Fat',     value: `${mealPlan.fat || 0}g`,              color: [245, 158, 11]   },
            { label: 'Calories',value: `${mealPlan.totalCalories || 0}kcal`, color: [244, 63, 94]    },
          ];
          const cw = (W - MARGIN*2 - 9) / 4;
          macros.forEach((m, i) => {
            const x = MARGIN + i * (cw + 3);
            doc.setFillColor(10, 18, 32);
            doc.roundedRect(x, y, cw, 18, 3, 3, 'F');
            doc.setFontSize(13); doc.setFont('helvetica', 'bold');
            doc.setTextColor(m.color[0], m.color[1], m.color[2]);
            doc.text(m.value, x + cw/2, y + 9, { align: 'center' });
            doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
            doc.setTextColor(77, 107, 138);
            doc.text(m.label, x + cw/2, y + 15, { align: 'center' });
          });
          y += 26;
        }

        // Daily meals schedule
        const meals = mealPlan.meals || mealPlan.schedule || [];
        if (mpInclude.schedule && meals.length > 0) {
          doc.setFontSize(12); doc.setFont('helvetica', 'bold');
          doc.setTextColor(226, 236, 255);
          doc.text('Daily Schedule', MARGIN, y);
          doc.setFillColor(52, 211, 153);
          doc.rect(MARGIN, y + 2, 22, 1, 'F');
          y += 10;

          meals.forEach((meal: any) => {
            if (y > 265) { doc.addPage(); doc.setFillColor(3,5,10); doc.rect(0,0,W,297,'F'); y = 20; }
            doc.setFillColor(10, 18, 32);
            const boxH = mpInclude.macros && meal.calories ? 22 : 16;
            doc.roundedRect(MARGIN, y, W-MARGIN*2, boxH, 3, 3, 'F');

            doc.setFillColor(52, 211, 153);
            doc.roundedRect(MARGIN, y, 20, boxH, 3, 3, 'F');
            doc.setFontSize(7); doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text((meal.mealType || meal.type || 'Meal').toUpperCase().slice(0,8), MARGIN + 10, y + boxH/2 + 2, { align: 'center' });

            doc.setFontSize(10); doc.setFont('helvetica', 'bold');
            doc.setTextColor(226, 236, 255);
            doc.text((meal.name || meal.food || meal.description || 'Meal').slice(0, 40), MARGIN + 24, y + 7);

            if (mpInclude.macros && meal.calories) {
              doc.setFontSize(8); doc.setFont('helvetica', 'normal');
              doc.setTextColor(77, 107, 138);
              const minfo = [meal.calories ? `${meal.calories} kcal` : '', meal.protein ? `${meal.protein}g protein` : '', meal.carbs ? `${meal.carbs}g carbs` : ''].filter(Boolean).join(' · ');
              doc.text(minfo, MARGIN + 24, y + 14);
            }

            y += boxH + 5;
          });
        }

        if (mpInclude.tips && mealPlan.tips) {
          if (y > 250) { doc.addPage(); doc.setFillColor(3,5,10); doc.rect(0,0,W,297,'F'); y = 20; }
          y += 4;
          doc.setFontSize(11); doc.setFont('helvetica', 'bold');
          doc.setTextColor(226, 236, 255);
          doc.text('Nutrition Tips', MARGIN, y);
          y += 8;
          const tips = Array.isArray(mealPlan.tips) ? mealPlan.tips : [mealPlan.tips];
          tips.slice(0, 5).forEach((tip: string) => {
            const lines = doc.splitTextToSize(`• ${tip}`, W - MARGIN*2 - 4);
            doc.setFontSize(9); doc.setFont('helvetica', 'normal');
            doc.setTextColor(77, 107, 138);
            doc.text(lines, MARGIN, y);
            y += lines.length * 5.5 + 2;
          });
        }
      }

      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 60, 80);
      doc.text(`UrbanWell · Generated ${new Date().toLocaleString()} · Confidential`, MARGIN, 290);

      doc.save(`UrbanWell_Meal_Plan_${new Date().toISOString().split('T')[0]}.pdf`);
      setDone('meal');
      showToast('✓ Meal Plan PDF downloaded!');
    } catch (e) {
      console.error(e);
      showToast('⚠ Failed to generate PDF');
    }
    setExporting(null);
  };

  /* ── Generate Progress Report PDF ── */
  const exportProgressPDF = async () => {
    setExporting('progress');
    try {
      const JsPDF = await loadJsPDF();
      const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210; const MARGIN = 18;

      doc.setFillColor(3, 5, 10);
      doc.rect(0, 0, W, 297, 'F');
      doc.setFillColor(167, 139, 250);
      doc.rect(0, 0, W, 3, 'F');

      doc.setFontSize(28); doc.setFont('helvetica', 'bold');
      doc.setTextColor(167, 139, 250);
      doc.text('Urban', MARGIN, 28);
      doc.setTextColor(226, 236, 255);
      doc.text('Well', MARGIN + 33, 28);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.setTextColor(77, 107, 138);
      doc.text('AI-Powered Health & Fitness Platform', MARGIN, 36);

      doc.setFillColor(10, 18, 32);
      doc.roundedRect(MARGIN, 48, W-MARGIN*2, 40, 4, 4, 'F');
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.setTextColor(167, 139, 250);
      doc.text('Progress Report', MARGIN + 8, 64);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.setTextColor(77, 107, 138);
      doc.text(`${user?.name || 'Member'} · ${new Date().toLocaleDateString('en-PK',{ day:'numeric', month:'long', year:'numeric' })}`, MARGIN + 8, 74);
      const dateRange = progress.length > 0
        ? `${new Date(progress[progress.length-1].date).toLocaleDateString('en-PK',{day:'numeric',month:'short'})} – ${new Date(progress[0].date).toLocaleDateString('en-PK',{day:'numeric',month:'short'})}`
        : 'No data';
      doc.setTextColor(226, 236, 255);
      doc.text(`Date range: ${dateRange} · ${progress.length} entries`, MARGIN + 8, 82);

      let y = 102;

      if (progress.length === 0) {
        doc.setFontSize(13); doc.setTextColor(77, 107, 138);
        doc.text('No progress data logged yet.', MARGIN, y);
      } else {
        // Summary stats
        const avgCals   = Math.round(progress.filter((p:any)=>p.caloriesConsumed||p.calories).reduce((s:any,p:any)=>s+(p.caloriesConsumed||p.calories||0),0) / (progress.filter((p:any)=>p.caloriesConsumed||p.calories).length||1));
        const avgWater  = Math.round(progress.filter((p:any)=>p.water||p.waterIntake).reduce((s:any,p:any)=>s+(p.water||p.waterIntake||0),0) / (progress.filter((p:any)=>p.water||p.waterIntake).length||1));
        const weights   = progress.filter((p:any)=>p.weight).map((p:any)=>p.weight);
        const firstW    = weights[weights.length-1];
        const lastW     = weights[0];
        const wtChange  = firstW && lastW ? (lastW - firstW).toFixed(1) : null;

        const stats = [
          { label: 'Entries',   value: String(progress.length),                color: [167, 139, 250] },
          { label: 'Avg Cals',  value: avgCals ? `${avgCals}` : '—',           color: [198, 241, 53]  },
          { label: 'Avg Water', value: avgWater ? `${(avgWater/1000).toFixed(1)}L` : '—', color: [0, 212, 255] },
          { label: 'Weight Δ',  value: wtChange ? `${wtChange}kg` : '—',       color: [244, 114, 182] },
        ];
        const cw = (W - MARGIN*2 - 9) / 4;
        stats.forEach((s, i) => {
          const x = MARGIN + i * (cw + 3);
          doc.setFillColor(10, 18, 32);
          doc.roundedRect(x, y, cw, 20, 3, 3, 'F');
          doc.setFontSize(14); doc.setFont('helvetica', 'bold');
          doc.setTextColor(s.color[0], s.color[1], s.color[2]);
          doc.text(s.value, x + cw/2, y + 11, { align: 'center' });
          doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
          doc.setTextColor(77, 107, 138);
          doc.text(s.label, x + cw/2, y + 17, { align: 'center' });
        });
        y += 28;

        // Progress log table
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.setTextColor(226, 236, 255);
        doc.text('Daily Log', MARGIN, y);
        doc.setFillColor(167, 139, 250);
        doc.rect(MARGIN, y + 2, 15, 1, 'F');
        y += 10;

        // Header
        doc.setFillColor(15, 26, 46);
        doc.rect(MARGIN, y, W-MARGIN*2, 8, 'F');
        ['Date','Calories','Water','Weight','Protein'].forEach((h, i) => {
          const xs = [MARGIN+3, MARGIN+40, MARGIN+75, MARGIN+110, MARGIN+148];
          doc.setFontSize(8); doc.setFont('helvetica', 'bold');
          doc.setTextColor(77, 107, 138);
          doc.text(h, xs[i], y + 5.5);
        });
        y += 9;

        progress.slice(0, 25).forEach((p: any, i: number) => {
          if (y > 270) return;
          if (i % 2 === 0) { doc.setFillColor(10, 18, 32); doc.rect(MARGIN, y, W-MARGIN*2, 7, 'F'); }
          const row = [
            new Date(p.date).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'2-digit'}),
            p.caloriesConsumed || p.calories ? `${p.caloriesConsumed||p.calories} kcal` : '—',
            p.water || p.waterIntake ? `${((p.water||p.waterIntake)/1000).toFixed(1)}L` : '—',
            p.weight ? `${p.weight}kg` : '—',
            p.protein ? `${p.protein}g` : '—',
          ];
          const xs = [MARGIN+3, MARGIN+40, MARGIN+75, MARGIN+110, MARGIN+148];
          doc.setFontSize(8); doc.setFont('helvetica', 'normal');
          doc.setTextColor(177, 196, 220);
          row.forEach((cell, ci) => doc.text(cell, xs[ci], y + 5));
          y += 7;
        });
      }

      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 60, 80);
      doc.text(`UrbanWell · Generated ${new Date().toLocaleString()} · Confidential`, MARGIN, 290);

      doc.save(`UrbanWell_Progress_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      setDone('progress');
      showToast('✓ Progress Report PDF downloaded!');
    } catch (e) {
      console.error(e);
      showToast('⚠ Failed to generate PDF');
    }
    setExporting(null);
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#03050a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:44, height:44, border:'2px solid rgba(198,241,53,0.15)', borderTop:'2px solid #c6f135', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const exports = [
    {
      id:          'workout',
      icon:        '🏋️',
      title:       'Workout Plan',
      desc:        'Your scheduled workouts, exercise breakdowns, and recent session history.',
      color:       '#00d4ff',
      grad:        'rgba(0,212,255,0.08)',
      border:      'rgba(0,212,255,0.2)',
      count:       `${workouts.length} plans · ${workoutLogs.length} logged sessions`,
      options:     [
        { key:'exercises', label:'Include exercises & sets',  val:wkInclude.exercises,  set:(v:boolean)=>setWkInclude(p=>({...p,exercises:v})) },
        { key:'notes',     label:'Include workout notes',     val:wkInclude.notes,      set:(v:boolean)=>setWkInclude(p=>({...p,notes:v})) },
        { key:'history',   label:'Include session history',   val:wkInclude.history,    set:(v:boolean)=>setWkInclude(p=>({...p,history:v})) },
      ],
      onExport: exportWorkoutPDF,
    },
    {
      id:          'meal',
      icon:        '🥗',
      title:       'Meal Plan',
      desc:        'Your active nutrition plan with macros, daily schedule, and diet tips.',
      color:       '#34d399',
      grad:        'rgba(52,211,153,0.08)',
      border:      'rgba(52,211,153,0.2)',
      count:       mealPlan ? `Active plan · ${mealPlan.meals?.length || 0} meals/day` : 'No active plan',
      options:     [
        { key:'macros',   label:'Include macro targets',    val:mpInclude.macros,   set:(v:boolean)=>setMpInclude(p=>({...p,macros:v})) },
        { key:'schedule', label:'Include meal schedule',   val:mpInclude.schedule, set:(v:boolean)=>setMpInclude(p=>({...p,schedule:v})) },
        { key:'tips',     label:'Include nutrition tips',  val:mpInclude.tips,     set:(v:boolean)=>setMpInclude(p=>({...p,tips:v})) },
      ],
      onExport: exportMealPDF,
    },
    {
      id:          'progress',
      icon:        '📊',
      title:       'Progress Report',
      desc:        'Full progress log with calories, water, weight trends and daily entries.',
      color:       '#a78bfa',
      grad:        'rgba(167,139,250,0.08)',
      border:      'rgba(167,139,250,0.2)',
      count:       `${progress.length} entries logged`,
      options:     [
        { key:'weekly',  label:'Include weekly summary',  val:prInclude.weekly,  set:(v:boolean)=>setPrInclude(p=>({...p,weekly:v})) },
        { key:'goals',   label:'Include goal comparison', val:prInclude.goals,   set:(v:boolean)=>setPrInclude(p=>({...p,goals:v})) },
      ],
      onExport: exportProgressPDF,
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        :root{--void:#03050a;--panel:#0a1220;--panel2:#0f1a2e;--lime:#c6f135;--cyan:#00d4ff;--text:#e2ecff;--sub:#4d6b8a;--line:rgba(0,212,255,0.08);}
        body{background:var(--void);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}

        .layout{display:flex;min-height:100vh;}
        .sidebar{width:258px;flex-shrink:0;background:var(--panel);border-right:1px solid var(--line);display:flex;flex-direction:column;padding:26px 16px;position:fixed;top:0;left:0;bottom:0;overflow-y:auto;z-index:100;}
        .sidebar::-webkit-scrollbar{width:3px;}.sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.05);}
        .logo{display:flex;align-items:center;gap:9px;text-decoration:none;margin-bottom:28px;}
        .logo-icon{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--lime),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#000;}
        .logo-text{font-size:18px;font-weight:800;letter-spacing:-.5px;}.logo-text em{font-style:normal;color:var(--lime);}
        .nav-lbl{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--sub);padding:0 8px;margin:14px 0 5px;opacity:.7;}
        .nav-a{display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:10px;font-size:13px;font-weight:500;color:var(--sub);transition:all .18s;margin-bottom:1px;border:1px solid transparent;text-decoration:none;}
        .nav-a:hover{color:var(--text);background:rgba(255,255,255,.04);}
        .nav-a.on{color:var(--lime);background:rgba(198,241,53,.08);border-color:rgba(198,241,53,.12);font-weight:700;}
        .sb-bot{margin-top:auto;padding-top:14px;}
        .ucard{display:flex;align-items:center;gap:10px;padding:12px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid var(--line);margin-bottom:9px;}
        .uav{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,rgba(198,241,53,.3),rgba(0,212,255,.2));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--lime);flex-shrink:0;}
        .logout-btn{width:100%;padding:9px;background:rgba(244,63,94,.05);border:1px solid rgba(244,63,94,.12);border-radius:9px;color:#fb7185;font-size:12px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}

        .main{margin-left:258px;flex:1;min-width:0;}
        .topbar{height:64px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 30px;background:rgba(3,5,10,.9);backdrop-filter:blur(20px);position:sticky;top:0;z-index:50;}
        .topbar-title{font-size:17px;font-weight:700;letter-spacing:-.5px;}
        .back-btn{padding:7px 14px;background:var(--panel);border:1px solid var(--line);border-radius:9px;color:var(--sub);font-size:12px;font-weight:600;text-decoration:none;transition:all .2s;}
        .back-btn:hover{color:var(--text);}
        .content{padding:28px 30px;animation:fadein .4s ease;max-width:860px;margin:0 auto;}

        .page-head{margin-bottom:26px;}
        .page-title{font-size:22px;font-weight:900;letter-spacing:-1px;margin-bottom:6px;}
        .page-sub{font-size:13px;color:var(--sub);line-height:1.65;}

        .export-grid{display:flex;flex-direction:column;gap:16px;}
        .export-card{background:var(--panel);border:1px solid var(--line);border-radius:20px;overflow:hidden;transition:border-color .2s;}
        .export-card:hover{border-color:rgba(255,255,255,.07);}
        .ec-top{display:flex;align-items:flex-start;gap:16px;padding:22px 24px 0;}
        .ec-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;}
        .ec-info{flex:1;}
        .ec-title{font-size:16px;font-weight:800;letter-spacing:-.4px;margin-bottom:4px;}
        .ec-desc{font-size:12.5px;color:var(--sub);line-height:1.6;margin-bottom:8px;}
        .ec-count{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:100px;font-size:11px;font-weight:700;}
        .ec-options{padding:14px 24px;border-top:1px solid var(--line);margin-top:16px;display:flex;gap:16px;flex-wrap:wrap;}
        .ec-opt{display:flex;align-items:center;gap:8px;cursor:pointer;}
        .ec-checkbox{width:18px;height:18px;border-radius:5px;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;}
        .ec-checkbox.on{border-color:var(--lime);background:rgba(198,241,53,.15);}
        .ec-opt-lbl{font-size:12px;font-weight:600;color:var(--sub);}
        .ec-footer{padding:14px 24px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
        .export-btn{display:flex;align-items:center;gap:8px;padding:11px 22px;border-radius:11px;font-size:13px;font-weight:800;cursor:pointer;border:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;}
        .export-btn:disabled{opacity:.5;cursor:not-allowed;}
        .done-tag{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:100px;font-size:11px;font-weight:700;background:rgba(198,241,53,.1);color:var(--lime);border:1px solid rgba(198,241,53,.2);}

        .install-note{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px 22px;margin-top:22px;display:flex;gap:14px;align-items:flex-start;}
        .install-icon{font-size:24px;flex-shrink:0;margin-top:2px;}

        .toast{position:fixed;bottom:24px;right:24px;z-index:2000;padding:12px 18px;border-radius:11px;font-size:12.5px;font-weight:700;background:rgba(198,241,53,.12);border:1px solid rgba(198,241,53,.3);color:var(--lime);animation:toastIn .3s ease;}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .skel{background:linear-gradient(90deg,var(--panel) 25%,var(--panel2) 50%,var(--panel) 75%);background-size:200% 100%;animation:shimmer 1.4s ease infinite;border-radius:8px;}

        @media(max-width:900px){.sidebar{display:none}.main{margin-left:0}.content{padding:18px}}
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      <div className="layout">
        <aside className="sidebar">
          <a className="logo" href="/"><div className="logo-icon">U</div><span className="logo-text"><em>Urban</em>Well</span></a>
          <div className="nav-lbl">Dashboard</div>
          <a className="nav-a" href="/dashboard">⚡ Overview</a>
          <a className="nav-a" href="/progress">📊 Progress</a>
          <div className="nav-lbl">Tools</div>
          <a className="nav-a" href="/calculator">⚖️ BMI / TDEE</a>
          <a className="nav-a on" href="/export">📄 PDF Export</a>
          <a className="nav-a" href="/leaderboard">🏆 Leaderboard</a>
          <a className="nav-a" href="/workouts/generate">🏋️ AI Workout</a>
          <a className="nav-a" href="/workouts/history">📋 History</a>
          <a className="nav-a" href="/progress/log">📝 Log Progress</a>
          <div className="nav-lbl">Discover</div>
          <a className="nav-a" href="/bookings">📅 Bookings</a>
          <a className="nav-a" href="/trainers">👥 Trainers</a>
          <a className="nav-a" href="/nutritionists">🧬 Nutritionists</a>
          <a className="nav-a" href="/meals">🥗 Meal Plans</a>
          <div className="nav-lbl">Communication</div>
          <a className="nav-a" href="/chat">💬 Messages</a>
          <a className="nav-a" href="/notifications">🔔 Notifications</a>
          <div className="nav-lbl">Account</div>
          <a className="nav-a" href="/profile">👤 Profile</a>
          <div className="sb-bot">
            <div className="ucard">
              <div className="uav">{user?.name?.[0]?.toUpperCase()||'U'}</div>
              <div><div style={{fontSize:12.5,fontWeight:700,marginBottom:1}}>{user?.name}</div><div style={{fontSize:10,color:'var(--sub)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:130,whiteSpace:'nowrap'}}>{user?.email}</div></div>
            </div>
            <button className="logout-btn" onClick={()=>{localStorage.removeItem('token');router.push('/login');}}>Sign out</button>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-title">📄 PDF Export</div>
            <a className="back-btn" href="/dashboard">← Dashboard</a>
          </div>

          <div className="content">
            <div className="page-head">
              <div className="page-title">Export Your Data</div>
              <div className="page-sub">Download professional PDF reports of your workouts, meal plan, and progress. All data is generated live from your account — no mock content.</div>
            </div>

            <div className="export-grid">
              {exports.map(ex => (
                <div key={ex.id} className="export-card">
                  <div className="ec-top">
                    <div className="ec-icon" style={{ background: ex.grad, border: `1px solid ${ex.border}` }}>{ex.icon}</div>
                    <div className="ec-info">
                      <div className="ec-title">{ex.title}</div>
                      <div className="ec-desc">{ex.desc}</div>
                      <div className="ec-count" style={{ background: ex.grad, border: `1px solid ${ex.border}`, color: ex.color }}>
                        {dataLoading ? <span className="skel" style={{ width: 100, height: 12 }} /> : ex.count}
                      </div>
                    </div>
                  </div>

                  <div className="ec-options">
                    {ex.options.map((opt: any) => (
                      <div key={opt.key} className="ec-opt" onClick={() => opt.set(!opt.val)}>
                        <div className={`ec-checkbox ${opt.val ? 'on' : ''}`}>
                          {opt.val && <span style={{ fontSize: 11, color: 'var(--lime)', fontWeight: 900 }}>✓</span>}
                        </div>
                        <span className="ec-opt-lbl" style={{ color: opt.val ? 'var(--text)' : undefined }}>{opt.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="ec-footer">
                    <div style={{ fontSize: 12, color: 'var(--sub)' }}>
                      A4 · Dark theme · UrbanWell branding
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {done === ex.id && <div className="done-tag">✓ Downloaded</div>}
                      <button
                        className="export-btn"
                        style={{ background: ex.color, color: '#000', opacity: exporting && exporting !== ex.id ? 0.4 : 1 }}
                        onClick={ex.onExport}
                        disabled={!!exporting || dataLoading}
                      >
                        {exporting === ex.id ? (
                          <>
                            <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,.2)', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                            Generating…
                          </>
                        ) : (
                          <>↓ Export PDF</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="install-note">
              <div className="install-icon">📦</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Install jsPDF in your project</div>
                <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 8 }}>
                  PDF generation runs entirely in the browser — no backend needed. Install the package:
                </div>
                <code style={{ display: 'block', padding: '8px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, color: 'var(--cyan)' }}>
                  npm install jspdf
                </code>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}