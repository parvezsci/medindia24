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
    }
    load()
  }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!profile) return <p className="p-6">Loading...</p>

  return (
    <main className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Namaste, {profile.full_name}</h1>
        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
          Logout
        </button>
      </div>
      <p className="text-textmuted">Role: <b className="text-primary">{profile.role}</b></p>

      {profile.role === 'store' && (
        <>
          <a
            href="/store-profile"
            className="inline-block bg-primary text-white px-4 py-2 rounded-lg font-semibold mb-4"
          >
            Store Profile Kholo
          </a>
          <StorePanel userId={profile.id} />
        </>
      )}

      {profile.role === 'admin' && <AdminPanel />}
      {profile.role === 'customer' && (
        <div className="space-y-3">
          <p className="text-textmuted">Customer panel</p>
          <div className="flex gap-3">
            <a href="/order" className="bg-primary text-white px-4 py-2 rounded-lg font-semibold">
              Naya Order
            </a>
            <a href="/my-orders" className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold">
              Mere Orders
            </a>
          </div>
        </div>
      )}
    </main>
  )
}

/* ---------------- STORE PANEL ---------------- */
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
          <p className="text-sm">Status: {s.is_approved ? 'Approved ✅' : 'Pending ⏳'}</p>
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

    // Us store ke orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        profiles:customer_id (full_name)
      `)
      .eq('store_id', storeData.id)
      .order('created_at', { ascending: false })

    setOrders(ordersData || [])
    setLoading(false)
  }

  useEffect(() => {
    if (userId) load()
  }, [userId])

  const updateOrderStatus = async (orderId, status) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      setMsg(error.message)
    } else {
      setMsg('Status update ho gaya')
      load()
    }
  }

  const updateItem = async (itemId, field, value) => {
    const { error } = await supabase
      .from('order_items')
      .update({ [field]: value })
      .eq('id', itemId)

    if (error) {
      setMsg(error.message)
    } else {
      load()
    }
  }

  const setTotalAndAccept = async (order) => {
    // Total calculate karo
    let total = 0
    order.order_items?.forEach((item) => {
      if (item.price && item.available !== false) {
        total += Number(item.price) * Number(item.quantity)
      }
    })

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'accepted',
        total_amount: total
      })
      .eq('id', order.id)

    if (error) {
      setMsg(error.message)
    } else {
      setMsg('Order accepted + total set')
      load()
    }
  }

  if (loading) return <p>Orders load ho rahe hain...</p>
  if (!store) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-yellow-800">Pehle Store Profile complete karo, tabhi orders dikhenge.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-primary">
        Store Orders — {store.store_name}
      </h2>

      {msg && <p className="text-sm text-secondary">{msg}</p>}

      {orders.length === 0 && (
        <p className="text-textmuted">Abhi koi order nahi aaya.</p>
      )}

      {orders.map((order) => (
        <div key={order.id} className="bg-white border border-accent/30 rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-primary">
                Customer: {order.profiles?.full_name || 'Unknown'}
              </p>
              <p className="text-sm text-textmuted">
                {new Date(order.created_at).toLocaleString('en-IN')}
              </p>
              <p className="text-sm">
                Type: <b>{order.delivery_type}</b>
                {order.delivery_address && ` | ${order.delivery_address}`}
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent text-primary">
              {order.status}
            </span>
          </div>

          {/* Medicines */}
          <div className="border-t pt-3 space-y-2">
            <p className="text-sm font-semibold">Medicines:</p>
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-2 text-sm bg-bg p-2 rounded-lg">
                <span className="flex-1 font-medium">
                  {item.medicine_name} × {item.quantity}
                </span>

                <input
                  type="number"
                  placeholder="Price"
                  defaultValue={item.price || ''}
                  onBlur={(e) => updateItem(item.id, 'price', e.target.value ? Number(e.target.value) : null)}
                  className="w-24 border rounded px-2 py-1"
                />

                <select
                  defaultValue={item.available === false ? 'no' : 'yes'}
                  onChange={(e) => updateItem(item.id, 'available', e.target.value === 'yes')}
                  className="border rounded px-2 py-1"
                >
                  <option value="yes">Available</option>
                  <option value="no">Unavailable</option>
                </select>
              </div>
            ))}
          </div>

          {order.total_amount && (
            <p className="font-semibold text-primary">Total: ₹{order.total_amount}</p>
          )}

          {/* Prescription link */}
          {order.prescription_url && (
            <a
              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/prescriptions/${order.prescription_url}`}
              target="_blank"
              className="text-sm text-secondary underline"
            >
              Prescription dekho
            </a>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {order.status === 'placed' && (
              <>
                <button
                  onClick={() => setTotalAndAccept(order)}
                  className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold"
                >
                  Accept + Price Set
                </button>
                <button
                  onClick={() => updateOrderStatus(order.id, 'rejected')}
                  className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold"
                >
                  Reject
                </button>
              </>
            )}

            {order.status === 'accepted' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-semibold"
              >
                Out for Delivery
              </button>
            )}

            {order.status === 'out_for_delivery' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'delivered')}
                className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold"
              >
                Mark Delivered
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------------- ADMIN ---------------- */
function AdminPanel() {
  const [stores, setStores] = useState([])

  const load = async () => {
    const { data } = await supabase.from('stores').select('*').order('created_at', { ascending: false })
    setStores(data || [])
  }
  useEffect(() => { load() }, [])

  const setApproval = async (id, value) => {
    await supabase.from('stores').update({ is_approved: value }).eq('id', id)
    load()
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-primary">Stores (Admin)</h2>
      {stores.length === 0 && <p className="text-textmuted">Abhi koi store nahi.</p>}
      {stores.map((s) => (
        <div key={s.id} className="border rounded-xl p-4 space-y-1">
          <p className="font-semibold">{s.store_name}</p>
          <p className="text-sm">License: {s.drug_license_no}</p>
          <p className="text-sm">{s.address} - {s.pincode}</p>
          <p className="text-sm">Status: {s.is_approved ? 'Approved ✅' : 'Pending ⏳'}</p>
          <div className="flex gap-2 pt-2">
            {!s.is_approved && (
              <button onClick={() => setApproval(s.id, true)} className="bg-green-600 text-white px-3 py-1 rounded-lg">
                Approve
              </button>
              {store.is_approved && (
  <button
    onClick={toggleOpen}
    className={`text-sm font-semibold px-3 py-1 rounded-full mt-2 ${store.is_open ? 'bg-secondary text-white' : 'bg-red-100 text-red-700'}`}
  >
    {store.is_open ? '🟢 Store Khula Hai (tap to close)' : '🔴 Store Band Hai (tap to open)'}
  </button>
)}
            )}
            {s.is_approved && (
              <button onClick={() => setApproval(s.id, false)} className="bg-orange-600 text-white px-3 py-1 rounded-lg">
                Suspend
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}