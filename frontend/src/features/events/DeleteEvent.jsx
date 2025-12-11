// src/components/DeleteEventDialog.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteEvent } from "./eventsSlice";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Navigate, useNavigate } from "react-router-dom";

export default function DeleteEventDialog({ eventId, title }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading: isDeleting, list } = useSelector((state) => state.events);

  const handleDelete = () => {
    dispatch(deleteEvent(eventId))
      .then(() => {
        // optionally: show a toast here
      })
      .catch((err) => {
        console.error("Failed to delete event", err);
      });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600">
          Delete
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{title}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            event and remove it from your dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
