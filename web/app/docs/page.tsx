import Image from "next/image"
import Link from "next/link"
import DownloadButton from "../../components/DownloadButton"

export default function Docs() {
  return (
    <div className="min-h-screen" style={{backgroundColor: '#FBFBF4'}}>
      {/* Header */}
      <header className="fixed top-0 w-full z-[100] border-b border-gray-100" style={{backgroundColor: '#FBFBF4'}}>
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/medusa-logo.png"
                alt="Medusa Logo"
                width={48}
                height={48}
                className="w-10 h-10 sm:w-12 sm:h-12"
              />
              <div className="text-xl sm:text-2xl font-bold tracking-wider" style={{color: '#6B5B47'}}>
                MEDUSA
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium hover:underline hidden sm:block"
                style={{color: '#6B5B47'}}
              >
                ← Back to Home
              </Link>
              <DownloadButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-10">

          {/* Hero Section */}
          <div className="mb-12 sm:mb-16">
            <p className="text-sm sm:text-base font-medium mb-3 tracking-wide" style={{color: '#D2691E'}}>
              DOCUMENTATION
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{color: '#6B5B47'}}>
              Get started with Medusa
            </h1>
            <p className="text-base sm:text-lg leading-relaxed" style={{color: '#6B5B47', opacity: 0.85}}>
              Your control center for AI-powered development. Review Claude&apos;s plans before they execute,
              or run autonomous agents on isolated branches. This guide covers both workflows.
            </p>
          </div>

          {/* Table of Contents */}
          <nav className="mb-12 sm:mb-16 p-6 sm:p-8 rounded-2xl" style={{backgroundColor: '#F3F1E8'}}>
            <h2 className="text-lg font-bold mb-4" style={{color: '#6B5B47'}}>
              On this page
            </h2>
            <ul className="space-y-2">
              {[
                { href: "#installation", label: "Installation" },
                { href: "#tasks", label: "Using Tasks (Quick Start)" },
                { href: "#hook-setup", label: "Setting up Plans (Auto)" },
                { href: "#first-review", label: "Your first plan review" },
                { href: "#annotations", label: "Using annotations" },
                { href: "#kanban", label: "The unified board" },
                { href: "#diffs", label: "Viewing diffs" },
                { href: "#obsidian", label: "Exporting to Obsidian" },
                { href: "#sharing", label: "Sharing plans" },
                { href: "#settings", label: "Configuration" },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm sm:text-base hover:underline transition-all"
                    style={{color: '#D2691E'}}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Section: Installation */}
          <section id="installation" className="mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>01</span>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{color: '#6B5B47'}}>Installation</h2>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{color: '#6B5B47'}}>
                Medusa is a desktop application currently available for macOS. Windows and Linux
                support is coming soon.
              </p>

              <div className="mb-6">
                <DownloadButton />
              </div>

              <div className="p-4 sm:p-6 rounded-xl border border-black/5 mb-6" style={{backgroundColor: '#F3F1E8'}}>
                <h4 className="font-bold mb-2" style={{color: '#6B5B47'}}>System Requirements</h4>
                <ul className="space-y-1 text-sm sm:text-base" style={{color: '#6B5B47', opacity: 0.8}}>
                  <li>• macOS 11+ (Apple Silicon & Intel)</li>
                  <li>• Windows and Linux coming soon</li>
                  <li>• Claude Code CLI installed and configured</li>
                </ul>
              </div>

              <div className="p-4 sm:p-6 rounded-xl border-l-4 mb-6" style={{backgroundColor: '#FFF8E7', borderColor: '#D2691E'}}>
                <h4 className="font-bold mb-2" style={{color: '#6B5B47'}}>macOS: Allow app to run</h4>
                <p className="text-sm sm:text-base mb-3" style={{color: '#6B5B47', opacity: 0.8}}>
                  Medusa is not code-signed yet. After installing, macOS may show a &quot;damaged&quot; or &quot;unidentified developer&quot; warning.
                  To fix this, run the following command in Terminal:
                </p>
                <div className="p-3 rounded-lg font-mono text-sm overflow-x-auto" style={{backgroundColor: '#1a1a1a', color: '#e5e5e5'}}>
                  xattr -cr /Applications/medusa.app
                </div>
                <p className="text-sm mt-3" style={{color: '#6B5B47', opacity: 0.7}}>
                  Alternatively, right-click the app and select &quot;Open&quot; to bypass the warning.
                </p>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="w-full h-px mb-12 sm:mb-16" style={{backgroundColor: '#D2691E', opacity: 0.2}}></div>

          {/* Section: Tasks */}
          <section id="tasks" className="mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>02</span>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{color: '#6B5B47'}}>Using Tasks (Quick Start)</h2>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{color: '#6B5B47'}}>
                Tasks let you run Claude Code agents autonomously on isolated git branches. No hook setup
                required—just create a task and start the agent.
              </p>

              <div className="p-4 sm:p-6 rounded-xl border-l-4 mb-6" style={{backgroundColor: '#F0FFF4', borderColor: '#22C55E'}}>
                <h4 className="font-bold mb-2" style={{color: '#166534'}}>No setup needed</h4>
                <p className="text-sm sm:text-base" style={{color: '#166534', opacity: 0.9}}>
                  Unlike Plans which require hook configuration, Tasks work out of the box.
                  Just open Medusa and create your first task.
                </p>
              </div>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>Creating a task</h3>

              <div className="space-y-4 mb-6">
                {[
                  {
                    step: "1",
                    title: "Click New Task",
                    description: "From the main board, click the \"New Task\" button in the top right."
                  },
                  {
                    step: "2",
                    title: "Enter details",
                    description: "Give your task a title (what you want done), an optional description, and select your project folder."
                  },
                  {
                    step: "3",
                    title: "Start the agent",
                    description: "Click the play button on the task card. Medusa creates an isolated git branch and starts Claude Code."
                  }
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 p-4 rounded-xl" style={{backgroundColor: '#F3F1E8'}}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold" style={{backgroundColor: '#D2691E', color: 'white'}}>
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold mb-1" style={{color: '#6B5B47'}}>{item.title}</h4>
                      <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>How it works</h3>
              <p className="text-base leading-relaxed mb-4" style={{color: '#6B5B47'}}>
                When you start an agent, Medusa:
              </p>

              <ul className="space-y-2 mb-6 list-disc list-inside" style={{color: '#6B5B47'}}>
                <li>Creates a git worktree (isolated branch) in your project</li>
                <li>Spawns a Claude Code instance in that worktree</li>
                <li>Streams output so you can monitor progress</li>
                <li>Keeps the branch isolated from your main code</li>
              </ul>

              <div className="relative w-full aspect-[16/10] mb-6 rounded-xl overflow-hidden shadow-lg border border-black/5">
                <Image
                  src="/agent-output.png"
                  alt="Agent running with live output"
                  fill
                  className="object-cover"
                />
              </div>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>Reviewing and merging</h3>
              <p className="text-base leading-relaxed mb-4" style={{color: '#6B5B47'}}>
                When the agent finishes (or you pause it), click &quot;Send to Review&quot;. Claude Code will
                commit the changes with a descriptive message, and you can:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl" style={{backgroundColor: '#F3F1E8'}}>
                  <h4 className="font-bold mb-2" style={{color: '#6B5B47'}}>Review diffs</h4>
                  <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>
                    See exactly what files changed, line by line.
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{backgroundColor: '#F3F1E8'}}>
                  <h4 className="font-bold mb-2" style={{color: '#6B5B47'}}>Edit commits</h4>
                  <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>
                    Update the commit message if needed.
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{backgroundColor: '#F3F1E8'}}>
                  <h4 className="font-bold mb-2" style={{color: '#6B5B47'}}>Merge</h4>
                  <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>
                    One click to merge the branch into main.
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{backgroundColor: '#F3F1E8'}}>
                  <h4 className="font-bold mb-2" style={{color: '#6B5B47'}}>Discard</h4>
                  <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>
                    Delete the task and worktree if you don&apos;t want the changes.
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>Running multiple agents</h3>
              <p className="text-base leading-relaxed mb-4" style={{color: '#6B5B47'}}>
                You can run multiple tasks in parallel. Each gets its own git worktree, so they
                won&apos;t conflict with each other. Great for working on multiple features simultaneously.
              </p>
            </div>
          </section>

          {/* Divider */}
          <div className="w-full h-px mb-12 sm:mb-16" style={{backgroundColor: '#D2691E', opacity: 0.2}}></div>

          {/* Section: Hook Setup */}
          <section id="hook-setup" className="mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>03</span>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{color: '#6B5B47'}}>Setting up Plans (Auto-Configured)</h2>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{color: '#6B5B47'}}>
                Medusa automatically configures the Claude Code hook on first launch. Just open
                Medusa and you&apos;re ready to go.
              </p>

              <div className="p-4 sm:p-6 rounded-xl border-l-4 mb-6" style={{backgroundColor: '#F0FFF4', borderColor: '#22C55E'}}>
                <h4 className="font-bold mb-2" style={{color: '#166534'}}>Automatic setup</h4>
                <p className="text-sm sm:text-base" style={{color: '#166534', opacity: 0.9}}>
                  When you launch Medusa, it automatically installs the hook script and configures
                  your Claude Code settings. No manual setup required for most users.
                </p>
              </div>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>How it works</h3>
              <div className="space-y-4 mb-6">
                {[
                  {
                    step: "1",
                    title: "Open Medusa",
                    description: "Launch the app. It automatically checks and configures the hook system."
                  },
                  {
                    step: "2",
                    title: "Start Claude Code",
                    description: "Enter plan mode in Claude Code as usual."
                  },
                  {
                    step: "3",
                    title: "Review in Medusa",
                    description: "Plans automatically appear in Medusa for your review."
                  }
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 p-4 rounded-xl" style={{backgroundColor: '#F3F1E8'}}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold" style={{backgroundColor: '#D2691E', color: 'white'}}>
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold mb-1" style={{color: '#6B5B47'}}>{item.title}</h4>
                      <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>Verify setup status</h3>
              <p className="text-base leading-relaxed mb-4" style={{color: '#6B5B47'}}>
                Open Medusa and navigate to Settings. The Hook Configuration section shows the
                status of each component.
              </p>

              <div className="relative w-full aspect-[16/10] mb-6 rounded-xl overflow-hidden shadow-lg border border-black/5">
                <Image
                  src="/hook-configuration.png"
                  alt="Hook Configuration panel"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-4 sm:p-6 rounded-xl border-l-4 mb-6" style={{backgroundColor: '#FEF2F2', borderColor: '#EF4444'}}>
                <h4 className="font-bold mb-2" style={{color: '#991B1B'}}>Important: Timeout setting</h4>
                <p className="text-sm sm:text-base" style={{color: '#991B1B', opacity: 0.9}}>
                  The hook uses a <code className="px-1 rounded" style={{backgroundColor: '#FEE2E2'}}>timeout</code> of 86400 seconds (24 hours).
                  If this timeout is reached before you approve or reject, Claude Code will <strong>automatically proceed without your approval</strong>.
                </p>
              </div>

              {/* Manual Setup Accordion */}
              <details className="mb-6 rounded-xl border border-black/10 overflow-hidden">
                <summary className="p-4 cursor-pointer font-bold" style={{backgroundColor: '#F3F1E8', color: '#6B5B47'}}>
                  Manual Setup (if auto-setup fails)
                </summary>
                <div className="p-4 space-y-4" style={{backgroundColor: '#FAFAF5'}}>
                  <p className="text-base leading-relaxed" style={{color: '#6B5B47'}}>
                    If you see a setup warning banner in Medusa, you can configure the hook manually:
                  </p>

                  <h4 className="text-lg font-bold" style={{color: '#6B5B47'}}>Step 1: Download the hook script</h4>
                  <div className="p-4 rounded-xl font-mono text-sm overflow-x-auto" style={{backgroundColor: '#1a1a1a', color: '#e5e5e5'}}>
                    <pre>{`curl -o ~/.claude/hooks/medusa-plan-review.sh \\
  https://raw.githubusercontent.com/benodiwal/medusa/main/hooks/medusa-plan-review.sh
chmod +x ~/.claude/hooks/medusa-plan-review.sh`}</pre>
                  </div>

                  <h4 className="text-lg font-bold" style={{color: '#6B5B47'}}>Step 2: Add to Claude settings</h4>
                  <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>
                    Add the following to <code className="px-1 rounded" style={{backgroundColor: '#F3F1E8'}}>~/.claude/settings.json</code>:
                  </p>
                  <div className="p-4 rounded-xl font-mono text-sm overflow-x-auto" style={{backgroundColor: '#1a1a1a', color: '#e5e5e5'}}>
                    <pre>{`{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/medusa-plan-review.sh",
            "timeout": 86400
          }
        ]
      }
    ]
  }
}`}</pre>
                  </div>

                  <h4 className="text-lg font-bold" style={{color: '#6B5B47'}}>Step 3: Retry in Medusa</h4>
                  <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>
                    Click &quot;Retry Setup&quot; in the warning banner, or go to Settings → Hook Configuration
                    and click &quot;Reinstall hook configuration&quot;.
                  </p>
                </div>
              </details>
            </div>
          </section>

          {/* Divider */}
          <div className="w-full h-px mb-12 sm:mb-16" style={{backgroundColor: '#D2691E', opacity: 0.2}}></div>

          {/* Section: First Review */}
          <section id="first-review" className="mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>04</span>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{color: '#6B5B47'}}>Your first plan review</h2>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{color: '#6B5B47'}}>
                Once the hook is configured, Medusa will automatically intercept Claude Code plans.
                Here&apos;s what happens:
              </p>

              <div className="space-y-4 mb-6">
                {[
                  {
                    step: "1",
                    title: "Claude writes a plan",
                    description: "When you ask Claude Code to make changes, it enters plan mode and outlines what it's going to do."
                  },
                  {
                    step: "2",
                    title: "Medusa intercepts",
                    description: "Before Claude can execute, the hook sends the plan to Medusa. You'll see a notification and the plan appears in your queue."
                  },
                  {
                    step: "3",
                    title: "Review and decide",
                    description: "Open the plan, read through it, add annotations if needed, then approve or request changes."
                  }
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 p-4 rounded-xl" style={{backgroundColor: '#F3F1E8'}}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold" style={{backgroundColor: '#D2691E', color: 'white'}}>
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold mb-1" style={{color: '#6B5B47'}}>{item.title}</h4>
                      <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative w-full aspect-[16/10] mb-6 rounded-xl overflow-hidden shadow-lg border border-black/5">
                <Image
                  src="/hero.png"
                  alt="Plan review modal"
                  fill
                  className="object-cover"
                />
              </div>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>Approving or requesting changes</h3>
              <p className="text-base leading-relaxed mb-4" style={{color: '#6B5B47'}}>
                After reviewing the plan, you have two options:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl border border-green-200" style={{backgroundColor: '#F0FFF4'}}>
                  <h4 className="font-bold mb-2 text-green-700">Approve</h4>
                  <p className="text-sm text-green-800">
                    The plan looks good. Claude Code will proceed with execution.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-orange-200" style={{backgroundColor: '#FFF8E7'}}>
                  <h4 className="font-bold mb-2 text-orange-700">Request Changes</h4>
                  <p className="text-sm text-orange-800">
                    Send your annotations back to Claude. It will revise the plan based on your feedback.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="w-full h-px mb-12 sm:mb-16" style={{backgroundColor: '#D2691E', opacity: 0.2}}></div>

          {/* Section: Annotations */}
          <section id="annotations" className="mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>05</span>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{color: '#6B5B47'}}>Using annotations</h2>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{color: '#6B5B47'}}>
                Annotations let you give Claude precise feedback on specific parts of a plan.
                Select any text and choose an annotation type from the toolbar.
              </p>

              <div className="space-y-4 mb-6">
                {[
                  {
                    name: "Comment",
                    color: "#3B82F6",
                    description: "Add a note or question about the selected text. Use this to ask for clarification or suggest alternatives."
                  },
                  {
                    name: "Delete",
                    color: "#EF4444",
                    description: "Mark text that should be removed from the plan. Claude will understand this section isn't wanted."
                  },
                  {
                    name: "Insert",
                    color: "#22C55E",
                    description: "Suggest new content to be added at a specific location in the plan."
                  },
                  {
                    name: "Replace",
                    color: "#F97316",
                    description: "Propose alternative text to replace the selected content."
                  }
                ].map((item) => (
                  <div key={item.name} className="flex gap-4 p-4 rounded-xl" style={{backgroundColor: '#F3F1E8'}}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{backgroundColor: item.color}}></div>
                    <div>
                      <h4 className="font-bold mb-1" style={{color: item.color}}>{item.name}</h4>
                      <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative w-full aspect-[16/10] mb-6 rounded-xl overflow-hidden shadow-lg border border-black/5">
                <Image
                  src="/annotations-demo.png"
                  alt="Annotation toolbar with text selected"
                  fill
                  className="object-cover"
                />
              </div>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>Global comments</h3>
              <p className="text-base leading-relaxed mb-4" style={{color: '#6B5B47'}}>
                Use global comments for feedback that applies to the entire plan rather than specific text.
                This is useful for high-level direction like &quot;focus on performance&quot; or &quot;keep the existing API structure&quot;.
              </p>

              <div className="relative w-full aspect-[16/10] mb-6 rounded-xl overflow-hidden shadow-lg border border-black/5">
                <Image
                  src="/global-comment.png"
                  alt="Global comment input"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="w-full h-px mb-12 sm:mb-16" style={{backgroundColor: '#D2691E', opacity: 0.2}}></div>

          {/* Section: Kanban */}
          <section id="kanban" className="mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>06</span>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{color: '#6B5B47'}}>The unified board</h2>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{color: '#6B5B47'}}>
                Plans and tasks live together in one unified kanban board. See what&apos;s pending,
                what agents are running, and what&apos;s ready for review—all at a glance.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { name: "Backlog", color: "#6B7280", description: "Tasks waiting to start" },
                  { name: "In Progress", color: "#D2691E", description: "Running agents & plans being revised" },
                  { name: "Review", color: "#D2691E", description: "Ready for your review" },
                  { name: "Done", color: "#22C55E", description: "Completed & approved" }
                ].map((column) => (
                  <div key={column.name} className="p-4 rounded-xl text-center" style={{backgroundColor: '#F3F1E8'}}>
                    <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{backgroundColor: column.color}}></div>
                    <h4 className="font-bold mb-1" style={{color: '#6B5B47'}}>{column.name}</h4>
                    <p className="text-xs" style={{color: '#6B5B47', opacity: 0.7}}>{column.description}</p>
                  </div>
                ))}
              </div>

              <div className="relative w-full aspect-[16/10] mb-6 rounded-xl overflow-hidden shadow-lg border border-black/5">
                <Image
                  src="/kanban.png"
                  alt="Kanban board with plans"
                  fill
                  className="object-cover"
                />
              </div>

              <p className="text-base leading-relaxed" style={{color: '#6B5B47'}}>
                Click any plan card to open it for review. Plans are automatically moved between
                columns as you interact with them.
              </p>
            </div>
          </section>

          {/* Divider */}
          <div className="w-full h-px mb-12 sm:mb-16" style={{backgroundColor: '#D2691E', opacity: 0.2}}></div>

          {/* Section: Diffs */}
          <section id="diffs" className="mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>07</span>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{color: '#6B5B47'}}>Viewing diffs</h2>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{color: '#6B5B47'}}>
                When you request changes and Claude revises the plan, Medusa shows you exactly what
                changed. The diff view highlights additions, deletions, and modifications.
              </p>

              <div className="relative w-full aspect-[16/10] mb-6 rounded-xl overflow-hidden shadow-lg border border-black/5">
                <Image
                  src="/diff.png"
                  alt="Diff view showing changes"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-4 sm:p-6 rounded-xl border-l-4 mb-6" style={{backgroundColor: '#F0FFF4', borderColor: '#22C55E'}}>
                <h4 className="font-bold mb-2" style={{color: '#166534'}}>Pro tip</h4>
                <p className="text-sm sm:text-base" style={{color: '#166534', opacity: 0.9}}>
                  Use the diff view to verify Claude addressed your feedback. If something was
                  missed, you can add more annotations and request another revision.
                </p>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="w-full h-px mb-12 sm:mb-16" style={{backgroundColor: '#D2691E', opacity: 0.2}}></div>

          {/* Section: Obsidian */}
          <section id="obsidian" className="mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>08</span>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{color: '#6B5B47'}}>Exporting to Obsidian</h2>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{color: '#6B5B47'}}>
                Build a knowledge base of your implementation decisions. Export any approved plan
                to your Obsidian vault with one click.
              </p>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>Setting up Obsidian export</h3>
              <ol className="space-y-3 mb-6 list-decimal list-inside" style={{color: '#6B5B47'}}>
                <li>Open Medusa Settings</li>
                <li>Navigate to the Obsidian section</li>
                <li>Set your vault path (the folder where your Obsidian vault lives)</li>
                <li>Optionally configure a subfolder for plans</li>
              </ol>

              <div className="relative w-full aspect-[16/10] mb-6 rounded-xl overflow-hidden shadow-lg border border-black/5">
                <Image
                  src="/obsidian-vault.png"
                  alt="Obsidian vault settings"
                  fill
                  className="object-cover"
                />
              </div>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>Exporting a plan</h3>
              <p className="text-base leading-relaxed mb-4" style={{color: '#6B5B47'}}>
                After approving a plan, click the &quot;Save to Obsidian&quot; button. The plan will be
                saved as a markdown file with metadata including the date, session, and any
                annotations you made.
              </p>

              <div className="relative w-full aspect-[16/10] mb-6 rounded-xl overflow-hidden shadow-lg border border-black/5">
                <Image
                  src="/obsidian.png"
                  alt="Exported plan in Obsidian"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="w-full h-px mb-12 sm:mb-16" style={{backgroundColor: '#D2691E', opacity: 0.2}}></div>

          {/* Section: Sharing */}
          <section id="sharing" className="mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>09</span>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{color: '#6B5B47'}}>Sharing plans</h2>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{color: '#6B5B47'}}>
                Collaborate with your team by sharing plans for review. Share URLs contain the entire
                plan compressed in the URL—no backend required, works entirely client-side.
              </p>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>How sharing works</h3>
              <div className="space-y-4 mb-6">
                {[
                  {
                    step: "1",
                    title: "Share from Medusa",
                    description: "Click the Share button in the plan review modal. A URL is generated with your plan and annotations compressed using lz-string."
                  },
                  {
                    step: "2",
                    title: "Recipients view and annotate",
                    description: "Anyone with the link can view the plan at heymedusa.net/share. They can add their own annotations and comments."
                  },
                  {
                    step: "3",
                    title: "Re-share with combined feedback",
                    description: "Recipients can generate a new share URL that includes both the original and their new annotations."
                  }
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 p-4 rounded-xl" style={{backgroundColor: '#F3F1E8'}}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold" style={{backgroundColor: '#D2691E', color: 'white'}}>
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold mb-1" style={{color: '#6B5B47'}}>{item.title}</h4>
                      <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>Collaborative annotations</h3>
              <p className="text-base leading-relaxed mb-4" style={{color: '#6B5B47'}}>
                When viewing a shared plan, you&apos;ll see annotations from the original reviewer.
                Their annotations are read-only, but you can add your own comments, deletions,
                and replacements. Each reviewer&apos;s annotations are tracked separately.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl" style={{backgroundColor: '#F3F1E8'}}>
                  <h4 className="font-bold mb-2" style={{color: '#6B5B47'}}>Original annotations</h4>
                  <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>
                    Highlighted and attributed to the original reviewer. Read-only for recipients.
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{backgroundColor: '#F3F1E8'}}>
                  <h4 className="font-bold mb-2" style={{color: '#6B5B47'}}>Your annotations</h4>
                  <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>
                    Add your own feedback. These can be edited or deleted before re-sharing.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-6 rounded-xl border-l-4 mb-6" style={{backgroundColor: '#FFF8E7', borderColor: '#D2691E'}}>
                <h4 className="font-bold mb-2" style={{color: '#6B5B47'}}>No account required</h4>
                <p className="text-sm sm:text-base" style={{color: '#6B5B47', opacity: 0.8}}>
                  Sharing works without any sign-up or authentication. The plan data is entirely
                  contained in the URL, so anyone with the link can view and annotate.
                </p>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="w-full h-px mb-12 sm:mb-16" style={{backgroundColor: '#D2691E', opacity: 0.2}}></div>

          {/* Section: Settings */}
          <section id="settings" className="mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>10</span>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{color: '#6B5B47'}}>Configuration</h2>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{color: '#6B5B47'}}>
                Customize Medusa to fit your workflow. Access settings from the gear icon in the
                main interface.
              </p>

              <div className="space-y-4 mb-6">
                {[
                  {
                    name: "Appearance",
                    description: "Switch between light, dark, and system themes."
                  },
                  {
                    name: "Hook Configuration",
                    description: "View the paths needed for your Claude Code hook setup."
                  },
                  {
                    name: "Obsidian Integration",
                    description: "Configure your vault path and export preferences."
                  }
                ].map((item) => (
                  <div key={item.name} className="p-4 rounded-xl" style={{backgroundColor: '#F3F1E8'}}>
                    <h4 className="font-bold mb-1" style={{color: '#6B5B47'}}>{item.name}</h4>
                    <p className="text-sm" style={{color: '#6B5B47', opacity: 0.8}}>{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="relative w-full aspect-[16/10] mb-6 rounded-xl overflow-hidden shadow-lg border border-black/5">
                <Image
                  src="/settings.png"
                  alt="Settings panel"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </section>

          {/* Help Section */}
          <section className="p-6 sm:p-8 rounded-2xl text-center" style={{backgroundColor: '#F3F1E8'}}>
            <h2 className="text-xl sm:text-2xl font-bold mb-3" style={{color: '#6B5B47'}}>
              Need help?
            </h2>
            <p className="text-base mb-4" style={{color: '#6B5B47', opacity: 0.8}}>
              Found a bug or have a feature request? We&apos;d love to hear from you.
            </p>
            <a
              href="https://github.com/benodiwal/medusa/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium border-2 rounded-md transition-all hover:shadow-md"
              style={{ borderColor: '#6B5B47', color: '#6B5B47' }}
            >
              Open an issue on GitHub
            </a>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t" style={{borderColor: '#D2691E'}}>
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{color: '#6B5B47'}}>
            <Link href="/" className="hover:underline">Back to Home</Link>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/benodiwal/medusa"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                GitHub
              </a>
              <a
                href="https://github.com/benodiwal/medusa/blob/master/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Apache 2.0
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
