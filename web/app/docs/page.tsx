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
              Set up human oversight for Claude Code in under 5 minutes. This guide covers installation,
              hook configuration, and everything you need to start reviewing AI plans.
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
                { href: "#hook-setup", label: "Setting up the Claude Code hook" },
                { href: "#first-review", label: "Your first plan review" },
                { href: "#annotations", label: "Using annotations" },
                { href: "#kanban", label: "Managing multiple plans" },
                { href: "#diffs", label: "Viewing revision diffs" },
                { href: "#obsidian", label: "Exporting to Obsidian" },
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

              <div className="p-4 sm:p-6 rounded-xl border border-black/5" style={{backgroundColor: '#F3F1E8'}}>
                <h4 className="font-bold mb-2" style={{color: '#6B5B47'}}>System Requirements</h4>
                <ul className="space-y-1 text-sm sm:text-base" style={{color: '#6B5B47', opacity: 0.8}}>
                  <li>• macOS 11+ (Apple Silicon & Intel)</li>
                  <li>• Windows and Linux coming soon</li>
                  <li>• Claude Code CLI installed and configured</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="w-full h-px mb-12 sm:mb-16" style={{backgroundColor: '#D2691E', opacity: 0.2}}></div>

          {/* Section: Hook Setup */}
          <section id="hook-setup" className="mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>02</span>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{color: '#6B5B47'}}>Setting up the Claude Code hook</h2>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{color: '#6B5B47'}}>
                Medusa uses Claude Code&apos;s native hook system to intercept plans before they execute.
                You&apos;ll need to add a hook configuration to your Claude Code settings.
              </p>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>Step 1: Locate your Claude Code settings</h3>
              <p className="text-base leading-relaxed mb-4" style={{color: '#6B5B47'}}>
                Open your Claude Code settings file. The location depends on your operating system:
              </p>

              <div className="p-4 rounded-xl font-mono text-sm mb-6 overflow-x-auto" style={{backgroundColor: '#1a1a1a', color: '#e5e5e5'}}>
                <p><span style={{color: '#6B9F6B'}}>macOS:</span> ~/.claude/settings.json</p>
              </div>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>Step 2: Add the Medusa hook</h3>
              <p className="text-base leading-relaxed mb-4" style={{color: '#6B5B47'}}>
                Add the following hook configuration to your settings file. This tells Claude Code to
                send plans to Medusa for review before executing.
              </p>

              <div className="p-4 rounded-xl font-mono text-sm mb-6 overflow-x-auto" style={{backgroundColor: '#1a1a1a', color: '#e5e5e5'}}>
                <pre>{`{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/medusa-plan-review.sh",
            "timeout": 3600
          }
        ]
      }
    ]
  }
}`}</pre>
              </div>

              <div className="p-4 sm:p-6 rounded-xl border-l-4 mb-6" style={{backgroundColor: '#FFF8E7', borderColor: '#D2691E'}}>
                <h4 className="font-bold mb-2" style={{color: '#6B5B47'}}>About the timeout</h4>
                <p className="text-sm sm:text-base" style={{color: '#6B5B47', opacity: 0.8}}>
                  The <code className="px-1 rounded" style={{backgroundColor: '#F3F1E8'}}>timeout</code> value is in seconds.
                  Claude Code&apos;s default is 60 seconds, which is too short for plan review.
                  Set it to <code className="px-1 rounded" style={{backgroundColor: '#F3F1E8'}}>3600</code> (1 hour) or higher.
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-xl border-l-4 mb-6" style={{backgroundColor: '#FFF8E7', borderColor: '#D2691E'}}>
                <h4 className="font-bold mb-2" style={{color: '#6B5B47'}}>Important</h4>
                <p className="text-sm sm:text-base" style={{color: '#6B5B47', opacity: 0.8}}>
                  Replace <code className="px-1 rounded" style={{backgroundColor: '#F3F1E8'}}>/path/to/medusa-plan-review.sh</code> with
                  the actual path to the hook script. You can find this path in Medusa&apos;s Settings → Hook Configuration.
                </p>
              </div>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>Step 3: Create the hook script</h3>
              <p className="text-base leading-relaxed mb-4" style={{color: '#6B5B47'}}>
                Create the file <code className="px-1 rounded" style={{backgroundColor: '#F3F1E8'}}>~/.claude/hooks/medusa-plan-review.sh</code> with
                the following content:
              </p>

              <div className="p-4 rounded-xl font-mono text-xs mb-6 overflow-x-auto" style={{backgroundColor: '#1a1a1a', color: '#e5e5e5'}}>
                <pre>{`#!/bin/bash

# Medusa Plan Review Hook for Claude Code

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [ "$TOOL_NAME" != "ExitPlanMode" ]; then
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
    exit 0
fi

PLANS_DIR="$HOME/.claude/plans"
PROJECT_NAME=$(basename "$CWD" 2>/dev/null)

# Find recent plan files
RECENT_PLANS=$(find "$PLANS_DIR" -name "*.md" -mmin -0.17 -type f 2>/dev/null)

if [ -n "$RECENT_PLANS" ]; then
    if [ -n "$PROJECT_NAME" ]; then
        PLAN_FILE=$(echo "$RECENT_PLANS" | xargs grep -l "$PROJECT_NAME" 2>/dev/null | head -1)
    fi
    if [ -z "$PLAN_FILE" ]; then
        PLAN_FILE=$(echo "$RECENT_PLANS" | head -1)
    fi
fi

if [ -z "$PLAN_FILE" ] || [ ! -f "$PLAN_FILE" ]; then
    PLAN_FILE=$(ls -t "$PLANS_DIR"/*.md 2>/dev/null | head -1)
fi

if [ -z "$PLAN_FILE" ] || [ ! -f "$PLAN_FILE" ]; then
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
    exit 0
fi

RESPONSE_FILE="/tmp/medusa-response-\${SESSION_ID:-$$}"
PENDING_DIR="$HOME/.medusa/pending"
mkdir -p "$PENDING_DIR"

cat > "$PENDING_DIR/$(uuidgen).json" << EOF
{"plan_file": "$PLAN_FILE", "response_file": "$RESPONSE_FILE"}
EOF

# Update this path to your Medusa installation
MEDUSA_APP="/Applications/medusa.app"
open -a "$MEDUSA_APP" 2>/dev/null || true

# Wait indefinitely for response
while true; do
    if [ -f "$RESPONSE_FILE" ] && [ -s "$RESPONSE_FILE" ]; then
        RESPONSE=$(cat "$RESPONSE_FILE")
        rm -f "$RESPONSE_FILE"
        DECISION=$(echo "$RESPONSE" | head -1)
        FEEDBACK=$(echo "$RESPONSE" | tail -n +2)

        if [ "$DECISION" = "APPROVED" ]; then
            echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
            exit 0
        else
            echo "$FEEDBACK" >&2
            exit 2
        fi
    fi
    sleep 1
done`}</pre>
              </div>

              <p className="text-base leading-relaxed mb-4" style={{color: '#6B5B47'}}>
                Make the script executable:
              </p>

              <div className="p-4 rounded-xl font-mono text-sm mb-6 overflow-x-auto" style={{backgroundColor: '#1a1a1a', color: '#e5e5e5'}}>
                <p>chmod +x ~/.claude/hooks/medusa-plan-review.sh</p>
              </div>

              <h3 className="text-xl font-bold mb-3" style={{color: '#6B5B47'}}>Step 4: Verify in Medusa</h3>
              <p className="text-base leading-relaxed mb-4" style={{color: '#6B5B47'}}>
                Open Medusa and navigate to Settings. The Hook Configuration section shows the
                paths for reference.
              </p>

              <div className="relative w-full aspect-[16/10] mb-6 rounded-xl overflow-hidden shadow-lg border border-black/5">
                <Image
                  src="/hook-configuration.png"
                  alt="Hook Configuration panel"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="w-full h-px mb-12 sm:mb-16" style={{backgroundColor: '#D2691E', opacity: 0.2}}></div>

          {/* Section: First Review */}
          <section id="first-review" className="mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>03</span>
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
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>04</span>
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
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>05</span>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{color: '#6B5B47'}}>Managing multiple plans</h2>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{color: '#6B5B47'}}>
                Running Claude Code in multiple terminals? Medusa&apos;s kanban board tracks every plan
                across all sessions in one place.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { name: "Pending", color: "#6B7280", description: "Plans waiting for your review" },
                  { name: "In Review", color: "#D2691E", description: "Plans you're currently reviewing" },
                  { name: "Approved", color: "#22C55E", description: "Plans that have been approved" }
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
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>06</span>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{color: '#6B5B47'}}>Viewing revision diffs</h2>
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
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>07</span>
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

          {/* Section: Settings */}
          <section id="settings" className="mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold" style={{color: '#D2691E', opacity: 0.3}}>08</span>
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
