// src/components/EventList.tsx
import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import DeleteButton from "./DeleteButton";
import AddButton from "./AddButton";
import { useForm, SubmitHandler } from "react-hook-form";

export type TEvent = {
  id: string;
  title: string;
  description: string;
  datetime: string;
  state: "regular" | "necessary" | "urgent";
};

// Make sure this is declared at the top of your file
const getBorderColorClass = (state: TEvent["state"]): string => {
  if (state === "urgent") return "border-red-500";
  if (state === "necessary") return "border-yellow-500";
  return "border-green-500"; // For "regular"
};

// Helper to convert an ISO datetime string to a format for <input type="datetime-local">
const formatDateTimeLocal = (isoString: string): string => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

type EventListProps = {
  selectedDate?: Date;
};

// Type for the new event form (react-hook-form)
type NewEventFormValues = {
  title: string;
  description: string;
  datetime: string; // expect string in datetime-local format; can be empty
  state: "regular" | "necessary" | "urgent";
};

export const EventList: React.FC<EventListProps> = ({ selectedDate }) => {
  const { user, loading } = useAuth();
  const [aEvents, setEvents] = useState<TEvent[]>([]);

  // States for filtering and editing events already present...
  const [filterTitle, setFilterTitle] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "regular" | "necessary" | "urgent">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingState, setEditingState] = useState<TEvent["state"]>("regular");
  const [editingDatetime, setEditingDatetime] = useState("");

  // State to toggle the Add New Event form
  const [showAddEvent, setShowAddEvent] = useState(false);

  // Using react-hook-form for the new event form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewEventFormValues>();

  // Fetch events for current user from Firestore
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
        const data = snapshot.docs.map((doc) => {
          const eventData = doc.data();
          return {
            id: doc.id,
            title: eventData.title || "",
            description: eventData.description || "",
            datetime: eventData.datetime || new Date().toISOString(),
            state: eventData.state || "regular",
          } as TEvent;
        });
        setEvents(data);
      },
      (error) => {
        console.error("Error fetching events:", error);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, "events", eventId));
      alert("Event deleted successfully!");
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event.");
    }
  };

  const handleEdit = (event: TEvent) => {
    setEditingId(event.id);
    setEditingTitle(event.title);
    setEditingDescription(event.description);
    setEditingState(event.state);
    setEditingDatetime(formatDateTimeLocal(event.datetime));
  };

  const handleUpdate = async (eventId: string) => {
    try {
      await updateDoc(doc(db, "events", eventId), {
        title: editingTitle,
        description: editingDescription,
        state: editingState,
        datetime: new Date(editingDatetime).toISOString(),
      });
      setEditingId(null);
      alert("Event updated successfully!");
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event.");
    }
  };

  // Handler for react-hook-form new-event submission
  const onSubmitNewEvent: SubmitHandler<NewEventFormValues> = async (data) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "events"), {
        title: data.title,
        description: data.description,
        datetime: data.datetime
          ? new Date(data.datetime).toISOString()
          : new Date().toISOString(),
        state: data.state,
        userId: user.uid,
      });
      alert("Event created successfully!");
      reset(); // Clear the form fields
      setShowAddEvent(false); // Hide the form
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event.");
    }
  };

  // Filtering events by selected date (if any), then applying title/status filters
  const eventsToFilter = selectedDate
    ? aEvents.filter((ev) => {
        const evDate = new Date(ev.datetime);
        return (
          evDate.getFullYear() === selectedDate.getFullYear() &&
          evDate.getMonth() === selectedDate.getMonth() &&
          evDate.getDate() === selectedDate.getDate()
        );
      })
    : aEvents;

  const filteredEvents = !selectedDate
    ? eventsToFilter.filter((ev) => {
        const titleMatches = ev.title.toLowerCase().includes(filterTitle.toLowerCase());
        const statusMatches = filterStatus === "all" ? true : ev.state === filterStatus;
        return titleMatches && statusMatches;
      })
    : eventsToFilter;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-md w-full max-w-md mx-auto mt-6">
      <h2 className="text-xl font-bold mb-4">
        {selectedDate ? `Events on ${selectedDate.toDateString()}` : "My Events"}
      </h2>

      {!selectedDate && (
        <div className="mb-4 space-y-2">
          <label className="block">
            Search by Title:
            <input
              type="text"
              placeholder="Enter title..."
              value={filterTitle}
              onChange={(e) => setFilterTitle(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </label>
          <label className="block">
            Filter by Status:
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as "all" | "regular" | "necessary" | "urgent")
              }
              className="w-full p-2 border rounded mt-1"
            >
              <option value="all">All</option>
              <option value="regular">Regular</option>
              <option value="necessary">Necessary</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <p className="text-gray-500">
          {selectedDate ? "No events scheduled for this day." : "No events match your filters."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filteredEvents.map((ev) => (
            <li
              key={ev.id}
              className={`border-l-4 p-3 bg-white shadow-sm hover:shadow-md transition ${getBorderColorClass(ev.state)}`}

            >
              {editingId === ev.id ? (
                <form
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
                <>
                  <h3 className="font-semibold">{ev.title}</h3>
                  <p className="text-sm text-gray-600">{ev.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ev.datetime).toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold">
                    State:{" "}
                    {ev.state.charAt(0).toUpperCase() +
                      ev.state.slice(1)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(ev)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <DeleteButton onClick={() => handleDelete(ev.id)} />
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* AddButton to trigger Add New Event form */}
      <div className="flex justify-center mt-4">
        <AddButton onClick={() => setShowAddEvent(true)} />
      </div>

      {/* New Event Form (using react-hook-form); pops up under the AddButton */}
      {showAddEvent && (
        <form onSubmit={handleSubmit(onSubmitNewEvent)} className="mt-4 space-y-2">
          <input
            type="text"
            placeholder="Event Title"
            {...register("title", { required: "Title is required" })}
            className="w-full p-2 border rounded"
          />
          {errors.title && (
            <p className="text-red-500 text-xs italic">{errors.title.message}</p>
          )}

          <textarea
            placeholder="Event Description"
            {...register("description", { required: "Description is required" })}
            className="w-full p-2 border rounded"
          />
          {errors.description && (
            <p className="text-red-500 text-xs italic">{errors.description.message}</p>
          )}

          <input
            type="datetime-local"
            {...register("datetime")}
            className="w-full p-2 border rounded"
          />

          <select
            {...register("state")}
            className="w-full p-2 border rounded"
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
              Add Event
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setShowAddEvent(false);
              }}
              className="bg-gray-500 text-white px-2 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
