@@ -218,7 +218,7 @@ export function QuestModal({ isOpen, onClose, quest, defaultGroupId }: QuestMod
 
   return (
     <Dialog open={isOpen} onOpenChange={onClose}>
-      <DialogContent className="sm:max-w-md">
+      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle data-testid="modal-title">
             {quest ? "Edit Quest" : "Create Quest"}
@@ -226,7 +226,7 @@ export function QuestModal({ isOpen, onClose, quest, defaultGroupId }: QuestMod
         </DialogHeader>
         
         <Form {...form}>
-          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
+          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-full">
             <FormField
               control={form.control}
               name="title"
   )
)
@@ -434,7 +434,7 @@ export function QuestModal({ isOpen, onClose, quest, defaultGroupId }: QuestMod
 
             {/* Toggle Features Section */}
-            <div className="border-t pt-4 space-y-4">
+            <div className="border-t pt-4 space-y-4 pb-4">
               <h3 className="text-sm font-medium">Advanced Features</h3>
               
               {/* Recurring Quest Toggle */}
@@ -584,7 +584,7 @@ export function QuestModal({ isOpen, onClose, quest, defaultGroupId }: QuestMod
             </div>
             
-            <div className="flex items-center space-x-3 pt-4">
+            <div className="flex items-center space-x-3 pt-4 sticky bottom-0 bg-background border-t mt-4">
               <Button
                 type="submit"
                 className="flex-1"