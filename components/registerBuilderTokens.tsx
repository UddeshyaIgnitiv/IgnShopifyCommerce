'use client'
import { useEffect } from 'react'
import registerDesignToken from '../app/registerDesignToken'

export default function RegisterTokens() {
  useEffect(() => {
    registerDesignToken()
  }, [])

  return null
}
