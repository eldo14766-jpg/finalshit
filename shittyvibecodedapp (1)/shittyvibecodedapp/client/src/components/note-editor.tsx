import { useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Note, insertNoteSchema, InsertNote } from "@shared/schema";
import { z } from "zod";
import { FileText, Save, X } from "lucide-react";

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  note?: Note | null;
}

// Form schema with proper validation rules
const noteFormSchema = insertNoteSchema.extend({
  title: z.string().min(1, "Note title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().max(10000, "Content must be less than 10,000 characters").optional(),
});

type NoteFormData = z.infer<typeof noteFormSchema>;

export function NoteEditor({ isOpen, onClose, note }: NoteEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Reset form when note changes
  useEffect(() => {
    if (note) {
      form.reset({
        title: note.title,
        content: note.content || "",
      });
    } else {
      form.reset({
        title: "",
        content: "",
      });
    }
  }, [note, form]);

  const createMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const response = await apiRequest("POST", "/api/notes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Success",
        description: "Note created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const response = await apiRequest("PATCH", `/api/notes/${note!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NoteFormData) => {
    if (note) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2" data-testid="text-editor-title">
            <FileText className="w-5 h-5" />
            <span>{note ? "Edit Note" : "Create New Note"}</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 space-y-4">
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter note title..."
                      disabled={isLoading}
                      data-testid="input-note-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Field */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-col">
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Write your note content here..."
                      className="flex-1 min-h-[300px] resize-none"
                      disabled={isLoading}
                      data-testid="textarea-note-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                data-testid="button-cancel-note"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                data-testid="button-save-note"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Saving..." : (note ? "Update Note" : "Create Note")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}