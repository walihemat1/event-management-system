// src/pages/EventTicketsManage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchTickets,
  createTicket,
  updateTicket,
  deleteTicket,
} from "../features/tickets/ticketsSlice";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Pencil, Trash2, ArrowLeft } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ticketSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z
    .string()
    .transform((val) => (val === "" ? "0" : val))
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Price must be a non-negative number",
    }),
  quantityAvailable: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Quantity must be a non-negative number",
    }),
});

export default function EventTicketsManage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const {
    items: tickets,
    isLoading,
    error,
  } = useSelector((state) => state.tickets);

  const [editingTicket, setEditingTicket] = useState(null);

  const form = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      quantityAvailable: "",
    },
  });

  useEffect(() => {
    if (eventId) {
      dispatch(fetchTickets(eventId));
    }
  }, [dispatch, eventId]);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Ticket error",
        description: error,
      });
    }
  }, [error, toast]);

  const resetForm = () => {
    setEditingTicket(null);
    form.reset({
      name: "",
      description: "",
      price: "",
      quantityAvailable: "",
    });
  };

  const onSubmit = (values) => {
    const payload = {
      name: values.name,
      description: values.description || "",
      price: Number(values.price),
      quantityAvailable: Number(values.quantityAvailable),
    };

    if (!editingTicket) {
      // create
      dispatch(createTicket({ eventId, payload }))
        .unwrap()
        .then(() => {
          toast({
            title: "Ticket created",
            description: "Your ticket was created successfully.",
          });
          resetForm();
        })
        .catch((errMsg) => {
          toast({
            variant: "destructive",
            title: "Failed to create ticket",
            description: errMsg || "Please try again.",
          });
        });
    } else {
      // update
      dispatch(
        updateTicket({
          eventId,
          ticketId: editingTicket._id,
          payload,
        })
      )
        .unwrap()
        .then(() => {
          toast({
            title: "Ticket updated",
            description: "Your changes have been saved.",
          });
          resetForm();
        })
        .catch((errMsg) => {
          toast({
            variant: "destructive",
            title: "Failed to update ticket",
            description: errMsg || "Please try again.",
          });
        });
    }
  };

  const handleEditClick = (ticket) => {
    setEditingTicket(ticket);
    form.setValue("name", ticket.name || "");
    form.setValue("description", ticket.description || "");
    form.setValue("price", String(ticket.price ?? 0));
    form.setValue("quantityAvailable", String(ticket.quantityAvailable ?? 0));
  };

  const handleDelete = (ticketId) => {
    dispatch(deleteTicket({ eventId, ticketId }))
      .unwrap()
      .then(() => {
        toast({
          title: "Ticket deleted",
          description: "The ticket has been removed.",
        });
      })
      .catch((errMsg) => {
        toast({
          variant: "destructive",
          title: "Failed to delete ticket",
          description: errMsg || "Please try again.",
        });
      });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="px-0 text-xs text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link to="/organizer-events">
                <ArrowLeft className="mr-1 h-3 w-3" />
                Back to my events
              </Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Manage tickets
            </h1>
            <p className="text-sm text-muted-foreground">
              Create and manage tickets for this event. Changes are applied
              immediately.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Tickets list */}
          <section className="space-y-4">
            <Card className="border-border bg-card/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Existing tickets
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Tickets available for this event.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {isLoading && tickets.length === 0 && (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-md" />
                    ))}
                  </div>
                )}

                {!isLoading && tickets.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No tickets created yet. Use the form on the right to add
                    your first ticket.
                  </p>
                )}

                {!isLoading &&
                  tickets.length > 0 &&
                  tickets.map((ticket) => (
                    <Card
                      key={ticket._id}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-background/60 px-3 py-2.5 sm:px-4 sm:py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm sm:text-base font-medium text-foreground">
                            {ticket.name}
                          </h3>
                          {ticket.description && (
                            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                              {ticket.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* EDIT */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditClick(ticket)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          {/* DELETE with AlertDialog */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete ticket?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove the ticket{" "}
                                  <span className="font-medium text-foreground">
                                    {ticket.name}
                                  </span>{" "}
                                  from this event. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(ticket._id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/5 text-primary"
                        >
                          {ticket.price
                            ? `$${ticket.price.toFixed(2)}`
                            : "Free"}
                        </Badge>
                        <span className="text-muted-foreground">
                          Available:{" "}
                          <span className="font-medium">
                            {ticket.quantityAvailable ?? 0}
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          Sold:{" "}
                          <span className="font-medium">
                            {ticket.quantitySold ?? 0}
                          </span>
                        </span>
                      </div>
                    </Card>
                  ))}
              </CardContent>
            </Card>
          </section>

          {/* Create / Edit form */}
          <section>
            <Card className="border-border bg-card/90">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  {editingTicket ? "Edit ticket" : "Create new ticket"}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Define ticket details like name, price, and available
                  quantity.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ticket name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. General Admission"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add a short description about what this ticket includes."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" {...field} />
                            </FormControl>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Set to 0 for a free ticket.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quantityAvailable"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity available</FormLabel>
                            <FormControl>
                              <Input placeholder="100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2">
                      {editingTicket ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={resetForm}
                        >
                          Cancel editing
                        </Button>
                      ) : (
                        <span />
                      )}

                      <Button type="submit" disabled={isLoading}>
                        {editingTicket ? "Save changes" : "Create ticket"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
