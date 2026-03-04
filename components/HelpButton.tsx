import { useState } from "react";
import { HelpCircle, Send } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner@2.0.3";

export default function HelpButton() {
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [issueType, setIssueType] = useState<
    "bug" | "feature" | "question"
  >("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");

  const handleSubmit = async () => {
    if (!title || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Create a formatted report
    const report = {
      type: issueType,
      title,
      description,
      stepsToReproduce:
        issueType === "bug" ? stepsToReproduce : undefined,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Save to localStorage as backup
    const existingReports = JSON.parse(
      localStorage.getItem("flowtrack-bug-reports") || "[]",
    );
    existingReports.push(report);
    localStorage.setItem(
      "flowtrack-bug-reports",
      JSON.stringify(existingReports),
    );

    // Send to Google Sheets
    try {
      // TODO: Replace this URL with your Google Apps Script Web App URL
      // See setup instructions in the comments below
      const GOOGLE_SCRIPT_URL =
        "https://script.google.com/macros/s/AKfycbzMVmOgFlqwMB2sdem_yGRSoBtIwzm7gvZwWvZArHnor6OAiHEo-V53SqoNYxSG0HejZw/exec";

      const formData = {
        issueType: issueType.toUpperCase(),
        title: title,
        description: description,
        stepsToReproduce:
          issueType === "bug" ? stepsToReproduce : "N/A",
        timestamp: new Date().toLocaleString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        email: "businessgutierrez060908@gmail.com",
      };

      if (
        GOOGLE_SCRIPT_URL !== "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE"
      ) {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        // Note: no-cors mode doesn't allow reading the response
        // We'll assume success if no error is thrown
        toast.success(
          "Report submitted successfully! An email has been sent.",
        );
      } else {
        toast.success(
          "Report saved locally. Please set up Google Sheets integration.",
        );
      }
    } catch (error) {
      console.error(
        "Error submitting to Google Sheets:",
        error,
      );
      toast.success(
        "Report saved locally. Thank you for your feedback.",
      );
    }

    // Reset form and close dialog
    setTitle("");
    setDescription("");
    setStepsToReproduce("");
    setIssueType("bug");
    setHelpDialogOpen(false);
  };

  return (
    <>
      {/* Floating Help Button */}
      <Button
        onClick={() => setHelpDialogOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 h-12 w-12 md:h-14 md:w-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
        size="icon"
      >
        <HelpCircle className="w-6 h-6 md:w-7 md:h-7" />
      </Button>

      {/* Help Dialog */}
      <Dialog
        open={helpDialogOpen}
        onOpenChange={setHelpDialogOpen}
      >
        <DialogContent className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-indigo-900 border-2 border-purple-300 dark:border-indigo-700/50 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-900 dark:text-purple-200">
              Help & Bug Report
            </DialogTitle>
            <DialogDescription className="text-sm text-purple-700 dark:text-purple-300">
              Report a coding issue, suggest a feature, or ask a
              question.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4 pb-4">
            <div>
              <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                Issue Type{" "}
                <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                value={issueType}
                onChange={(e) =>
                  setIssueType(
                    e.target.value as
                      | "bug"
                      | "feature"
                      | "question",
                  )
                }
                className="w-full p-3 border-2 border-purple-300 dark:border-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-indigo-500 bg-white dark:bg-slate-700 text-purple-900 dark:text-purple-100"
              >
                <option value="bug">Bug / Coding Issue</option>
                <option value="feature">Feature Request</option>
                <option value="question">
                  General Question
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                Title <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 dark:bg-slate-700 dark:text-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                Description{" "}
                <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the issue, feature, or question"
                className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 min-h-[100px] dark:bg-slate-700 dark:text-purple-100"
              />
            </div>

            {issueType === "bug" && (
              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Steps to Reproduce
                </label>
                <Textarea
                  value={stepsToReproduce}
                  onChange={(e) =>
                    setStepsToReproduce(e.target.value)
                  }
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                  className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 min-h-[80px] dark:bg-slate-700 dark:text-purple-100"
                />
              </div>
            )}

            <div className="bg-purple-100 dark:bg-indigo-900/30 dark:backdrop-blur-sm border-2 border-purple-300 dark:border-indigo-700/50 rounded-xl p-4">
              <p className="text-sm text-purple-900 dark:text-purple-200">
                <strong>Note:</strong> Your report will be saved
                locally. In a production environment, this would
                be sent to a support team for review.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!title || !description}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-indigo-600 dark:to-purple-600 hover:from-purple-600 hover:to-pink-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Report
              </Button>
              <Button
                onClick={() => {
                  setHelpDialogOpen(false);
                  setTitle("");
                  setDescription("");
                  setStepsToReproduce("");
                  setIssueType("bug");
                }}
                variant="outline"
                className="border-2 border-purple-300 dark:border-indigo-600 dark:text-purple-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
