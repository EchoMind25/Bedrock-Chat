"use client";

import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dropdown,
  Input,
  Modal,
  NotificationBadge,
  Textarea,
  ToastContainer,
  Toggle,
  ToggleGroup,
  Tooltip,
  TooltipIcon,
  toast,
} from "@/components/ui";
import type { DropdownItem } from "@/components/ui";
import { useState } from "react";

export default function DemoPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleChecked, setToggleChecked] = useState(false);
  const [dropdownValue, setDropdownValue] = useState("");
  const [toggleGroupItems, setToggleGroupItems] = useState([
    { id: "1", label: "Email notifications", checked: true },
    { id: "2", label: "Push notifications", checked: false },
    { id: "3", label: "SMS notifications", checked: false, disabled: true },
  ]);

  const dropdownItems: DropdownItem[] = [
    { id: "1", label: "Option 1", value: "option1" },
    { id: "2", label: "Option 2", value: "option2" },
    { id: "3", label: "Option 3", value: "option3" },
    { id: "4", label: "Disabled Option", value: "option4", disabled: true },
  ];

  const handleToggleGroupChange = (id: string, checked: boolean) => {
    setToggleGroupItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked } : item))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <ToastContainer />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Bedrock Chat UI Components
          </h1>
          <p className="text-muted-foreground">
            2026 Design Aesthetics with React 19 & Motion 12
          </p>
        </div>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>
              Variants: primary, secondary, danger, ghost with loading state
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="primary" loading>
                Loading
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>
              Text, password, textarea with animated focus border
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                helperText="We'll never share your email"
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
              />
              <Textarea
                label="Message"
                placeholder="Type your message..."
                rows={4}
              />
              <Input label="Error state" error="This field is required" />
            </div>
          </CardContent>
        </Card>

        {/* Avatars */}
        <Card>
          <CardHeader>
            <CardTitle>Avatars</CardTitle>
            <CardDescription>
              Image + fallback with status indicator (pulse animation)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-6">
              <Avatar fallback="JD" status="online" size="lg" />
              <Avatar fallback="AS" status="away" size="md" />
              <Avatar fallback="MK" status="busy" size="sm" />
              <Avatar fallback="LT" status="offline" size="xs" />
              <AvatarGroup size="md">
                <Avatar fallback="A" />
                <Avatar fallback="B" />
                <Avatar fallback="C" />
                <Avatar fallback="D" />
                <Avatar fallback="E" />
              </AvatarGroup>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>
              Variants with optional pulse animation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success" pulse>
                Online
              </Badge>
              <Badge variant="warning" pulse>
                Warning
              </Badge>
              <Badge variant="danger" pulse>
                Error
              </Badge>
              <Badge variant="outline">Outline</Badge>
              <div className="relative inline-block">
                <Button variant="ghost">Notifications</Button>
                <NotificationBadge count={5} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal & Toast */}
        <Card>
          <CardHeader>
            <CardTitle>Modal & Toast</CardTitle>
            <CardDescription>
              Modal with focus trap, Toast with Zustand & swipe dismiss
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
              <Button
                onClick={() => toast.success("Success!", "Operation completed")}
              >
                Success Toast
              </Button>
              <Button
                onClick={() => toast.error("Error!", "Something went wrong")}
              >
                Error Toast
              </Button>
              <Button
                onClick={() => toast.warning("Warning!", "Please be careful")}
              >
                Warning Toast
              </Button>
              <Button onClick={() => toast.info("Info", "Did you know?")}>
                Info Toast
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Toggle</CardTitle>
            <CardDescription>Liquid fill animation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Toggle
                label="Enable notifications"
                checked={toggleChecked}
                onChange={(e) => setToggleChecked(e.target.checked)}
              />
              <ToggleGroup
                items={toggleGroupItems}
                onChange={handleToggleGroupChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tooltip */}
        <Card>
          <CardHeader>
            <CardTitle>Tooltip</CardTitle>
            <CardDescription>Positions with 500ms delay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Tooltip content="Top tooltip" position="top">
                <Button variant="ghost">Top</Button>
              </Tooltip>
              <Tooltip content="Bottom tooltip" position="bottom">
                <Button variant="ghost">Bottom</Button>
              </Tooltip>
              <Tooltip content="Left tooltip" position="left">
                <Button variant="ghost">Left</Button>
              </Tooltip>
              <Tooltip content="Right tooltip" position="right">
                <Button variant="ghost">Right</Button>
              </Tooltip>
              <TooltipIcon content="This is helpful information" />
            </div>
          </CardContent>
        </Card>

        {/* Dropdown */}
        <Card>
          <CardHeader>
            <CardTitle>Dropdown</CardTitle>
            <CardDescription>
              Keyboard navigation with search filter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm space-y-4">
              <Dropdown
                label="Basic Dropdown"
                items={dropdownItems}
                value={dropdownValue}
                onSelect={setDropdownValue}
                placeholder="Select an option"
              />
              <Dropdown
                label="Searchable Dropdown"
                items={dropdownItems}
                value={dropdownValue}
                onSelect={setDropdownValue}
                searchable
                placeholder="Search options..."
              />
            </div>
          </CardContent>
        </Card>

        {/* 3D Tilt Card */}
        <Card tilt hoverable>
          <CardHeader>
            <CardTitle>3D Tilt Card</CardTitle>
            <CardDescription>
              Hover over this card to see the 3D tilt effect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This card uses the Glass component with 3D transform effects. Move
              your mouse around to see the tilt in action!
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="primary">Action</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Modal Example */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Example Modal"
        description="This modal has focus trap and AnimatePresence"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalOpen(false);
                toast.success("Saved!", "Your changes have been saved");
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" placeholder="Enter your name" />
          <Textarea label="Description" placeholder="Enter description" />
        </div>
      </Modal>
    </div>
  );
}
