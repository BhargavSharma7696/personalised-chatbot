import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MarkdownContent } from '../components/chat/MarkdownContent'

describe('MarkdownContent', () => {
  it('renders markdown text and code blocks with copy button', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })

    const markdown = 'Here is code:\n```javascript\nconsole.log("hello world");\n```'
    render(<MarkdownContent content={markdown} />)

    expect(screen.getByText('Here is code:')).toBeInTheDocument()
    expect(screen.getByText(/console\.log/)).toBeInTheDocument()

    const copyBtn = screen.getByRole('button', { name: /copy/i })
    expect(copyBtn).toBeInTheDocument()

    fireEvent.click(copyBtn)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('console.log("hello world");\n')
  })

  it('renders bold, lists, and headings properly', () => {
    const markdown = '# Header\n- Bullet 1\n- Bullet 2\n**Bold Text**'
    render(<MarkdownContent content={markdown} />)

    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(screen.getByText('Bullet 1')).toBeInTheDocument()
    expect(screen.getByText('Bullet 2')).toBeInTheDocument()
    expect(screen.getByText('Bold Text')).toBeInTheDocument()
  })
})
