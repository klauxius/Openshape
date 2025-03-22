import { useEffect, useLayoutEffect } from 'react'

// This hook safely handles useLayoutEffect in SSR environments
export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

// Check if we're on the client or server
export const isServer = typeof window === 'undefined'
export const isClient = !isServer

// Safe window access
export const getWindow = () => {
  if (isClient) {
    return window
  }
  return undefined
}

// Safe document access
export const getDocument = () => {
  if (isClient) {
    return document
  }
  return undefined
}

// Safe useLayoutEffect for SSR
export function useSSRSafeLayoutEffect(callback, deps) {
  // Use useEffect on server, useLayoutEffect on client
  return useIsomorphicLayoutEffect(callback, deps)
} 