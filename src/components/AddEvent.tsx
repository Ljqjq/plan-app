// src/components/AddEvent.tsx
import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../services/firebase";

// Define the form data type with an extra "datetime" field.
type FormData = {
  title: string;
  description: string;
  datetime: string; // This will use the datetime-local format.
  state: "regular" | "necessary" | "urgent";
};

// Helper function: converts the current local date/time to a format
// compatible with the HTML "datetime-local" input (YYYY-MM-DDTHH:MM).
const getLocalDateTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const AddEvent: React.FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      // Set a default datetime value in local format.
      datetime: getLocalDateTimeString(),
      state: "regular",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to add events.");
      return;
    }

    if (!data.title.trim()) {
      alert("Title is required.");
      return;
    }

    try {
      // Convert the datetime from the form (a string like "2025-04-16T15:30")
      // into a Date and store it as an ISO string.
      const eventDate = new Date(data.datetime);
      await addDoc(collection(db, "events"), {
        userId: user.uid,
        title: data.title,
        description: data.description,
        datetime: eventDate.toISOString(),
        state: data.state,
      });
      reset();
      alert("Event added successfully!");
    } catch (error) {
      console.error("Error adding event:", error);
      alert("Failed to add event.");
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Add Event</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Title Field */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            placeholder="Title"
            className="w-full p-2 border rounded"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && (
            <p className="text-red-500 text-xs italic">{errors.title.message}</p>
          )}
        </div>

        {/* Description Field */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            placeholder="Description"
            className="w-full p-2 border rounded"
            {...register("description")}
          />
        </div>

        {/* Date and Time Field */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Date &amp; Time
          </label>
          <input
            type="datetime-local"
            className="w-full p-2 border rounded"
            {...register("datetime", {
              required: "Event date and time are required",
            })}
          />
          {errors.datetime && (
            <p className="text-red-500 text-xs italic">{errors.datetime.message}</p>
          )}
        </div>

        {/* State (Priority) Field */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <select
            className="w-full p-2 border rounded"
            {...register("state", { required: "State is required" })}
          >
            <option value="regular">Regular</option>
            <option value="necessary">Necessary</option>
            <option value="urgent">Urgent</option>
          </select>
          {errors.state && (
            <p className="text-red-500 text-xs italic">{errors.state.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-full"
        >
          Add Event
        </button>
      </form>
    </div>
  );
};

export default AddEvent;
