'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Profile() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ full_name: '', phone: '', saved_address: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        saved_address: data.saved_address || '',
      })
    }
    load()
  }, [router])

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setMsg('')

    if (!navigator.geolocation) {
      const { error } = await supabase.from('profiles').update(form).eq('id', userId)
      if (error) setMsg(error.message)
      else setMsg('Saved ✅ (location capture nahi ho payi)')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error } = await supabase.from('profiles').update({
          ...form,
          saved_lat: pos.coords.latitude,
          saved_lng: pos.coords.longitude,
        }).eq('id', userId)
        if (error) setMsg(error.message)
        else setMsg('Saved ✅')
      },
      async () => {
        const { error } = await supabase.from('profiles').update(form).eq('id', userId)
        if (error) setMsg(error.message)
        else setMsg('Saved ✅ (location allow nahi hui)')
      }
    )
  }

  const input = 'w-full border border-accent rounded-lg p-3 bg-white text-text'

  if (!profile) return <p className="p-6 text-textmuted">Loading...</p>

  return (
    <main className="min-h-screen bg-bg p-4">
      <form onSubmit={save} className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow space-y-3 mt-8">
        <h1 className="text-2xl font-bold text-primary">Mera Profile</h1>
        <input className={input} name="full_name" placeholder="Poora naam" value={form.full_name} onChange={update} required />
        <input className={input} name="phone" placeholder="Phone number" value={form.phone} onChange={update} required />
        <textarea className={input} name="saved_address" placeholder="Ghar ka address (default order address)" value={form.saved_address} onChange={update} />
        {msg && <p className="text-secondary text-sm font-semibold">{msg}</p>}
        <button className="bg-primary text-white px-4 py-2 rounded-lg font-semibold">Save Profile</button>
      </form>
    </main>
  )
}