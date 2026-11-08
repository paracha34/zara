import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Plus,
  CheckCircle2,
  Trash2,
  RotateCcw,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { ReminderItem } from '../types/assistant.ts';
import { soundEffects } from '../utils/audioService.ts';

interface RemindersViewProps {
  reminders: ReminderItem[];
  onAddReminder: (task: string, delayMinutes: number, priority?: 'normal' | 'high') => void;
  onUpdateStatus: (id: string, status: 'active' | 'completed' | 'snoozed') => void;
  onDeleteReminder: (id: string) => void;
  onSnoozeReminder: (id: string, extraMinutes: number) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  onAddReminder,
  onUpdateStatus,
  onDeleteReminder,
  onSnoozeReminder,
}) => {
  const [taskText, setTaskText] = useState('');
  const [delayMins, setDelayMins] = useState(10);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Real-time ticking clock every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      // Check if any reminder just hit 0
      reminders.forEach((r) => {
        if (r.status === 'active' && Math.abs(r.dueTime - now) < 1500) {
          soundEffects.playReminderAlarm();
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [reminders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    onAddReminder(taskText.trim(), delayMins);
    setTaskText('');
  };

  const formatCountdown = (dueTime: number) => {
    const diff = dueTime - currentTime;
    if (diff <= 0) {
      return 'DUE NOW';
    }
    const totalSecs = Math.floor(diff / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const presets = [
    { label: '5m Water', task: 'Pani peene ka waqt (Drink Water)', mins: 5 },
    { label: '15m Armor Check', task: 'Check Arc Reactor & Armor Systems', mins: 15 },
    { label: '30m Meeting', task: 'Briefing with Pepper Potts & Jarvis', mins: 30 },
    { label: '1h Break', task: 'Work sprint break aur rest', mins: 60 },
  ];

  const activeReminders = reminders.filter((r) => r.status === 'active' || r.status === 'snoozed');
  const completedReminders = reminders.filter((r) => r.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Reminders & Scheduled Alarms
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ZARA executes time-based notifications with audio chimes and voice alerts in Urdu & English.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              activeTab === 'active'
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({activeReminders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              activeTab === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            History ({completedReminders.length})
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 my-6 shadow-xl">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Create New Voice Reminder / Alarm
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="e.g. Call Bruce Banner / Server deployment check..."
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-400/60 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          <div className="flex items-center gap-2">
            <select
              value={delayMins}
              onChange={(e) => setDelayMins(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value={1}>In 1 minute (Fast test)</option>
              <option value={5}>In 5 minutes</option>
              <option value={10}>In 10 minutes</option>
              <option value={15}>In 15 minutes</option>
              <option value={30}>In 30 minutes</option>
              <option value={60}>In 1 hour</option>
              <option value={120}>In 2 hours</option>
            </select>

            <button
              type="submit"
              disabled={!taskText.trim()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shrink-0 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Set Alarm</span>
            </button>
          </div>
        </form>

        {/* Preset quick buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-500">Quick Presets:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onAddReminder(p.task, p.mins)}
              className="text-[11px] px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
            >
              + {p.label}
            </button>
          ))}
          <button
            onClick={() => soundEffects.playReminderAlarm()}
            className="text-[11px] ml-auto px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 flex items-center gap-1"
            title="Test synthetic alarm chime"
          >
            <Volume2 className="w-3 h-3" />
            Test Chime
          </button>
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {activeTab === 'active' ? (
          activeReminders.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No active alarms or reminders.</p>
              <p className="text-xs text-slate-500 mt-1">
                Say "ZARA, remind me in 5 minutes to test..." or use the quick form above.
              </p>
            </div>
          ) : (
            activeReminders.map((r) => {
              const isDue = r.dueTime <= currentTime;
              return (
                <div
                  key={r.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition ${
                    isDue
                      ? 'bg-red-950/30 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isDue
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white">{r.task}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="font-mono tabular-nums text-cyan-300 font-semibold">
                          Due: {new Date(r.dueTime).toLocaleTimeString()}
                        </span>
                        <span>·</span>
                        <span
                          className={`font-mono tabular-nums font-bold ${
                            isDue ? 'text-red-400' : 'text-amber-400'
                          }`}
                        >
                          {formatCountdown(r.dueTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSnoozeReminder(r.id, 5)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                      title="Snooze 5 minutes"
                    >
                      +5m Snooze
                    </button>
                    <button
                      onClick={() => onUpdateStatus(r.id, 'completed')}
                      className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition"
                      title="Mark as completed"
                      aria-label="Complete"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteReminder(r.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition"
                      title="Delete reminder"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : completedReminders.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-400">No completed reminders yet.</p>
          </div>
        ) : (
          completedReminders.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 opacity-70"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm line-through text-slate-400">{r.task}</span>
              </div>
              <button
                onClick={() => onUpdateStatus(r.id, 'active')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-activate</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
