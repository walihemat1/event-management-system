import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CategoryForm({ initial = {}, onChange }) {
  const [form, setForm] = useState({
    name: initial.name || "",
    slug: initial.slug || "",
    icon: initial.icon || "",
    description: initial.description || "",
  });

  const handleUpdate = (field, value) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    onChange(newForm);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          value={form.name}
          onChange={(e) => handleUpdate("name", e.target.value)}
          placeholder="Technology"
        />
      </div>

      <div>
        <Label>Slug</Label>
        <Input
          value={form.slug}
          onChange={(e) => handleUpdate("slug", e.target.value)}
          placeholder="technology"
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => handleUpdate("description", e.target.value)}
          placeholder="Short description..."
        />
      </div>
    </div>
  );
}
