import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Save, X, Bold, Italic, Underline, List, Link, FileText, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Note, InsertNote } from "@shared/schema";

export function Notepad() {
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [noteForm, setNoteForm] = useState<InsertNote>({ title: "", content: "" });
  const [isPlainText, setIsPlainText] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const createNoteMutation = useMutation({
    mutationFn: (note: InsertNote) => apiRequest("POST", "/api/notes", note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setIsCreating(false);
      setNoteForm({ title: "", content: "" });
      toast({ title: "Note created successfully" });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<InsertNote> }) =>
      apiRequest("PUT", `/api/notes/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setAutoSaveStatus("saved");
      if (!editingNote) {
        toast({ title: "Note updated successfully" });
      }
    },
  });

  // Auto-save functionality
  useEffect(() => {
    if (editingNote && noteForm.title.trim() && noteForm.content.trim()) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      setAutoSaveStatus("unsaved");
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        setAutoSaveStatus("saving");
        updateNoteMutation.mutate({
          id: editingNote.id,
          updates: noteForm,
        });
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [noteForm, editingNote]);

  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({ title: "Note deleted successfully" });
    },
  });

  const handleCreateNote = () => {
    setIsCreating(true);
    setNoteForm({ title: "", content: "" });
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteForm({ title: note.title, content: note.content });
  };

  const handleSaveNote = () => {
    if (!noteForm.title.trim()) return;

    if (editingNote) {
      updateNoteMutation.mutate({
        id: editingNote.id,
        updates: noteForm,
      });
      setEditingNote(null);
    } else {
      createNoteMutation.mutate(noteForm);
    }
  };

  const handleCancel = () => {
    setEditingNote(null);
    setIsCreating(false);
    setNoteForm({ title: "", content: "" });
  };

  const handleDeleteNote = (id: number) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(id);
    }
  };

  const formatLastEdited = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const showEditor = !!(editingNote || isCreating);

  if (isLoading) {
    return <div className="text-center py-8">Loading notes...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">My Notes</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant={isPlainText ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPlainText(!isPlainText)}
              >
                {isPlainText ? <Type className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                {isPlainText ? "Plain Text" : "Rich Text"}
              </Button>
              <Button onClick={handleCreateNote}>
                <Plus className="mr-2 h-4 w-4" />
                New Note
              </Button>
            </div>
          </div>

          {/* Notes Grid */}
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No notes yet. Create your first note!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map(note => (
                <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4" onClick={() => handleEditNote(note)}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium truncate flex-1">{note.title}</h3>
                      <div className="flex space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditNote(note);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">
                      {note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Last edited: {formatLastEdited(note.updatedAt)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rich Text Editor Modal */}
      <Dialog open={showEditor} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Create Note'}</DialogTitle>
            <DialogDescription>
              {editingNote ? 'Update your note content below.' : 'Create a new note with title and content.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Note title..."
              value={noteForm.title}
              onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
              className="text-lg font-semibold"
            />
            
            {/* Simple Toolbar */}
            {!isPlainText && (
              <div className="border-b border-gray-200 pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Underline className="h-4 w-4" />
                    </Button>
                    <div className="w-px bg-gray-300 mx-2"></div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <List className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Link className="h-4 w-4" />
                    </Button>
                  </div>
                  {editingNote && (
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={autoSaveStatus === "saved" ? "default" : autoSaveStatus === "saving" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {autoSaveStatus === "saved" ? "Saved" : autoSaveStatus === "saving" ? "Saving..." : "Unsaved"}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Content Area */}
            <Textarea
              placeholder="Start writing your note here..."
              value={noteForm.content}
              onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
              className="min-h-96 resize-none"
            />
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                onClick={handleSaveNote}
                disabled={!noteForm.title.trim() || createNoteMutation.isPending || updateNoteMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {editingNote ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
