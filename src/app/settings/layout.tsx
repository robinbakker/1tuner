import { Toaster } from "~/components/ui/toaster"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      {children}
      <Toaster />
    </div>
  )
}

