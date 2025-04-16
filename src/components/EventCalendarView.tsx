// src/components/EventCalendarView.tsx
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

type TEvent = {
  id: string;
  title: string;
  description: string;
  datetime: string;
  state: "regular" | "necessary" | "urgent";
};

const EventCalendarView: React.FC = () => {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<TEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- Editing States ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingState, setEditingState] = useState<TEvent["state"]>("regular");
  const [editingDatetime, setEditingDatetime] = useState("");

  // Helper function: converts an ISO datetime string to a datetime-local compatible string
  const formatDateTimeLocal = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // --- Fetching Events from Firebase ---
  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    const eventsQuery = query(
      collection(db, "events"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
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
      },
      (error) => {
        console.error("Error fetching events:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- Filtering Events for a Specific Day ---
  const getEventsForDay = (date: Date): TEvent[] => {
    return events.filter((event) => {
      const eventDate = new Date(event.datetime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  // --- Event Deletion ---
  const handleDelete = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, "events", eventId));
      console.log("Event deleted successfully!");
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event.");
    }
  };

  // --- Enable Editing: Populate editing states with event data ---
  const handleEdit = (event: TEvent) => {
    setEditingId(event.id);
    setEditingTitle(event.title);
    setEditingDescription(event.description);
    setEditingState(event.state);
    setEditingDatetime(formatDateTimeLocal(event.datetime));
  };

  // --- Submit Updates ---
  const handleUpdate = async (eventId: string) => {
    try {
      await updateDoc(doc(db, "events", eventId), {
        title: editingTitle,
        description: editingDescription,
        state: editingState,
        // Convert the datetime-local string (editedDatetime) back into ISO format.
        datetime: new Date(editingDatetime).toISOString(),
      });
      setEditingId(null);
      alert("Event updated successfully!");
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* -------------------------- */}
      {/* Calendar Component Section */}
      {/* -------------------------- */}
      <Calendar
        onChange={(date: Date | Date[]) => {
          // Ensure we only work with a single date.
          if (Array.isArray(date)) {
            setSelectedDate(date[0]);
          } else {
            setSelectedDate(date);
          }
        }}
        value={selectedDate}
        // Render markers on the calendar; when a day has events, show how many.
        tileContent={({ date, view }) => {
          if (view === "month") {
            const dayEvents = getEventsForDay(date);
            return dayEvents.length > 0 ? (
              <div className="text-xs mt-1 text-green-600">
                {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
              </div>
            ) : null;
          }
          return null;
        }}
        className="react-calendar"
      />

      {/* -------------------------- */}
      {/* Events List for the Selected Day */}
      {/* -------------------------- */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">
          Events on {selectedDate.toDateString()}
        </h2>
        {getEventsForDay(selectedDate).length === 0 ? (
          <p className="text-gray-500">No events scheduled for this day.</p>
        ) : (
          <ul className="space-y-4">
            {getEventsForDay(selectedDate).map((ev) => (
              <li
                key={ev.id}
                className="border rounded p-4 shadow-sm flex justify-between items-start"
              >
                {editingId === ev.id ? (
                  // --- Editing Form for a Specific Event ---
                  <form
                    className="w-full"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdate(ev.id);
                    }}
                  >
                    <input
                      type="text"
                      className="w-full p-2 border rounded mb-2"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      placeholder="Event Title"
                    />
                    <textarea
                      className="w-full p-2 border rounded mb-2"
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      placeholder="Event Description"
                    />
                    {/* Input for editing datetime (date & time) */}
                    <input
                      type="datetime-local"
                      className="w-full p-2 border rounded mb-2"
                      value={editingDatetime}
                      onChange={(e) => setEditingDatetime(e.target.value)}
                    />
                    <select
                      className="w-full p-2 border rounded mb-2"
                      value={editingState}
                      onChange={(e) =>
                        setEditingState(e.target.value as TEvent["state"])
                      }
                    >
                      <option value="regular">Regular</option>
                      <option value="necessary">Necessary</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-blue-500 text-white px-2 py-1 rounded"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="bg-gray-500 text-white px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  // --- Normal Event Display ---
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl">{ev.title}</h3>
                    <p className="text-gray-700">{ev.description}</p>
                    <p className="text-sm text-gray-400">
                      Time: {new Date(ev.datetime).toLocaleTimeString()}
                    </p>
                    <p className="text-sm font-semibold">
                      Status:{" "}
                      {ev.state.charAt(0).toUpperCase() + ev.state.slice(1)}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEdit(ev)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EventCalendarView;
