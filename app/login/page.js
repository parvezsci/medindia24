'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', password: '', role: 'customer',
  })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    let error
    if (isSignup) {
      ;({ error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name, phone: form.phone, role: form.role },
        },
      }))
    } else {
      ;({ error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      }))
    }

    setLoading(false)
    if (error) setMsg(error.message)
    else router.push('/dashboard')
  }

  const input = 'w-full border rounded-lg p-3 text-black'

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={submit} className="bg-white w-full max-w-sm p-6 rounded-xl shadow space-y-3">
        <h1 className="text-2xl font-bold text-black">
          {isSignup ? 'Naya account banao' : 'Login'}
        </h1>

        {isSignup && (
          <>
            <input className={input} name="full_name" placeholder="Poora naam" onChange={update} required />
            <input className={input} name="phone" placeholder="Phone number" onChange={update} required />
            <select className={input} name="role" onChange={update} value={form.role}>
              <option value="customer">Main customer hoon</option>
              <option value="store">Main medical store owner hoon</option>
            </select>
          </>
        )}

        <input className={input} type="email" name="email" placeholder="Email" onChange={update} required />
        <input className={input} type="password" name="password" placeholder="Password (min 6 characters)" onChange={update} required minLength={6} />

        {msg && <p className="text-red-600 text-sm">{msg}</p>}

        <button disabled={loading} className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold">
          {loading ? 'Ruko...' : isSignup ? 'Signup' : 'Login'}
        </button>

        <p className="text-sm text-center text-gray-600 cursor-pointer" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? 'Pehle se account hai? Login karo' : 'Naya user? Signup karo'}
        </p>
      </form>
    </main>
  )
}