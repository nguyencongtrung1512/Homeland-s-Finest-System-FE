// Utility to export toast functions compatible with react-toastify API
// This file allows us to use toast.success(), toast.error(), etc. anywhere
// Compatible with react-toastify API for easy migration

import { getToastInstance } from '../contexts/toast.context'

// Helper to extract title and message from react-toastify style calls
const parseToastArgs = (args: unknown[]): { title: string; message?: string; duration?: number } => {
  // react-toastify: toast.success('message') or toast.success('message', { autoClose: 3000 })
  // Our API: toast.success(title, message?, duration?)

  if (args.length === 0) {
    return { title: '' }
  }

  const firstArg = args[0]
  const secondArg = args[1]

  // If first arg is a string and second is an object (react-toastify style)
  if (
    typeof firstArg === 'string' &&
    secondArg &&
    typeof secondArg === 'object' &&
    !Array.isArray(secondArg) &&
    'autoClose' in secondArg
  ) {
    const options = secondArg as { autoClose?: number; duration?: number }
    return {
      title: firstArg,
      duration: options.autoClose || options.duration || 3000
    }
  }

  // If first arg is string and second is string (our style: title, message)
  if (typeof firstArg === 'string' && typeof secondArg === 'string') {
    return {
      title: firstArg,
      message: secondArg,
      duration: args[2] as number | undefined
    }
  }

  // If first arg is string and second is number (our style: title, duration)
  if (typeof firstArg === 'string' && typeof secondArg === 'number') {
    return {
      title: firstArg,
      duration: secondArg
    }
  }

  // If only first arg is string, treat as title
  if (typeof firstArg === 'string') {
    return {
      title: firstArg
    }
  }

  return { title: String(firstArg) }
}

// Create a toast object that will work globally once ToastProvider is mounted
const createToastObject = () => {
  return {
    success: (...args: unknown[]) => {
      const { title, message, duration } = parseToastArgs(args)
      const instance = getToastInstance()
      instance.success(title, message, duration)
    },
    error: (...args: unknown[]) => {
      const { title, message, duration } = parseToastArgs(args)
      const instance = getToastInstance()
      instance.error(title, message, duration)
    },
    warning: (...args: unknown[]) => {
      const { title, message, duration } = parseToastArgs(args)
      const instance = getToastInstance()
      instance.warning(title, message, duration)
    },
    // Support react-toastify info style
    info: (...args: unknown[]) => {
      const { title, message, duration } = parseToastArgs(args)
      const instance = getToastInstance()
      instance.success(title, message, duration)
    }
  }
}

// Export toast object - will work once ToastProvider is mounted
export const toast = createToastObject()
