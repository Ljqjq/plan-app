// Example: EventCalendarView.tsx (with events fetched here)
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { EventList, TEvent } from "./EventList"; // Ensure TEvent export from EventList

const EventCalendarView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<TEvent[]>([]);

  // Assume you are fetching events in this component (replace with your own auth logic)
  useEffect(() => {
    // Replace with your user uid condition if needed:
    const eventsQuery = query(collection(db, "events") /*, where("userId", "==", uid) */);
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const fetchedEvents = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "",
          description: data.description || "",
          datetime: data.datetime || new Date().toISOString(),
          state: data.state || "regular",
        } as TEvent;
      });
      setEvents(fetchedEvents);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full bg-gray-100 min-h-screen">
      <div className="flex flex-col lg:flex-row">
        {/* Left Bar: The Calendar */}
        <div className="w-full lg:w-1/3 p-4">
          <Calendar
            onChange={(date: Date | Date[]) => {
              if (Array.isArray(date)) {
                setSelectedDate(date[0]);
              } else {
                setSelectedDate(date);
              }
            }}
            value={selectedDate}
            tileContent={({ date, view }) => {
              if (view === "month") {
                const dayEvents = events.filter((ev) => {
                  const evDate = new Date(ev.datetime);
                  return (
                    evDate.getFullYear() === date.getFullYear() &&
                    evDate.getMonth() === date.getMonth() &&
                    evDate.getDate() === date.getDate()
                  );
                });
                return dayEvents.length > 0 ? (
                  <div className="text-xs mt-1 text-green-600">
                    {dayEvents.length} {dayEvents.length > 1 ? "events" : "event"}
                  </div>
                ) : null;
              }
              return null;
            }}
            className="react-calendar bg-white rounded-xl shadow-lg p-4 w-full"
          />
        </div>

        {/* Right Bar: EventList (passing selectedDate, and optionally, events if needed) */}
        <div className="w-full lg:w-2/3 p-4 border-l border-gray-300">
          <EventList selectedDate={selectedDate} />
        </div>
      </div>
    </div>
  );
};

export default EventCalendarView;
