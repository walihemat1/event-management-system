import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import CategoryForm from "./CategoryForm";
import { useDispatch } from "react-redux";
import { updateCategory } from "./categorySlice";
import { useState } from "react";

export default function EditCategoryModal({ data, setData }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState(data);

  const handleSubmit = async () => {
    await dispatch(updateCategory({ id: data._id, values: form }));
    setData(null);
  };

  return (
    <Dialog open={!!data} onOpenChange={() => setData(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>

        <CategoryForm initial={data} onChange={setForm} />

        <div className="flex justify-end pt-4">
          <Button onClick={handleSubmit}>Update</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
