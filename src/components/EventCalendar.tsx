// src/components/EventCalendar.tsx
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Import default calendar styles
import { useAuth } from "../hooks/useAuth";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

type TEvent = {
  id: string;
  title: string;
  description: string;
  datetime: string;
  state: "regular" | "necessary" | "urgent";
};

const EventCalendar: React.FC = () => {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<TEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    const eventsQuery = query(
      collection(db, "events"),
      where("userId", "==", user.uid)
    );

    // Real-time listener for events
    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const evData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "",
            description: data.description || "",
            datetime: data.datetime || new Date().toISOString(),
            state: data.state || "regular",
          } as TEvent;
        });
        setEvents(evData);
      },
      (error) => {
        console.error("Error fetching events:", error);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Utility function that returns only events that fall on the selected day.
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.datetime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const eventsForDay = getEventsForDay(selectedDate);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Calendar
        onChange={(date: Date) => setSelectedDate(date)}
        value={selectedDate}
        className="react-calendar"  // Apply custom Tailwind styles or keep default styles
      />
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">
          Events on {selectedDate.toDateString()}
        </h2>
        {eventsForDay.length === 0 ? (
          <p className="text-gray-500">No events scheduled for this day.</p>
        ) : (
          <ul className="space-y-4">
            {eventsForDay.map((ev) => (
              <li key={ev.id} className="border rounded p-4 shadow-sm">
                <h3 className="font-semibold text-xl">{ev.title}</h3>
                <p className="text-gray-700">{ev.description}</p>
                <p className="text-sm text-gray-400">
                  Time: {new Date(ev.datetime).toLocaleTimeString()}
                </p>
                <p className="text-sm font-semibold">
                  Status: {ev.state.charAt(0).toUpperCase() + ev.state.slice(1)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EventCalendar;
