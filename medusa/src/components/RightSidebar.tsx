import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, GitBranch, FileText, Terminal } from "lucide-react";

export const RightSidebar = () => {
  const [activeTab, setActiveTab] = useState("plan");

  return (
    <div className="w-80 bg-card border-l border-border h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted rounded-none border-b border-border">
          <TabsTrigger
            value="plan"
            className="flex items-center gap-1 text-xs data-[state=active]:bg-background"
          >
            <CheckSquare className="w-3 h-3" />
            Plan
          </TabsTrigger>
          <TabsTrigger
            value="changes"
            className="flex items-center gap-1 text-xs data-[state=active]:bg-background"
          >
            <GitBranch className="w-3 h-3" />
            Changes
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="flex items-center gap-1 text-xs data-[state=active]:bg-background"
          >
            <FileText className="w-3 h-3" />
            Logs
          </TabsTrigger>
          <TabsTrigger
            value="terminal"
            className="flex items-center gap-1 text-xs data-[state=active]:bg-background"
          >
            <Terminal className="w-3 h-3" />
            Terminal
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="plan" className="h-full m-0 p-4">
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No plan yet</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="changes" className="h-full m-0 p-4">
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No changes yet</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="h-full m-0 p-4">
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No logs yet</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="terminal" className="h-full m-0 p-4">
            <div className="h-full bg-black rounded-md p-4 font-mono text-sm">
              <div className="text-green-400">
                <span className="text-blue-400">user@medusa</span>
                <span className="text-white">:</span>
                <span className="text-purple-400">~</span>
                <span className="text-white">$ </span>
                <span className="animate-pulse">_</span>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};