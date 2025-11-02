import React, { useState, useEffect } from 'react';
import {
  ChevronLeftIcon, ChevronRightIcon, CalendarIcon, TruckIcon,
  ClockIcon, UserIcon, MapPinIcon, PlusIcon, ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

interface DeliveryEvent {
  id: string;
  runNumber: string;
  runName: string;
  date: string;
  time: string;
  driver: string;
  vehicle: string;
  stops: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  customers: string[];
}

interface DeliveryCalendarProps {
  onCreateNewRun: (date: string) => void;
  onViewRun: (runId: string) => void;
  refreshTrigger?: number; // To force refresh when delivery runs change
}

const DeliveryCalendar: React.FC<DeliveryCalendarProps> = ({
  onCreateNewRun,
  onViewRun,
  refreshTrigger
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [deliveryEvents, setDeliveryEvents] = useState<DeliveryEvent[]>([]);

  useEffect(() => {
    loadDeliveryRuns();
  }, [refreshTrigger]); // Reload when delivery runs change

  const loadDeliveryRuns = () => {
    // Load real delivery runs from localStorage
    const storedRuns = localStorage.getItem('saleskik-delivery-runs');
    if (storedRuns) {
      const runs = JSON.parse(storedRuns);
      
      // Convert delivery runs to calendar events with proper date handling
      const events: DeliveryEvent[] = runs.map((run: any) => {
        // Ensure date is in YYYY-MM-DD format without timezone issues
        let eventDate = run.plannedDate;
        if (eventDate && eventDate.includes('T')) {
          // If it's a full datetime, extract just the date part
          eventDate = eventDate.split('T')[0];
        }
        
        return {
          id: run.id,
          runNumber: run.runNumber,
          runName: run.runName,
          date: eventDate,
          time: run.startTime || '08:00',
          driver: run.driver.name,
          vehicle: run.vehicle.registration,
          stops: run.totalStops || run.deliveries?.length || 0,
          status: run.status,
          customers: run.deliveries ? 
            run.deliveries.slice(0, 3).map((d: any) => d.customerName) : 
            ['Customer info loading...']
        };
      });
      
      setDeliveryEvents(events);
      console.log('📅 Calendar loaded', events.length, 'delivery runs');
    } else {
      setDeliveryEvents([]);
      console.log('📅 No delivery runs found for calendar');
    }
  };
  const [view, setView] = useState<'month' | 'week'>('month');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const events = deliveryEvents.filter(event => event.date === dateStr);
    console.log(`📅 Events for ${dateStr}:`, events.length);
    return events;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Delivery Schedule Calendar
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  view === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  view === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Week
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            
            <h3 className="text-lg font-medium text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Week Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth(currentDate).map((date, index) => {
            if (!date) {
              return <div key={index} className="h-24"></div>;
            }

            const events = getEventsForDate(date);
            const dateStr = formatDateForDisplay(date);
            const isSelected = selectedDate === dateStr;
            const todayClass = isToday(date) ? 'bg-blue-50 border-blue-200' : '';

            return (
              <div
                key={index}
                className={`h-24 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors ${todayClass} ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              >
                <div className="p-1 h-full flex flex-col">
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      isToday(date) ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </span>
                    {events.length === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateNewRun(dateStr);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Create delivery run"
                      >
                        <PlusIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Delivery Events */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {events.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewRun(event.id);
                        }}
                        className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm ${getStatusColor(event.status)}`}
                        title={`${event.runName} - ${event.driver} (${event.vehicle})`}
                      >
                        <div className="font-medium truncate">{event.runName}</div>
                        <div className="text-xs opacity-75">{event.time} • {event.stops} stops</div>
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{events.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              Deliveries for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h4>
            <button
              onClick={() => onCreateNewRun(selectedDate)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              New Delivery Run
            </button>
          </div>

          {(() => {
            const dayEvents = deliveryEvents.filter(event => event.date === selectedDate);
            
            if (dayEvents.length === 0) {
              return (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <CalendarIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">No deliveries scheduled for this date</p>
                  <button
                    onClick={() => onCreateNewRun(selectedDate)}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Schedule Delivery
                  </button>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onViewRun(event.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <TruckIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{event.runName}</h5>
                          <p className="text-sm text-gray-600">{event.runNumber}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">
                              <ClockIcon className="w-3 h-3 inline mr-1" />
                              {event.time}
                            </span>
                            <span className="text-xs text-gray-500">
                              <UserIcon className="w-3 h-3 inline mr-1" />
                              {event.driver}
                            </span>
                            <span className="text-xs text-gray-500">
                              <MapPinIcon className="w-3 h-3 inline mr-1" />
                              {event.stops} stops
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Customers:</p>
                          <p className="text-xs text-gray-700 font-medium">
                            {event.customers.slice(0, 2).join(', ')}
                            {event.customers.length > 2 && ` +${event.customers.length - 2} more`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default DeliveryCalendar;