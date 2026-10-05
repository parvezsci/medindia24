'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)

      // Customer aur store ko seedha unke asli working page pe bhej do
      if (data.role === 'customer') router.push('/my-orders')
      if (data.role === 'store') router.push('/store-profile')
      // Admin yahin rukega, neeche AdminPanel dikhega
    }
    load()
  }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!profile || profile.role !== 'admin') return <p className="p-6 text-textmuted">Loading...</p>

  return (
    <main className="p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Namaste, {profile.full_name}</h1>
        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg">Logout</button>
      </div>
      <p>Role: <b>{profile.role}</b></p>
      <AdminPanel />
    </main>
  )
}

/* ---------------- ADMIN ---------------- */
function AdminPanel() {
  const [stores, setStores] = useState([])
  const [stats, setStats] = useState({ totalStores: 0, approvedStores: 0, totalOrders: 0, totalRevenue: 0 })

  const load = async () => {
    const { data } = await supabase.from('stores').select('*').order('created_at', { ascending: false })
    setStores(data || [])

    const { count: totalStores } = await supabase.from('stores').select('*', { count: 'exact', head: true })
    const { count: approvedStores } = await supabase.from('stores').select('*', { count: 'exact', head: true }).eq('is_approved', true)
    const { data: allOrders } = await supabase.from('orders').select('total_amount, status')
    const totalOrders = allOrders?.length || 0
    const totalRevenue = (allOrders || [])
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0)

    setStats({ totalStores: totalStores || 0, approvedStores: approvedStores || 0, totalOrders, totalRevenue })
  }

  useEffect(() => { load() }, [])

  const setApproval = async (id, value) => {
    await supabase.from('stores').update({ is_approved: value }).eq('id', id)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.totalStores}</p>
          <p className="text-xs text-textmuted">Total Stores</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-secondary">{stats.approvedStores}</p>
          <p className="text-xs text-textmuted">Approved</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.totalOrders}</p>
          <p className="text-xs text-textmuted">Total Orders</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-secondary">₹{stats.totalRevenue}</p>
          <p className="text-xs text-textmuted">Total Revenue</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-primary">Stores</h2>
      {stores.length === 0 && <p className="text-textmuted">Abhi koi store nahi.</p>}
      {stores.map((s) => (
        <div key={s.id} className="border rounded-xl p-4 space-y-1 bg-white shadow">
          <p className="font-semibold">{s.store_name}</p>
          <p className="text-sm">License: {s.drug_license_no}</p>
          <p className="text-sm">{s.address} - {s.pincode}</p>
          <p className="text-sm">Lat/Lng: {s.lat || 'MISSING'}, {s.lng || 'MISSING'}</p>
          <p className="text-sm">Status: {s.is_approved ? 'Approved ✅' : 'Pending ⏳'} | {s.is_open ? 'Open 🟢' : 'Closed 🔴'}</p>
          <div className="flex gap-2 pt-2">
            {!s.is_approved && (
              <button onClick={() => setApproval(s.id, true)} className="bg-green-600 text-white px-3 py-1 rounded-lg">Approve</button>
            )}
            {s.is_approved && (
              <button onClick={() => setApproval(s.id, false)} className="bg-orange-600 text-white px-3 py-1 rounded-lg">Suspend</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}