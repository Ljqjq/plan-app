
import React, { useState } from "react";
import { EventList } from "./EventList";
import EventCalendarView from "./EventCalendarView";

const EventsDashboard: React.FC = () => {
  // State to control which view to display: 'list' or 'calendar'
  const [view, setView] = useState<"list" | "calendar">("list");

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Events</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded ${
              view === "list"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-2 rounded ${
              view === "calendar"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {view === "list" ? <EventList /> : <EventCalendarView />}
    </div>
  );
};

export default EventsDashboard;
