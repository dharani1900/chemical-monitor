import type { DetectionRecord, DashboardStats, User } from '../types';

// Helper to draw semi-transparent simulated gas cloud plume on image canvas
export function generateClientSidePlumeOverlay(
  imageSrc: string,
  isLeakage: boolean = true
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      const w = img.width;
      const h = img.height;
      const bannerHeight = 40;

      canvas.width = w;
      canvas.height = h + (isLeakage ? bannerHeight : 0);

      // Draw original image
      ctx.drawImage(img, 0, 0, w, h);

      if (isLeakage) {
        // Render semi-transparent multi-colored gas plume gradient
        const centerX = w * 0.55;
        const centerY = h * 0.55;
        const radius = Math.min(w, h) * 0.35;

        // Plume gradient (Blue -> Cyan -> Yellow -> Orange -> Red)
        const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.75)'); // Red center
        grad.addColorStop(0.3, 'rgba(249, 115, 22, 0.65)'); // Orange
        grad.addColorStop(0.55, 'rgba(234, 179, 8, 0.5)'); // Yellow
        grad.addColorStop(0.75, 'rgba(6, 182, 212, 0.35)'); // Cyan
        grad.addColorStop(1, 'rgba(59, 130, 246, 0.0)'); // Blue fade

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw intensity legend bar (bottom right)
        const legW = Math.min(180, w * 0.4);
        const legH = 18;
        const legX = w - legW - 15;
        const legY = h - legH - 20;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(legX - 8, legY - 20, legW + 16, legH + 32);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText('Simulated Risk Density', legX, legY - 6);

        const barGrad = ctx.createLinearGradient(legX, 0, legX + legW, 0);
        barGrad.addColorStop(0, '#3b82f6');
        barGrad.addColorStop(0.25, '#06b6d4');
        barGrad.addColorStop(0.5, '#eab308');
        barGrad.addColorStop(0.75, '#f97316');
        barGrad.addColorStop(1, '#ef4444');

        ctx.fillStyle = barGrad;
        ctx.fillRect(legX, legY, legW, legH);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText('Low', legX, legY + legH + 11);
        ctx.fillText('High', legX + legW - 20, legY + legH + 11);

        // Burned-in Disclaimer Banner
        ctx.fillStyle = '#dc2626'; // Red banner
        ctx.fillRect(0, h, w, bannerHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          'AI-SIMULATED LEAKAGE VISUALIZATION -- NOT A REAL GAS MEASUREMENT',
          w / 2,
          h + 25
        );
      } else {
        // Draw green safe banner
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(0, h - 35, w, 35);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SAFE STATUS -- NO LEAKAGE INDICATORS DETECTED', w / 2, h - 12);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

// LocalStorage Persistence Helpers
const HISTORY_KEY = 'chemical_monitor_demo_history_v1';
const USER_KEY = 'chemical_monitor_demo_user_v1';

export function getDemoHistory(): DetectionRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDemoHistory(records: DetectionRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
}

export function getDemoUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : {
      id: 1,
      email: 'admin@lab.com',
      full_name: 'Lab Safety Administrator',
      role: 'admin',
      created_at: new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export function saveDemoUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function processDemoAnalyze(file: File, notes?: string): Promise<DetectionRecord> {
  const originalDataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  const isLeakage = file.name.toLowerCase().includes('leak') || Math.random() > 0.45;
  const visDataUrl = await generateClientSidePlumeOverlay(originalDataUrl, isLeakage);

  const history = getDemoHistory();
  const newRecord: DetectionRecord = {
    id: history.length + 1,
    user_id: 1,
    original_image_path: originalDataUrl,
    visualization_image_path: visDataUrl,
    prediction: isLeakage ? 'leakage' : 'no_leakage',
    confidence: isLeakage ? 0.895 : 0.942,
    mode: 'demo_mode',
    visualization_type: 'gradcam_or_simulated',
    severity: isLeakage ? 'High' : 'None',
    alarm_recommended: isLeakage,
    alarm_activated: isLeakage,
    model_version: 'MobileNetV2-Demo-v1.0',
    notes: notes || 'Vercel Online Demo Evaluation',
    timestamp: new Date().toISOString()
  };

  history.unshift(newRecord);
  saveDemoHistory(history);

  return newRecord;
}

export function getDemoStats(): DashboardStats {
  const history = getDemoHistory();
  const total = history.length;
  const leakage = history.filter(h => h.prediction === 'leakage').length;
  const safe = history.filter(h => h.prediction === 'no_leakage').length;

  const latest = history[0] || null;

  return {
    total_images: total,
    leakage_predictions: leakage,
    safe_predictions: safe,
    latest_detection: latest,
    alarm_status: latest && latest.prediction === 'leakage' ? 'active' : 'silent',
    model_status: 'demo_mode',
    detections_over_time: [
      { date: 'Today', total, leakage, safe }
    ],
    prediction_breakdown: [
      { name: 'Safe Cabinets', value: safe, color: '#10b981' },
      { name: 'Leakage Alerts', value: leakage, color: '#ef4444' }
    ]
  };
}
