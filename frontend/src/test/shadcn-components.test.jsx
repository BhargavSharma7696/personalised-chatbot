import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../components/ui/button'
import { SidebarProvider, Sidebar } from '../components/ui/sidebar'
import { TooltipProvider } from '../components/ui/tooltip'

describe('Official shadcn UI components', () => {
  it('renders Button correctly', () => {
    render(<Button>Click Me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('renders Sidebar within SidebarProvider and TooltipProvider', () => {
    render(
      <TooltipProvider>
        <SidebarProvider>
          <Sidebar data-testid="test-sidebar">
            <div>Sidebar Content</div>
          </Sidebar>
        </SidebarProvider>
      </TooltipProvider>
    )
    expect(screen.getByText('Sidebar Content')).toBeInTheDocument()
  })
})
