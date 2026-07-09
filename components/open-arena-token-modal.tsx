"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface OpenArenaTokenModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (token: string) => void
  initialValue?: string
}

export function OpenArenaTokenModal({
  open,
  onOpenChange,
  onSave,
  initialValue = "",
}: OpenArenaTokenModalProps) {
  const [value, setValue] = useState(initialValue)

  function handleSave() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSave(trimmed)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter your Open Arena token</DialogTitle>
          <DialogDescription>
            Paste your Thomson Reuters Open Arena API token to enable AI features. Your token is
            kept in memory only for this session and is never stored.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Label htmlFor="open-arena-token">API token</Label>
          <Input
            id="open-arena-token"
            type="password"
            autoComplete="off"
            placeholder="Paste token here"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                handleSave()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!value.trim()}>
            Save token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
