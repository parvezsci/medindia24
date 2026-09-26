'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    load()

    const { data: listener } = supabase.auth.onAuthStateChange(() => load())
    return () => listener.subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-primary text-white px-4 py-3 flex justify-between items-center shadow">
      <a href="/" className="font-bold text-lg">Medindia24</a>

      <div className="flex items-center gap-4 text-sm">
        {!profile && <a href="/login" className="font-semibold">Login</a>}

        {profile?.role === 'customer' && (
          <>
            <a href="/order" className="hover:underline">Order Karo</a>
            <a href="/my-orders" className="hover:underline">Mere Orders</a>
            {profile?.role === 'customer' && (
  <>
    <a href="/order" className="hover:underline">Order Karo</a>
    <a href="/my-orders" className="hover:underline">Mere Orders</a>
    <a href="/profile" className="hover:underline">Profile</a>
  </>
)}
          </>
        )}

        {profile?.role === 'store' && (
          <a href="/store-profile" className="hover:underline">Store Profile</a>
        )}

        {profile?.role === 'admin' && (
          <a href="/dashboard" className="hover:underline">Admin Panel</a>
        )}

        {profile && (
          <button onClick={logout} className="bg-secondary px-3 py-1 rounded-lg font-semibold">
            Logout
          </button>
        )}
      </div>
    </nav>
  )
}