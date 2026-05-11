"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, Clock, AlignLeft, X } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays,
  parseISO
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { createClient } from '@/utils/supabase/client';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  type: string;
}

export default function PlanningPage() {
  const supabase = createClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  // Form state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventType, setNewEventType] = useState('Soirée');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('event_date', format(monthEnd, 'yyyy-MM-dd'));
        
      if (error) {
        console.error("Erreur (la table events n'existe peut-être pas encore):", error);
      } else if (data) {
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (date: Date) => {
    setSelectedDate(date);
    setNewEventTitle('');
    setNewEventDesc('');
    setNewEventType('Soirée');
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    setSelectedDate(parseISO(event.event_date));
    setNewEventTitle(event.title);
    setNewEventDesc(event.description || '');
    setNewEventType(event.type);
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setEditingEvent(null);
  };

  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !selectedDate) return;
    
    setIsLoading(true);
    const eventDateStr = format(selectedDate, 'yyyy-MM-dd');
    
    const eventData = {
      title: newEventTitle.trim(),
      description: newEventDesc.trim(),
      event_date: eventDateStr,
      type: newEventType
    };

    if (editingEvent) {
      // Optimistic update
      setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? { ...ev, ...eventData } : ev));
      closeModal();
      
      const { error } = await supabase.from('events').update(eventData).eq('id', editingEvent.id);
      if (error) {
        console.error("Erreur lors de la mise à jour:", error);
        fetchEvents(); // Revert on error
      }
    } else {
      const tempId = Date.now().toString();
      setEvents([...events, { ...eventData, id: tempId }]);
      closeModal();

      const { data, error } = await supabase.from('events').insert([eventData]).select();
      if (data && data[0]) {
        setEvents(prev => prev.map(ev => ev.id === tempId ? data[0] : ev));
      } else if (error) {
        console.error("Erreur lors de l'ajout:", error);
        setEvents(prev => prev.filter(ev => ev.id !== tempId));
      }
    }
    setIsLoading(false);
  };

  const deleteEvent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEvents(prev => prev.filter(ev => ev.id !== id));
    await supabase.from('events').delete().eq('id', id);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Soirée': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Réunion': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Lancement': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Prestation': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-stone-200 text-stone-800 border-stone-300';
    }
  };

  const monthStart = startOfMonth(currentDate);
  const days = getDaysInMonth();
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight mb-2">Planning</h1>
          <p className="text-stone-500">Gérez les événements et activités de la COMIF.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-[#E8E4D9] shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-[#F4F1EB] rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-stone-600" />
          </button>
          <div className="w-40 text-center font-bold text-stone-800 capitalize flex items-center justify-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#5A0A18]" />
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-[#F4F1EB] rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-stone-600" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E4D9] shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#E8E4D9] bg-[#FCFAF5]">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-xs font-black uppercase tracking-widest text-stone-500 border-r border-[#E8E4D9] last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 auto-rows-[140px] bg-[#E8E4D9] gap-[1px]">
          {days.map((day, i) => {
            const isSelectedMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const dayEvents = events.filter(e => e.event_date === format(day, 'yyyy-MM-dd'));
            
            return (
              <div 
                key={i}
                onClick={() => openModal(day)}
                className={`bg-white p-2 flex flex-col transition-colors cursor-pointer hover:bg-stone-50 group relative ${!isSelectedMonth ? 'opacity-50 bg-stone-50/50' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-[#5A0A18] text-white shadow-md' : 'text-stone-700'}`}>
                    {format(day, 'd')}
                  </span>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-stone-400 hover:text-[#5A0A18] p-1">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-1">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id} 
                      onClick={(e) => openEditModal(e, event)}
                      className={`text-xs px-2 py-1.5 rounded-md border font-semibold flex items-start justify-between group/event ${getTypeColor(event.type)} hover:brightness-95 transition-all`}
                    >
                      <span className="truncate pr-1">{event.title}</span>
                      <button 
                        onClick={(e) => deleteEvent(e, event.id)}
                        className="opacity-0 group-hover/event:opacity-100 hover:text-red-600 transition-opacity shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Ajout Événement */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#E8E4D9] flex justify-between items-center bg-[#FCFAF5]">
              <h3 className="font-bold text-stone-800 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#5A0A18]" />
                {editingEvent ? 'Modifier un événement' : 'Ajouter un événement'}
              </h3>
              <button onClick={closeModal} className="text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-lg hover:bg-stone-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={saveEvent} className="p-6 flex flex-col gap-5">
              <div className="bg-[#F4F1EB] text-stone-800 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 border border-[#E8E4D9]">
                <Clock className="w-4 h-4 text-stone-500" />
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Titre de l'événement</label>
                <input 
                  type="text" 
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  placeholder="Ex: Soirée K-Pop, Réunion d'équipe..."
                  className="w-full px-4 py-3 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-sm focus:outline-none focus:border-[#5A0A18] focus:ring-1 focus:ring-[#5A0A18] font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Type</label>
                <div className="flex gap-2">
                  {['Soirée', 'Réunion', 'Lancement', 'Prestation', 'Autre'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewEventType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        newEventType === type 
                          ? getTypeColor(type) + ' ring-2 ring-offset-1 ring-' + getTypeColor(type).split('-')[1] + '-400'
                          : 'bg-white border-[#E8E4D9] text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Description (optionnelle)</label>
                <div className="relative">
                  <AlignLeft className="w-4 h-4 text-stone-400 absolute top-3.5 left-4" />
                  <textarea 
                    value={newEventDesc}
                    onChange={e => setNewEventDesc(e.target.value)}
                    placeholder="Détails, horaires, organisation..."
                    className="w-full pl-11 pr-4 py-3 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-sm focus:outline-none focus:border-[#5A0A18] focus:ring-1 focus:ring-[#5A0A18] min-h-[100px] resize-none font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-5 py-3 rounded-xl text-sm font-bold bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isLoading || !newEventTitle.trim()}
                  className="flex-1 px-5 py-3 rounded-xl text-sm font-bold bg-[#5A0A18] text-white hover:bg-[#7A1224] transition-colors disabled:opacity-50 shadow-md shadow-rose-900/20"
                >
                  {isLoading ? 'Enregistrement...' : (editingEvent ? 'Mettre à jour' : 'Créer l\'événement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
