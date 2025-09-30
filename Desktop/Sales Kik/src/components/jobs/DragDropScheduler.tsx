import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';

interface SchedulerEvent {
  id: string;
  jobId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  status: 'PLANNED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedCrewIds: string[];
  location?: string;
  customer: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'EMERGENCY';
  conflicts?: boolean;
}

interface CrewMember {
  id: string;
  name: string;
  skills: string[];
  isActive: boolean;
  color: string;
}

interface DragDropSchedulerProps {
  onEventUpdate?: (event: SchedulerEvent) => void;
  onEventCreate?: (event: Partial<SchedulerEvent>) => void;
  onEventDelete?: (eventId: string) => void;
}

export function DragDropScheduler({ onEventUpdate, onEventCreate, onEventDelete }: DragDropSchedulerProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [events, setEvents] = useState<SchedulerEvent[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [draggedEvent, setDraggedEvent] = useState<SchedulerEvent | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showConflicts, setShowConflicts] = useState(true);
  const [selectedView, setSelectedView] = useState<'week' | 'day'>('week');
  const [dragOverCell, setDragOverCell] = useState<{date: Date, crew: string} | null>(null);
  
  const schedulerRef = useRef<HTMLDivElement>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);

  // Mock data - in production this would come from API
  useEffect(() => {
    const mockCrewMembers: CrewMember[] = [
      { id: 'crew1', name: 'Mike Johnson', skills: ['plumbing', 'electrical'], isActive: true, color: '#3B82F6' },
      { id: 'crew2', name: 'Tom Wilson', skills: ['carpentry', 'general'], isActive: true, color: '#10B981' },
      { id: 'crew3', name: 'Dave Brown', skills: ['plumbing', 'tiling'], isActive: true, color: '#F59E0B' },
      { id: 'crew4', name: 'Steve Davis', skills: ['electrical', 'general'], isActive: true, color: '#EF4444' },
      { id: 'crew5', name: 'Paul Smith', skills: ['carpentry', 'painting'], isActive: true, color: '#8B5CF6' }
    ];

    const mockEvents: SchedulerEvent[] = [
      {
        id: 'event1',
        jobId: 'job1',
        title: 'Kitchen Installation - Smith Residence',
        startTime: new Date(2024, 8, 25, 9, 0),
        endTime: new Date(2024, 8, 25, 17, 0),
        status: 'CONFIRMED',
        assignedCrewIds: ['crew1', 'crew2'],
        customer: 'John Smith',
        priority: 'HIGH',
        location: '123 Main St'
      },
      {
        id: 'event2',
        jobId: 'job2',
        title: 'Bathroom Renovation - Jones Property',
        startTime: new Date(2024, 8, 24, 8, 0),
        endTime: new Date(2024, 8, 24, 16, 0),
        status: 'IN_PROGRESS',
        assignedCrewIds: ['crew3'],
        customer: 'Sarah Jones',
        priority: 'NORMAL',
        location: '456 Oak Ave'
      },
      {
        id: 'event3',
        jobId: 'job3',
        title: 'Electrical Repair - Brown House',
        startTime: new Date(2024, 8, 26, 10, 0),
        endTime: new Date(2024, 8, 26, 14, 0),
        status: 'PLANNED',
        assignedCrewIds: ['crew4'],
        customer: 'Mike Brown',
        priority: 'URGENT',
        location: '789 Pine St'
      }
    ];

    setCrewMembers(mockCrewMembers);
    setEvents(mockEvents);
  }, []);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = [];
  
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(weekStart, i));
  }

  const timeSlots = [];
  for (let hour = 6; hour < 20; hour++) {
    timeSlots.push(hour);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-gray-100 border-gray-300 text-gray-700';
      case 'CONFIRMED': return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'IN_PROGRESS': return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      case 'COMPLETED': return 'bg-green-100 border-green-300 text-green-700';
      case 'CANCELLED': return 'bg-red-100 border-red-300 text-red-700';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'border-l-green-500';
      case 'NORMAL': return 'border-l-blue-500';
      case 'HIGH': return 'border-l-orange-500';
      case 'URGENT': return 'border-l-red-500';
      case 'EMERGENCY': return 'border-l-red-700';
      default: return 'border-l-gray-500';
    }
  };

  const getEventPosition = (event: SchedulerEvent, date: Date) => {
    if (!isSameDay(event.startTime, date)) return null;
    
    const startHour = event.startTime.getHours() + event.startTime.getMinutes() / 60;
    const endHour = event.endTime.getHours() + event.endTime.getMinutes() / 60;
    const duration = endHour - startHour;
    
    const topOffset = ((startHour - 6) / 14) * 100; // 6am to 8pm = 14 hours
    const height = (duration / 14) * 100;
    
    return {
      top: `${Math.max(0, topOffset)}%`,
      height: `${Math.min(100 - topOffset, height)}%`
    };
  };

  const handleEventDragStart = (e: React.DragEvent, event: SchedulerEvent) => {
    setDraggedEvent(event);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Create drag preview
    if (dragPreviewRef.current) {
      dragPreviewRef.current.style.display = 'block';
      dragPreviewRef.current.textContent = event.title;
    }
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
  };

  const handleEventDragEnd = () => {
    setDraggedEvent(null);
    setDragOverCell(null);
    if (dragPreviewRef.current) {
      dragPreviewRef.current.style.display = 'none';
    }
  };

  const handleCellDragOver = (e: React.DragEvent, date: Date, crewId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell({ date, crew: crewId });
  };

  const handleCellDragLeave = () => {
    setDragOverCell(null);
  };

  const handleCellDrop = (e: React.DragEvent, date: Date, crewId: string, hour: number) => {
    e.preventDefault();
    setDragOverCell(null);
    
    if (!draggedEvent) return;
    
    // Calculate new start and end times
    const originalDuration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime();
    const newStartTime = new Date(date);
    newStartTime.setHours(hour, 0, 0, 0);
    const newEndTime = new Date(newStartTime.getTime() + originalDuration);
    
    // Create updated event
    const updatedEvent: SchedulerEvent = {
      ...draggedEvent,
      startTime: newStartTime,
      endTime: newEndTime,
      assignedCrewIds: [crewId]
    };
    
    // Check for conflicts
    const hasConflict = checkForConflicts(updatedEvent, events.filter(e => e.id !== draggedEvent.id));
    if (hasConflict && showConflicts) {
      updatedEvent.conflicts = true;
    }
    
    // Update events
    setEvents(prev => prev.map(e => e.id === draggedEvent.id ? updatedEvent : e));
    
    // Callback
    if (onEventUpdate) {
      onEventUpdate(updatedEvent);
    }
    
    setDraggedEvent(null);
  };

  const checkForConflicts = (event: SchedulerEvent, existingEvents: SchedulerEvent[]): boolean => {
    return existingEvents.some(existing => {
      const hasCommonCrew = event.assignedCrewIds.some(crewId => 
        existing.assignedCrewIds.includes(crewId)
      );
      
      if (!hasCommonCrew) return false;
      
      const eventStart = event.startTime.getTime();
      const eventEnd = event.endTime.getTime();
      const existingStart = existing.startTime.getTime();
      const existingEnd = existing.endTime.getTime();
      
      return (eventStart < existingEnd && eventEnd > existingStart);
    });
  };

  const renderEvent = (event: SchedulerEvent, date: Date) => {
    const position = getEventPosition(event, date);
    if (!position) return null;
    
    const crew = crewMembers.find(c => event.assignedCrewIds.includes(c.id));
    const isDragging = draggedEvent?.id === event.id;
    
    return (
      <div
        key={event.id}
        draggable
        onDragStart={(e) => handleEventDragStart(e, event)}
        onDragEnd={handleEventDragEnd}
        className={`absolute left-1 right-1 p-2 rounded-md border-l-4 cursor-move transition-all duration-200 ${
          getStatusColor(event.status)
        } ${getPriorityColor(event.priority)} ${
          isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'
        } ${event.conflicts ? 'border-2 border-red-500' : ''}`}
        style={position}
      >
        <div className="text-xs font-medium truncate">{event.title}</div>
        <div className="text-xs text-gray-600 truncate">{event.customer}</div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="flex items-center">
            <ClockIcon className="w-3 h-3 mr-1" />
            {format(event.startTime, 'HH:mm')}
          </span>
          {crew && (
            <div 
              className="w-3 h-3 rounded-full border border-white"
              style={{ backgroundColor: crew.color }}
              title={crew.name}
            />
          )}
        </div>
        {event.conflicts && (
          <div className="absolute -top-1 -right-1">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
    );
  };

  const renderTimeSlot = (date: Date, hour: number, crewId: string) => {
    const isCurrentHour = new Date().getHours() === hour && isSameDay(new Date(), date);
    const isDragOver = dragOverCell?.date === date && dragOverCell?.crew === crewId;
    
    return (
      <div
        key={`${date.toISOString()}-${hour}-${crewId}`}
        className={`h-12 border-b border-gray-100 relative ${
          isCurrentHour ? 'bg-blue-50' : ''
        } ${isDragOver ? 'bg-blue-100 border-blue-300' : ''}`}
        onDragOver={(e) => handleCellDragOver(e, date, crewId)}
        onDragLeave={handleCellDragLeave}
        onDrop={(e) => handleCellDrop(e, date, crewId, hour)}
      >
        {hour === 6 && (
          <div className="absolute top-0 left-0 text-xs text-gray-500 p-1">
            {format(date, 'EEE d')}
          </div>
        )}
      </div>
    );
  };

  const renderCrewColumn = (crewMember: CrewMember, date: Date) => {
    const dayEvents = events.filter(event => 
      isSameDay(event.startTime, date) && event.assignedCrewIds.includes(crewMember.id)
    );
    
    return (
      <div key={`${date.toISOString()}-${crewMember.id}`} className="relative">
        {timeSlots.map(hour => renderTimeSlot(date, hour, crewMember.id))}
        {dayEvents.map(event => renderEvent(event, date))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="p-2 hover:bg-gray-200 rounded-md"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <div className="text-lg font-semibold">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </div>
              <button
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className="p-2 hover:bg-gray-200 rounded-md"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Today
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showConflicts}
                onChange={(e) => setShowConflicts(e.target.checked)}
                className="mr-2"
              />
              Show Conflicts
            </label>
            <div className="flex bg-gray-200 rounded-md p-1">
              <button
                onClick={() => setSelectedView('week')}
                className={`px-3 py-1 rounded text-sm ${
                  selectedView === 'week' ? 'bg-white shadow' : ''
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setSelectedView('day')}
                className={`px-3 py-1 rounded text-sm ${
                  selectedView === 'day' ? 'bg-white shadow' : ''
                }`}
              >
                Day
              </button>
            </div>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <PlusIcon className="w-5 h-5 mr-2" />
              New Event
            </button>
          </div>
        </div>
      </div>

      {/* Crew Legend */}
      <div className="bg-gray-50 p-3 border-b border-gray-200">
        <div className="flex items-center space-x-6 overflow-x-auto">
          {crewMembers.map(crew => (
            <div key={crew.id} className="flex items-center space-x-2 flex-shrink-0">
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: crew.color }}
              />
              <span className="text-sm font-medium">{crew.name}</span>
              <span className="text-xs text-gray-500">({crew.skills.join(', ')})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduler Grid */}
      <div ref={schedulerRef} className="overflow-auto max-h-96">
        <div className="grid grid-cols-8 min-w-full">
          {/* Time column */}
          <div className="border-r border-gray-200 bg-gray-50">
            <div className="h-8 border-b border-gray-200 flex items-center px-2 text-xs font-medium text-gray-600">
              Time
            </div>
            {timeSlots.map(hour => (
              <div key={hour} className="h-12 border-b border-gray-100 flex items-center px-2 text-xs text-gray-600">
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map(date => (
            <div key={date.toISOString()} className="border-r border-gray-200 min-w-32">
              <div className="h-8 border-b border-gray-200 flex items-center justify-center text-xs font-medium text-gray-700 bg-gray-50">
                {format(date, 'EEE d/M')}
              </div>
              <div className="grid grid-cols-1">
                {crewMembers.map(crew => renderCrewColumn(crew, date))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drag Preview */}
      <div
        ref={dragPreviewRef}
        className="fixed top-0 left-0 p-2 bg-blue-100 border border-blue-300 rounded shadow-lg pointer-events-none z-50 hidden"
        style={{ transform: 'translate(-50%, -50%)' }}
      />

      {/* Legend */}
      <div className="bg-gray-50 p-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Planned</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span>Completed</span>
            </div>
          </div>
          <div className="text-gray-500">
            Drag events to reschedule • Click to edit details
          </div>
        </div>
      </div>
    </div>
  );
}