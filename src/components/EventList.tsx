// src/components/EventList.tsx
import { useEffect, useState } from "react";
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

// Helper function that converts an ISO datetime string to a
// format compatible with <input type="datetime-local">
const formatDateTimeLocal = (isoString: string): string => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const EventList = () => {
  const { user, loading } = useAuth();
  const [aEvents, setEvents] = useState<TEvent[]>([]);
  
  // Filter state: title and status with an "all" option.
  const [filterTitle, setFilterTitle] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "regular" | "necessary" | "urgent">("all");

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingState, setEditingState] = useState<TEvent["state"]>("regular");
  const [editingDatetime, setEditingDatetime] = useState("");

  useEffect(() => {
    // Clear events if there is no logged-in user.
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

  // When editing is started, load the event data into the editing states.
  const handleEdit = (event: TEvent) => {
    setEditingId(event.id);
    setEditingTitle(event.title);
    setEditingDescription(event.description);
    setEditingState(event.state);
    setEditingDatetime(formatDateTimeLocal(event.datetime));
  };

  // Update the event with the edited values, including the new datetime.
  const handleUpdate = async (eventId: string) => {
    try {
      await updateDoc(doc(db, "events", eventId), {
        title: editingTitle,
        description: editingDescription,
        state: editingState,
        // Convert the datetime-local string back to an ISO string.
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

  // Filtering logic: if filterStatus is not "all", the event must match that state.
  // Also, check if the event title includes the filter text.
  const filteredEvents = aEvents.filter((event) => {
    const titleMatches = event.title.toLowerCase().includes(filterTitle.toLowerCase());
    const statusMatches = filterStatus === "all" ? true : event.state === filterStatus;
    return titleMatches && statusMatches;
  });

  return (
    <div className="bg-white p-4 rounded-xl shadow-md w-full max-w-md mx-auto mt-6">
      <h2 className="text-xl font-bold mb-4">My Events</h2>

      {/* Filter Controls */}
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

      {filteredEvents.length === 0 ? (
        <p className="text-gray-500">No events match your filters.</p>
      ) : (
        <ul className="space-y-2">
          {filteredEvents.map((ev) => (
            <li
              key={ev.id}
              className="border rounded p-3 shadow-sm hover:shadow-md transition"
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
                  {/* New input for editing datetime */}
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
                      className="bg-gray-500 text-white px-2 py-1 rounded"
                      onClick={() => setEditingId(null)}
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
                    State: {ev.state.charAt(0).toUpperCase() + ev.state.slice(1)}
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
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
