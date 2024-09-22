declare module 'react-textarea-autosize' {
  import React from 'react'
  
  interface TextareaAutosizeProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    minRows?: number
    maxRows?: number
    ref?: React.RefObject<HTMLTextAreaElement>
  }

  const TextareaAutosize: React.ForwardRefExoticComponent<TextareaAutosizeProps & React.RefAttributes<HTMLTextAreaElement>>
  export default TextareaAutosize
}

declare module '@/components/ui/button' {
  import { ButtonHTMLAttributes, ReactNode } from 'react'

  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    asChild?: boolean
    className?: string
    children?: ReactNode
  }

  export const Button: React.FC<ButtonProps>
}

declare module 'sonner' {
  export const toast: {
    (message: string): void;
    success(message: string): void;
    error(message: string): void;
  }
}

declare module '@radix-ui/react-dialog' {
  export interface DialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
}

declare module '@radix-ui/react-icons' {
  import * as React from 'react'
  export const ExclamationTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>>
  // Add other icons as needed
}

// Add any other necessary type declarations here