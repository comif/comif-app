"use client";

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, CheckCircle2, Circle, Clock, ListTodo, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type TaskStatus = 'Pas commencé' | 'En cours' | 'Fini';

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  assignees: string[];
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase.from('admin_tasks').select('*').order('created_at', { ascending: true });
    if (data) setTasks(data);
  };

  // KPIs state
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    // Membres actifs
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (count !== null) setActiveMembers(count);

    // Recettes du jour (achats d'aujourd'hui)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: sales } = await supabase
      .from('transactions')
      .select('amount')
      .eq('transaction_type', 'achat')
      .gte('created_at', today.toISOString());

    if (sales) {
      // Les montants d'achat sont souvent en négatif dans la DB si c'est un retrait sur le solde, on prend la valeur absolue
      const total = sales.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
      setTodayRevenue(total);
    }
  };

  const toggleStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    let newStatus = 'En cours';
    if (task.status === 'Pas commencé') newStatus = 'En cours';
    else if (task.status === 'En cours') newStatus = 'Fini';
    else newStatus = 'Pas commencé';

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    await supabase.from('admin_tasks').update({ status: newStatus }).eq('id', id);
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const assignees = newTaskAssignee.split(',').map(a => a.trim()).filter(a => a !== '');
    const newTaskObj = {
      title: newTaskTitle.trim(),
      status: 'Pas commencé',
      assignees: assignees.length > 0 ? assignees : ['Équipe']
    };

    // UI optimiste temporaire
    const tempId = Date.now().toString();
    setTasks([...tasks, { ...newTaskObj, id: tempId }]);
    setNewTaskTitle('');
    setNewTaskAssignee('');

    const { data } = await supabase.from('admin_tasks').insert([newTaskObj]).select();
    if (data && data[0]) {
      setTasks(prev => prev.map(t => t.id === tempId ? data[0] : t));
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('admin_tasks').delete().eq('id', id);
  };

  const getStatusIcon = (status: TaskStatus) => {
    if (status === 'Fini') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (status === 'En cours') return <Clock className="w-5 h-5 text-amber-500" />;
    return <Circle className="w-5 h-5 text-stone-300" />;
  };

  const getStatusBadge = (status: TaskStatus) => {
    if (status === 'Fini') return <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200">Fini</span>;
    if (status === 'En cours') return <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200">En cours</span>;
    return <span className="bg-stone-100 text-stone-600 px-2.5 py-1 rounded-md text-xs font-bold border border-stone-200">Pas commencé</span>;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-800 tracking-tight mb-2">Tableau de bord</h1>
      <p className="text-stone-500 mb-8">Vue d'ensemble de l'activité du foyer.</p>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        
        <div className="bg-white rounded-2xl p-6 border border-[#E8E4D9] shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-1">Recettes du jour</p>
            <p className="text-3xl font-black text-stone-800">{todayRevenue.toFixed(2)} €</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8E4D9] shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-1">Membres Actifs</p>
            <p className="text-3xl font-black text-stone-800">{activeMembers}</p>
          </div>
        </div>

      </div>

      {/* Todo List COMIF */}
      <div className="bg-white rounded-2xl border border-[#E8E4D9] shadow-sm overflow-hidden max-w-4xl">
        <div className="p-5 border-b border-[#E8E4D9] bg-[#FCFAF5] flex items-center gap-3">
          <ListTodo className="w-5 h-5 text-[#5A0A18]" />
          <h3 className="font-bold text-stone-800">Tâches COMIF</h3>
        </div>

        {/* Formulaire d'ajout */}
        <form onSubmit={addTask} className="p-4 bg-white border-b border-[#E8E4D9] flex gap-3">
          <input 
            type="text" 
            placeholder="Nouvelle tâche..." 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 px-4 py-2 bg-[#F4F1EB] border border-[#E8E4D9] rounded-lg text-sm focus:outline-none focus:border-[#5A0A18] font-medium"
          />
          <input 
            type="text" 
            placeholder="Assigné à (ex: Maxence, Théo)" 
            value={newTaskAssignee}
            onChange={(e) => setNewTaskAssignee(e.target.value)}
            className="w-56 px-4 py-2 bg-[#F4F1EB] border border-[#E8E4D9] rounded-lg text-sm focus:outline-none focus:border-[#5A0A18] font-medium"
          />
          <button 
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="bg-[#5A0A18] text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#7A1224] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </form>
        
        <div className="divide-y divide-[#F0EBE0]">
          {tasks.map(task => (
            <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-[#F4F1EB] transition-colors group">
              <button 
                onClick={() => toggleStatus(task.id)}
                className="shrink-0 transition-transform active:scale-90 p-1 hover:bg-stone-100 rounded-full"
              >
                {getStatusIcon(task.status)}
              </button>
              
              <div className="flex-1">
                <p className={`font-semibold text-sm ${task.status === 'Fini' ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                  {task.title}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="flex -space-x-2">
                  {task.assignees?.map((assignee: string, idx: number) => (
                    <div 
                      key={idx} 
                      title={assignee}
                      className="w-7 h-7 rounded-full bg-[#1E7D7A] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm"
                    >
                      {assignee.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
                <div className="w-28 text-right cursor-pointer" onClick={() => toggleStatus(task.id)}>
                  {getStatusBadge(task.status)}
                </div>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Supprimer la tâche"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="p-8 text-center text-stone-400 font-medium">
              Aucune tâche pour le moment. Tout est en ordre !
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
