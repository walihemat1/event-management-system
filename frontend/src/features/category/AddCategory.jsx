import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import CategoryForm from "./CategoryForm";
import { useDispatch } from "react-redux";
import { createCategory } from "./categorySlice";
import { useState } from "react";

export default function AddCategoryModal({ open, setOpen }) {
  const [form, setForm] = useState({});
  const dispatch = useDispatch();

  const handleSubmit = async () => {
    await dispatch(createCategory(form));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>

        <CategoryForm onChange={setForm} />

        <div className="flex justify-end pt-4">
          <Button onClick={handleSubmit}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
