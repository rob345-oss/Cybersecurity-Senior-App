import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  AlertTriangle,
  Ban,
  Bell,
  ChevronRight,
  Download,
  Mail,
  Phone,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import {
  AsyncButton,
  Button,
  ButtonGroup,
  ConfirmButton,
  CopyButton,
  DropdownButton,
  FileUploadButton,
  FloatingActionButton,
  SocialLoginButton,
  SplitButton,
  type ButtonSize,
  type ButtonVariant,
} from './index'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Titanium Guardian button system — trust-first, accessible components for older adults, caregivers, and healthcare organizations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'outline',
        'ghost',
        'destructive',
        'success',
        'warning',
        'gradient',
        'icon',
        'iconCircle',
        'fab',
        'link',
      ],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    fullWidth: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    iconOnly: { control: 'boolean' },
    showNotificationDot: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Get Protected',
    variant: 'primary',
    size: 'md',
  },
}

export const AllVariants: Story = {
  render: () => {
    const variants: ButtonVariant[] = [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'destructive',
      'success',
      'warning',
      'gradient',
      'link',
    ]
    return (
      <div className="flex flex-col gap-3">
        {variants.map((variant) => (
          <Button key={variant} variant={variant} size="md">
            {variant.charAt(0).toUpperCase() + variant.slice(1)}
          </Button>
        ))}
      </div>
    )
  },
}

export const AllSizes: Story = {
  render: () => {
    const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
    return (
      <div className="flex flex-col items-start gap-3">
        {sizes.map((size) => (
          <Button key={size} variant="primary" size={size}>
            Size {size.toUpperCase()}
          </Button>
        ))}
      </div>
    )
  },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Button variant="primary">Default</Button>
      <Button variant="primary" disabled>
        Disabled
      </Button>
      <Button variant="primary" loading>
        Loading
      </Button>
      <Button variant="primary" status="success">
        Success
      </Button>
      <Button variant="primary" status="error">
        Error
      </Button>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Button variant="primary" leftIcon={ShieldCheck}>
        Verify Identity
      </Button>
      <Button variant="secondary" rightIcon={ChevronRight}>
        Learn More
      </Button>
      <Button variant="outline" leftIcon={Mail} rightIcon={ChevronRight} badge={3}>
        Inbox
      </Button>
      <Button variant="icon" iconOnly leftIcon={Settings} aria-label="Settings" />
      <Button
        variant="iconCircle"
        iconOnly
        leftIcon={Bell}
        showNotificationDot
        aria-label="Notifications"
      />
      <Button variant="primary" shortcut="⌘K">
        Quick Actions
      </Button>
    </div>
  ),
}

export const FullWidth: Story = {
  render: () => (
    <div className="w-80">
      <Button variant="primary" fullWidth leftIcon={Phone}>
        Start Call Protection
      </Button>
    </div>
  ),
}

export const IconButtons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button variant="icon" iconOnly leftIcon={Settings} aria-label="Settings" size="md" />
      <Button variant="iconCircle" iconOnly leftIcon={Plus} aria-label="Add contact" size="md" />
      <Button variant="fab" iconOnly leftIcon={Phone} aria-label="Call support" size="md" />
    </div>
  ),
}

export const LinkButton: Story = {
  render: () => (
    <Button as="a" href="#" variant="link" size="md">
      View privacy policy
    </Button>
  ),
}

export const ButtonGroupExample: Story = {
  render: () => (
    <ButtonGroup aria-label="Filter options">
      <Button variant="outline" size="md">
        All
      </Button>
      <Button variant="outline" size="md">
        Blocked
      </Button>
      <Button variant="outline" size="md">
        Allowed
      </Button>
    </ButtonGroup>
  ),
}

export const SplitButtonExample: Story = {
  render: () => (
    <SplitButton
      label="Block Caller"
      variant="destructive"
      onPrimaryClick={() => undefined}
      items={[
        { id: 'report', label: 'Report as scam', onClick: () => undefined },
        { id: 'whitelist', label: 'Add to whitelist', onClick: () => undefined },
      ]}
    />
  ),
}

export const DropdownButtonExample: Story = {
  render: () => (
    <DropdownButton
      label="Actions"
      variant="secondary"
      leftIcon={Settings}
      items={[
        { id: 'export', label: 'Export report', onClick: () => undefined },
        { id: 'share', label: 'Share with caregiver', onClick: () => undefined },
        { id: 'delete', label: 'Delete history', onClick: () => undefined, destructive: true },
      ]}
    />
  ),
}

export const ConfirmButtonExample: Story = {
  render: () => (
    <ConfirmButton
      label="Block Caller"
      confirmLabel="Yes, block"
      variant="destructive"
      leftIcon={Ban}
      onConfirm={() => undefined}
    />
  ),
}

export const AsyncButtonExample: Story = {
  render: () => (
    <AsyncButton
      variant="primary"
      onClick={async () => {
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }}
    >
      Save Settings
    </AsyncButton>
  ),
}

export const CopyButtonExample: Story = {
  render: () => <CopyButton value="TG-ABC-12345" variant="outline" />,
}

export const SocialLoginButtons: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <SocialLoginButton provider="google" onProviderClick={() => undefined} />
      <SocialLoginButton provider="apple" onProviderClick={() => undefined} />
      <SocialLoginButton provider="microsoft" onProviderClick={() => undefined} />
    </div>
  ),
}

export const FileUploadButtonExample: Story = {
  render: () => (
    <FileUploadButton
      accept=".pdf,.jpg,.png"
      onFilesSelected={() => undefined}
      leftIcon={Download}
    >
      Upload document
    </FileUploadButton>
  ),
}

export const FloatingActionButtonExample: Story = {
  render: () => (
    <div className="relative h-40 w-full">
      <FloatingActionButton
        icon={Phone}
        label="Call emergency contact"
        position="bottom-right"
      />
    </div>
  ),
  parameters: { layout: 'fullscreen' },
}

export const TitaniumGuardianSecurity: Story = {
  name: 'Titanium Guardian / Security Actions',
  render: () => (
    <div className="flex w-96 flex-col gap-4">
      <Button variant="success" size="lg" fullWidth leftIcon={ShieldCheck}>
        Verify Identity
      </Button>
      <Button variant="destructive" size="lg" fullWidth leftIcon={Ban}>
        Block Caller
      </Button>
      <Button variant="warning" size="lg" fullWidth leftIcon={AlertTriangle}>
        Report Scam
      </Button>
      <ConfirmButton
        label="Delete Call History"
        confirmLabel="Delete permanently"
        variant="destructive"
        size="lg"
        fullWidth
        leftIcon={Trash2}
        onConfirm={() => undefined}
      />
    </div>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <p className="text-base text-slate-600">
        Tab through buttons to see focus rings. All buttons meet 44×44px minimum touch
        targets at medium size and above. Icon-only buttons require aria-label.
      </p>
      <Button variant="primary" leftIcon={ShieldCheck}>
        Focus me (keyboard)
      </Button>
      <Button variant="outline" iconOnly leftIcon={Settings} aria-label="Open settings" />
      <Button variant="primary" loading aria-busy>
        Loading state
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Focus-visible rings, aria-busy for loading, aria-label for icon-only, and role="status" for success/error feedback.',
      },
    },
  },
}
