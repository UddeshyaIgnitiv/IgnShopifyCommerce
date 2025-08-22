'use client'
import { useEffect } from 'react'
import BuilderComponents from '../app/builder-registry'

export default function RegisterTokens() {
  useEffect(() => {
    BuilderComponents()
  }, [])

  return null
}
