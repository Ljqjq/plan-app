// src/components/AddEvent.tsx
import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../services/firebase";

type FormData = {
  title: string;
  description: string;
  state: "regular" | "necessary" | "urgent";
};

export const AddEvent = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
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
      alert("Title is required");
      return;
    }

    try {
      await addDoc(collection(db, "events"), {
        userId: user.uid,
        title: data.title,
        description: data.description,
        datetime: new Date().toISOString(),
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
        <input
          className="w-full p-2 border rounded mb-2"
          type="text"
          placeholder="Title"
          {...register("title", { required: "Title is required" })}
        />
        {errors.title && (
          <p className="text-red-500 text-xs italic">{errors.title.message}</p>
        )}

        <textarea
          className="w-full p-2 border rounded mb-2"
          placeholder="Description"
          {...register("description")}
        />

        <select
          className="w-full p-2 border rounded mb-2"
          {...register("state", { required: "State is required" })}
        >
          <option value="regular">Regular</option>
          <option value="necessary">Necessary</option>
          <option value="urgent">Urgent</option>
        </select>

        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-full"
          type="submit"
        >
          Add
        </button>
      </form>
    </div>
  );
};
