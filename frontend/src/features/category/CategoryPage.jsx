import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCategories, deleteCategory } from "./categorySlice";

import CategoryTable from "./CategoryTable";
import AddCategory from "./AddCategory";
import EditCategory from "./EditCategory";
import DeleteCategory from "./DeleteCategory";

import { Button } from "@/components/ui/button";

export default function CategoryPage() {
  const dispatch = useDispatch();
  const { list, isLoading } = useSelector((state) => state.category);

  const [addOpen, setAddOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categories</h1>
        <Button onClick={() => setAddOpen(true)}>Add Category</Button>
      </div>

      <CategoryTable
        categories={list}
        isLoading={isLoading}
        onEdit={setEditData}
        onDelete={setDeleteId}
      />

      <AddCategory open={addOpen} setOpen={setAddOpen} />

      {editData && <EditCategory data={editData} setData={setEditData} />}

      {deleteId && <DeleteCategory id={deleteId} setId={setDeleteId} />}
    </div>
  );
}
