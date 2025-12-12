// src/features/admin/AdminUserManagement.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  fetchAdminUsers,
  updateUserActivation,
  updateUserRole,
  setAdminUserFilters,
} from "./adminUsersSlice";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AdminUserManagement() {
  const dispatch = useDispatch();
  const { toast } = useToast();

  const { list, pagination, filters, isLoading } = useSelector(
    (state) => state.adminUsers
  );
  const currentUser = useSelector((state) => state.auth.user);

  const { page, totalPages } = pagination;

  useEffect(() => {
    dispatch(
      fetchAdminUsers({
        page,
        limit: pagination.limit,
        search: filters.search,
        role: filters.role,
        status: filters.status,
      })
    );
  }, [dispatch, page, filters.role, filters.status, filters.search]);

  const handleSearchChange = (e) => {
    dispatch(
      setAdminUserFilters({
        search: e.target.value,
      })
    );
  };

  const handleRoleFilter = (value) => {
    dispatch(setAdminUserFilters({ role: value === "all" ? "" : value }));
  };

  const handleStatusFilter = (value) => {
    dispatch(setAdminUserFilters({ status: value === "all" ? "" : value }));
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    dispatch(
      fetchAdminUsers({
        page: nextPage,
        limit: pagination.limit,
        search: filters.search,
        role: filters.role,
        status: filters.status,
      })
    );
  };

  const handleToggleActive = async (user) => {
    const nextActive = !user.isActive;
    try {
      await dispatch(
        updateUserActivation({ userId: user._id, isActive: nextActive })
      ).unwrap();

      toast({
        title: "User updated",
        description: `User has been ${
          nextActive ? "activated" : "deactivated"
        }.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err || "Could not update user status.",
      });
    }
  };

  const handleChangeRole = async (user, role) => {
    try {
      await dispatch(updateUserRole({ userId: user._id, role })).unwrap();
      toast({
        title: "Role updated",
        description: `User role has been changed to ${role}.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Role update failed",
        description: err || "Could not update user role.",
      });
    }
  };

  const isSelf = (user) =>
    user._id === currentUser?.id || user._id === currentUser?._id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            User management
          </h2>
          <p className="text-sm text-muted-foreground">
            View, filter, and control user access and roles across Eventory.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search by email or name"
            value={filters.search}
            onChange={handleSearchChange}
            className="max-w-xs"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={filters.role || "all"}
            onValueChange={handleRoleFilter}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="attendee">Attendee</SelectItem>
              <SelectItem value="organizer">Organizer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && list.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                    No users found.
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              list.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="max-w-xs truncate">
                    {user.email}
                  </TableCell>
                  <TableCell>{user.fullName || user.username || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          user.role === "admin"
                            ? "default"
                            : user.role === "organizer"
                            ? "outline"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {user.role}
                      </Badge>

                      {/* Role select */}
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleChangeRole(user, value)}
                        disabled={isSelf(user)} // don't change own role
                      >
                        <SelectTrigger className="h-7 w-[7.5rem] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="attendee">Attendee</SelectItem>
                          <SelectItem value="organizer">Organizer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isActive ? "success" : "destructive"}
                      className="capitalize"
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={user.isActive ? "outline" : "default"}
                      onClick={() => handleToggleActive(user)}
                      disabled={isSelf(user)} // can't deactivate self either
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
